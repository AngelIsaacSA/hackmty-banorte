'use client'

const formatoMoneda = new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'MXN',
})

const formatoFecha = new Intl.DateTimeFormat('es-MX', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})

export default function MovimientoTicket({ data }) {
  const { movimiento, cuenta } = data || {}
  if (!movimiento) return null

  const esAbono = movimiento.tipo === 'abono'

  return (
    <div className="mx-auto w-full max-w-xs rounded-2xl border border-dashed border-border bg-card p-5 text-card-foreground shadow-sm">
      <p className="text-center text-xs tracking-widest text-muted-foreground uppercase">
        Comprobante de movimiento
      </p>
      {cuenta && (
        <p className="text-center text-[11px] text-muted-foreground">
          {cuenta.cliente} · {cuenta.numeroCuenta}
        </p>
      )}

      <p className="mt-3 text-center text-lg font-semibold">{movimiento.comercio}</p>
      <p
        className={`text-center text-2xl font-bold tabular-nums ${
          esAbono ? 'text-green-600' : 'text-foreground'
        }`}
      >
        {esAbono ? '+' : '-'}
        {formatoMoneda.format(Math.abs(movimiento.monto))}
      </p>

      <div className="my-4 border-t border-dashed border-border" />

      <dl className="space-y-2 text-sm">
        <div className="flex justify-between">
          <dt className="text-muted-foreground">Fecha</dt>
          <dd className="text-right capitalize">{formatoFecha.format(new Date(movimiento.fecha))}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-muted-foreground">Categoría</dt>
          <dd>{movimiento.categoria}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="shrink-0 text-muted-foreground">Descripción</dt>
          <dd className="text-right">{movimiento.descripcion}</dd>
        </div>
        {movimiento.recurrente && (
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Tipo de cargo</dt>
            <dd>Recurrente</dd>
          </div>
        )}
        <div className="flex justify-between">
          <dt className="text-muted-foreground">Folio</dt>
          <dd className="font-mono text-xs">#{movimiento.id}</dd>
        </div>
      </dl>
    </div>
  )
}
