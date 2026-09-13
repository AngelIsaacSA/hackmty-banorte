import { createMcpHandler } from 'mcp-handler'
import { z } from 'zod'
import {
  getHistorial,
  buscarMovimiento,
  getProyeccion,
  getPlanPago,
  aplicarPlanPago,
} from '@/lib/queries'

function toolResult(component, data) {
  return {
    content: [{ type: 'text', text: JSON.stringify({ component, data }) }],
  }
}

// Para tools que resuelven en varias pantallas (ver CONTEXT.md → "Nueva
// dirección de UI" → "Decisión tomada"): en vez de { component, data }
// regresan { screens: [{ component, data }, ...] } en el orden en que se
// deben mostrar.
function screensResult(screens) {
  return {
    content: [{ type: 'text', text: JSON.stringify({ screens }) }],
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

    server.registerTool(
      'get_plan_pago',
      {
        title: 'Plan de pago de tarjeta',
        description:
          'Calcula 2-3 opciones (12/18/24 meses) para reestructurar el saldo de la tarjeta de crédito, con su mensualidad, CAT e interés total de cada plazo. Solo consulta, no cambia nada. Úsala cuando el usuario diga que no puede pagar todo el saldo de su tarjeta, quiera reestructurar su deuda, pagar menos intereses, o pida un plan de pagos.',
        inputSchema: {},
      },
      async () => {
        const resultado = getPlanPago()
        return toolResult('PlanPagoOpciones', resultado)
      }
    )

    server.registerTool(
      'aplicar_plan_pago',
      {
        title: 'Aplicar plan de pago',
        description:
          'Aplica de verdad la opción de reestructura que el usuario ya eligió (actualiza su tarjeta) — esta tool sí modifica datos, no es una consulta. Solo llámala después de que get_plan_pago le haya mostrado las opciones y el usuario haya confirmado explícitamente un plazo en meses (12, 18 o 24).',
        inputSchema: {
          meses: z
            .number()
            .int()
            .describe('Plazo en meses de la opción que el usuario confirmó (12, 18 o 24).'),
        },
      },
      async ({ meses }) => {
        const resultado = aplicarPlanPago({ meses })
        return screensResult([
          {
            component: 'PlanPagoOpciones',
            data: {
              tarjeta: resultado.tarjeta,
              saldo: resultado.saldo,
              opciones: resultado.opciones,
              opcionAplicada: resultado.opcionAplicada,
            },
          },
          {
            component: 'PlanPagoConfirmacion',
            data: { tarjeta: resultado.tarjeta, opcion: resultado.opcionAplicada },
          },
        ])
      }
    )
  },
  {},
  { basePath: '/api', maxDuration: 60, verboseLogs: true }
)

export { handler as GET, handler as POST, handler as DELETE }
