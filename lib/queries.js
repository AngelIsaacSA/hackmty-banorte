import { supabase } from './supabase.js'

// Demo temporal sin autenticación: esta cuenta pertenece a Carlos Ramírez
// Mendoza. Cuando exista sesión, reemplazar este ancla por el cuenta_id de la
// sesión y eliminar getCuentaDemo(). El esquema usa un UUID interno para id,
// por eso resolvemos una vez la cuenta a partir de su número fijo de demo.
const CUENTA_DEMO_NUMERO = '0218-1234-5678'

const MOVIMIENTOS_TABLE = 'movimiento'
const RECURRENTES_TABLE = 'recurrente'

function roundMoney(value) {
  return Math.round(value * 100) / 100
}

function toDateOnly(date) {
  return date.toISOString().slice(0, 10)
}

function getMonthEnd(date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0))
}

function parsePeriodo(periodo = '') {
  const texto = periodo.toLowerCase()
  const match = texto.match(/(\d+)\s*mes/)
  const meses = match ? Number.parseInt(match[1], 10) : 1
  const hoy = new Date()
  const desde = new Date(hoy)

  if (texto.includes('este mes') || texto.includes('mes actual')) {
    desde.setUTCDate(1)
  } else {
    desde.setUTCMonth(desde.getUTCMonth() - Math.max(meses, 1))
  }

  return { desde: toDateOnly(desde), hasta: toDateOnly(hoy) }
}

function categoriaNombre(categoria) {
  if (Array.isArray(categoria)) return categoriaNombre(categoria[0])
  return categoria?.nombre || 'Sin categoría'
}

function clienteNombre(cliente) {
  if (Array.isArray(cliente)) return clienteNombre(cliente[0])
  return cliente?.nombre || 'Carlos Ramírez Mendoza'
}

function normalizarMovimiento(movimiento) {
  const monto = Number(movimiento.monto) || 0
  const esAbono = movimiento.tipo === 'abono'

  return {
    id: movimiento.id,
    fecha: movimiento.fecha,
    comercio: movimiento.comercio || movimiento.descripcion || 'Movimiento Banorte',
    monto: esAbono ? Math.abs(monto) : -Math.abs(monto),
    categoria: categoriaNombre(movimiento.categoria),
    descripcion: movimiento.descripcion || movimiento.comercio || '',
    tipo: movimiento.tipo,
  }
}

async function execute(query, message) {
  const { data, error } = await query

  if (error) {
    throw new Error(`${message}: ${error.message}`)
  }

  return data
}

async function getCuentaDemo() {
  const cuenta = await execute(
    supabase
      .from('cuenta')
      .select('id, numero_cuenta, saldo, cliente(nombre)')
      .eq('numero_cuenta', CUENTA_DEMO_NUMERO)
      .single(),
    'No fue posible obtener la cuenta demo',
  )

  return {
    id: cuenta.id,
    cliente: clienteNombre(cuenta.cliente),
    numeroCuenta: cuenta.numero_cuenta,
    saldoActual: Number(cuenta.saldo) || 0,
  }
}

async function getMovimientos(cuentaId, { desde, hasta } = {}) {
  let query = supabase
    .from(MOVIMIENTOS_TABLE)
    .select('id, fecha, comercio, descripcion, monto, tipo, categoria(nombre)')
    .eq('cuenta_id', cuentaId)

  if (desde) query = query.gte('fecha', desde)
  if (hasta) query = query.lte('fecha', hasta)

  const movimientos = await execute(
    query.order('fecha', { ascending: false }),
    'No fue posible obtener los movimientos',
  )

  return movimientos.map(normalizarMovimiento)
}

// Conserva el contrato de las tools MCP: getHistorial({ periodo }).
export async function getHistorial({ periodo = 'este mes' } = {}) {
  const cuenta = await getCuentaDemo()
  const { desde, hasta } = parsePeriodo(periodo)
  const movimientos = await getMovimientos(cuenta.id, { desde, hasta })

  return { cuenta, periodo, movimientos }
}

function puntuarMovimiento(movimiento, tokens) {
  let puntaje = 0

  for (const token of tokens) {
    if (
      movimiento.comercio.toLowerCase().includes(token) ||
      movimiento.descripcion.toLowerCase().includes(token) ||
      movimiento.categoria.toLowerCase().includes(token)
    ) {
      puntaje += 1
      continue
    }

    if (movimiento.fecha === token) {
      puntaje += 1
      continue
    }

    const monto = Number.parseFloat(token.replace(/[^0-9.]/g, ''))
    if (
      token.replace(/[^0-9.]/g, '').length > 0 &&
      !Number.isNaN(monto) &&
      Math.abs(Math.abs(movimiento.monto) - monto) < 0.01
    ) {
      puntaje += 1
    }
  }

  return puntaje
}

// Conserva el contrato de las tools MCP: buscarMovimiento({ query }).
export async function buscarMovimiento({ query = '' } = {}) {
  const cuenta = await getCuentaDemo()
  const tokens = query
    .toLowerCase()
    .trim()
    .split(/[\s,$.]+/)
    .filter(Boolean)

  if (tokens.length === 0) {
    return { cuenta, query, movimientos: [] }
  }

  // Se consulta la cuenta demo real y se conserva el puntaje del mock para
  // desambiguar cargos repetidos (por ejemplo, dos OXXO del mismo monto).
  const movimientos = await getMovimientos(cuenta.id)
  const puntuados = movimientos
    .map((movimiento) => ({ movimiento, puntaje: puntuarMovimiento(movimiento, tokens) }))
    .filter(({ puntaje }) => puntaje > 0)
  const mejorPuntaje = Math.max(0, ...puntuados.map(({ puntaje }) => puntaje))
  const resultados = puntuados
    .filter(({ puntaje }) => puntaje === mejorPuntaje)
    .map(({ movimiento }) => movimiento)
    .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))

  return { cuenta, query, movimientos: resultados }
}

// Conserva el contrato de las tools MCP: getProyeccion().
export async function getProyeccion() {
  const cuenta = await getCuentaDemo()
  const hoy = new Date()
  const finDeMes = getMonthEnd(hoy)
  const diaActual = hoy.getUTCDate()
  const diasEnMes = finDeMes.getUTCDate()
  const diasRestantes = Math.max(diasEnMes - diaActual, 0)
  const inicioDeMes = new Date(Date.UTC(hoy.getUTCFullYear(), hoy.getUTCMonth(), 1))

  const [recurrentes, cargosDelMes] = await Promise.all([
    execute(
      supabase
        .from(RECURRENTES_TABLE)
        .select('monto, fecha_siguiente')
        .eq('cuenta_id', cuenta.id)
        .eq('estatus', 'activo')
        .gte('fecha_siguiente', toDateOnly(hoy))
        .lte('fecha_siguiente', toDateOnly(finDeMes)),
      'No fue posible obtener los gastos recurrentes',
    ),
    getMovimientos(cuenta.id, {
      desde: toDateOnly(inicioDeMes),
      hasta: toDateOnly(hoy),
    }),
  ])

  const gastosRecurrentesPendientes = recurrentes.reduce(
    (total, recurrente) => total + Math.abs(Number(recurrente.monto) || 0),
    0,
  )
  const gastoAcumulado = cargosDelMes
    .filter((movimiento) => movimiento.tipo === 'cargo')
    .reduce((total, movimiento) => total + Math.abs(movimiento.monto), 0)
  const gastoVariableProyectado =
    diaActual > 0 ? (gastoAcumulado / diaActual) * diasRestantes : 0
  const gastosProyectados = gastosRecurrentesPendientes + gastoVariableProyectado
  const saldoProyectado = cuenta.saldoActual - gastosProyectados

  return {
    cuenta,
    saldoActual: cuenta.saldoActual,
    gastosProyectados: roundMoney(gastosProyectados),
    saldoProyectado: roundMoney(saldoProyectado),
    alcanza: saldoProyectado >= 0,
    diasRestantes,
  }
}
