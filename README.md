# Banorte GEN-AI

Asistente financiero que no solo responde con texto: **genera la interfaz**
que resuelve la pregunta del usuario, en tiempo real. Proyecto del equipo
"Memorias Rotas" para el reto Banorte × Tec de Monterrey (HackMTY 2026).

## Cómo correrlo

```bash
pnpm install
pnpm dev
```

Abre [http://localhost:3000](http://localhost:3000).

Necesitas un `.env.local` (no se sube al repo) con:

```
GEMINI_API_KEY=...
GROQ_API_KEY=...
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

## Arquitectura

Las 3 piezas que pide el reto — LLM, MCP, A2UI — mapeadas así:

```
Usuario (chat)
  → useChat / message.parts   ← esto es nuestro "A2UI": el AI SDK transmite
  │                              qué componente renderizar y con qué datos
  ↓
app/api/chat/route.js          ← el LLM (Gemini, fallback Groq) interpreta
  │                              la intención y decide qué tool llamar
  ↓ (cliente MCP real por HTTP)
app/api/mcp/route.js           ← servidor MCP: expone get_historial,
  │                              buscar_movimiento, get_proyeccion
  ↓
lib/queries.js                 ← datos (hoy sintéticos, ver CONTEXT.md)
```

Cada tool regresa `{ component, data }` (o `{ screens: [...] }` para un flujo
de varias pantallas). El frontend muestra esa interfaz en un panel/canvas
junto al chat, no como tarjeta dentro de la burbuja: `components/message-list.jsx`
solo pinta un chip "Ver interfaz generada" que abre
`components/generative/InterfacePanel.jsx`, el cual usa `GenerativeToolResult.jsx`
para elegir cuál de los componentes generativos renderizar con `data`. Tocar
un movimiento en la lista manda ese movimiento de vuelta al agente como
contexto, que genera el ticket de detalle — así se cierra el ciclo interacción
→ nueva interfaz que pide el reto.

## Estructura

- `app/api/chat/route.js` — orquesta el LLM + cliente MCP
- `app/api/mcp/route.js` — servidor MCP con las 3 tools financieras
- `lib/queries.js` — capa de datos
- `components/banorte-chat.jsx` y alrededores — UI del chat con identidad Banorte
- `components/generative/` — los 3 componentes que genera el agente
  (`MovimientosList`, `MovimientoTicket`, `ProyeccionCard`)

## Estado del proyecto y decisiones técnicas

Ver [`CONTEXT.md`](./CONTEXT.md) — bitácora técnica completa y actualizada:
qué funciona, bugs reales encontrados y cómo se resolvieron, esquema de
Supabase, y qué falta.
