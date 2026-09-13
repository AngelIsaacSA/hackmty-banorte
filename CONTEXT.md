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
  → components/message-list.jsx lee las partes tool-* y solo pinta un chip
    "Ver interfaz generada" (la tarjeta ya no va inline en la burbuja)
  → components/banorte-chat.jsx encuentra la última interfaz generada en
    `messages` y se la pasa a components/generative/InterfacePanel.jsx, el
    panel/canvas que vive al lado del chat (o encima en mobile)
  → InterfacePanel usa GenerativeToolResult.jsx para elegir el componente
    real (MovimientosList / MovimientoTicket / ProyeccionCard) según
    output.component, con navegación si output.screens trae varias
  → tocar un movimiento en MovimientosList dispara onSelectMovimiento, que
    manda un mensaje nuevo al agente con los datos de ese movimiento, y el
    agente regresa MovimientoTicket — así se cierra el ciclo "lo que la
    persona toca regresa al modelo como contexto" que pide el reto
```

Archivos clave:
- `app/api/chat/route.js` — orquesta Gemini/Groq + cliente MCP
- `app/api/mcp/route.js` — servidor MCP, las 3 tools
- `lib/queries.js` — capa de datos (dataset sintético + lógica de búsqueda)
- `components/banorte-chat.jsx` — contenedor del chat (useChat, estado,
  deriva la interfaz activa para el panel)
- `components/message-list.jsx` — renderiza mensajes + el chip que abre el
  panel (ya no la interfaz completa inline)
- `components/generative/InterfacePanel.jsx` — el panel/canvas: layout,
  colapsar/expandir, cerrar (reset total), navegación multi-pantalla
- `components/generative/*.jsx` — los 3 componentes generativos +
  `GenerativeToolResult.jsx` (elige cuál pintar)
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
   produzca un cambio real, no solo otra consulta. **Resuelto** en
   `feature/flujo-accionable`: `aplicar_plan_pago` (ver sección propia abajo).
4. Libertad de stack

**Evaluación:** cumplimiento/utilidad 25% · calidad y adaptabilidad de la UI
generada 20% · calidad de la solución de IA 15% · arquitectura e ingeniería
15% · UX y diseño 10% · innovación 10% · presentación 5%.

**Entregables:** demo en vivo · repositorio (componentes + servidor MCP +
capa A2UI, con instrucciones para correrlo) · datos/APIs del equipo ·
diagrama de arquitectura y decisiones/tradeoffs.

**Consejo del reto:** un solo flujo resuelto completo vale más que cinco
pantallas a medias.

## Nueva dirección de UI — "vida de la interfaz" (implementado en `feature/interfaz-canvas`)

Fuente: `banorteaiexplicacion.pdf` (un inge del reto ya dio luz verde a este
patrón). Cambia cómo se debe mostrar la interfaz generada — hoy la pintamos
como tarjetas inline dentro del chat; el patrón que pide este doc es más
parecido a un canvas/panel que a una tarjeta dentro de la burbuja de texto.
**Actualización**: después de verlo en vivo en Vercel, se cambió de panel
lateral fijo a **modal centrado con el chat de fondo difuminado**
(`backdrop-blur-sm`, `animate-in zoom-in-95`) — se sentía como dos paneles
compitiendo por espacio en vez de una interfaz que el agente genera encima
de la conversación. Ver `InterfacePanel.jsx`.

**Regla de diseño para todo componente generativo: debe tener algo que
tocar.** Una tarjeta que solo muestra datos y no ofrece ningún siguiente
paso es un callejón sin salida — no toda interfaz necesita N pantallas
(eso solo aplica a flujos accionables tipo plan de pago), pero SÍ necesita
al menos una acción disponible: un botón, un link, algo clickeable que
mande contexto de vuelta al agente. Ejemplo real que se corrigió: cuando
`buscar_movimiento` no encuentra nada, `MovimientosList` mostraba
"No encontré movimientos." y ya, sin salida — se le agregó un botón
"Ver historial completo" (`onVerHistorial`, mismo patrón que
`onSelectMovimiento`/`onElegirPlan`: se pasa desde `banorte-chat.jsx` hasta
el componente vía `InterfacePanel` → `GenerativeToolResult`) que manda un
mensaje nuevo al agente en vez de dejar al usuario sin nada que hacer.
Antes de dar por terminado un componente nuevo, pregúntate qué pasa cuando
el usuario ya vio los datos — si la respuesta es "nada, se queda viéndolo",
falta una acción.

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

**Decisión tomada:** vamos por el patrón completo de panel/canvas separado
del chat (más fiel al PDF), en paralelo con el flujo accionable, en ramas
distintas. Para que ninguna de las dos rompa a la otra, este es el
**contrato de datos acordado** entre ambas:

- Una tool que resuelve en **una sola pantalla** (las 3 que ya existen: 
  `get_historial`, `buscar_movimiento`, `get_proyeccion`) sigue regresando
  exactamente `{ component: "NombreComponente", data: {...} }`, sin cambios.
- Una tool que resuelve en **N pantallas** (el flujo accionable nuevo)
  regresa `{ screens: [{ component, data }, { component, data }, ...] }` —
  un arreglo, en el orden en que se deben mostrar.
- El componente de UI que decide qué pintar (hoy `GenerativeToolResult`,
  mañana el panel/canvas nuevo) debe checar: si el output tiene `screens`,
  es una interfaz multi-pantalla con navegación (anterior/siguiente); si
  tiene `component`/`data` directo, es una sola pantalla. Ambos casos
  reutilizan los mismos componentes generativos (`MovimientosList`,
  `MovimientoTicket`, `ProyeccionCard`, y los nuevos que agregue el flujo
  accionable) — el panel solo decide layout y navegación, no duplica lógica
  de cada tarjeta.

**Cómo quedó implementado** (`components/generative/InterfacePanel.jsx` +
cambios en `components/banorte-chat.jsx` y `components/message-list.jsx`):

- Desktop (`md:` y arriba): panel fijo de 420px al lado del chat, mismo alto
  (`items-stretch` en el contenedor de `banorte-chat.jsx`), ambos usables al
  mismo tiempo. Mobile: bottom-sheet de 60vh con backdrop — deja la parte de
  arriba del chat visible/tocable (tap en el backdrop también colapsa).
- `message-list.jsx` ya no pinta la tarjeta completa inline — solo un chip
  "Ver interfaz generada" (o "Consultando tu información…" mientras no está
  lista) que abre/expande el panel. La tarjeta real vive únicamente en el
  panel, vía `GenerativeToolResult`.
- El panel se deriva de `messages` (no de estado aparte): `findLatestInterface`
  en `banorte-chat.jsx` recorre los mensajes de atrás hacia adelante buscando
  la última parte `tool-*`/`dynamic-tool` con `state: "output-available"`, y
  normaliza `{component,data}` → `{screens:[{component,data}]}` para que el
  panel siempre trabaje con un arreglo. Por eso colapsar/expandir no pierde
  nada: el contenido se recalcula solo, lo único que se guarda aparte es el
  índice de pantalla activa por interfaz (`screenIndexByKey`, llave =
  `messageId-partType-índice`) para que una interfaz de N pantallas recuerde
  en cuál te quedaste.
- Colapsar (flecha "Chat"): en desktop se vuelve un riel delgado de 56px con
  un botón para reexpandir; en mobile desaparece y deja un pill flotante
  "Ver interfaz". Ninguno de los dos destruye el estado.
- Cerrar (X): `stop()` de `useChat` + `setMessages([])` + limpiar el estado
  del panel. El `stop()` es importante — sin él, si cierras mientras el
  agente todavía está generando una respuesta, esa respuesta llega después
  y "revive" el chat que acababas de cerrar (bug real que apareció al
  probarlo, no solo teórico).
- Probado a mano con datos falsos para el caso `{ screens: [...] }` (interceptando
  la respuesta de `/api/chat` con Playwright) ya que la tool del flujo
  accionable todavía no existe — navegación anterior/siguiente, contador
  "x/N", puntos y que el índice sobreviva a colapsar/expandir, todo
  verificado así. Cuando exista la tool real de N pantallas no debería hacer
  falta tocar `InterfacePanel.jsx`, solo que la tool regrese ese shape.

## Avance en feature/flujo-accionable

Primer flujo accionable del reto (regla #3): reestructura del saldo de una
tarjeta de crédito, siguiendo el ejemplo del PDF del reto y los campos reales
de `tarjeta` documentados arriba.

- `lib/queries.js` — se agregó una `TARJETA` sintética (mutable a propósito,
  con `limiteCredito`, `creditoUtilizado`, `tasaInteres`, `cat`, `pagoMinimo`,
  `pagoSinIntereses`, igual que la tabla real) y dos funciones:
  - `getPlanPago({ tarjetaId })` — **solo lectura**. Calcula la mensualidad
    con amortización francesa (mensualidad fija) a 12/18/24 meses sobre
    `creditoUtilizado` y `tasaInteres`, regresa mensualidad/interés
    total/CAT de cada plazo. `tarjetaId` está en la firma para cuando haya
    más de una tarjeta o se conecte Supabase; hoy solo existe la sintética.
  - `aplicarPlanPago({ tarjetaId, meses })` — **sí escribe**: muta
    `TARJETA.pagoSinIntereses` y `TARJETA.planPago` con el plazo elegido.
    Cuando se conecte Supabase esto pasa a ser un `UPDATE` real sobre la fila
    de `tarjeta` — la firma ya está pensada para ese swap.
- `app/api/mcp/route.js` — dos tools nuevas: `get_plan_pago` (regresa
  `{ component: "PlanPagoOpciones", data }`, una sola pantalla) y
  `aplicar_plan_pago` (regresa `{ screens: [...] }` con 2 pantallas: un
  recap de `PlanPagoOpciones` con `opcionAplicada` marcada, y
  `PlanPagoConfirmacion` con el plan ya activo) — usando el contrato de
  pantallas múltiples acordado arriba.
- `components/generative/PlanPagoOpciones.jsx` y `PlanPagoConfirmacion.jsx`
  — mismo patrón visual que `MovimientosList`/`MovimientoTicket`/
  `ProyeccionCard` (Tailwind + tokens del tema, sin shadcn genérico).
  `PlanPagoOpciones` recibe un `onElegirPlan(meses)` opcional — si no se le
  pasa (como hoy), simplemente no muestra los botones y queda de solo
  lectura; el flujo accionable sigue funcionando por texto normal en el chat
  (el usuario escribe "quiero el de 18 meses" y el agente llama
  `aplicar_plan_pago` igual).
- `components/generative/GenerativeToolResult.jsx` — se le agregó el `case`
  de `'PlanPagoOpciones'` (mismo patrón que los otros 3), nada más. **No** se
  tocó el manejo de `screens` ni `message-list.jsx`/`banorte-chat.jsx` — eso
  se deja para quien esté armando el panel/canvas nuevo. Falta, cuando esa
  pieza exista: (a) que sepa leer `output.screens` además de
  `output.component`, y (b) enchufar `onElegirPlan` desde
  `banorte-chat.jsx` → `message-list.jsx` (igual que ya existe
  `onSelectMovimiento`) para que el botón "Elegir este plan" mande el mensaje
  en vez de solo mostrarse deshabilitado.
- Actualizado el system prompt en `app/api/chat/route.js` con la 4ª
  intención (PLAN DE PAGO) y sus sinónimos.
- Probado en vivo end-to-end (MCP directo sin modelo, y el flujo completo
  por chat con fallback a Groq porque la cuota de Gemini seguía agotada):
  `get_plan_pago` calcula bien las 3 opciones, `aplicar_plan_pago` muta la
  tarjeta y regresa las 2 pantallas correctas. `pnpm exec eslint .` y
  `pnpm build` limpios. **Falta probar** que `InterfacePanel.jsx` (probado
  ahí solo con datos falsos) navegue bien las 2 pantallas reales que regresa
  `aplicar_plan_pago` ahora que ambas ramas ya están juntas en
  `feature/integracion` — ver Pendientes.

## Avance en feature/plan-pago-clickeable

Conecta el botón "Elegir este plan" de `PlanPagoOpciones` (antes el flujo
accionable solo se podía disparar escribiendo texto en el chat).

- `components/banorte-chat.jsx` — se agregó `onElegirPlan(meses)` junto a
  `onSelectMovimiento`, mismo patrón: arma
  `"Quiero el plan de {meses} meses."` y lo manda con `send(...)`. Se pasa
  como prop directo a `<InterfacePanel>` (ya **no** pasa por
  `message-list.jsx` — desde que existe el panel, `onSelectMovimiento` /
  `onElegirPlan` van de `banorte-chat.jsx` directo a `InterfacePanel.jsx`,
  que a su vez se los pasa a `GenerativeToolResult.jsx`; `message-list.jsx`
  solo maneja el chip "Ver interfaz generada", ya no renderiza tarjetas).
- `components/generative/InterfacePanel.jsx` — recibe `onElegirPlan` y lo
  reenvía a `GenerativeToolResult`.
- **Bug real encontrado y arreglado**: `GenerativeToolResult.jsx` nunca tuvo
  el `case 'PlanPagoConfirmacion'` — se me había pasado al agregar
  `PlanPagoOpciones` en `feature/flujo-accionable`. Sin este fix, la segunda
  pantalla del flujo accionable (la confirmación) se veía **en blanco**
  dentro del panel — la tool corría bien y el JSON era correcto, pero nada
  se pintaba. Se encontró probando el clic real en navegador (Playwright +
  Chrome del sistema, sin instalar nada en el repo); no se hubiera visto
  con curl/pruebas directas al MCP porque esas solo revisan el JSON, no el
  render.
- Probado de punta a punta con un clic real (no texto): "quiero
  reestructurar mi tarjeta" → clic en "Elegir este plan" (18 meses) → recap
  con badge "Plan activo" → clic en "Siguiente" → pantalla de confirmación
  con folio/mensualidad/fecha correctos. Confirmado que `onSelectMovimiento`
  sigue funcionando (tocar un movimiento en `MovimientosList` sigue
  regresando su `MovimientoTicket`, ahora con datos reales de Supabase).
  `pnpm exec eslint .` y `pnpm build` limpios, sin errores de consola.
- Nota para quien pruebe esto: el panel abre las interfaces de N pantallas
  siempre en el índice 0 (para `aplicar_plan_pago` eso es el recap de
  opciones, no la confirmación) — hay que darle "Siguiente" para ver la
  segunda pantalla, no es un bug.

## Avance en feature/auth-biometrico

Pantalla de login con WebAuthn real (huella/Face ID vía el navegador) antes
de llegar al chat. No es un mockup — usa `navigator.credentials.create/get`
de verdad.

- `app/login/page.jsx` — pantalla de login. Registra un credential
  biométrico la primera vez (`navigator.credentials.create`) y lo guarda en
  `localStorage`; en visitas siguientes solo pide la verificación
  (`navigator.credentials.get`) contra ese mismo credential ID.
- `components/auth-gate.jsx` — envuelve `app/page.jsx`. Usa
  `useSyncExternalStore` para leer un flag en `sessionStorage`
  (`banorte-demo-biometric-session`); si no está autenticado, redirige a
  `/login`. `getServerSession()` regresa `false` a propósito (evita
  mismatch de hidratación) — por eso el HTML del server siempre muestra un
  spinner "Verificando sesión" antes de que el cliente decida.
- Como solo existe un usuario demo (Carlos Ramírez Mendoza), el login NO
  toca `cuenta_id` ni ningún archivo del backend (`lib/queries.js`,
  `app/api/mcp/route.js`, `app/api/chat/route.js`) — es puramente una
  puerta de entrada, no un sistema multi-usuario.
- **Nota de consistencia, no bug**: usa íconos de `lucide-react` (ya estaba
  en `package.json`, no se instaló nada nuevo) — es la única pantalla de
  toda la app que no usa los SVG propios de `components/icons.jsx`. No
  viola la regla del reto (el login no es un componente que invoque el
  agente, esa regla aplica a `components/generative/*`), pero rompe la
  consistencia visual/de código. Si da tiempo, cambiar esos 6 íconos
  (`ArrowRight`, `CircleAlert`, `Fingerprint`, `LoaderCircle`, `ScanFace`,
  `ShieldCheck`) por equivalentes en `icons.jsx`.
- **Pendiente de probar por un humano**: la ceremonia real de WebAuthn
  (pedir huella/Face ID) no se puede probar por curl/CI — necesita un
  navegador real con hardware biométrico y un gesto del usuario. Build y
  rutas verificados (`/` y `/login` cargan bien, `/` muestra el gate
  correctamente sin sesión), pero el flujo end-to-end de tocar el sensor
  todavía no lo confirmó nadie.

## Bitácora técnica — bugs reales y por qué se resolvieron así

- **El chip "Ver interfaz generada" de un mensaje viejo abría la interfaz
  equivocada**: `onOpenInterface` en `banorte-chat.jsx` ignoraba por completo
  el `messageId` que le mandaba `message-list.jsx` — sin importar cuál chip
  tocaras, siempre mostraba `findLatestInterface(messages)` (la más
  reciente). Encontrado por feedback directo probando la app: si preguntabas
  historial y luego proyección, el chip del historial también abría
  proyección. Se reemplazó `findLatestInterface` por `findAllInterfaces`
  (regresa todas, con su `messageId`) + un estado `activeInterfaceKey` que
  `onOpenInterface` sí actualiza según qué mensaje se tocó.
- **El botón X del panel era contraproducente**: visualmente se ve como
  "cerrar esta ventana" pero antes ejecutaba `resetAll` (borraba TODA la
  conversación) — sorprendía al usuario, que esperaba un cierre inocuo igual
  que el botón "Chat". Se separaron las dos acciones: X y "Chat" ahora
  colapsan el panel sin borrar nada; el reset total (regla 5 del PDF de
  interfaz: "al cerrar se borra todo") se movió a un botón explícito
  "Nueva conversación" en el header del chat, fuera del panel, para que sea
  una acción deliberada y no una sorpresa.

- **`getHistorial`/`getProyeccion` con Supabase real usaban `new Date()` como
  "hoy"**: el dataset de demo está sembrado solo en agosto 2026, pero en
  cuanto la fecha real pasa de agosto (que es justo lo que ya pasó — hoy es
  septiembre 2026), "este mes" y la proyección consultan un rango sin datos
  y regresan todo vacío/en cero. Se encontró probando en vivo contra
  Supabase real (con las env vars de verdad, cosa que Codex no pudo hacer en
  su sandbox). Arreglado: `getFechaReferencia(cuentaId)` consulta el
  `movimiento` más reciente de la cuenta y esa fecha se usa como "hoy" en
  vez del reloj real — así el historial y la proyección siempre trabajan
  sobre el mes que sí tiene datos, sin importar cuándo se corra la demo.
  Para `getProyeccion` específicamente esa fecha se recorre 3 días atrás
  (mismo ajuste que ya hacía el dataset sintético original a propósito, día
  28 de 31) porque anclar "hoy" al último movimiento literal deja 0 días
  restantes y $0 proyectado — técnicamente correcto pero sin nada que
  mostrar en la demo.

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
- **Cerrar el chat sin `stop()` no es un reset real**: `setMessages([])` solo
  vacía el arreglo en ese instante. Si había una respuesta en curso (el
  usuario cerró justo después de tocar un movimiento, por ejemplo), esa
  respuesta sigue viva en el `fetch`/stream de `useChat` y cuando termina se
  inserta de vuelta en `messages` — el chat "revive" solo, con contenido
  viejo, después de que ya se había cerrado. Hay que llamar `stop()` (lo
  regresa `useChat`) antes de `setMessages([])`. Se reprodujo de verdad
  interceptando el stream con Playwright y forzando el cierre a mitad de una
  respuesta — no es un caso hipotético.
- **`scrollIntoView` en un layout sin scroll acotado mueve toda la página**:
  antes de tener un panel al lado, que `bottomRef.scrollIntoView()` scrolleara
  la ventana completa no se notaba. En cuanto hay un panel como hermano del
  chat, ese scroll de página saca el header del panel (con los botones de
  volver/cerrar) fuera de la vista sin que se note por qué. La solución no es
  tocar el `scrollIntoView` sino contener el scroll: `app/page.jsx` pasó de
  `min-h-dvh` a `h-dvh overflow-hidden`, y el área de mensajes en
  `banorte-chat.jsx` tiene su propio `overflow-y-auto` — así el scroll queda
  encerrado ahí y el resto del layout (header, panel) no se mueve.
- **`feature/chat-ui` se integró dos veces**: se rediseñó por completo
  después de la primera integración (commits de "natwDX") y se volvió a
  desincronizar del MCP — tenía un TODO literal sin resolver para renderizar
  los componentes generativos y usaba el modelo ya dado de baja. Se
  re-integró en `feature/integracion` conservando el diseño nuevo intacto y
  conectándole el backend real.

## Pendientes (por prioridad)

1. ~~**Flujo accionable**~~, ~~**nuevo patrón de interfaz**~~ y ~~**prueba
   conjunta de ambos**~~ — resueltos. Ver "Avance en
   feature/plan-pago-clickeable" abajo: se conectó el botón "Elegir este
   plan" (antes solo funcionaba escribiendo texto) y se encontró/arregló un
   bug real que dejaba en blanco la pantalla de confirmación.
2. ~~Conectar `lib/queries.js` al esquema real de Supabase~~ — hecho.
   `feature/supabase-real` (Codex, commit `3b4de76`) ya está mergeada en
   `feature/integracion`. `getHistorial`/`buscarMovimiento`/`getProyeccion`
   consultan `cuenta`/`movimiento`/`categoria`/`recurrente` de verdad; el
   merge con `TARJETA`/`getPlanPago`/`aplicarPlanPago` (mock, del flujo
   accionable) fue automático sin conflictos porque tocan partes distintas
   del archivo.
3. Entregables: ya existen `README.md`, `ARCHITECTURE.md` y `DECISIONS.md`
   en la raíz — falta mantenerlos al día conforme se mergeen las piezas que
   faltan.
4. Deploy final en Vercel + prueba end-to-end ahí (no solo local) — en
   proceso, ver conversación del equipo para el estado más reciente.

## Notas importantes

- `.env.local` nunca se sube a GitHub; Vercel lee sus env vars desde su
  propio dashboard, no del repo
- shadcn ya está configurado — no correr `pnpm dlx shadcn@latest init` de nuevo
- No modificar `AGENTS.md` (lo regenera `next dev` automáticamente) ni
  `.env.local`, ni la configuración de Tailwind/shadcn
