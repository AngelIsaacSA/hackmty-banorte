import { ChevronRight, TrendIcon } from "./icons"

export default function InstitutionalTopBar() {
  return (
    <aside className="hidden bg-banorte-charcoal px-6 py-2 text-xs text-slate-300 md:block">
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        <div className="flex items-center gap-6">
          <span className="flex cursor-pointer items-center gap-1.5 font-bold tracking-wider text-white">
            GRUPO FINANCIERO BANORTE
            <ChevronRight className="h-3.5 w-3.5 text-banorte-red" />
          </span>
          <span className="text-slate-600">|</span>
          <span className="flex items-center gap-1">
            <TrendIcon className="h-3.5 w-3.5 text-slate-400" />
            Análisis económico
          </span>
          <span className="flex items-center gap-1">Tipo de cambio: USD $17.82</span>
        </div>
        <div className="flex items-center gap-3 border-l border-slate-700 pl-4">
          <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
          <span className="text-slate-400">Motor IA Banorte v3.4 Conectado</span>
        </div>
      </div>
    </aside>
  )
}
