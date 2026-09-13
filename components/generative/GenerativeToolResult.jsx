'use client'

import MovimientosList from './MovimientosList'
import MovimientoTicket from './MovimientoTicket'
import ProyeccionCard from './ProyeccionCard'
import PlanPagoOpciones from './PlanPagoOpciones'
import PlanPagoConfirmacion from './PlanPagoConfirmacion'

export default function GenerativeToolResult({
  output,
  onSelectMovimiento,
  onElegirPlan,
  onVerHistorial,
}) {
  if (!output || typeof output !== 'object') return null

  switch (output.component) {
    case 'MovimientosList':
      return (
        <MovimientosList
          data={output.data}
          onSelect={onSelectMovimiento}
          onVerHistorial={onVerHistorial}
        />
      )
    case 'MovimientoTicket':
      return <MovimientoTicket data={output.data} />
    case 'ProyeccionCard':
      return <ProyeccionCard data={output.data} />
    case 'PlanPagoOpciones':
      return <PlanPagoOpciones data={output.data} onElegirPlan={onElegirPlan} />
    case 'PlanPagoConfirmacion':
      return <PlanPagoConfirmacion data={output.data} />
    default:
      return null
  }
}
