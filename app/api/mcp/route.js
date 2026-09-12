import { createMcpHandler } from 'mcp-handler'
import { z } from 'zod'
import { getHistorial, buscarMovimiento, getProyeccion } from '@/lib/queries'

function toolResult(component, data) {
  return {
    content: [{ type: 'text', text: JSON.stringify({ component, data }) }],
  }
}

const handler = createMcpHandler(
  (server) => {
    server.registerTool(
      'get_historial',
      {
        title: 'Historial de movimientos',
        description:
          'Obtiene los últimos movimientos de la cuenta en un periodo dado (ej. "este mes", "últimos 3 meses"). Úsala cuando el usuario quiera ver su historial o sus movimientos recientes.',
        inputSchema: {
          periodo: z
            .string()
            .describe('Periodo a consultar, ej. "este mes", "últimos 3 meses"')
            .default('este mes'),
        },
      },
      async ({ periodo }) => {
        const resultado = getHistorial({ periodo })
        return toolResult('MovimientosList', resultado)
      }
    )

    server.registerTool(
      'buscar_movimiento',
      {
        title: 'Buscar movimiento',
        description:
          'Busca uno o varios movimientos por comercio, monto o descripción. Úsala cuando el usuario pregunte en qué gastó, dónde se le cobró algo, o busque un cargo específico (sinónimos: "en qué gasté", "en qué se me cobró", "dónde se fue mi dinero").',
        inputSchema: {
          query: z
            .string()
            .describe('Comercio, monto o descripción a buscar, ej. "OXXO" o "67"'),
        },
      },
      async ({ query }) => {
        const resultado = buscarMovimiento({ query })
        const component =
          resultado.movimientos.length === 1 ? 'MovimientoTicket' : 'MovimientosList'
        const data =
          resultado.movimientos.length === 1
            ? { cuenta: resultado.cuenta, movimiento: resultado.movimientos[0] }
            : resultado
        return toolResult(component, data)
      }
    )

    server.registerTool(
      'get_proyeccion',
      {
        title: 'Proyección de saldo',
        description:
          'Calcula el saldo actual contra los gastos recurrentes y proyectados para saber si le alcanza al usuario a fin de mes. Úsala cuando el usuario pregunte si le alcanza, cómo va su saldo, o pida una proyección financiera.',
        inputSchema: {},
      },
      async () => {
        const resultado = getProyeccion()
        return toolResult('ProyeccionCard', resultado)
      }
    )
  },
  {},
  { basePath: '/api', maxDuration: 60, verboseLogs: true }
)

export { handler as GET, handler as POST, handler as DELETE }
