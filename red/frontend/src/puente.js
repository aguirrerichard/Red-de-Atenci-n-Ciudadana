// Puente entre la app unificada y los 4 sitios originales (cada uno guardaba su sesión a su manera).
// 1) escribirSesionModulo: copia el login único a las llaves de sessionStorage que lee cada sitio original.
// 2) avisarLogout / irAlLogin: los sitios originales piden cerrar sesión o iniciar sesión con estos eventos.

export const avisarLogout = () => window.dispatchEvent(new Event('ra:logout'));
export const irAlLogin = () => window.dispatchEvent(new Event('ra:login'));

const guardar = (k, v) => { try { sessionStorage.setItem(k, typeof v === 'string' ? v : JSON.stringify(v)); } catch { /* modo privado */ } };
const quitar = (...ks) => ks.forEach((k) => { try { sessionStorage.removeItem(k); } catch { /* nada */ } });

// r = { token, rol, turno, usuario, crudo } (lo que devolvió el /auth/login de ese backend)
export function escribirSesionModulo(modulo, r) {
  if (!r?.token) return;
  const u = r.usuario;
  if (modulo === 'serenazgo') { guardar('usuario', u); guardar('token', r.token); }
  else if (modulo === 'hospital') {
    guardar('hrn.session', { token: r.token, user: { id: u.id, nombre: u.nombre, correo: u.correo ?? '', rol: u.rol, turno: u.turno ?? null } });
  } else if (modulo === 'luz') guardar('sesion', { usuario: u, token: r.token });
  else if (modulo === 'envios') guardar('usuario', r.crudo ?? { ...u, token: r.token });
}

// Serenazgo y ExpressEnvíos usan la misma llave "usuario": solo una vive a la vez, por eso se reescribe al entrar a cada sitio.
export function limpiarSesionesModulos() {
  quitar('usuario', 'token', 'hrn.session', 'sesion');
  try { Object.keys(sessionStorage).filter((k) => k.startsWith('hrn.history.')).forEach((k) => sessionStorage.removeItem(k)); } catch { /* nada */ }
}
