import { useLayoutEffect, useState } from 'react';
import { useAuth } from '../../../context/AuthContext.jsx';
import css0 from './styles/notificaciones.css?inline';
import css1 from './styles/inicio.css?inline';
import css2 from './styles/servicios.css?inline';
import css3 from './styles/requisitos.css?inline';
import css4 from './styles/contacto.css?inline';
import css5 from './styles/tramites.css?inline';
import css6 from './styles/formulario.css?inline';
import css7 from './styles/actualizar.css?inline';
import css8 from './styles/pago.css?inline';
import css9 from './styles/login.css?inline';
import css10 from './styles/recibos.css?inline';
import css11 from './styles/pagorecibo.css?inline';
import css12 from './styles/comprobante.css?inline';
import css13 from './styles/caja.css?inline';
import css14 from './styles/panel.css?inline';
import css15 from './styles/global.css?inline';
import Rutas from './Rutas.jsx';
import { ToastProvider } from './context/ToastContext';
import { AuthProvider } from './context/AuthContext';
const HOJAS = [css0, css1, css2, css3, css4, css5, css6, css7, css8, css9, css10, css11, css12, css13, css14, css15];

/*
 * Sitio original de "luz" montado dentro de la app unificada.
 * - La sesión del login único se copia a las llaves que usaba el sitio original (sincronizarSesion).
 * - Su CSS se inserta al entrar y se retira al salir, para no pisar a los otros sitios.
 */
export default function Sitio() {
  const { sincronizarSesion } = useAuth();
  const [listo] = useState(() => { sincronizarSesion('luz'); return true; });

  useLayoutEffect(() => {
    const el = document.createElement('style');
    el.setAttribute('data-sitio', 'luz');
    el.textContent = HOJAS.join('\n');
    document.head.insertBefore(el, document.head.firstChild);
    return () => { el.remove(); };
  }, []);

  if (!listo) return null;
  return (
    <ToastProvider><AuthProvider><Rutas /></AuthProvider></ToastProvider>
  );
}
