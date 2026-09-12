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

export function buscarMovimiento({ query = '' } = {}) {
  const texto = query.toLowerCase().trim()
  const montoBuscado = parseFloat(texto.replace(/[^0-9.]/g, ''))

  const resultados = MOVIMIENTOS.filter((m) => {
    const coincideTexto =
      m.comercio.toLowerCase().includes(texto) ||
      m.descripcion.toLowerCase().includes(texto) ||
      m.categoria.toLowerCase().includes(texto)
    const coincideMonto =
      !Number.isNaN(montoBuscado) && Math.abs(Math.abs(m.monto) - montoBuscado) < 0.01
    return coincideTexto || coincideMonto
  }).sort((a, b) => new Date(b.fecha) - new Date(a.fecha))

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
