"use client"

import { ArrowLeft, ChevronLeft, ChevronRight, SparkIcon, XIcon } from "../icons"
import GenerativeToolResult from "./GenerativeToolResult"

export default function InterfacePanel({
  screens,
  screenIndex,
  onScreenChange,
  collapsed,
  onCollapse,
  onExpand,
  onSelectMovimiento,
  onElegirPlan,
  onVerHistorial,
  onBuscarComercio,
  onVerCategoria,
}) {
  const total = screens.length
  const safeIndex = Math.min(screenIndex, total - 1)
  const current = screens[safeIndex]
  const canPrev = safeIndex > 0
  const canNext = safeIndex < total - 1

  if (collapsed) {
    return (
      <button
        type="button"
        onClick={onExpand}
        className="fixed bottom-24 right-4 z-30 flex items-center gap-2 rounded-full bg-banorte-red px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-red-500/30 animate-in fade-in slide-in-from-bottom-2 duration-200 sm:bottom-6"
      >
        <SparkIcon className="h-4 w-4" />
        Ver interfaz generada
      </button>
    )
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-3 sm:p-6">
      <div
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onCollapse}
        aria-hidden="true"
      />

      <section className="relative z-10 flex h-[88vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl animate-in fade-in zoom-in-95 slide-in-from-bottom-4 duration-300 sm:h-[82vh]">
        <header className="flex items-center justify-between gap-2 border-b border-slate-100 px-4 py-3">
          <button
            type="button"
            onClick={onCollapse}
            title="Volver al chat"
            className="flex items-center gap-1.5 rounded-full px-2 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-banorte-red"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Chat</span>
          </button>

          {total > 1 && (
            <span className="text-xs font-semibold text-slate-400">
              {safeIndex + 1} / {total}
            </span>
          )}

          <button
            type="button"
            onClick={onCollapse}
            title="Cerrar"
            className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition hover:bg-red-50 hover:text-banorte-red"
          >
            <XIcon className="h-4 w-4" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6">
          {current && (
            <GenerativeToolResult
              output={current}
              onSelectMovimiento={onSelectMovimiento}
              onElegirPlan={onElegirPlan}
              onVerHistorial={onVerHistorial}
              onBuscarComercio={onBuscarComercio}
              onVerCategoria={onVerCategoria}
            />
          )}
        </div>

        {total > 1 && (
          <footer className="flex items-center justify-between gap-3 border-t border-slate-100 px-4 py-3">
            <button
              type="button"
              disabled={!canPrev}
              onClick={() => onScreenChange(safeIndex - 1)}
              className="flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-banorte-red hover:text-banorte-red disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              Anterior
            </button>

            <div className="flex items-center gap-1.5">
              {screens.map((_, index) => (
                <span
                  key={index}
                  className={`h-1.5 w-1.5 rounded-full transition-colors ${
                    index === safeIndex ? "bg-banorte-red" : "bg-slate-200"
                  }`}
                />
              ))}
            </div>

            <button
              type="button"
              disabled={!canNext}
              onClick={() => onScreenChange(safeIndex + 1)}
              className="flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-banorte-red hover:text-banorte-red disabled:cursor-not-allowed disabled:opacity-40"
            >
              Siguiente
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </footer>
        )}
      </section>
    </div>
  )
}
