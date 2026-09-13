// Capa de datos financieros para las tools MCP (historial, búsqueda, proyección).
//
// TODO(feature/supabase-client): reemplazar el arreglo MOVIMIENTOS y CUENTA por
// queries reales a Supabase (tablas `movimientos` y `cuentas`) una vez que el
// esquema esté definido. Las firmas de getHistorial/buscarMovimiento/getProyeccion
// deben mantenerse iguales para no romper las tools en app/api/mcp/route.js.

const CUENTA = {
  cliente: 'Carlos Ramírez Mendoza',
  numeroCuenta: '0218-1234-5678',
  saldoActual: 18450.32,
}

// 20 movimientos sintéticos de agosto 2026, alineados con CONTEXT.md.
const MOVIMIENTOS = [
  { id: 1, fecha: '2026-08-01', comercio: 'Renta Departamento', monto: -8500, categoria: 'Vivienda', descripcion: 'Pago de renta mensual', tipo: 'cargo', recurrente: true },
  { id: 2, fecha: '2026-08-02', comercio: 'CFE', monto: -620.5, categoria: 'Servicios', descripcion: 'Pago de luz', tipo: 'cargo', recurrente: true },
  { id: 3, fecha: '2026-08-02', comercio: 'OXXO', monto: -67, categoria: 'Conveniencia', descripcion: 'Compra en tienda', tipo: 'cargo', recurrente: false },
  { id: 4, fecha: '2026-08-03', comercio: 'Netflix', monto: -219, categoria: 'Entretenimiento', descripcion: 'Suscripción mensual', tipo: 'cargo', recurrente: true },
  { id: 5, fecha: '2026-08-04', comercio: 'Spotify', monto: -115, categoria: 'Entretenimiento', descripcion: 'Suscripción mensual', tipo: 'cargo', recurrente: true },
  { id: 6, fecha: '2026-08-05', comercio: 'Walmart', monto: -1245.8, categoria: 'Supermercado', descripcion: 'Despensa quincenal', tipo: 'cargo', recurrente: false },
  { id: 7, fecha: '2026-08-06', comercio: 'Uber', monto: -134.2, categoria: 'Transporte', descripcion: 'Viaje al trabajo', tipo: 'cargo', recurrente: false },
  { id: 8, fecha: '2026-08-07', comercio: 'Depósito Nómina', monto: 22000, categoria: 'Ingreso', descripcion: 'Pago de nómina quincenal', tipo: 'abono', recurrente: true },
  { id: 9, fecha: '2026-08-08', comercio: 'Telcel', monto: -399, categoria: 'Servicios', descripcion: 'Plan celular', tipo: 'cargo', recurrente: true },
  { id: 10, fecha: '2026-08-09', comercio: 'Starbucks', monto: -89, categoria: 'Restaurantes', descripcion: 'Café', tipo: 'cargo', recurrente: false },
  { id: 11, fecha: '2026-08-10', comercio: 'OXXO', monto: -45.5, categoria: 'Conveniencia', descripcion: 'Compra en tienda', tipo: 'cargo', recurrente: false },
  { id: 12, fecha: '2026-08-12', comercio: 'Farmacia Guadalajara', monto: -312, categoria: 'Salud', descripcion: 'Medicamentos', tipo: 'cargo', recurrente: false },
  { id: 13, fecha: '2026-08-13', comercio: 'Gas Natural', monto: -280, categoria: 'Servicios', descripcion: 'Pago de gas', tipo: 'cargo', recurrente: true },
  { id: 14, fecha: '2026-08-15', comercio: 'Cinépolis', monto: -210, categoria: 'Entretenimiento', descripcion: 'Boletos de cine', tipo: 'cargo', recurrente: false },
  { id: 15, fecha: '2026-08-16', comercio: 'Amazon', monto: -560.9, categoria: 'Compras en línea', descripcion: 'Compra de audífonos', tipo: 'cargo', recurrente: false },
  { id: 16, fecha: '2026-08-18', comercio: 'Restaurante La Parrilla', monto: -430, categoria: 'Restaurantes', descripcion: 'Cena', tipo: 'cargo', recurrente: false },
  { id: 17, fecha: '2026-08-20', comercio: 'Gimnasio Smart Fit', monto: -449, categoria: 'Salud', descripcion: 'Membresía mensual', tipo: 'cargo', recurrente: true },
  { id: 18, fecha: '2026-08-22', comercio: 'Depósito Nómina', monto: 22000, categoria: 'Ingreso', descripcion: 'Pago de nómina quincenal', tipo: 'abono', recurrente: true },
  { id: 19, fecha: '2026-08-25', comercio: 'OXXO', monto: -67, categoria: 'Conveniencia', descripcion: 'Compra en tienda', tipo: 'cargo', recurrente: false },
  { id: 20, fecha: '2026-08-28', comercio: 'Uber Eats', monto: -195.4, categoria: 'Restaurantes', descripcion: 'Pedido a domicilio', tipo: 'cargo', recurrente: false },
]

// Tarjeta de crédito sintética de Carlos Ramírez Mendoza, alineada con los
// campos reales de la tabla `tarjeta` (ver CONTEXT.md → "Esquema real de
// Supabase"): limiteCredito, creditoUtilizado, tasaInteres, cat, pagoMinimo,
// pagoSinIntereses. Es un objeto mutable a propósito: aplicarPlanPago
// escribe sobre ella, simulando la actualización real que haría Supabase.
const TARJETA = {
  id: 1,
  numero: '4152 •••• •••• 8842',
  limiteCredito: 45000,
  creditoUtilizado: 27350.8,
  tasaInteres: 42.9,
  cat: 58.3,
  pagoMinimo: 1640,
  pagoSinIntereses: 27350.8,
  fechaCorte: '2026-08-20',
  fechaLimitePago: '2026-09-12',
  planPago: null,
}

// Amortización francesa (mensualidad fija): principal, tasa anual en % y
// plazo en meses.
function calcularMensualidad(principal, tasaAnualPct, meses) {
  const tasaMensual = tasaAnualPct / 100 / 12
  if (tasaMensual === 0) return principal / meses
  const factor = Math.pow(1 + tasaMensual, meses)
  return (principal * tasaMensual * factor) / (factor - 1)
}

function redondear(n) {
  return Math.round(n * 100) / 100
}

// Solo lectura: calcula 2-3 opciones de reestructura (12/18/24 meses) para
// el saldo utilizado de la tarjeta. `tarjetaId` se deja en la firma para
// cuando haya más de una tarjeta / se conecte a Supabase; hoy solo existe
// la tarjeta sintética de arriba.
export function getPlanPago({ tarjetaId = TARJETA.id } = {}) {
  const tarjeta = tarjetaId === TARJETA.id ? TARJETA : null
  if (!tarjeta) throw new Error(`No existe la tarjeta ${tarjetaId}.`)

  const saldo = tarjeta.creditoUtilizado
  const opciones = [12, 18, 24].map((meses) => {
    const mensualidad = calcularMensualidad(saldo, tarjeta.tasaInteres, meses)
    const totalAPagar = mensualidad * meses
    return {
      meses,
      mensualidad: redondear(mensualidad),
      totalAPagar: redondear(totalAPagar),
      interesTotal: redondear(totalAPagar - saldo),
      cat: tarjeta.cat,
    }
  })

  return { tarjeta, saldo, opciones }
}

// Sí escribe: aplica una de las opciones que regresó getPlanPago(). Por
// ahora actualiza el objeto TARJETA en memoria (dataset sintético); cuando
// se conecte Supabase esto pasa a ser un UPDATE real sobre la fila de
// `tarjeta` (pago_sin_intereses, y una tabla/columna de plan activo).
export function aplicarPlanPago({ tarjetaId = TARJETA.id, meses } = {}) {
  const { tarjeta, saldo, opciones } = getPlanPago({ tarjetaId })
  const opcionAplicada = opciones.find((o) => o.meses === meses)

  if (!opcionAplicada) {
    throw new Error(`No existe una opción de ${meses} meses para esta tarjeta.`)
  }

  tarjeta.planPago = {
    meses: opcionAplicada.meses,
    mensualidad: opcionAplicada.mensualidad,
    saldoDiferido: saldo,
    fechaAplicacion: new Date().toISOString().slice(0, 10),
  }
  tarjeta.pagoSinIntereses = opcionAplicada.mensualidad

  return { tarjeta, saldo, opciones, opcionAplicada }
}

function parsePeriodo(periodo = '') {
  const texto = periodo.toLowerCase()
  const match = texto.match(/(\d+)\s*mes/)
  const meses = match ? parseInt(match[1], 10) : 1
  const hoy = new Date('2026-08-31')
  const desde = new Date(hoy)
  desde.setMonth(desde.getMonth() - meses)
  return { desde, hasta: hoy }
}

export function getHistorial({ periodo = 'este mes' } = {}) {
  const { desde, hasta } = parsePeriodo(periodo)
  const movimientos = MOVIMIENTOS.filter((m) => {
    const fecha = new Date(m.fecha)
    return fecha >= desde && fecha <= hasta
  }).sort((a, b) => new Date(b.fecha) - new Date(a.fecha))

  return { cuenta: CUENTA, periodo, movimientos }
}

// Le da un puntaje a cada movimiento por cuántos "tokens" de la búsqueda
// coinciden (comercio, categoría, descripción, monto o fecha exacta). Esto
// permite que una búsqueda con varias señales ("OXXO 67 2026-08-25", como la
// que se arma al tocar un movimiento en la lista) desempate entre registros
// parecidos, mientras que una búsqueda con una sola señal ("67") sigue
// regresando todos los que coincidan.
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
    const monto = parseFloat(token.replace(/[^0-9.]/g, ''))
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

export function buscarMovimiento({ query = '' } = {}) {
  const tokens = query
    .toLowerCase()
    .trim()
    .split(/[\s,$.]+/)
    .filter(Boolean)

  const puntuados = MOVIMIENTOS.map((m) => ({ m, puntaje: puntuarMovimiento(m, tokens) })).filter(
    ({ puntaje }) => puntaje > 0
  )
  const mejorPuntaje = Math.max(0, ...puntuados.map((p) => p.puntaje))

  const resultados = puntuados
    .filter(({ puntaje }) => puntaje === mejorPuntaje)
    .map(({ m }) => m)
    .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))

  return { cuenta: CUENTA, query, movimientos: resultados }
}

export function getProyeccion() {
  const diasEnMes = 31
  const diaActual = 28
  const diasRestantes = diasEnMes - diaActual

  const gastosRecurrentesPendientes = MOVIMIENTOS.filter(
    (m) => m.recurrente && m.tipo === 'cargo' && new Date(m.fecha).getDate() > diaActual
  ).reduce((total, m) => total + Math.abs(m.monto), 0)

  const promedioGastoDiarioNoRecurrente =
    MOVIMIENTOS.filter((m) => !m.recurrente && m.tipo === 'cargo').reduce(
      (total, m) => total + Math.abs(m.monto),
      0
    ) / diaActual

  const gastoVariableProyectado = promedioGastoDiarioNoRecurrente * diasRestantes
  const gastosProyectados = gastosRecurrentesPendientes + gastoVariableProyectado
  const saldoProyectado = CUENTA.saldoActual - gastosProyectados

  return {
    cuenta: CUENTA,
    saldoActual: CUENTA.saldoActual,
    gastosProyectados: Math.round(gastosProyectados * 100) / 100,
    saldoProyectado: Math.round(saldoProyectado * 100) / 100,
    alcanza: saldoProyectado >= 0,
    diasRestantes,
  }
}
