'use client'

import MovimientosList from './MovimientosList'
import MovimientoTicket from './MovimientoTicket'
import ProyeccionCard from './ProyeccionCard'
import PlanPagoOpciones from './PlanPagoOpciones'
import PlanPagoConfirmacion from './PlanPagoConfirmacion'
import GastoPorCategoriaCard from './GastoPorCategoriaCard'
import ResumenGastosCard from './ResumenGastosCard'

export default function GenerativeToolResult({
  output,
  onSelectMovimiento,
  onElegirPlan,
  onVerHistorial,
  onBuscarComercio,
  onVerCategoria,
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
      return <MovimientoTicket data={output.data} onBuscarComercio={onBuscarComercio} />
    case 'ProyeccionCard':
      return <ProyeccionCard data={output.data} onVerHistorial={onVerHistorial} />
    case 'PlanPagoOpciones':
      return <PlanPagoOpciones data={output.data} onElegirPlan={onElegirPlan} />
    case 'PlanPagoConfirmacion':
      return <PlanPagoConfirmacion data={output.data} />
    case 'GastoPorCategoriaCard':
      return (
        <GastoPorCategoriaCard
          data={output.data}
          onSelect={onSelectMovimiento}
          onVerCategoria={onVerCategoria}
        />
      )
    case 'ResumenGastosCard':
      return (
        <ResumenGastosCard
          data={output.data}
          onSelectMovimiento={onSelectMovimiento}
          onVerCategoria={onVerCategoria}
        />
      )
    default:
      return null
  }
}
