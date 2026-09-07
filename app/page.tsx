'use client'

import { useChat } from '@ai-sdk/react'

export default function Home() {
  const { messages, input, handleInputChange, handleSubmit } = useChat()

  return (
    <main className="flex flex-col h-screen max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4 text-center">
        Asistente Banorte 🏦
      </h1>

      <div className="flex-1 overflow-y-auto space-y-4 mb-4">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`p-3 rounded-lg ${
              m.role === 'user'
                ? 'bg-red-100 ml-auto max-w-xs text-right'
                : 'bg-gray-100 mr-auto max-w-xs'
            }`}
          >
            {m.content}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          value={input}
          onChange={handleInputChange}
          placeholder="Escribe tu pregunta..."
          className="flex-1 border rounded-lg p-2 outline-none"
        />
        <button
          type="submit"
          className="bg-red-600 text-white px-4 py-2 rounded-lg"
        >
          Enviar
        </button>
      </form>
    </main>
  )
}