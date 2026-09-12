'use client'

import { useMemo, useState } from 'react'
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import {
  ArrowUp,
  Bot,
  Clock3,
  Landmark,
  LoaderCircle,
  ShieldCheck,
  Sparkles,
  WalletCards,
} from 'lucide-react'

const suggestions = [
  '¿En qué gasté más este mes?',
  '¿Me alcanza para fin de mes?',
  '¿Dónde se fue mi último cobro de OXXO?',
  'Muéstrame mis últimos movimientos',
  '¿Cuánto he gastado en restaurantes?',
  'Ayúdame a organizar mis gastos',
]

function AssistantInterface({ message, isStreaming }) {
  const interfaceParts = (message.parts || []).filter((part) => {
    return (
      part.type === 'ui' ||
      part.type === 'custom' ||
      part.type === 'data' ||
      part.type.startsWith('data-') ||
      part.type === 'tool' ||
      part.type.startsWith('tool-')
    )
  })

  if (interfaceParts.length === 0) {
    return isStreaming ? (
      <div className="flex items-center gap-3 rounded-2xl border border-red-100 bg-white px-4 py-3 text-sm font-medium text-slate-500 shadow-sm">
        <LoaderCircle className="size-4 animate-spin text-[#E40520]" aria-hidden="true" />
        Preparando tu resumen financiero
      </div>
    ) : null
  }

  return (
    <div className="space-y-3" aria-label="Interfaz financiera generada">
      {interfaceParts.map((part, index) => {
        const isTool = part.type === 'tool' || part.type.startsWith('tool-')
        const isReady = part.state === 'output-available' || part.state === 'done'

        return (
          <section
            key={`${message.id}-${part.type}-${index}`}
            className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
          >
            <div className="flex items-center gap-3 border-b border-slate-100 px-4 py-3">
              <span className="grid size-9 place-items-center rounded-xl bg-[#E40520]/10 text-[#E40520]">
                {isTool ? <WalletCards className="size-5" aria-hidden="true" /> : <Sparkles className="size-5" aria-hidden="true" />}
              </span>
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  {isTool ? 'Consulta financiera' : 'Resumen personalizado'}
                </p>
                <p className="text-xs text-slate-500">
                  {isReady ? 'Información lista para revisar' : 'Actualizando información'}
                </p>
              </div>
              {!isReady && <LoaderCircle className="ml-auto size-4 animate-spin text-[#E40520]" aria-label="Cargando" />}
            </div>
            <div className="flex items-center gap-2 px-4 py-4">
              <span className="h-2 w-2 rounded-full bg-[#E40520]" />
              <span className="h-2 w-16 rounded-full bg-slate-100" />
              <span className="h-2 w-9 rounded-full bg-slate-100" />
            </div>
          </section>
        )
      })}
    </div>
  )
}

export default function Home() {
  const [input, setInput] = useState('')
  const transport = useMemo(
    () => new DefaultChatTransport({ api: '/api/chat' }),
    [],
  )
  const { messages, sendMessage, status } = useChat({ transport })
  const isSending = status === 'submitted' || status === 'streaming'

  async function sendQuestion(question) {
    const text = question.trim()
    if (!text || isSending) return

    setInput('')
    await sendMessage({ text })
  }

  function handleSubmit(event) {
    event.preventDefault()
    sendQuestion(input)
  }

  return (
    <main className="min-h-screen bg-[#f8f8fa] text-slate-900">
      <header className="bg-[#E40520] text-white shadow-lg shadow-red-950/10">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-5 py-4 sm:px-8">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-xl bg-white text-[#E40520] shadow-sm">
              <Landmark className="size-5" aria-hidden="true" />
            </span>
            <div>
              <p className="text-lg font-bold tracking-tight">Banorte</p>
              <p className="text-xs font-medium text-white/75">Asistente financiero</p>
            </div>
          </div>
          <span className="hidden items-center gap-2 text-xs font-medium text-white/80 sm:flex">
            <ShieldCheck className="size-4" aria-hidden="true" />
            Tu información está protegida
          </span>
        </div>
      </header>

      <div className="mx-auto flex min-h-[calc(100vh-72px)] max-w-4xl flex-col px-5 py-7 sm:px-8">
        <section className="mb-6 text-center sm:mb-8">
          <span className="mx-auto mb-4 grid size-14 place-items-center rounded-2xl bg-[#E40520] text-white shadow-lg shadow-red-200">
            <Bot className="size-7" aria-hidden="true" />
          </span>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Hola, ¿qué quieres revisar hoy?</h1>
          <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-500 sm:text-base">
            Pregúntame sobre tus movimientos, gastos o cómo llegar con calma a fin de mes.
          </p>
        </section>

        <section className="flex-1 space-y-5" aria-live="polite">
          {messages.map((message) => {
            if (message.role === 'user') {
              const text = (message.parts || [])
                .filter((part) => part.type === 'text')
                .map((part) => part.text)
                .join('')

              return (
                <div key={message.id} className="ml-auto max-w-[88%] sm:max-w-md">
                  <div className="rounded-2xl rounded-br-md bg-[#E40520] px-4 py-3 text-sm leading-6 text-white shadow-sm">
                    {text}
                  </div>
                </div>
              )
            }

            if (message.role === 'assistant') {
              return (
                <div key={message.id} className="max-w-xl">
                  <AssistantInterface message={message} isStreaming={status === 'streaming'} />
                </div>
              )
            }

            return null
          })}

          {messages.length === 0 && (
            <div className="rounded-3xl border border-white bg-white/80 p-5 shadow-sm sm:p-6">
              <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-700">
                <Sparkles className="size-4 text-[#E40520]" aria-hidden="true" />
                Prueba una consulta rápida
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                {suggestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => sendQuestion(suggestion)}
                    disabled={isSending}
                    className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-left text-sm font-medium text-slate-700 transition hover:border-[#E40520]/30 hover:bg-red-50 hover:text-[#E40520] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}
        </section>

        <div className="sticky bottom-0 mt-6 bg-gradient-to-t from-[#f8f8fa] via-[#f8f8fa] pt-5">
          <form onSubmit={handleSubmit} className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-lg shadow-slate-200/50">
            <label className="sr-only" htmlFor="chat-input">Escribe tu consulta</label>
            <input
              id="chat-input"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              disabled={isSending}
              placeholder="Escribe una consulta sobre tu dinero..."
              className="min-w-0 flex-1 bg-transparent px-3 py-2 text-sm outline-none placeholder:text-slate-400 disabled:cursor-not-allowed"
            />
            <button
              type="submit"
              disabled={!input.trim() || isSending}
              className="grid size-10 place-items-center rounded-xl bg-[#E40520] text-white transition hover:bg-[#c9041b] disabled:cursor-not-allowed disabled:bg-slate-200"
              aria-label="Enviar consulta"
            >
              {isSending ? <Clock3 className="size-5 animate-pulse" aria-hidden="true" /> : <ArrowUp className="size-5" aria-hidden="true" />}
            </button>
          </form>
          <p className="mt-3 text-center text-xs text-slate-400">Asistente informativo. Verifica tus movimientos en Banorte Móvil.</p>
        </div>
      </div>
    </main>
  )
}
