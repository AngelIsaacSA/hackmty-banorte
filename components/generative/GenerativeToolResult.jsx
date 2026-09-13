'use client'

import MovimientosList from './MovimientosList'
import MovimientoTicket from './MovimientoTicket'
import ProyeccionCard from './ProyeccionCard'
import PlanPagoOpciones from './PlanPagoOpciones'

export default function GenerativeToolResult({ output, onSelectMovimiento, onElegirPlan }) {
  if (!output || typeof output !== 'object') return null

  // Nota: get_plan_pago (solo lectura) resuelve en una sola pantalla y sí
  // pasa por aquí. aplicar_plan_pago regresa { screens: [...] } (varias
  // pantallas) — ese caso todavía no lo maneja este dispatcher; lo resuelve
  // el panel/canvas nuevo que se está armando en paralelo (ver CONTEXT.md →
  // "Nueva dirección de UI").
  switch (output.component) {
    case 'MovimientosList':
      return <MovimientosList data={output.data} onSelect={onSelectMovimiento} />
    case 'MovimientoTicket':
      return <MovimientoTicket data={output.data} />
    case 'ProyeccionCard':
      return <ProyeccionCard data={output.data} />
    case 'PlanPagoOpciones':
      return <PlanPagoOpciones data={output.data} onElegirPlan={onElegirPlan} />
    default:
      return null
  }
}
