'use client'

import { useState, type FormEvent } from 'react'
import { useChat } from '@ai-sdk/react'
import GenerativeToolResult from '@/components/generative/GenerativeToolResult'

export default function Home() {
  const { messages, sendMessage, status } = useChat()
  const [input, setInput] = useState('')

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return
    sendMessage({ text: input })
    setInput('')
  }

  const onSelectMovimiento = (movimiento: {
    comercio: string
    monto: number
    fecha: string
  }) => {
    sendMessage({
      text: `Muéstrame el detalle de este movimiento: ${movimiento.comercio}, $${Math.abs(
        movimiento.monto
      )} MXN, ${movimiento.fecha}.`,
    })
  }

  return (
    <main className="flex flex-col h-screen max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4 text-center">
        Asistente Banorte 🏦
      </h1>

      <div className="flex-1 overflow-y-auto space-y-4 mb-4">
        {messages.map((m) => (
          <div key={m.id} className={m.role === 'user' ? 'flex justify-end' : 'space-y-3'}>
            {m.parts.map((part, i) => {
              if (part.type === 'text') {
                return (
                  <div
                    key={i}
                    className={`p-3 rounded-lg ${
                      m.role === 'user'
                        ? 'bg-red-100 max-w-xs text-right'
                        : 'bg-gray-100 max-w-md'
                    }`}
                  >
                    {part.text}
                  </div>
                )
              }

              const isToolPart = part.type === 'dynamic-tool' || part.type.startsWith('tool-')
              if (isToolPart && part.state === 'output-available') {
                return (
                  <GenerativeToolResult
                    key={i}
                    output={part.output}
                    onSelectMovimiento={onSelectMovimiento}
                  />
                )
              }

              return null
            })}
          </div>
        ))}
      </div>

      <form onSubmit={onSubmit} className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Escribe tu pregunta..."
          className="flex-1 border rounded-lg p-2 outline-none"
        />
        <button
          type="submit"
          disabled={status !== 'ready'}
          className="bg-red-600 text-white px-4 py-2 rounded-lg disabled:opacity-50"
        >
          Enviar
        </button>
      </form>
    </main>
  )
}
