'use client'

const formatoMoneda = new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'MXN',
})

const formatoFecha = new Intl.DateTimeFormat('es-MX', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})

export default function PlanPagoConfirmacion({ data }) {
  const { tarjeta, opcion } = data || {}
  if (!tarjeta || !opcion) return null

  return (
    <div className="rounded-2xl border border-green-600/30 bg-card p-4 text-card-foreground">
      <div className="mb-3 flex items-center gap-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-green-600/10 text-green-600">
          <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
        <div>
          <p className="font-semibold">Tu plan de pago ya quedó activo</p>
          <p className="text-xs text-muted-foreground">{tarjeta.numero}</p>
        </div>
      </div>

      <dl className="space-y-2 text-sm">
        <div className="flex justify-between">
          <dt className="text-muted-foreground">Plazo</dt>
          <dd className="font-medium">{opcion.meses} meses</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-muted-foreground">Nueva mensualidad</dt>
          <dd className="font-semibold tabular-nums">{formatoMoneda.format(opcion.mensualidad)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-muted-foreground">Interés total del plan</dt>
          <dd className="tabular-nums">{formatoMoneda.format(opcion.interesTotal)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-muted-foreground">Próxima fecha límite de pago</dt>
          <dd>{formatoFecha.format(new Date(tarjeta.fechaLimitePago))}</dd>
        </div>
      </dl>
    </div>
  )
}
