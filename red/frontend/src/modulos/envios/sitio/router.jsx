import { forwardRef, useCallback, useMemo } from 'react';
import * as RR from 'react-router-dom';
export * from 'react-router-dom';

/*
 * Capa de rutas del sitio original de "envios" dentro de la app unificada.
 * El sitio original usa rutas absolutas ("/panel", "/servicios"...). Aquí se les antepone
 * la base "/envios/sitio" para que convivan con los otros 3 sitios en una sola SPA,
 * y todo enlace a "/login" va al login único de la red (HU-0).
 */
export const BASE = '/envios/sitio';

function abs(to) {
  if (typeof to === 'string') {
    if (/^\/login(?![\w-])/.test(to)) return '/login';
    if (to === '/') return BASE;
    return to.startsWith('/') ? BASE + to : to;
  }
  if (to && typeof to === 'object' && typeof to.pathname === 'string') return { ...to, pathname: abs(to.pathname) };
  return to;
}

export const Link = forwardRef(function Link({ to, ...resto }, ref) {
  return <RR.Link ref={ref} to={abs(to)} {...resto} />;
});

export const NavLink = forwardRef(function NavLink({ to, ...resto }, ref) {
  return <RR.NavLink ref={ref} to={abs(to)} {...resto} />;
});

export function Navigate({ to, ...resto }) {
  return <RR.Navigate to={abs(to)} {...resto} />;
}

export function useNavigate() {
  const navegar = RR.useNavigate();
  return useCallback((to, opciones) => (typeof to === 'number' ? navegar(to) : navegar(abs(to), opciones)), [navegar]);
}

// El sitio original ve rutas "limpias" (sin la base), igual que cuando corría solo
export function useLocation() {
  const l = RR.useLocation();
  return useMemo(() => {
    const p = l.pathname.startsWith(BASE) ? l.pathname.slice(BASE.length) || '/' : l.pathname;
    return { ...l, pathname: p };
  }, [l]);
}
