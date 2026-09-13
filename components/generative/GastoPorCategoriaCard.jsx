'use client'

const formatoMoneda = new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'MXN',
})

const formatoFecha = new Intl.DateTimeFormat('es-MX', {
  day: 'numeric',
  month: 'short',
})

export default function GastoPorCategoriaCard({ data, onSelect, onVerCategoria }) {
  const { periodo, categoria, total, grupos, movimientos } = data

  if (categoria) {
    return (
      <div className="rounded-2xl border border-border bg-card p-4 text-card-foreground">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h3 className="font-semibold">
            {categoria} ({periodo})
          </h3>
          <span className="shrink-0 text-sm font-semibold tabular-nums">
            {formatoMoneda.format(total)}
          </span>
        </div>

        {movimientos.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No encontré gastos en esta categoría.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {movimientos.map((mov) => (
              <li key={mov.id}>
                <button
                  type="button"
                  onClick={() => onSelect?.(mov)}
                  className="flex w-full items-center justify-between gap-3 py-2.5 text-left transition-colors hover:bg-muted/60 rounded-lg px-2 -mx-2"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">{mov.comercio}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatoFecha.format(new Date(mov.fecha))}
                    </p>
                  </div>
                  <span className="shrink-0 font-semibold tabular-nums">
                    {formatoMoneda.format(Math.abs(mov.monto))}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    )
  }

  const max = grupos.length > 0 ? grupos[0].total : 1

  return (
    <div className="rounded-2xl border border-border bg-card p-4 text-card-foreground">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="font-semibold">Gasto por categoría ({periodo})</h3>
        <span className="shrink-0 text-sm text-muted-foreground">
          Total: {formatoMoneda.format(total)}
        </span>
      </div>

      {grupos.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No encontré gastos en este periodo.
        </p>
      ) : (
        <ul className="space-y-3">
          {grupos.map((grupo) => (
            <li key={grupo.categoria}>
              <button
                type="button"
                onClick={() => onVerCategoria?.(grupo.categoria)}
                className="w-full rounded-lg px-2 py-1 text-left -mx-2 hover:bg-muted/60 transition-colors"
              >
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="font-medium">{grupo.categoria}</span>
                  <span className="tabular-nums text-muted-foreground">
                    {formatoMoneda.format(grupo.total)} · {grupo.cantidad}
                  </span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${Math.max((grupo.total / max) * 100, 4)}%` }}
                  />
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
