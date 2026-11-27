#!/usr/bin/env python3
"""Porta los 4 sitios originales a frontend/src/modulos/<mod>/sitio/ (una sola SPA)."""
import os, re, shutil, glob, sys

W = '/home/claude/w'
OUT = '/home/claude/out/red/frontend'
SRC = {
  'serenazgo': glob.glob(W + '/s12*/s12*')[0],
  'hospital':  W + '/hospital-regional-norte-main/hospital-regional-norte-main',
  'luz':       W + '/luzcentro-frontend/luzcentro-frontend',
  'envios':    W + '/saenz-react-main/saenz-react-main',
}
DIRS = {
  'serenazgo': ['components','hooks','pages','api','styles','data','utils','context','assets'],
  'hospital':  ['components','hooks','pages','services','context','styles'],
  'luz':       ['components','hooks','pages','api','styles','utils','context'],
  'envios':    ['components','hooks','pages','services','styles','utils','context','assets'],
}

def leer(p):
    return open(p, encoding='utf-8-sig').read()
def escribir(p, t):
    os.makedirs(os.path.dirname(p), exist_ok=True)
    open(p, 'w', encoding='utf-8').write(t)
def sub(t, viejo, nuevo, archivo, regex=False, count=1):
    if regex:
        r, n = re.subn(viejo, nuevo, t, count=count, flags=re.S)
    else:
        n = t.count(viejo); r = t.replace(viejo, nuevo, count if count else -1) if n else t
        n = min(n, count) if count else n
    if not n:
        print('  !! NO ENCONTRADO en', archivo, '->', viejo[:70]); sys.exit(1)
    return r

SHIM = '''import { forwardRef, useCallback, useMemo } from 'react';
import * as RR from 'react-router-dom';
export * from 'react-router-dom';

/*
 * Capa de rutas del sitio original de "%(mod)s" dentro de la app unificada.
 * El sitio original usa rutas absolutas ("/panel", "/servicios"...). Aquí se les antepone
 * la base "%(base)s" para que convivan con los otros 3 sitios en una sola SPA,
 * y todo enlace a "/login" va al login único de la red (HU-0).
 */
export const BASE = '%(base)s';

function abs(to) {
  if (typeof to === 'string') {
    if (/^\\/login(?![\\w-])/.test(to)) return '/login';
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
'''

def rel(desde_archivo, a_archivo):
    r = os.path.relpath(a_archivo, os.path.dirname(desde_archivo)).replace(os.sep, '/')
    return r if r.startswith('.') else './' + r

def resolver(base_dir, spec):
    p = os.path.normpath(os.path.join(base_dir, spec))
    for c in [p, p + '.jsx', p + '.js', os.path.join(p, 'index.jsx'), os.path.join(p, 'index.js')]:
        if os.path.isfile(c): return c
    return None

def orden_css(raiz, entrada):
    """Recorre los imports desde main.jsx para conservar el orden en que Vite apilaba el CSS."""
    vistos, css = set(), []
    def visita(f):
        if f in vistos: return
        vistos.add(f)
        t = leer(f)
        for m in re.finditer(r'''import\s+(?:[^'"\n;]*?from\s+)?['"](\.[^'"]+)['"]''', t):
            spec = m.group(1)
            if spec.endswith('.css'):
                p = os.path.normpath(os.path.join(os.path.dirname(f), spec))
                if p not in css: css.append(p)
            elif '?inline' not in spec:
                r = resolver(os.path.dirname(f), spec)
                if r: visita(r)
    visita(entrada)
    return css

def portar(mod):
    base = '/%s/sitio' % mod
    src = SRC[mod]
    dst = f'{OUT}/src/modulos/{mod}/sitio'
    shutil.rmtree(dst, ignore_errors=True)
    # 1) orden de CSS global (los import "x.css" de efecto lateral)
    css_orden = orden_css(src + '/src', src + '/src/main.jsx')
    css_orden = [c for c in css_orden if any(c.startswith(f'{src}/src/{d}/') for d in DIRS[mod]) or c.startswith(src + '/src/')]
    # 2) copiar carpetas
    for d in DIRS[mod]:
        if os.path.isdir(f'{src}/src/{d}'):
            shutil.copytree(f'{src}/src/{d}', f'{dst}/{d}')
    shim = f'{dst}/router.jsx'
    escribir(shim, SHIM % {'mod': mod, 'base': base})
    puente = f'{OUT}/src/puente.js'
    # 3) reescribir imports
    for raiz, _, archivos in os.walk(dst):
        for a in archivos:
            if not a.endswith(('.js', '.jsx')): continue
            f = os.path.join(raiz, a)
            if f == shim: continue
            t = leer(f)
            ori = t
            t = re.sub(r'''(from\s+)(['"])react-router-dom\2''', lambda m: f"{m.group(1)}'{rel(f, shim)[:-4]}'" if False else f"{m.group(1)}'{rel(f, shim)}'", t)
            t = re.sub(r'''^\s*import\s+['"]\.[^'"]+\.css['"];?[ \t]*\r?\n''', '', t, flags=re.M)
            if t != ori: escribir(f, t)
    return dst, css_orden, puente, shim

WRAP = '''import { useLayoutEffect, useState } from 'react';
import { useAuth } from '../../../context/AuthContext.jsx';
%(imports)s
import Rutas from './Rutas.jsx';
%(provs_imp)s
const HOJAS = [%(hojas)s];

/*
 * Sitio original de "%(mod)s" montado dentro de la app unificada.
 * - La sesión del login único se copia a las llaves que usaba el sitio original (sincronizarSesion).
 * - Su CSS se inserta al entrar y se retira al salir, para no pisar a los otros sitios.
 */
export default function Sitio() {
  const { sincronizarSesion } = useAuth();
  const [listo] = useState(() => { sincronizarSesion('%(mod)s'); return true; });

  useLayoutEffect(() => {
    const el = document.createElement('style');
    el.setAttribute('data-sitio', '%(mod)s');
    el.textContent = HOJAS.join('\\n');
    document.head.insertBefore(el, document.head.firstChild);
%(extra_mount)s    return () => { el.remove();%(extra_unmount)s };
  }, []);

  if (!listo) return null;
  return (
    %(open)s<Rutas />%(close)s
  );
}
'''

def envolver(mod, dst, css, provs, extra_mount='', extra_unmount='', imports_extra=''):
    imports, names = [], []
    for i, c in enumerate(css):
        r = os.path.relpath(c, dst).replace(os.sep, '/') if c.startswith(dst) else None
        if r is None:
            # css dentro de src/ original pero fuera de las carpetas copiadas (p. ej. styles/bridge.css)
            sub_ = os.path.relpath(c, SRC[mod] + '/src').replace(os.sep, '/')
            destino = f'{dst}/{sub_}'
            if not os.path.exists(destino):
                os.makedirs(os.path.dirname(destino), exist_ok=True); shutil.copy(c, destino)
            r = sub_
        else:
            r = os.path.relpath(c, dst).replace(os.sep, '/')
        imports.append(f"import css{i} from './{r}?inline';"); names.append(f'css{i}')
    provs_imp = '\n'.join(p[1] for p in provs)
    open_ = ''.join(f'<{p[0]}>' for p in provs)
    close = ''.join(f'</{p[0]}>' for p in reversed(provs))
    return WRAP % dict(mod=mod, imports='\n'.join(imports) + ('\n' + imports_extra if imports_extra else ''), provs_imp=provs_imp,
                      hojas=', '.join(names), extra_mount=extra_mount, extra_unmount=extra_unmount, open=open_, close=close)

def parche_comun_contexto(f, mod):
    pass

if __name__ == '__main__':
    for m in SRC:
        print('portando', m)
        dst, css, puente, shim = portar(m)
        print('  css global:', [os.path.basename(c) for c in css])
        import json
        json.dump({'dst': dst, 'css': css}, open(f'/home/claude/out/herr/.{m}.json', 'w'))
