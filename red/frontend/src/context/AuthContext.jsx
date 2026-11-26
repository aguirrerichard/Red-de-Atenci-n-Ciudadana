import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { escribirSesionModulo, limpiarSesionesModulos } from '../puente.js';
import { ErrorApi, onSesionExpirada, pedir } from '../api/http.js';
import { MODULOS } from '../config/modulos.js';

const CLAVE = 'rac.sesion';
const AuthContext = createContext(null);

const leer = () => { try { return JSON.parse(sessionStorage.getItem(CLAVE)) || null; } catch { return null; } };
const guardar = (s) => { try { s ? sessionStorage.setItem(CLAVE, JSON.stringify(s)) : sessionStorage.removeItem(CLAVE); } catch { /* modo privado */ } };

function normalizar(modulo, datos) {
  const token = datos?.token;
  const usuario = datos?.usuario ?? (modulo === 'envios' ? (({ token: _t, ...resto }) => resto)(datos) : null);
  if (!token || !usuario?.rol) throw new ErrorApi(500, 'Respuesta de login inesperada.');
  return { token, rol: usuario.rol, turno: usuario.turno ?? null, usuario, crudo: datos };
}

const vence = (token) => { try { return JSON.parse(atob(token.split('.')[1])).exp * 1000; } catch { return 0; } };

export function AuthProvider({ children }) {
  const [sesion, setSesion] = useState(leer);
  const [aviso, setAviso] = useState('');

  const navegar = useNavigate();
  const cerrarSesion = useCallback((motivo = '') => { guardar(null); limpiarSesionesModulos(); setSesion(null); setAviso(motivo); }, []);

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

    const tokenIntegracion = Object.values(modulos).map((r) => r.token).sort((a, b) => vence(b) - vence(a))[0];
    let perfil = Object.values(modulos)[0].usuario;
    try {
      perfil = await pedir('integracion', '/yo', { token: tokenIntegracion });
      const rolesObj = perfil?.roles && typeof perfil.roles === 'object' ? perfil.roles : {};
      for (const [mod, rol] of Object.entries(rolesObj)) {
        if (MODULOS[mod] && !modulos[mod] && typeof rol === 'string' && rol) {
          modulos[mod] = {
            token: tokenIntegracion,
            rol,
            turno: null,
            usuario: { id: perfil.id, nombre: perfil.nombre, correo: perfil.correo, rol, turno: null },
            crudo: { token: tokenIntegracion, usuario: { ...perfil, rol } },
          };
          alProgresar(mod, 'ok', rol);
        }
      }
    } catch { /* opcional */ }

    const nueva = {
      usuario: { id: perfil.id, nombre: perfil.nombre, correo: perfil.correo, dni: perfil.dni ?? null },
      modulos,
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
    sincronizarSesion: (m) => escribirSesionModulo(m, sesion?.modulos?.[m]),
  }), [sesion, aviso, iniciarSesion, cerrarSesion]);

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);