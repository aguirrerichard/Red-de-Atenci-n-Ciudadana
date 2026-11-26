export function rutaInicioSegunRol(rol) {
  const rutas = {
    cliente: '/cotizador',
    administrador: '/panel',
    empleado: '/panel',
    cajero: '/caja',
  }
  return rutas[rol] ?? '/'
}
