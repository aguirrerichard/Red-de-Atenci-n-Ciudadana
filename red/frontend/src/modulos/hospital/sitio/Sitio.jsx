import { useLayoutEffect, useState } from 'react';
import { useAuth } from '../../../context/AuthContext.jsx';
import css0 from './styles/bridge.css?inline';
import Rutas from './Rutas.jsx';
import { AuthProvider } from './context/AuthContext';
const HOJAS = [css0];

/*
 * Sitio original de "hospital" montado dentro de la app unificada.
 * - La sesión del login único se copia a las llaves que usaba el sitio original (sincronizarSesion).
 * - Su CSS se inserta al entrar y se retira al salir, para no pisar a los otros sitios.
 */
export default function Sitio() {
  const { sincronizarSesion } = useAuth();
  const [listo] = useState(() => { sincronizarSesion('hospital'); return true; });

  useLayoutEffect(() => {
    const el = document.createElement('style');
    el.setAttribute('data-sitio', 'hospital');
    el.textContent = HOJAS.join('\n');
    document.head.insertBefore(el, document.head.firstChild);
    const nav = document.createElement('link'); nav.rel = 'stylesheet'; nav.href = '/hospital/css/nav-superior.css'; nav.setAttribute('data-sitio', 'hospital'); document.head.appendChild(nav);
    return () => { el.remove(); nav.remove(); };
  }, []);

  if (!listo) return null;
  return (
    <AuthProvider><Rutas /></AuthProvider>
  );
}
