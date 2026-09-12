import { ArrowRight, MicIcon } from "./icons"

const SUGGESTIONS = [
  { label: "¿En qué gasté más este mes?", prompt: "¿En qué gasté más este mes?" },
  { label: "¿Me alcanza para fin de mes?", prompt: "¿Me alcanza para fin de mes?" },
  { label: "Último cobro de OXXO", prompt: "¿Dónde se fue mi último cobro de OXXO?" },
  { label: "Movimientos de los últimos 3 meses", prompt: "Quiero ver mis últimos movimientos de los últimos 3 meses" },
  { label: "¿En qué se me cobró hoy?", prompt: "¿En qué se me cobró hoy?" },
  { label: "¿Dónde se fue mi dinero?", prompt: "¿Dónde se fue mi dinero este mes?" },
]

export default function PromptInput({ value, onChange, onSubmit, onSuggestion, disabled, showHeading, showSuggestions }) {
  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      if (event.nativeEvent.isComposing || event.keyCode === 229) return
      event.preventDefault()
      onSubmit()
    }
  }

  return (
    <section className="mx-auto w-full max-w-3xl pb-2">
      {showHeading && (
        <div className="mb-2.5 px-2">
          <label htmlFor="ai-prompt-input" className="text-base font-semibold text-slate-900 sm:text-lg">
            ¿Qué hacemos hoy?
          </label>
        </div>
      )}

      <form
        onSubmit={(event) => {
          event.preventDefault()
          onSubmit()
        }}
        className="relative flex items-center"
      >
        <input
          id="ai-prompt-input"
          type="text"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Escribe tu consulta o comando financiero aquí..."
          className="w-full rounded-full border-2 border-slate-300 bg-white py-4 pl-6 pr-32 text-sm text-slate-800 shadow-lg shadow-slate-900/5 outline-none transition-all placeholder:text-slate-400 focus:border-banorte-red focus:ring-4 focus:ring-red-100 sm:text-base"
        />
        <div className="absolute right-2.5 flex items-center gap-1.5">
          <button
            type="button"
            title="Activar entrada de voz"
            className="rounded-full p-2.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-banorte-red"
          >
            <MicIcon className="h-5 w-5" />
            <span className="sr-only">Activar entrada de voz</span>
          </button>
          <button
            type="submit"
            disabled={disabled}
            title="Enviar mensaje"
            className="inline-flex items-center justify-center rounded-full bg-banorte-red p-2.5 text-sm font-medium text-white shadow-md shadow-red-500/20 transition-all hover:bg-banorte-dark-red active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 sm:px-4 sm:py-2.5"
          >
            <span className="hidden pr-1 font-semibold sm:inline">Enviar</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </form>

      {showSuggestions && (
        <div className="mt-3 flex flex-wrap items-center justify-center gap-2 text-xs text-slate-500">
          <span className="font-medium text-slate-400">Sugerencias:</span>
          {SUGGESTIONS.map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={() => onSuggestion(item.prompt)}
              className="rounded-md border border-slate-200 bg-white px-2.5 py-1 transition-colors hover:bg-slate-100"
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </section>
  )
}
