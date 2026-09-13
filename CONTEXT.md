# CONTEXT — Estado del proyecto (para agentes de IA)

> Este archivo es solo para las IAs que trabajan en el repo. Léelo completo
> antes de tocar código — evita que se repitan bugs ya resueltos o se
> reconstruya algo que ya existe. Actualízalo cuando cierres una pieza de
> trabajo importante; reemplaza información vieja, no la acumules.

## Qué es este proyecto

Equipo "Memorias Rotas", reto Banorte × Tec de Monterrey (HackMTY 2026):
construir un agente de IA que no solo conteste con texto, sino que **genere
la interfaz** que resuelve el problema financiero de quien pregunta. Dominio
elegido: banca personal — movimientos, gasto, proyección de saldo.

## Stack y decisiones

- Next.js 16 (App Router), JavaScript puro — nada de TypeScript en archivos nuevos
- pnpm (nunca npm)
- Tailwind CSS + shadcn/ui, tema Nova
- Vercel AI SDK 7 (`ai`, `@ai-sdk/react`) — es nuestro "A2UI equivalente":
  `useChat` + `message.parts` transmiten la interfaz que decide el agente
- `@modelcontextprotocol/sdk` + `mcp-handler` v1.x — servidor MCP real
- LLM: **Gemini 3.6 Flash** (`gemini-3.6-flash`) como principal, **Groq**
  (`openai/gpt-oss-120b`) como fallback automático si Gemini falla por cuota
  o rate-limit. `gemini-2.5-flash` ya no existe (la API de Google lo dio de
  baja) — si ves ese nombre en algún lado es código viejo, hay que
  actualizarlo.
- Supabase — el esquema real **ya existe** (ver "Esquema real de Supabase"
  abajo). Hoy las tools todavía usan un dataset sintético en memoria porque
  nadie ha adaptado `lib/queries.js` al esquema real. Las reglas del reto
  permiten datos sintéticos, así que esto no bloquea la demo, pero ya no es
  "no sabemos el esquema" — es "falta conectar contra el esquema que ya
  tenemos".
- Vercel (deploy, plan Hobby)

## Cómo funciona hoy (arquitectura real, no aspiracional)

```
Usuario (banorte-chat.jsx, useChat)
  → POST /api/chat  (app/api/chat/route.js)
      → se conecta como CLIENTE MCP real a su propio /api/mcp
      → le pasa las tools a Gemini (fallback Groq si Gemini falla)
      → Gemini detecta la intención y llama la tool correspondiente
  → /api/mcp (app/api/mcp/route.js, servidor MCP)
      → get_historial / buscar_movimiento / get_proyeccion
      → cada tool llama lib/queries.js y regresa { component, data }
  → el resultado de la tool viaja de vuelta como parte del mensaje
  → components/message-list.jsx lee las partes tool-* y las manda a
    components/generative/GenerativeToolResult.jsx, que elige el componente
    real (MovimientosList / MovimientoTicket / ProyeccionCard) según
    output.component
  → tocar un movimiento en MovimientosList dispara onSelectMovimiento, que
    manda un mensaje nuevo al agente con los datos de ese movimiento, y el
    agente regresa MovimientoTicket — así se cierra el ciclo "lo que la
    persona toca regresa al modelo como contexto" que pide el reto
```

Archivos clave:
- `app/api/chat/route.js` — orquesta Gemini/Groq + cliente MCP
- `app/api/mcp/route.js` — servidor MCP, las 3 tools
- `lib/queries.js` — capa de datos (dataset sintético + lógica de búsqueda)
- `components/banorte-chat.jsx` — contenedor del chat (useChat, estado)
- `components/message-list.jsx` — renderiza mensajes + interfaz generada
- `components/generative/*.jsx` — los 3 componentes generativos
- `components/chat-hero.jsx`, `prompt-input.jsx`, `main-header.jsx`, etc. —
  UI/identidad Banorte (rediseño de natwDX, no tocar el diseño sin avisar)

## Esquema real de Supabase

Ya existe (compartido por el equipo el 2026-09-12), 10 tablas. **Nadie ha
adaptado `lib/queries.js` a esto todavía** — sigue usando el dataset
sintético. Esto es lo que hay que saber antes de conectarlo de verdad:

- `cliente` — datos personales (nombre, RFC, CURP, KYC, estatus)
- `cuenta` — pertenece a un `cliente_id`, tiene `producto_id`, `saldo`,
  `numero_cuenta`, `clabe`, `tipo` (debito/credito/ahorro), `estatus`
- `producto` — catálogo de productos Banorte (clásica/oro/preferente, tasa,
  comisión, beneficios en jsonb)
- `tarjeta` — pertenece a una `cuenta_id`; para tarjetas de crédito trae
  `limite_credito`, `credito_disponible`, `fecha_corte`,
  `fecha_limite_pago`, `pago_minimo`, `pago_sin_intereses`, `cat`,
  `tasa_interes` — **estos campos son justo lo que necesita un flujo de
  "reestructura tu saldo" / "plan de pago"**, el ejemplo del flujo
  accionable que muestra el PDF del reto
- `movimiento` — pertenece a `cuenta_id`, tiene `categoria_id` (FK a
  `categoria`), `monto`, `tipo` (cargo/abono), `comercio`, `descripcion`,
  `fecha`, `hora`, `canal`, `tipo_operacion`, `saldo_despues`, `estatus`
- `categoria` — catálogo (nombre, tipo ingreso/gasto, icono, color)
- `recurrente` — cargos recurrentes por `cuenta_id`: `monto`, `frecuencia`,
  `dia_cobro`, `fecha_siguiente`, `estatus` (activo/pausado/cancelado) — esto
  reemplaza el campo `recurrente: true/false` que trae el mock; en el
  esquema real es su propia tabla
- `transferencia` — SPEI/interna/corresponsal, liga a `movimiento_cargo_id`
  y `movimiento_abono_id`
- `beneficiario` — cuentas destino guardadas por cliente
- `notificacion` — alertas/push ligadas a `movimiento_id`

**Lo que esto cambia respecto al contrato actual de `lib/queries.js`:**
- `getHistorial`/`buscarMovimiento`/`getProyeccion` reciben `{ periodo }` /
  `{ query }` sin cuenta — en el esquema real **todo cuelga de
  `cuenta.id`**, así que las queries reales necesitan un `cuenta_id`. No hay
  auth/sesión todavía, así que para la demo hay que fijar un `cuenta_id` de
  Carlos Ramírez Mendoza como constante (igual que el mock hoy asume un solo
  cliente).
- `getProyeccion` en el mock inventa "gastos recurrentes" filtrando el
  arreglo de movimientos; en el esquema real eso es la tabla `recurrente`
  directamente — la query real es más simple y más precisa que el mock.
- El flujo accionable que falta (ver Pendientes) encaja perfecto con
  `tarjeta`: una tool que le muestre al usuario un plan de pago (12/18/24
  meses, como el ejemplo del PDF del reto) usando `limite_credito`,
  `credito_utilizado`, `tasa_interes`, `cat` de una tarjeta real, y que al
  confirmar actualice `pago_sin_intereses`/`estatus` — esa sí sería una
  escritura real a Supabase, no una lectura más.
- `feature/supabase-client` (`getMovimientosPorCategoria`,
  `getMovimientosRecientes`, `buscarMovimiento(cuenta_id, texto, monto)`) ya
  apunta a este esquema real, pero con nombres/firmas distintos a los que
  usan las tools del MCP hoy — sigue pendiente de reconciliar (ver
  Bitácora técnica).

## El reto oficial — resumen ejecutable

Fuente: `Reto_UI_Generativa_Banorte_Tec.pdf` (compartido por el equipo).

**3 piezas obligatorias:** LLM al centro (no un chat pegado a un lado) · MCP
para datos/herramientas/acciones · A2UI o protocolo equivalente para
transmitir la interfaz (en nuestro caso: AI SDK + `message.parts`).

**Reglas que no se negocian:**
1. Componentes propios, no biblioteca de UI genérica
2. Datos y APIs propios (sintéticos está permitido)
3. **Al menos un flujo accionable** — una interacción con la UI generada que
   produzca un cambio real, no solo otra consulta. **Esto todavía no lo
   tenemos** (ver "Pendientes" abajo) — es la regla que más urge resolver.
4. Libertad de stack

**Evaluación:** cumplimiento/utilidad 25% · calidad y adaptabilidad de la UI
generada 20% · calidad de la solución de IA 15% · arquitectura e ingeniería
15% · UX y diseño 10% · innovación 10% · presentación 5%.

**Entregables:** demo en vivo · repositorio (componentes + servidor MCP +
capa A2UI, con instrucciones para correrlo) · datos/APIs del equipo ·
diagrama de arquitectura y decisiones/tradeoffs.

**Consejo del reto:** un solo flujo resuelto completo vale más que cinco
pantallas a medias.

## Nueva dirección de UI — "vida de la interfaz" (pendiente de implementar)

Fuente: `banorteaiexplicacion.pdf` (un inge del reto ya dio luz verde a este
patrón). Cambia cómo se debe mostrar la interfaz generada — hoy la pintamos
como tarjetas inline dentro del chat; el patrón que pide este doc es más
parecido a un canvas/panel que vive junto al chat, no dentro de la burbuja
de texto.

**Flujo de vida de una interfaz generada:**
1. Prompt — el usuario escribe en lenguaje natural
2. Lectura e interpretación — el agente detecta la intención
3. Construcción de la interfaz — arma 1 o N pantallas según el prompt
4. Muestra — se le presenta al usuario
5. Interacción — el usuario interactúa con la(s) pantalla(s)
6. Volver al chat — un back-arrow regresa/colapsa la interfaz sin perderla
7. Cerrar chat (botón X) — borra **todo**: prompts e interfaces generadas

**Reglas nuevas que esto agrega sobre lo que ya sabíamos:**
1. Un prompt a la vez por chat
2. El usuario puede mandar tantos prompts como quiera
3. Un prompt responde con una interfaz **o con una pregunta** (si el prompt
   es ambiguo o le falta info, el agente puede simplemente preguntar en vez
   de generar UI)
4. **Una interfaz puede tener 1 o N pantallas** — no todo es una sola
   tarjeta; puede ser un mini-flujo con varios pasos (esto encaja perfecto
   con el flujo accionable que falta: ej. "confirmar cancelación" →
   "confirmación exitosa" como 2 pantallas de una sola interfaz)
5. Cerrar el chat borra todo el historial + todas las interfaces generadas

**Decisión de diseño pendiente** (hay que tomarla antes de repartir el
trabajo de UI): ¿vamos por el patrón completo de panel/canvas separado del
chat (más fiel al PDF, más vistoso, más trabajo), o extendemos el modelo
actual de tarjetas inline agregándole soporte multi-pantalla + botón de
reset (menos trabajo, cumple las reglas funcionalmente pero no calca el
layout de las capturas)? Ver la conversación de reparto de trabajo para la
recomendación vigente.

## Bitácora técnica — bugs reales y por qué se resolvieron así

- **`convertToModelMessages()` es async en AI SDK 7** — si no le pones
  `await`, `streamText` truena con `messages.some is not a function`.
- **`gemini-2.5-flash` fue dado de baja** por Google para proyectos nuevos
  (404, sugiere migrar). Se usa `gemini-3.6-flash`.
- **`writer.merge(stream)` no es esperable** (regresa `void`, sigue
  escribiendo en segundo plano). Si cierras el cliente MCP justo después de
  llamarlo, se cierra a medias mientras el modelo todavía pide tools y las
  tool calls truenan con `tool-output-error`. Solución: consumir el stream
  manualmente con un loop `reader.read()` (`drainReaderInto` en
  `app/api/chat/route.js`) y cerrar el cliente MCP solo cuando ese loop
  termina de verdad.
- **Fallback a Groq**: si el primer chunk útil que regresa Gemini es un
  `error` (cuota/rate-limit), no se le manda nada al cliente todavía — se
  descarta y se reintenta la misma pregunta con Groq. Si Gemini responde
  bien, nunca se llama a Groq. Modelo de Groq: `openai/gpt-oss-120b` (de los
  pocos con tool-calling habilitado en esta cuenta — verificar con
  `curl -H "Authorization: Bearer $GROQ_API_KEY" https://api.groq.com/openai/v1/models`
  antes de cambiarlo).
- **`buscarMovimiento` desambigua por puntaje**: el dataset sintético tiene
  dos cargos de OXXO por $67 en fechas distintas. Buscar solo por texto/monto
  hacía que tocar cualquiera de los dos regresara la lista en vez del ticket.
  Ahora se le da un punto a cada movimiento por cada token de la búsqueda que
  coincide (comercio, categoría, descripción, monto, fecha exacta) y solo se
  regresan los que empatan en el puntaje más alto.
- **`feature/supabase-client` no está integrado**: su `lib/queries.js` usa
  funciones y firmas distintas (`getMovimientosPorCategoria(cuenta_id, mes,
  anio)` en vez de `getHistorial({ periodo })`) y requiere `cuenta_id`, que
  no existe todavía porque no hay auth/sesión. Si se retoma, hay que decidir
  primero de dónde sale ese `cuenta_id` (usuario fijo tipo demo está bien
  para el hackathon).
- **`feature/chat-ui` se integró dos veces**: se rediseñó por completo
  después de la primera integración (commits de "natwDX") y se volvió a
  desincronizar del MCP — tenía un TODO literal sin resolver para renderizar
  los componentes generativos y usaba el modelo ya dado de baja. Se
  re-integró en `feature/integracion` conservando el diseño nuevo intacto y
  conectándole el backend real.

## Pendientes (por prioridad)

1. **Flujo accionable** (regla #3 del reto, 25% de la nota) — ninguna de las
   3 tools actuales cambia nada, todas son lectura. El esquema real ya trae
   todo lo necesario para uno bueno: un plan de pago de tarjeta usando
   `tarjeta.limite_credito/credito_utilizado/tasa_interes/cat` (ver "Esquema
   real de Supabase" arriba), que al confirmarse escriba de verdad en la
   tabla.
2. **Nuevo patrón de interfaz** (ver sección de arriba) — decidir alcance e
   implementarlo.
3. Conectar `lib/queries.js` al esquema real de Supabase (ya no es "falta
   definirlo", es "falta adaptarlo") — o formalizar que el dataset sintético
   es la decisión final para la demo (está permitido por las reglas).
4. Entregables: README con instrucciones de cómo correr el proyecto,
   diagrama de arquitectura, doc de decisiones/tradeoffs.
5. Deploy final en Vercel + prueba end-to-end ahí (no solo local).

## Notas importantes

- `.env.local` nunca se sube a GitHub; Vercel lee sus env vars desde su
  propio dashboard, no del repo
- shadcn ya está configurado — no correr `pnpm dlx shadcn@latest init` de nuevo
- No modificar `AGENTS.md` (lo regenera `next dev` automáticamente) ni
  `.env.local`, ni la configuración de Tailwind/shadcn
