import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { createGroq } from '@ai-sdk/groq'
import {
  convertToModelMessages,
  createUIMessageStream,
  createUIMessageStreamResponse,
  jsonSchema,
  stepCountIs,
  streamText,
  tool,
} from 'ai'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js'

const google = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY,
})
const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY,
})

const SYSTEM_PROMPT = `Eres el asistente financiero de Banorte. Ayudas a Carlos Ramírez Mendoza
a entender sus movimientos de la cuenta 0218-1234-5678. Respondes siempre en español, de forma
breve y clara.

Detectas 3 intenciones. Muchas frases distintas del usuario significan la misma intención —
identifica la intención por su significado, no por palabras exactas:

1. HISTORIAL — el usuario quiere ver sus movimientos recientes o de un periodo.
   Ejemplos: "mis últimos movimientos", "qué he gastado este mes", "muéstrame los últimos 3 meses".
   Acción: llama la tool get_historial con el periodo mencionado (o "este mes" si no especifica).

2. BÚSQUEDA — el usuario busca un cargo o gasto específico, por comercio, monto o descripción.
   Son la misma intención: "en qué gasté", "en qué se me cobró", "dónde se fue mi dinero",
   "de dónde salió el cargo de OXXO", "busca el cobro de 67 pesos".
   Acción: llama la tool buscar_movimiento con el comercio, monto o palabra clave mencionado.

3. PROYECCIÓN — el usuario quiere saber si le alcanza el dinero a fin de mes.
   Son la misma intención: "¿me alcanza?", "cómo voy de saldo", "voy a tronar con el dinero este mes".
   Acción: llama la tool get_proyeccion (no necesita argumentos).

4. PLAN DE PAGO — el usuario no puede pagar todo el saldo de su tarjeta y quiere reestructurarlo.
   Son la misma intención: "quiero pagar menos intereses", "reestructura mi tarjeta", "no puedo
   pagar todo mi saldo", "ponme un plan de pagos", "¿en cuántos meses puedo pagar mi tarjeta?".
   Acción: llama la tool get_plan_pago (no necesita argumentos) para mostrarle las opciones a 12,
   18 y 24 meses. Cuando el usuario elija explícitamente un plazo de esos (ej. "el de 18 meses",
   "quiero el de año y medio"), llama aplicar_plan_pago con ese número de meses — esta sí modifica
   la tarjeta de verdad, no es una consulta más, así que solo llámala tras una confirmación clara.

Si el usuario toca un movimiento de una lista que ya le mostraste, trátalo como una búsqueda de
ese movimiento específico para generar su ticket de detalle.

Siempre que llames una tool, después de recibir el resultado responde con un mensaje breve que
describa lo que se encontró — la interfaz visual la genera el frontend a partir del resultado de
la tool, tú no repitas los datos en tablas de texto.`

async function getMcpTools(origin) {
  const client = new Client({ name: 'banorte-chat-agent', version: '1.0.0' })
  const transport = new StreamableHTTPClientTransport(new URL(`${origin}/api/mcp`))
  await client.connect(transport)

  const { tools: mcpTools } = await client.listTools()

  const tools = {}
  for (const mcpTool of mcpTools) {
    tools[mcpTool.name] = tool({
      description: mcpTool.description,
      inputSchema: jsonSchema(mcpTool.inputSchema),
      execute: async (args) => {
        const result = await client.callTool({ name: mcpTool.name, arguments: args })
        const text = result.content?.[0]?.text ?? '{}'
        return JSON.parse(text)
      },
    })
  }

  return { tools, client }
}

function runAgent(model, messages, tools) {
  return streamText({
    model,
    system: SYSTEM_PROMPT,
    messages,
    tools,
    stopWhen: stepCountIs(3),
  })
}

// Vacía el resto de un reader hacia el writer. Se usa en vez de
// writer.merge() (que no se puede esperar: regresa void y sigue
// escribiendo en segundo plano) porque necesitamos saber con certeza
// cuándo terminó de consumirse el stream antes de cerrar el cliente MCP.
async function drainReaderInto(writer, reader) {
  while (true) {
    const { done, value } = await reader.read()
    if (done) return
    writer.write(value)
  }
}

// Corre el agente con `model`. Si el primer chunk útil que regresa es un
// error (típicamente cuota/rate-limit agotada), no se le manda nada al
// cliente todavía — se descarta y se reintenta con `fallbackModel`. Si el
// primer intento sí funciona, se reenvía tal cual (sin gastar una segunda
// llamada). Así Gemini y Groq nunca se llaman los dos para la misma pregunta
// a menos que el primero falle. Espera a que el stream elegido termine por
// completo antes de regresar, para no cerrar el cliente MCP a medias.
async function writeWithFallback(writer, { model, fallbackModel, messages, tools }) {
  const reader = runAgent(model, messages, tools).toUIMessageStream().getReader()
  const buffered = []
  let failed = false

  // "start" siempre es el primer chunk (éxito o error), así que hay que
  // seguir leyendo hasta ver algo que confirme progreso real o un error.
  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    if (value.type === 'error') {
      failed = true
      break
    }

    buffered.push(value)
    if (value.type !== 'start') break
  }

  if (!failed) {
    for (const chunk of buffered) writer.write(chunk)
    await drainReaderInto(writer, reader)
    return
  }

  await reader.cancel().catch(() => {})
  const fallbackReader = runAgent(fallbackModel, messages, tools).toUIMessageStream().getReader()
  await drainReaderInto(writer, fallbackReader)
}

export async function POST(req) {
  const { messages } = await req.json()
  const origin = new URL(req.url).origin

  const { tools, client } = await getMcpTools(origin)
  const modelMessages = await convertToModelMessages(messages)

  const stream = createUIMessageStream({
    execute: async ({ writer }) => {
      try {
        await writeWithFallback(writer, {
          model: google('gemini-3.6-flash'),
          fallbackModel: groq('openai/gpt-oss-120b'),
          messages: modelMessages,
          tools,
        })
      } finally {
        await client.close()
      }
    },
  })

  return createUIMessageStreamResponse({ stream })
}
