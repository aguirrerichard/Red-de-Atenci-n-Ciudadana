
import { avisarLogout } from '../../../../puente.js'// Dirección del backend. En Vercel se define la variable VITE_API_URL (link de Render).
// Se acepta con o sin "/api" y con o sin "/" al final. El respaldo a localhost solo existe en desarrollo.
const BASE = '/api/envios' // proxy de la app unificada

function leerToken() {
  try { return JSON.parse(sessionStorage.getItem('usuario'))?.token } catch { return undefined }
}

async function pedir(ruta, { metodo = 'GET', cuerpo } = {}) {
  const token = leerToken()
  const res = await fetch(`${BASE}${ruta.replace(/^\/api/, '')}`, {
    method: metodo,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: cuerpo ? JSON.stringify(cuerpo) : undefined,
  })
  if (res.status === 401 && ruta === '/api/auth/login') return null   // credenciales incorrectas
  if (res.status === 401) {                                        // sesión vencida
    sessionStorage.removeItem('usuario')
    avisarLogout() // vuelve al login único
    throw new Error('Sesión vencida')
  }
  if (res.status === 404) return null
  if (!res.ok) {
    const cuerpo = await res.json().catch(() => ({}))
    const error = new Error(cuerpo.error ?? 'Error del servidor')
    error.status = res.status
    throw error
  }
  return res.json()
}

// Auth
export const iniciarSesion = (correo, contrasena) =>
  pedir('/api/auth/login', { metodo: 'POST', cuerpo: { correo, contrasena } })
export const registrarUsuario = (nombre, correo, contrasena) =>
  pedir('/api/auth/registro', { metodo: 'POST', cuerpo: { nombre, correo, contrasena } })

// Cotizaciones
export const crearCotizacion = (datos) =>
  pedir('/api/cotizaciones', { metodo: 'POST', cuerpo: datos })
export const misCotizaciones = () => pedir('/api/cotizaciones/mias')
export const estadoCotizacion = (id) => pedir(`/api/cotizaciones/${id}/estado`)

// Comprobante
export const obtenerComprobante = (op) =>
  pedir(`/api/comprobantes/${encodeURIComponent(op)}`)

// Panel (administrador / empleado)
export const listarRegistrosPanel = (q = '') =>
  pedir(`/api/panel/registros?q=${encodeURIComponent(q)}`)
export const crearRegistroPanel = (datos) =>
  pedir('/api/panel/registros', { metodo: 'POST', cuerpo: datos })
export const cancelarCotizacion = (id) =>
  pedir(`/api/cotizaciones/${id}/cancelar`, { metodo: 'PATCH' })
export const eliminarCotizacion = (id) =>
  pedir(`/api/cotizaciones/${id}`, { metodo: 'DELETE' })

// Detalle y edición
export const obtenerCotizacion = (id) => pedir(`/api/cotizaciones/${id}`)
export const actualizarCotizacion = (id, datos) =>
  pedir(`/api/cotizaciones/${id}`, { metodo: 'PUT', cuerpo: datos })

// Pago en línea (cliente)
export const pendientesDePago = () => pedir('/api/pagos/pendientes')
export const pagarConTarjeta = (datos) =>
  pedir('/api/pagos/tarjeta', { metodo: 'POST', cuerpo: datos })
export const pagarConBilletera = (datos) =>
  pedir('/api/pagos/billetera', { metodo: 'POST', cuerpo: datos })

// Caja (cajero / administrador)
export const cajaPendientes = (q = '') =>
  pedir(`/api/caja/pendientes?q=${encodeURIComponent(q)}`)
export const cajaCobrar = (datos) =>
  pedir('/api/caja/cobros', { metodo: 'POST', cuerpo: datos })
export const cajaPagosEnLinea = (fecha, soloPorVerificar = false) =>
  pedir(`/api/caja/en-linea?fecha=${encodeURIComponent(fecha)}&soloPorVerificar=${soloPorVerificar}`)
export const cajaVerificar = (id) =>
  pedir(`/api/caja/pagos/${id}/verificar`, { metodo: 'POST' })
export const cajaResumen = (fecha) =>
  pedir(`/api/caja/resumen?fecha=${encodeURIComponent(fecha)}`)
