import { supabase } from './supabase.js'

const MOVIMIENTOS_TABLE = 'movimientos'

function getMonthRange(mes, anio) {
  const month = Number(mes)
  const year = Number(anio)

  if (!Number.isInteger(month) || month < 1 || month > 12) {
    throw new Error('El mes debe ser un número entre 1 y 12.')
  }

  if (!Number.isInteger(year) || year < 2000) {
    throw new Error('El año no es válido.')
  }

  const start = new Date(Date.UTC(year, month - 1, 1))
  const end = new Date(Date.UTC(year, month, 1))

  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
  }
}

function assertCuentaId(cuentaId) {
  if (!cuentaId) {
    throw new Error('cuenta_id es obligatorio.')
  }
}

async function execute(query) {
  const { data, error } = await query

  if (error) {
    throw new Error(`No fue posible consultar movimientos: ${error.message}`)
  }

  return data || []
}

export async function getMovimientosPorCategoria(cuenta_id, mes, anio) {
  assertCuentaId(cuenta_id)
  const { start, end } = getMonthRange(mes, anio)

  return execute(
    supabase
      .from(MOVIMIENTOS_TABLE)
      .select('*')
      .eq('cuenta_id', cuenta_id)
      .gte('fecha', start)
      .lt('fecha', end)
      .order('categoria', { ascending: true })
      .order('fecha', { ascending: false }),
  )
}

export async function getMovimientosRecientes(cuenta_id, meses = 1) {
  assertCuentaId(cuenta_id)
  const totalMeses = Number(meses)

  if (!Number.isInteger(totalMeses) || totalMeses < 1) {
    throw new Error('meses debe ser un entero mayor o igual a 1.')
  }

  const today = new Date()
  const start = new Date(
    Date.UTC(today.getUTCFullYear(), today.getUTCMonth() - totalMeses + 1, 1),
  )

  return execute(
    supabase
      .from(MOVIMIENTOS_TABLE)
      .select('*')
      .eq('cuenta_id', cuenta_id)
      .gte('fecha', start.toISOString().slice(0, 10))
      .order('fecha', { ascending: false }),
  )
}

export async function buscarMovimiento(cuenta_id, texto, monto) {
  assertCuentaId(cuenta_id)
  const normalizedText = texto?.trim()
  const normalizedAmount = monto === undefined || monto === null || monto === ''
    ? null
    : Number(monto)

  if (!normalizedText && normalizedAmount === null) {
    throw new Error('Indica un texto o monto para buscar un movimiento.')
  }

  if (normalizedAmount !== null && Number.isNaN(normalizedAmount)) {
    throw new Error('El monto debe ser numérico.')
  }

  let query = supabase
    .from(MOVIMIENTOS_TABLE)
    .select('*')
    .eq('cuenta_id', cuenta_id)

  if (normalizedText) {
    query = query.ilike('descripcion', `%${normalizedText}%`)
  }

  if (normalizedAmount !== null) {
    query = query.eq('monto', normalizedAmount)
  }

  return execute(query.order('fecha', { ascending: false }))
}
