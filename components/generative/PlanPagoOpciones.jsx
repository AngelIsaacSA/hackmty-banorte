'use client'

const formatoMoneda = new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'MXN',
})

export default function PlanPagoOpciones({ data, onElegirPlan }) {
  const { tarjeta, saldo, opciones, opcionAplicada } = data || {}
  if (!tarjeta || !opciones) return null

  return (
    <div className="rounded-2xl border border-border bg-card p-4 text-card-foreground">
      <div className="mb-1 flex items-center justify-between gap-2">
        <h3 className="font-semibold">Reestructura tu saldo</h3>
        <span className="text-xs text-muted-foreground">{tarjeta.numero}</span>
      </div>
      <p className="mb-4 text-sm text-muted-foreground">
        Saldo a reestructurar: <span className="font-semibold text-foreground">{formatoMoneda.format(saldo)}</span>
      </p>

      <div className="grid gap-2 sm:grid-cols-3">
        {opciones.map((opcion) => {
          const esLaAplicada = opcionAplicada?.meses === opcion.meses

          return (
            <div
              key={opcion.meses}
              className={`rounded-xl border p-3 text-center ${
                esLaAplicada ? 'border-green-600 bg-green-600/5' : 'border-border'
              }`}
            >
              <p className="text-xs text-muted-foreground">{opcion.meses} meses</p>
              <p className="mt-1 text-lg font-bold tabular-nums">
                {formatoMoneda.format(opcion.mensualidad)}
                <span className="text-xs font-normal text-muted-foreground">/mes</span>
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                CAT {opcion.cat}% · interés total {formatoMoneda.format(opcion.interesTotal)}
              </p>

              {esLaAplicada ? (
                <span className="mt-2 inline-block rounded-full bg-green-600/10 px-2 py-0.5 text-xs font-medium text-green-600">
                  Plan activo
                </span>
              ) : (
                onElegirPlan &&
                !opcionAplicada && (
                  <button
                    type="button"
                    onClick={() => onElegirPlan(opcion.meses)}
                    className="mt-2 w-full rounded-lg bg-primary px-2 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/80"
                  >
                    Elegir este plan
                  </button>
                )
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
