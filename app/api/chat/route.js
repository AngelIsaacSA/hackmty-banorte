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

// Junta todas las keys configuradas bajo `${envPrefix}`, `${envPrefix}_2`,
// `${envPrefix}_3`... para rotar entre varias cuentas gratis cuando una se
// queda sin cuota diaria, en vez de depender de una sola. Tolera huecos en
// la numeración (si falta `_4` pero existe `_5`, igual se usa `_5`) porque
// con varias personas mandando keys a mano es fácil que alguien se salte
// un número — buscar hasta MAX_KEYS en vez de detenerse en el primer hueco
// evita que una key se quede fuera por eso.
const MAX_KEYS_PER_PROVIDER = 10

function getKeyedModels(envPrefix, createModel) {
  const models = []
  const first = process.env[envPrefix]
  if (first) models.push(createModel(first))

  for (let index = 2; index <= MAX_KEYS_PER_PROVIDER; index += 1) {
    const key = process.env[`${envPrefix}_${index}`]
    if (key) models.push(createModel(key))
  }

  return models
}

// Nombres esperados en .env.local / Vercel:
// GEMINI_API_KEY, GEMINI_API_KEY_2, GEMINI_API_KEY_3...
// GROQ_API_KEY, GROQ_API_KEY_2, GROQ_API_KEY_3...
function getGeminiModels() {
  return getKeyedModels('GEMINI_API_KEY', (key) =>
    createGoogleGenerativeAI({ apiKey: key })('gemini-3.6-flash')
  )
}

function getGroqModels() {
  return getKeyedModels('GROQ_API_KEY', (key) =>
    createGroq({ apiKey: key })('openai/gpt-oss-120b')
  )
}

const SYSTEM_PROMPT = `Eres el asistente financiero de Banorte. Ayudas a Carlos Ramírez Mendoza
a entender sus movimientos de la cuenta 0218-1234-5678. Respondes siempre en español, de forma
breve y clara.

Detectas 3 intenciones. Muchas frases distintas del usuario significan la misma intención —
identifica la intención por su significado, no por palabras exactas:

1. HISTORIAL — el usuario quiere ver sus movimientos recientes o de un periodo, O quiere un
   resumen/ranking de sus gastos (no un cargo puntual). Ejemplos: "mis últimos movimientos",
   "qué he gastado este mes", "muéstrame los últimos 3 meses", "¿cuál fue mi mayor gasto?",
   "¿en qué gasté más este mes?", "dame un resumen de mis gastos". Ojo: "en qué gasté más" y
   "mi mayor/más grande gasto" son HISTORIAL, no búsqueda — no hay un comercio ni monto que
   buscar, es una pregunta sobre el conjunto completo de movimientos.
   Acción: llama get_historial con el periodo mencionado (o "este mes" si no especifica). Si la
   pregunta pedía un ranking/superlativo ("mayor gasto", "en qué gasté más"), identifica tú
   mismo cuál es el movimiento de mayor monto en el resultado y menciónalo explícitamente en tu
   respuesta de texto (comercio y monto) — no dejes que el usuario tenga que buscarlo en la lista.

2. BÚSQUEDA — el usuario busca UN cargo específico y puntual, identificable por comercio, monto
   exacto o fecha que él mismo menciona. Son la misma intención: "en qué se me cobró en OXXO",
   "dónde se fue el cargo de Netflix", "busca el cobro de 67 pesos", "el cargo del 25 de agosto".
   Si el usuario NO menciona ningún comercio/monto/fecha concreto (solo pregunta algo general
   sobre sus gastos), es HISTORIAL, no esto — buscar_movimiento con una palabra vaga como
   "mayor gasto" no encuentra nada porque no es texto que aparezca en ningún movimiento.
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

// En Vercel, Deployment Protection cubre TODAS las rutas del deployment,
// incluyendo /api/mcp — esta llamada es el propio servidor hablándose a sí
// mismo, pero igual la bloquea (401) si no manda el bypass. Localmente
// VERCEL_AUTOMATION_BYPASS_SECRET no existe, así que el header no se manda
// y no afecta nada.
function bypassHeaders() {
  const secret = process.env.VERCEL_AUTOMATION_BYPASS_SECRET
  return secret ? { 'x-vercel-protection-bypass': secret } : {}
}

async function getMcpTools(origin) {
  const client = new Client({ name: 'banorte-chat-agent', version: '1.0.0' })
  const transport = new StreamableHTTPClientTransport(new URL(`${origin}/api/mcp`), {
    requestInit: { headers: bypassHeaders() },
  })
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

// Corre el agente con un modelo y lee hasta el primer chunk que confirme
// progreso real o un error. No decide qué hacer con el resultado — eso lo
// hace writeWithFallback, que es quien sabe si hay más modelos a los que
// pasar.
async function tryModel(model, messages, tools) {
  const reader = runAgent(model, messages, tools).toUIMessageStream().getReader()
  const buffered = []

  // "start" siempre es el primer chunk (éxito o error), así que hay que
  // seguir leyendo hasta ver algo que confirme progreso real o un error.
  while (true) {
    const { done, value } = await reader.read()
    if (done) return { ok: true, buffered, reader }

    if (value.type === 'error') {
      await reader.cancel().catch(() => {})
      return { ok: false, errorChunk: value }
    }

    buffered.push(value)
    if (value.type !== 'start') return { ok: true, buffered, reader }
  }
}

// Prueba cada modelo de la lista en orden (típicamente: una o más keys de
// Gemini rotando por si alguna se quedó sin cuota diaria, y Groq al final
// como último recurso). Si el primer chunk útil de un modelo es un error,
// no se le manda nada al cliente todavía — se descarta y se prueba el
// siguiente. En cuanto uno responde bien, se reenvía tal cual y ya no se
// prueban los demás (nunca se gastan dos cuotas para la misma pregunta a
// menos que la primera falle). Si TODOS fallan, se manda el último error
// al cliente — no hay de otra. Espera a que el stream elegido termine por
// completo antes de regresar, para no cerrar el cliente MCP a medias.
async function writeWithFallback(writer, { models, messages, tools }) {
  let lastError = null

  for (const model of models) {
    const result = await tryModel(model, messages, tools)

    if (result.ok) {
      for (const chunk of result.buffered) writer.write(chunk)
      await drainReaderInto(writer, result.reader)
      return
    }

    lastError = result.errorChunk
  }

  if (lastError) writer.write(lastError)
}

export async function POST(req) {
  const { messages } = await req.json()
  const origin = new URL(req.url).origin

  const { tools, client } = await getMcpTools(origin)
  const modelMessages = await convertToModelMessages(messages)
  const models = [...getGeminiModels(), ...getGroqModels()]

  const stream = createUIMessageStream({
    execute: async ({ writer }) => {
      try {
        await writeWithFallback(writer, { models, messages: modelMessages, tools })
      } finally {
        await client.close()
      }
    },
  })

  return createUIMessageStreamResponse({ stream })
}
