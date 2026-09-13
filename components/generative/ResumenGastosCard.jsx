'use client'

const formatoMoneda = new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'MXN',
})

const formatoFecha = new Intl.DateTimeFormat('es-MX', {
  day: 'numeric',
  month: 'short',
})

export default function ResumenGastosCard({ data, onSelectMovimiento, onVerCategoria }) {
  const { periodo, totalGastado, mayorGasto, topGastos, porCategoria } = data

  return (
    <div className="rounded-2xl border border-border bg-card p-4 text-card-foreground">
      <div className="mb-4 flex items-center justify-between gap-2">
        <h3 className="font-semibold">Resumen de gastos ({periodo})</h3>
        <span className="shrink-0 text-sm font-semibold tabular-nums">
          {formatoMoneda.format(totalGastado)}
        </span>
      </div>

      {mayorGasto && (
        <div className="mb-4 rounded-xl border border-border bg-muted/40 p-3">
          <p className="text-xs text-muted-foreground">Tu gasto más grande</p>
          <div className="mt-1 flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate font-semibold">{mayorGasto.comercio}</p>
              <p className="text-xs text-muted-foreground">
                {formatoFecha.format(new Date(mayorGasto.fecha))} · {mayorGasto.categoria}
              </p>
            </div>
            <span className="shrink-0 text-lg font-bold tabular-nums">
              {formatoMoneda.format(Math.abs(mayorGasto.monto))}
            </span>
          </div>
          {onSelectMovimiento && (
            <button
              type="button"
              onClick={() => onSelectMovimiento(mayorGasto)}
              className="mt-2 rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-foreground transition-colors hover:border-banorte-red hover:text-banorte-red"
            >
              Ver detalle
            </button>
          )}
        </div>
      )}

      {topGastos?.length > 0 && (
        <div className="mb-4">
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Top 3 gastos
          </p>
          <ul className="divide-y divide-border">
            {topGastos.map((mov) => (
              <li key={mov.id}>
                <button
                  type="button"
                  onClick={() => onSelectMovimiento?.(mov)}
                  className="flex w-full items-center justify-between gap-3 py-2 text-left transition-colors hover:bg-muted/60 rounded-lg px-2 -mx-2"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{mov.comercio}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatoFecha.format(new Date(mov.fecha))}
                    </p>
                  </div>
                  <span className="shrink-0 text-sm font-semibold tabular-nums">
                    {formatoMoneda.format(Math.abs(mov.monto))}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {porCategoria?.length > 0 && (
        <div>
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Por categoría
          </p>
          <ul className="space-y-1">
            {porCategoria.map((grupo) => (
              <li key={grupo.categoria}>
                <button
                  type="button"
                  onClick={() => onVerCategoria?.(grupo.categoria)}
                  className="-mx-2 flex w-full items-center justify-between gap-2 rounded-lg px-2 py-1 text-sm transition-colors hover:bg-muted/60"
                >
                  <span>{grupo.categoria}</span>
                  <span className="tabular-nums text-muted-foreground">
                    {formatoMoneda.format(grupo.total)}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
