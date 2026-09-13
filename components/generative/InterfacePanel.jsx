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
  onClose,
  onSelectMovimiento,
  onElegirPlan,
}) {
  const total = screens.length
  const safeIndex = Math.min(screenIndex, total - 1)
  const current = screens[safeIndex]
  const canPrev = safeIndex > 0
  const canNext = safeIndex < total - 1

  if (collapsed) {
    return (
      <>
        <div className="hidden shrink-0 flex-col items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white py-4 md:flex md:w-14">
          <button
            type="button"
            onClick={onExpand}
            title="Ver interfaz generada"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-banorte-red text-white shadow-sm shadow-red-500/25 transition hover:bg-banorte-dark-red"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        </div>

        <button
          type="button"
          onClick={onExpand}
          className="fixed bottom-28 right-4 z-30 flex items-center gap-2 rounded-full bg-banorte-red px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-red-500/30 md:hidden"
        >
          <SparkIcon className="h-4 w-4" />
          Ver interfaz
        </button>
      </>
    )
  }

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center md:static md:inset-auto md:z-auto md:block">
      <div
        className="absolute inset-0 bg-slate-900/30 md:hidden"
        onClick={onCollapse}
        aria-hidden="true"
      />

      <section className="relative z-10 flex h-[60vh] w-full flex-col overflow-hidden rounded-t-3xl border border-slate-200 bg-white shadow-2xl md:h-full md:w-[420px] md:shrink-0 md:rounded-2xl md:shadow-sm">
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
            onClick={onClose}
            title="Cerrar y empezar de nuevo"
            className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition hover:bg-red-50 hover:text-banorte-red"
          >
            <XIcon className="h-4 w-4" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-4 py-4">
          {current && (
            <GenerativeToolResult
              output={current}
              onSelectMovimiento={onSelectMovimiento}
              onElegirPlan={onElegirPlan}
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
