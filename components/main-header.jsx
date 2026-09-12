import { BanorteMark, SparkIcon } from "./icons"

export default function MainHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white shadow-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-banorte-red text-white shadow-md shadow-red-500/20">
              <BanorteMark className="h-6 w-6" />
            </div>
            <div className="leading-none">
              <span className="block text-lg font-extrabold tracking-tight text-slate-900">BANORTE</span>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                El Banco Fuerte de México
              </span>
            </div>
          </div>
          <div className="hidden h-6 w-px bg-slate-300 sm:block" />
          <div className="hidden items-center gap-1.5 rounded-full border border-red-100 bg-red-50 px-3 py-1 text-xs font-semibold text-banorte-red sm:flex">
            <SparkIcon className="h-3.5 w-3.5" />
            <span>Asistente Financiero IA</span>
          </div>
        </div>

        <div className="flex items-center gap-3 sm:gap-5">
          <span className="hidden text-sm font-semibold text-slate-800 lg:block">José Sánchez Garza</span>
          <div className="relative flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-slate-100 text-sm font-bold text-slate-700 shadow-inner">
            JS
            <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-500" />
          </div>
          <a
            href="#banca"
            className="inline-flex items-center justify-center rounded-lg bg-banorte-red px-3 py-2 text-xs font-bold uppercase tracking-wider text-white shadow-sm transition-colors hover:bg-banorte-dark-red sm:px-4"
          >
            Banca en línea
          </a>
        </div>
      </div>
    </header>
  )
}
