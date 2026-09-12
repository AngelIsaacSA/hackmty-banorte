import { BanorteMark } from "./icons"

function messageText(message) {
  return message.parts
    .filter((part) => part.type === "text")
    .map((part) => part.text)
    .join("")
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
  return (
    <section className="flex-1 space-y-5 px-1 py-6">
      {messages.map((message) => {
        const isUser = message.role === "user"
        return (
          <div key={message.id} className={`flex items-start gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
            <Avatar role={message.role} />
            <div
              className={`max-w-[80%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
                isUser
                  ? "rounded-tr-sm bg-banorte-red text-white"
                  : "rounded-tl-sm border border-slate-200 bg-white text-slate-800"
              }`}
            >
              {messageText(message)}
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
