import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { streamText } from 'ai'

const google = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY,
})

export async function POST(req) {
  const { messages } = await req.json()

  const result = streamText({
    model: google('gemini-2.5-flash'),
    system: `Eres un asistente financiero de Banorte. 
    Ayudas a los usuarios a consultar su saldo, 
    ver sus transacciones y obtener recomendaciones financieras.
    Responde siempre en español.`,
    messages,
  })

  return result.toDataStreamResponse()
}