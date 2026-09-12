# CONTEXT — Historial del proyecto

## ¿Qué es este proyecto?
Reto Banorte de HackMTY 2026. Construir agentes de IA que generan interfaces 
en tiempo real usando MCP (Model Context Protocol) en servicios financieros.

## Equipo
- 2 TI (frontend/diseño y backend)
- 2 DevOps (infraestructura y agente de IA)

## Decisiones tomadas

- **Lenguaje:** JavaScript (no TypeScript)
- **Framework:** Next.js 16 App Router — frontend + backend en uno
- **Gestor de paquetes:** pnpm
- **UI:** Tailwind CSS + shadcn/ui con tema Nova
- **Diseño:** Google Stitch para mockups → v0.dev para generar código
- **Animaciones:** Framer Motion
- **Gráficas:** Recharts
- **IA en la app:** Vercel AI SDK 7
- **Protocolo del reto:** MCP (@modelcontextprotocol/sdk)
- **Modelo principal:** Gemini 2.5 Flash (gratis)
- **Modelo fallback:** Groq (gratis, por si Gemini falla)
- **Vibecoding:** Claude Pro + Gemini Pro
- **Base de datos:** Supabase
- **Deploy:** Vercel (plan Hobby, gratis)
- **Backend separado:** No — todo vive dentro de Next.js en app/api/

## Lo que ya está hecho

- [x] Proyecto Next.js creado con todo el stack instalado
- [x] shadcn/ui configurado con tema Nova
- [x] Repo en GitHub (privado)
- [x] Deploy en Vercel funcionando
- [x] Variables de entorno configuradas (Gemini + Groq)
- [x] CLAUDE.md con reglas para la IA
- [x] API route del chat en app/api/chat/route.js
- [x] Página principal con chat básico (page.tsx)
- [x] Supabase creado y keys configuradas en .env.local y Vercel
## Lo que falta

- [x] MCP server con tools financieras (rama `feature/mcp-agent`, ver abajo)
- [ ] definir esquema de base de datos
- [ ] Generative UI — renderizar componentes desde el agente
- [ ] Diseño visual con identidad de Banorte
- [ ] Integrar datos financieros reales o sintéticos
- [ ] Deploy final y pruebas end-to-end

## Avance en feature/mcp-agent (DevOps, rama 2)

- `app/api/mcp/route.js` — servidor MCP real (con `mcp-handler` v1.x, que es
  la versión compatible con `@modelcontextprotocol/sdk` v1.30 que ya estaba
  instalado — la v2 de `mcp-handler` pide `@modelcontextprotocol/server` v2 y
  no aplica aquí). Expone 3 tools: `get_historial`, `buscar_movimiento`,
  `get_proyeccion`. Cada una regresa `{ component, data }` para que el
  frontend sepa qué componente renderizar (`MovimientosList`,
  `MovimientoTicket`, `ProyeccionCard`).
- `lib/queries.js` — capa de datos de la que salen los 3 tools. Por ahora usa
  un dataset **sintético en memoria** (20 movimientos de agosto 2026, Carlos
  Ramírez Mendoza, cuenta 0218-1234-5678) porque el esquema de Supabase
  todavía no está definido. Tiene un TODO explícito: cuando
  `feature/supabase-client` defina las tablas, solo hay que reemplazar el
  contenido de `getHistorial`/`buscarMovimiento`/`getProyeccion` por queries
  reales — las tools del MCP no deberían cambiar.
- `app/api/chat/route.js` — Gemini ya no tiene tools pegadas directo en el
  código: en cada request se conecta como **cliente MCP real** (via
  `@modelcontextprotocol/sdk`) al propio `/api/mcp`, pide la lista de tools y
  se las pasa. El system prompt enseña las 3 intenciones y sus sinónimos
  ("en qué gasté" / "en qué se me cobró" / "dónde se fue mi dinero" = misma
  intención de búsqueda). Probado en vivo con los 3 flujos.
- **Cambio importante de modelo**: `gemini-2.5-flash` ya no está disponible
  para proyectos nuevos (la API de Google regresa 404 y sugiere migrar). Se
  cambió a `gemini-3.6-flash`. Si alguien más toca `app/api/chat/route.js`
  o agrega otra llamada a Gemini, usar ese modelo.
- Pendiente de otras ramas para que esto se vea en pantalla:
  `feature/components` (los `.jsx` que consumen `data`) y `feature/chat-ui`
  (que `page.tsx` lea `message.parts` y renderice el componente indicado).

## Fallback a Groq (`app/api/chat/route.js`)

Justo lo que pasó arriba (se acabó la cuota de Gemini a media prueba) es para
lo que `GROQ_API_KEY` estaba pensado desde el inicio (ver `CLAUDE.md`), pero
nadie lo había conectado. Ya quedó implementado:

- `POST` ya no regresa directo `streamText(...).toUIMessageStreamResponse()`.
  Ahora arma la respuesta con `createUIMessageStream`/
  `createUIMessageStreamResponse`, y adentro corre el agente con Gemini
  primero. Si el primer chunk útil que regresa es un `error` (cuota,
  rate-limit, lo que sea), no se le manda nada al cliente todavía — se
  descarta y se reintenta la misma pregunta con Groq
  (`openai/gpt-oss-120b`, es de los pocos modelos con tool-calling que esta
  cuenta de Groq sí tiene habilitados — probar con `curl .../v1/models` antes
  de cambiarlo). Si Gemini sí responde, se reenvía tal cual — nunca se
  llaman los dos modelos para la misma pregunta.
- **Bug real que encontré armando esto**: `writer.merge(stream)` no es
  awaitable (regresa `void` y sigue escribiendo en segundo plano). Si cierras
  el cliente MCP (`client.close()`) justo después de llamar `merge()`, se
  cierra a medias mientras el modelo todavía está pidiendo tools — eso tronaba
  los tool calls con `tool-output-error`. La solución fue consumir el stream
  manualmente con un loop `reader.read()` que si se puede esperar
  (`drainReaderInto`), y solo cerrar el cliente MCP después de que ese loop
  termine.
- Probado en vivo con los 3 intents corriendo ya en Groq (porque la cuota de
  Gemini seguía agotada): historial, proyección y búsqueda funcionan. Con
  Groq, la búsqueda por comercio a veces regresa `MovimientosList` en vez de
  `MovimientoTicket` para el mismo mensaje que con Gemini sí daba un solo
  resultado — es porque cada modelo arma el argumento `query` de
  `buscar_movimiento` distinto, no un bug de este fallback.
- Si alguien quiere cambiar el modelo de fallback, la lista de modelos que
  esta cuenta de Groq tiene habilitados se puede consultar con:
  `curl -H "Authorization: Bearer $GROQ_API_KEY" https://api.groq.com/openai/v1/models`

## Notas importantes

- El `.env.local` nunca se sube a GitHub
- shadcn ya está configurado — no correr `pnpm dlx shadcn@latest init` de nuevo
- Vercel lee las env vars desde su dashboard, no desde el repo
- El equipo usa pnpm siempre, nunca npm directamente
## División de trabajo

- **feature/chat-ui** → TI — pantalla principal del chat con identidad Banorte
- **feature/supabase-client** → TI — conexión a Supabase y queries
- **feature/mcp-agent** → DevOps — MCP server con las 3 tools y detección de intención
- **feature/components** → DevOps — componentes React que renderiza el agente

## Intenciones del agente

- **historial** → últimos movimientos por periodo (ej. "últimos 3 meses")
- **busqueda** → encontrar cobro por comercio, monto o descripción (ej. "en qué gasté 67", "dónde se fue el cobro de OXXO")
- **proyeccion** → ¿me alcanza? saldo actual vs gastos recurrentes proyectados

## Componentes generativos

- MovimientosList.jsx → lista clickeable de movimientos
- MovimientoTicket.jsx → detalle tipo ticket de un movimiento
- ProyeccionCard.jsx → tarjeta de proyección de saldo
## El reto — Banorte × HackMTY 2026

### Qué pide el reto
Construir un agente de IA que no solo conteste con texto, sino que genere
la interfaz que resuelve el problema financiero del usuario en tiempo real.

### Las 3 piezas obligatorias
- **LLM** → Gemini 2.5 Flash — interpreta la intención y orquesta todo
- **MCP** → @modelcontextprotocol/sdk — expone los datos y acciones al agente
- **A2UI (equivalente)** → Vercel AI SDK con useChat + message.parts — transmite
  la interfaz que genera el agente al frontend

### Dominio elegido
Banca personal — movimientos inteligentes

### Las 3 intenciones que resolvemos
1. **Historial** → "quiero ver mis últimos movimientos" → lista de movimientos por periodo
2. **Búsqueda** → "en qué gasté 67" / "dónde se fue el cobro de OXXO" → movimientos filtrados
3. **Proyección** → "¿me alcanza para fin de mes?" → saldo actual vs gastos recurrentes

### Flujo completo del ciclo
1. Usuario escribe o toca una sugerencia en el chat
2. Gemini detecta la intención (entiende sinónimos)
3. Llama la tool MCP correspondiente
4. La tool consulta Supabase vía lib/queries.js
5. El agente decide qué componente renderizar y lo manda en message.parts
6. El usuario toca un movimiento → regresa al agente como contexto → nueva interfaz

### Reglas del reto que no se negocian
- El LLM es el centro, no un chat pegado a un lado
- Al menos un flujo accionable donde la interacción con la UI generada
  produzca un cambio o una nueva interfaz
- Los componentes los construye el equipo — no son de shadcn genérico
- Los datos pueden ser sintéticos — ya están cargados en Supabase

### Criterios de evaluación
- Cumplimiento y utilidad → 25%
- Calidad y adaptabilidad de la UI generada → 20%
- Calidad de la solución de IA → 15%
- Arquitectura e ingeniería → 15%
- UX y diseño → 10%
- Innovación → 10%
- Presentación → 5%

### Consejo del reto
Un solo flujo resuelto completo vale más que cinco pantallas a medias.