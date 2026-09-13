import { BanorteMark, SparkIcon } from "./icons"

function messageText(message) {
  return message.parts
    .filter((part) => part.type === "text")
    .map((part) => part.text)
    .join("")
}

function interfaceParts(message) {
  return (message.parts || []).filter(
    (part) => part.type === "dynamic-tool" || part.type.startsWith("tool-")
  )
}

function InterfaceChip({ message, onOpenInterface }) {
  const parts = interfaceParts(message)
  if (parts.length === 0) return null

  const isReady = parts.some((part) => part.state === "output-available")

  if (!isReady) {
    return (
      <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-500 shadow-sm">
        Consultando tu información…
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={() => onOpenInterface?.(message.id)}
      className="flex items-center gap-1.5 rounded-full border border-banorte-red/30 bg-red-50 px-3 py-1.5 text-xs font-semibold text-banorte-red transition hover:bg-red-100"
    >
      <SparkIcon className="h-3.5 w-3.5" />
      Ver interfaz generada
    </button>
  )
}

function Avatar({ role }) {
  if (role === "user") {
    return (
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-slate-100 text-xs font-bold text-slate-700">
        CR
      </div>
    )
  }
  return (
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-banorte-red text-white shadow-sm shadow-red-500/25">
      <BanorteMark className="h-5 w-5" />
    </div>
  )
}

export default function MessageList({ messages, status, bottomRef, onOpenInterface }) {
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
              {hasInterface && <InterfaceChip message={message} onOpenInterface={onOpenInterface} />}
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
