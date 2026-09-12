import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { streamText, convertToModelMessages, stepCountIs, tool, jsonSchema } from 'ai'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js'

const google = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY,
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

export async function POST(req) {
  const { messages } = await req.json()
  const origin = new URL(req.url).origin

  const { tools, client } = await getMcpTools(origin)

  const result = streamText({
    model: google('gemini-3.6-flash'),
    system: SYSTEM_PROMPT,
    messages: await convertToModelMessages(messages),
    tools,
    stopWhen: stepCountIs(3),
    onFinish: async () => {
      await client.close()
    },
  })

  return result.toUIMessageStreamResponse()
}
