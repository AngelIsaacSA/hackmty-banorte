# Decisiones técnicas y tradeoffs

## Modelo: Gemini 3.6 Flash + fallback a Groq

**Decisión:** Gemini 3.6 Flash como modelo principal, con reintento
automático a Groq (`openai/gpt-oss-120b`) si Gemini falla por cuota o
rate-limit.

**Por qué:** el tier gratuito de Gemini tiene un límite bajo de requests por
día, insuficiente para desarrollar y hacer demos repetidas. En vez de
cambiar de modelo manualmente cada vez que se agota la cuota, el fallback es
transparente: si el primer chunk que regresa Gemini es un error, se
descarta sin mandarle nada al usuario y se reintenta la misma pregunta con
Groq. Si Gemini responde bien, nunca se llama a Groq — no se duplica el
costo/latencia en el caso normal.

**Tradeoff aceptado:** los dos modelos no siempre interpretan una consulta
ambigua exactamente igual (ej. arman el argumento de búsqueda distinto para
el mismo texto), así que el comportamiento no es 100% determinista entre
proveedores. Para el alcance del reto es aceptable — ambos cumplen la
detección de intención correctamente, solo varía el detalle del argumento.

## Protocolo: MCP real vía HTTP, no tools "de mentira"

**Decisión:** el chat no tiene las tools de Gemini escritas directamente en
su código — se conecta como **cliente MCP real** (vía
`@modelcontextprotocol/sdk`, transporte Streamable HTTP) a un servidor MCP
propio (`app/api/mcp/route.js`, construido con `mcp-handler`).

**Por qué:** el reto pide explícitamente que MCP sea una de las 3 piezas
centrales, no un detalle de implementación oculto. Con esta arquitectura, el
servidor MCP es independiente y se puede probar solo (con el MCP Inspector
oficial, sin pasar por el LLM), y en teoría cualquier otro cliente MCP
(Claude Desktop, otro agente) podría conectarse a las mismas tools.

**Tradeoff aceptado:** cada request de chat hace un round-trip HTTP interno
extra (el propio servidor Next.js llamándose a sí mismo) para listar y
llamar tools. Es medible pero no perceptible a la escala de esta demo;
en producción real convendría cachear la lista de tools en vez de pedirla en
cada request.

## mcp-handler v1.x, no v2

**Decisión:** se usa `mcp-handler@^1` en vez de la v2 más reciente.

**Por qué:** la v2 de `mcp-handler` requiere `@modelcontextprotocol/server`
v2, un paquete distinto al `@modelcontextprotocol/sdk` v1.30 que ya traía
instalado el proyecto. Migrar hubiera significado cambiar el SDK base sin
ninguna ganancia funcional para el alcance del reto.

## Datos sintéticos primero, Supabase real después

**Decisión:** las tools MCP arrancaron sobre un dataset sintético en
`lib/queries.js` (20 movimientos, un cliente demo) en vez de esperar a que
el esquema de Supabase estuviera listo.

**Por qué:** el reto permite explícitamente datos sintéticos, y desacoplar
"las tools MCP funcionan" de "Supabase está conectado" dejó a los dos
equipos avanzar en paralelo sin bloquearse. El contrato de las funciones
(`getHistorial({ periodo })`, `buscarMovimiento({ query })`,
`getProyeccion()`) se definió primero y es lo único que le importa al
servidor MCP — la implementación de adentro (mock o Supabase real) es
intercambiable sin tocar las tools.

**Estado:** el esquema real de Supabase ya existe (10 tablas). Conectar
`lib/queries.js` contra él es trabajo en curso — ver `CONTEXT.md`.

## Interfaz generada: panel/canvas con soporte multi-pantalla, no solo tarjetas

**Decisión:** la interfaz que genera el agente puede tener 1 o N pantallas
(`{ component, data }` vs `{ screens: [...] }`), mostradas en un panel
navegable en vez de una sola tarjeta fija dentro del chat.

**Por qué:** un flujo accionable real casi siempre necesita más de un paso
(ej. "elige un plan de pago" → "confirmación") — forzar todo a una sola
tarjeta hubiera limitado qué tan completo podía ser ese flujo. El contrato
de datos se definió explícitamente antes de repartir el trabajo entre varias
personas en paralelo, para que la tool que genera N pantallas y el
componente que las muestra se pudieran construir al mismo tiempo sin
chocar.

## Sin autenticación real todavía

**Decisión:** la demo asume un solo cliente fijo (Carlos Ramírez Mendoza,
cuenta 0218-1234-5678) en vez de un flujo de login.

**Por qué:** el reto se evalúa sobre el flujo de IA generativa, no sobre un
sistema de auth completo — implementarlo hubiera consumido tiempo sin sumar
a los criterios de evaluación. Es la limitación más visible del proyecto
actual y el primer paso obvio si se siguiera desarrollando después del
hackathon.
