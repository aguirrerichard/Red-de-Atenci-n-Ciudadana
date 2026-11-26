import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { escribirSesionModulo, limpiarSesionesModulos } from '../puente.js';
import { ErrorApi, onSesionExpirada, pedir } from '../api/http.js';
import { MODULOS } from '../config/modulos.js';

/*
 * LOGIN ÚNICO
 * Como los 4 backends comparten la tabla usuarios, el mismo correo y contraseña sirven en todos.
 * Se inicia sesión en los 4 a la vez: cada uno devuelve SU token con SU rol (sale de usuario_rol).
 * Si un backend responde 401, ese usuario no tiene rol en esa app → no aparece en su menú.
 */

const CLAVE = 'rac.sesion';
const AuthContext = createContext(null);

const leer = () => { try { return JSON.parse(sessionStorage.getItem(CLAVE)) || null; } catch { return null; } };
const guardar = (s) => { try { s ? sessionStorage.setItem(CLAVE, JSON.stringify(s)) : sessionStorage.removeItem(CLAVE); } catch { /* modo privado */ } };

// Cada backend devuelve el login con una forma distinta
function normalizar(modulo, datos) {
  const token = datos?.token;
  const usuario = datos?.usuario ?? (modulo === 'envios' ? (({ token: _t, ...resto }) => resto)(datos) : null);
  if (!token || !usuario?.rol) throw new ErrorApi(500, 'Respuesta de login inesperada.');
  return { token, rol: usuario.rol, turno: usuario.turno ?? null, usuario, crudo: datos };
}

// Decodifica el payload del JWT (sin verificar) para conocer su vencimiento
const vence = (token) => { try { return JSON.parse(atob(token.split('.')[1])).exp * 1000; } catch { return 0; } };

export function AuthProvider({ children }) {
  const [sesion, setSesion] = useState(leer);
  const [aviso, setAviso] = useState('');

  const navegar = useNavigate();
  const cerrarSesion = useCallback((motivo = '') => { guardar(null); limpiarSesionesModulos(); setSesion(null); setAviso(motivo); }, []);

  // Los sitios originales (Serenazgo, Hospital, LuzCentro, ExpressEnvíos) avisan por eventos
  useEffect(() => {
    const salir = () => cerrarSesion();
    const entrar = () => navegar('/login');
    window.addEventListener('ra:logout', salir);
    window.addEventListener('ra:login', entrar);
    return () => { window.removeEventListener('ra:logout', salir); window.removeEventListener('ra:login', entrar); };
  }, [cerrarSesion, navegar]);

  useEffect(() => {
    onSesionExpirada(() => cerrarSesion('Tu sesión venció. Vuelve a iniciar sesión.'));
  }, [cerrarSesion]);

  /**
   * alProgresar(modulo, estado) permite animar los 4 nodos del login:
   *   'conectando' → 'ok' | 'sin-acceso' | 'error'
   */
  const iniciarSesion = useCallback(async (correo, contrasena, alProgresar = () => {}) => {
    const claves = Object.keys(MODULOS);
    claves.forEach((m) => alProgresar(m, 'conectando'));

    const resultados = await Promise.all(claves.map(async (m) => {
      try {
        const datos = await pedir(m, '/auth/login', { method: 'POST', body: { correo, contrasena }, timeoutMs: 75000, reintentos: 3 });
        const r = normalizar(m, datos);
        alProgresar(m, 'ok', r.rol);
        return [m, r];
      } catch (e) {
        alProgresar(m, e.status === 401 || e.status === 403 ? 'sin-acceso' : 'error');
        return [m, { error: e }];
      }
    }));

    const modulos = Object.fromEntries(resultados.filter(([, r]) => r.token));
    if (!Object.keys(modulos).length) {
      const credenciales = resultados.some(([, r]) => r.error?.status === 401);
      throw new ErrorApi(401, credenciales ? 'Correo o contraseña incorrectos.' : 'Ningún servidor respondió. Intenta de nuevo en un minuto.');
    }

    // Para la API de integración sirve cualquier token (mismo JWT_SECRET): usamos el que vence más tarde
    const tokenIntegracion = Object.values(modulos).map((r) => r.token).sort((a, b) => vence(b) - vence(a))[0];
    let perfil = Object.values(modulos)[0].usuario;
    try { perfil = await pedir('integracion', '/yo', { token: tokenIntegracion }); } catch { /* opcional */ }

    const nueva = {
      usuario: { id: perfil.id, nombre: perfil.nombre, correo: perfil.correo, dni: perfil.dni ?? null },
      modulos, // { luz: { token, rol, turno }, ... }
      tokenIntegracion,
    };
    guardar(nueva);
    setSesion(nueva);
    setAviso('');
    return nueva;
  }, []);

  const valor = useMemo(() => ({
    sesion,
    usuario: sesion?.usuario ?? null,
    aviso,
    rolEn: (m) => sesion?.modulos?.[m]?.rol ?? null,
    tokenDe: (m) => (m === 'integracion' ? sesion?.tokenIntegracion : sesion?.modulos?.[m]?.token),
    iniciarSesion,
    cerrarSesion,
    // Copia la sesión del login único a las llaves del sitio original de ese módulo
    sincronizarSesion: (m) => escribirSesionModulo(m, sesion?.modulos?.[m]),
  }), [sesion, aviso, iniciarSesion, cerrarSesion]);

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
