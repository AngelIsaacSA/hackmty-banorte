import { BanorteMark, ChartIcon, ChevronRight, ClockIcon, DocIcon } from "./icons"

const CARDS = [
  {
    title: "Historial",
    description: "Tus últimos movimientos por periodo, categorizados y con el comercio de cada cargo.",
    prompt: "Quiero ver mis últimos movimientos de los últimos 3 meses",
    Icon: ClockIcon,
    accent: true,
  },
  {
    title: "Búsqueda",
    description: "Encuentra un cobro específico por comercio, monto o descripción.",
    prompt: "¿Dónde se fue mi último cobro de OXXO?",
    Icon: DocIcon,
    accent: false,
  },
  {
    title: "Proyección",
    description: "Tu saldo actual contra tus gastos recurrentes: ¿te alcanza para fin de mes?",
    prompt: "¿Me alcanza para fin de mes?",
    Icon: ChartIcon,
    accent: false,
    wide: true,
  },
]

function QuickCard({ card, onQuick }) {
  const { title, description, prompt, Icon, accent, wide } = card
  return (
    <button
      type="button"
      onClick={() => onQuick(prompt)}
      className={`group flex flex-col rounded-xl border border-slate-300 bg-white p-4 text-left shadow-sm transition-all duration-200 hover:border-banorte-red hover:shadow-lg hover:shadow-red-500/5 ${
        wide ? "sm:col-span-2 sm:mx-auto sm:w-2/3" : ""
      }`}
    >
      <div className="mb-1.5 flex items-center justify-between">
        <span className="flex items-center gap-2 text-base font-bold text-slate-900 transition-colors group-hover:text-banorte-red">
          <span
            className={`rounded-lg p-1.5 transition-colors group-hover:bg-banorte-red group-hover:text-white ${
              accent ? "bg-red-50 text-banorte-red" : "bg-slate-100 text-slate-700"
            }`}
          >
            <Icon className="h-4 w-4" />
          </span>
          {title}
        </span>
        <ChevronRight className="h-4 w-4 text-slate-400 transition-all group-hover:translate-x-0.5 group-hover:text-banorte-red" />
      </div>
      <p className="text-xs font-normal text-slate-500">{description}</p>
    </button>
  )
}

export function BrandHeader({ compact = false }) {
  return (
    <div
      className={`flex flex-col items-center transition-all duration-500 ease-out ${
        compact ? "mb-4 pt-1" : "mb-8"
      }`}
    >
      <div
        className={`rounded-2xl border border-slate-200/80 bg-white shadow-sm transition-all duration-500 ease-out ${
          compact ? "mb-2 p-2" : "mb-3 p-3"
        }`}
      >
        <div
          className={`flex items-center justify-center rounded-xl bg-banorte-red text-white shadow-md shadow-red-500/25 transition-all duration-500 ease-out ${
            compact ? "h-9 w-9" : "h-14 w-14"
          }`}
        >
          <BanorteMark className={`transition-all duration-500 ease-out ${compact ? "h-5 w-5" : "h-8 w-8"}`} />
        </div>
      </div>
      <h1
        className={`text-balance font-extrabold tracking-tight text-slate-900 transition-all duration-500 ease-out ${
          compact ? "text-xl" : "text-3xl sm:text-4xl"
        }`}
      >
        BANORTE <span className="font-light text-banorte-red">GEN-AI</span>
      </h1>
    </div>
  )
}

export default function ChatHero({ onQuick }) {
  return (
    <section className="flex w-full flex-col items-center px-1 text-center">
      <p className="mb-8 max-w-lg text-pretty text-sm leading-relaxed text-slate-600 sm:text-base">
        Tu asistente inteligente para consultar tus movimientos, analizar tus gastos y proyectar tu saldo.
      </p>

      <div className="grid w-full max-w-2xl grid-cols-1 gap-4 sm:grid-cols-2">
        {CARDS.map((card) => (
          <QuickCard key={card.title} card={card} onQuick={onQuick} />
        ))}
      </div>
    </section>
  )
}
