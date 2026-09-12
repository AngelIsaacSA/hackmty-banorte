import { BanorteMark } from "./icons"

function messageText(message) {
  return message.parts
    .filter((part) => part.type === "text")
    .map((part) => part.text)
    .join("")
}

function interfaceParts(message) {
  return (message.parts || []).filter((part) => {
    return (
      part.type === "ui" ||
      part.type === "custom" ||
      part.type === "data" ||
      part.type.startsWith("data-") ||
      part.type === "tool" ||
      part.type.startsWith("tool-")
    )
  })
}

function GeneratedInterface({ message, isStreaming }) {
  const parts = interfaceParts(message)

  if (parts.length === 0) {
    return isStreaming ? (
      <div className="flex items-center gap-2 rounded-2xl rounded-tl-sm border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500 shadow-sm">
        Preparando tu resumen financiero…
      </div>
    ) : null
  }

  return (
    <div className="space-y-3">
      {parts.map((part, index) => {
        const isReady = part.state === "output-available" || part.state === "done"
        return (
          <div
            key={`${message.id}-${part.type}-${index}`}
            className="flex items-center gap-2 overflow-hidden rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500 shadow-sm"
          >
            {/* TODO: mapear part.type al componente de components/generative/ una vez exista feature/components */}
            {isReady ? "Interfaz generada por el agente" : "Actualizando información…"}
          </div>
        )
      })}
    </div>
  )
}

function Avatar({ role }) {
  if (role === "user") {
    return (
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-slate-100 text-xs font-bold text-slate-700">
        JS
      </div>
    )
  }
  return (
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-banorte-red text-white shadow-sm shadow-red-500/25">
      <BanorteMark className="h-5 w-5" />
    </div>
  )
}

export default function MessageList({ messages, status, bottomRef }) {
  const isStreaming = status === "streaming"

  return (
    <section className="flex-1 space-y-5 px-1 py-6">
      {messages.map((message) => {
        const isUser = message.role === "user"
        const text = messageText(message)
        const hasInterface = !isUser && interfaceParts(message).length > 0

        return (
          <div key={message.id} className={`flex items-start gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
            <Avatar role={message.role} />
            <div className={`flex max-w-[80%] flex-col gap-2 ${isUser ? "items-end" : "items-start"}`}>
              {text && (
                <div
                  className={`whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
                    isUser
                      ? "rounded-tr-sm bg-banorte-red text-white"
                      : "rounded-tl-sm border border-slate-200 bg-white text-slate-800"
                  }`}
                >
                  {text}
                </div>
              )}
              {hasInterface && (
                <div className="w-full">
                  <GeneratedInterface message={message} isStreaming={isStreaming} />
                </div>
              )}
            </div>
          </div>
        )
      })}

      {status === "submitted" && (
        <div className="flex items-start gap-3">
          <Avatar role="assistant" />
          <div className="flex items-center gap-1.5 rounded-2xl rounded-tl-sm border border-slate-200 bg-white px-4 py-3.5 shadow-sm">
            <span className="h-2 w-2 animate-bounce rounded-full bg-banorte-red [animation-delay:-0.3s]" />
            <span className="h-2 w-2 animate-bounce rounded-full bg-banorte-red [animation-delay:-0.15s]" />
            <span className="h-2 w-2 animate-bounce rounded-full bg-banorte-red" />
          </div>
        </div>
      )}

      <div ref={bottomRef} />
    </section>
  )
}
