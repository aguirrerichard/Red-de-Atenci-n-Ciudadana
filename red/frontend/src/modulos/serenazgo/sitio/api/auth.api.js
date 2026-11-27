// serenazgo-react/src/services/auth.js  (REEMPLAZA al actual; mismas funciones y mismos retornos)
import { http } from './client.js';

const SIN_CONEXION = 'No se pudo conectar con el servidor.';

export async function registrarUsuario(nombre, correo, contrasena) {
  try {
    const { ok, datos } = await http('/auth/registro', { method: 'POST', body: { nombre, correo, contrasena } });
    return { exito: ok, mensaje: datos?.mensaje ?? 'No se pudo crear la cuenta.' };
  } catch {
    return { exito: false, mensaje: SIN_CONEXION };
  }
}

export async function iniciarSesion(correo, contrasena) {
  try {
    const { ok, datos } = await http('/auth/login', { method: 'POST', body: { correo, contrasena } });
    if (!ok) return { exito: false, mensaje: datos?.mensaje ?? 'Correo o contraseña incorrectos.' };
    sessionStorage.setItem('usuario', JSON.stringify(datos.usuario));
    sessionStorage.setItem('token', datos.token);
    return { exito: true, usuario: datos.usuario };
  } catch {
    return { exito: false, mensaje: SIN_CONEXION };
  }
}

export function obtenerUsuarioActual() {
  const guardado = sessionStorage.getItem('usuario');
  return guardado ? JSON.parse(guardado) : null;
}

export function cerrarSesion() {
  sessionStorage.removeItem('usuario');
  sessionStorage.removeItem('token');
  localStorage.removeItem('usuario');
}

export function rutaInicioSegunRol(rol) {
  const rutas = { cliente: '/', administrador: '/panel', empleado: '/panel', cajero: '/caja' };
  return rutas[rol] ?? '/';
}
