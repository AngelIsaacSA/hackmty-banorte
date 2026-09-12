'use client'

const formatoMoneda = new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'MXN',
})

const formatoFecha = new Intl.DateTimeFormat('es-MX', {
  day: 'numeric',
  month: 'short',
})

export default function MovimientosList({ data, onSelect }) {
  const { periodo, query, movimientos } = data
  const totalGastado = movimientos
    .filter((m) => m.monto < 0)
    .reduce((acc, m) => acc + Math.abs(m.monto), 0)

  return (
    <div className="rounded-2xl border border-border bg-card p-4 text-card-foreground">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="font-semibold">
          {periodo ? `Movimientos (${periodo})` : `Resultados para "${query}"`}
        </h3>
        {totalGastado > 0 && (
          <span className="shrink-0 text-sm text-muted-foreground">
            Gastado: {formatoMoneda.format(totalGastado)}
          </span>
        )}
      </div>

      {movimientos.length === 0 ? (
        <p className="text-sm text-muted-foreground">No encontré movimientos.</p>
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
                    {formatoFecha.format(new Date(mov.fecha))} · {mov.categoria}
                  </p>
                </div>
                <span
                  className={`shrink-0 font-semibold tabular-nums ${
                    mov.tipo === 'abono' ? 'text-green-600' : 'text-foreground'
                  }`}
                >
                  {mov.tipo === 'abono' ? '+' : '-'}
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
