import { useLayoutEffect, useState } from 'react';
import { useAuth } from '../../../context/AuthContext.jsx';
import css0 from './styles/auth-modal.css?inline';
import css1 from './styles/base.css?inline';
import css2 from './styles/login.css?inline';
import css3 from './styles/panel-sz.css?inline';
import Rutas from './Rutas.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
const HOJAS = [css0, css1, css2, css3];

/*
 * Sitio original de "serenazgo" montado dentro de la app unificada.
 * - La sesión del login único se copia a las llaves que usaba el sitio original (sincronizarSesion).
 * - Su CSS se inserta al entrar y se retira al salir, para no pisar a los otros sitios.
 */
export default function Sitio() {
  const { sincronizarSesion } = useAuth();
  const [listo] = useState(() => { sincronizarSesion('serenazgo'); return true; });

  useLayoutEffect(() => {
    const el = document.createElement('style');
    el.setAttribute('data-sitio', 'serenazgo');
    el.textContent = HOJAS.join('\n');
    document.head.insertBefore(el, document.head.firstChild);
    return () => { el.remove(); };
  }, []);

  if (!listo) return null;
  return (
    <AuthProvider><Rutas /></AuthProvider>
  );
}
