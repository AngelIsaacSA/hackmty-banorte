'use client'

const formatoMoneda = new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'MXN',
})

export default function ProyeccionCard({ data }) {
  const { saldoActual, gastosProyectados, saldoProyectado, alcanza, diasRestantes } = data

  return (
    <div className="rounded-2xl border border-border bg-card p-4 text-card-foreground">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-semibold">Proyección a fin de mes</h3>
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
            alcanza
              ? 'bg-green-600/10 text-green-600'
              : 'bg-destructive/10 text-destructive'
          }`}
        >
          {alcanza ? 'Sí te alcanza' : 'No te alcanza'}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2 text-center">
        <div>
          <p className="text-xs text-muted-foreground">Saldo actual</p>
          <p className="font-semibold tabular-nums">{formatoMoneda.format(saldoActual)}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Gastos por venir</p>
          <p className="font-semibold tabular-nums">{formatoMoneda.format(gastosProyectados)}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Saldo proyectado</p>
          <p
            className={`font-semibold tabular-nums ${
              saldoProyectado < 0 ? 'text-destructive' : 'text-foreground'
            }`}
          >
            {formatoMoneda.format(saldoProyectado)}
          </p>
        </div>
      </div>

      {diasRestantes != null && (
        <p className="mt-3 border-t border-border pt-3 text-center text-xs text-muted-foreground">
          Quedan {diasRestantes} día{diasRestantes === 1 ? '' : 's'} para que termine el mes.
        </p>
      )}
    </div>
  )
}
