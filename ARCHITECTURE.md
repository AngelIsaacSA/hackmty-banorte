# Arquitectura — Banorte GEN-AI

Diagrama de las 3 piezas obligatorias del reto (LLM, MCP, A2UI) mapeadas a
los archivos reales del repo, y el ciclo completo de una interacción.

## Flujo completo

```mermaid
sequenceDiagram
    actor U as Usuario
    participant UI as banorte-chat.jsx<br/>(useChat)
    participant Chat as app/api/chat/route.js<br/>(LLM: Gemini + fallback Groq)
    participant MCP as app/api/mcp/route.js<br/>(servidor MCP)
    participant DB as lib/queries.js<br/>(datos)
    participant Gen as components/generative/*<br/>(componente generado)

    U->>UI: escribe o toca una sugerencia
    UI->>Chat: POST /api/chat (message.parts)
    Chat->>MCP: cliente MCP real (StreamableHTTP)<br/>listTools()
    MCP-->>Chat: get_historial, buscar_movimiento,<br/>get_proyeccion
    Chat->>Chat: Gemini detecta la intención<br/>(sinónimos incluidos)
    Chat->>MCP: callTool(nombre, argumentos)
    MCP->>DB: getHistorial / buscarMovimiento / getProyeccion
    DB-->>MCP: datos
    MCP-->>Chat: { component, data } o { screens: [...] }
    Chat-->>UI: stream de vuelta (tool-output-available)
    UI->>Gen: GenerativeToolResult elige el componente<br/>según output.component
    Gen-->>U: interfaz renderizada
    U->>Gen: toca un movimiento
    Gen->>UI: onSelectMovimiento(movimiento)
    UI->>Chat: nuevo mensaje con el movimiento como contexto
    Chat-->>UI: MovimientoTicket (el ciclo se repite)
```

## Las 3 piezas obligatorias, mapeadas

| Pieza del reto | Cómo la resolvemos | Archivo |
|---|---|---|
| **LLM al centro** | Gemini 3.6 Flash interpreta intención y decide qué tool llamar; Groq (`openai/gpt-oss-120b`) como fallback automático si Gemini falla por cuota | `app/api/chat/route.js` |
| **MCP** | Servidor MCP real (protocolo Streamable HTTP), no tools "pegadas" al código del chat — el chat se conecta como cliente MCP genuino a su propio servidor | `app/api/mcp/route.js` |
| **A2UI (equivalente)** | Vercel AI SDK: `useChat` + `message.parts` transmiten qué componente renderizar y con qué datos; el resultado de cada tool viaja como parte del mensaje | `components/banorte-chat.jsx`, `components/message-list.jsx` |

## Contrato de datos entre MCP y la UI

Cada tool regresa uno de estos dos shapes (ver `CONTEXT.md` para el detalle
completo del contrato):

- **Una pantalla:** `{ component: "MovimientosList", data: {...} }`
- **N pantallas** (flujos accionables con pasos, ej. confirmar → resultado):
  `{ screens: [{ component, data }, { component, data }, ...] }`

`GenerativeToolResult.jsx` decide con cuál de los dos casos está trabajando y
elige el componente real a renderizar — la lógica de cada tarjeta vive una
sola vez, sin duplicarse entre el caso de 1 pantalla y el de N.

## Componentes del sistema

```mermaid
flowchart LR
    subgraph Frontend
        A[banorte-chat.jsx] --> B[message-list.jsx]
        B --> C[GenerativeToolResult.jsx]
        C --> D1[MovimientosList]
        C --> D2[MovimientoTicket]
        C --> D3[ProyeccionCard]
    end

    subgraph Backend
        E[api/chat/route.js] --> F{Gemini responde?}
        F -->|sí| G[stream de vuelta]
        F -->|error de cuota| H[reintenta con Groq]
        H --> G
        E <-->|cliente MCP| I[api/mcp/route.js]
        I --> J[lib/queries.js]
    end

    subgraph Datos
        J --> K[(Dataset sintético /<br/>Supabase)]
    end

    A -->|POST /api/chat| E
    G -->|tool-output-available| B
```

## Tradeoffs y decisiones — ver `DECISIONS.md`

El porqué de cada elección (modelo, protocolo, infraestructura) está en
[`DECISIONS.md`](./DECISIONS.md). El estado técnico completo, bugs
encontrados y bitácora de cambios está en [`CONTEXT.md`](./CONTEXT.md).
