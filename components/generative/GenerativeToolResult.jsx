'use client'

import MovimientosList from './MovimientosList'
import MovimientoTicket from './MovimientoTicket'
import ProyeccionCard from './ProyeccionCard'

export default function GenerativeToolResult({ output, onSelectMovimiento }) {
  if (!output || typeof output !== 'object') return null

  switch (output.component) {
    case 'MovimientosList':
      return <MovimientosList data={output.data} onSelect={onSelectMovimiento} />
    case 'MovimientoTicket':
      return <MovimientoTicket data={output.data} />
    case 'ProyeccionCard':
      return <ProyeccionCard data={output.data} />
    default:
      return null
  }
}
