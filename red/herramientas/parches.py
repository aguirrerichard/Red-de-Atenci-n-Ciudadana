#!/usr/bin/env python3
import os, re, json, shutil, sys
sys.path.insert(0, os.path.dirname(__file__))
from portar import *

OUTS = OUT + '/src'
def rp(f, destino):  # import relativo hacia un archivo de src/
    return rel(f, destino)

def editar(f, fn):
    t = leer(f); n = fn(t)
    escribir(f, n)

def put_import(t, linea):
    # inserta tras el último import
    ms = list(re.finditer(r'^import .*?;?\s*$', t, flags=re.M))
    pos = ms[-1].end() if ms else 0
    return t[:pos] + '\n' + linea + t[pos:]

def datos(m): return json.load(open(f'/home/claude/out/herr/.{m}.json'))

# ------------------------------------------------------------------ SERENAZGO
def serenazgo():
    d = datos('serenazgo'); dst = d['dst']
    f = f'{dst}/api/client.js'
    editar(f, lambda t: sub(t, 'const BASE = import.meta.env.VITE_API_URL ?? "/api";', 'const BASE = "/api/serenazgo"; // proxy de la app unificada (vercel.json / vite.config.js)', f))
    f = f'{dst}/context/AuthContext.jsx'
    def ctx(t):
        t = put_import(t, f'import {{ avisarLogout, irAlLogin }} from "{rp(f, OUTS + "/puente.js")}";')
        t = sub(t, 'auth.cerrarSesion();\n    setUsuario(null);', 'auth.cerrarSesion();\n    setUsuario(null);\n    avisarLogout(); // cierra también el login único de la red', f)
        t = sub(t, 'abrirModal: setModal,', 'abrirModal: (m) => (m === "login" ? irAlLogin() : setModal(m)), // el login es único para toda la red', f)
        return t
    editar(f, ctx)
    # Rutas
    app = leer(glob.glob(W + '/s12*/s12*')[0] + '/src/App.jsx')
    app = app.replace('"./components/Layout"', '"./components/Layout"').replace('export default function App()', 'export default function Rutas()')
    escribir(f'{dst}/Rutas.jsx', re.sub(r'''from\s+(['"])react-router-dom\1''', f"from './router.jsx'", app))
    escribir(f'{dst}/Sitio.jsx', envolver('serenazgo', dst, d['css'], [('AuthProvider', "import { AuthProvider } from './context/AuthContext.jsx';")]))

# ------------------------------------------------------------------ HOSPITAL
def hospital():
    d = datos('hospital'); dst = d['dst']
    f = f'{dst}/services/api.js'
    def api(t):
        t = sub(t, r"const base = \(import\.meta\.env\?\.VITE_API_URL \|\| 'http://localhost:3000'\)\.replace\(/\\/\+\$/, ''\);", "const base = '/api/hospital'; // proxy de la app unificada", f, regex=True)
        t = sub(t, '`${base}/api${path}`', '`${base}${path}`', f)
        return t
    editar(f, api)
    f = f'{dst}/components/Common.jsx'
    editar(f, lambda t: sub(t, '`${import.meta.env.BASE_URL}css/${name}.css`', "`/hospital/css/${name}.css`", f))
    f = f'{dst}/context/AuthContext.jsx'
    def ctx(t):
        t = put_import(t, f"import {{ avisarLogout }} from '{rp(f, OUTS + '/puente.js')}';")
        t = sub(t, "setSession(null); }, []);", "setSession(null); avisarLogout(); }, []);", f)
        return t
    editar(f, ctx)
    # public css
    srcp = SRC['hospital'] + '/public/css'
    shutil.rmtree(f'{OUT}/public/hospital', ignore_errors=True)
    shutil.copytree(srcp, f'{OUT}/public/hospital/css')
    # Rutas
    app = leer(SRC['hospital'] + '/src/App.jsx')
    app = sub(app, ",['/login',LoginPage]", '', 'hospital App')
    app = sub(app, "import LoginPage from './pages/LoginPage';\n", '', 'hospital App')
    app = app.replace('export default function App()', 'export default function Rutas()')
    app = re.sub(r'''from\s*(['"])react-router-dom\1''', "from './router.jsx'", app)
    escribir(f'{dst}/Rutas.jsx', app)
    nav = "    const nav = document.createElement('link'); nav.rel = 'stylesheet'; nav.href = '/hospital/css/nav-superior.css'; nav.setAttribute('data-sitio', 'hospital'); document.head.appendChild(nav);\n"
    escribir(f'{dst}/Sitio.jsx', envolver('hospital', dst, d['css'], [('AuthProvider', "import { AuthProvider } from './context/AuthContext';")], extra_mount=nav, extra_unmount=' nav.remove();'))

# ------------------------------------------------------------------ LUZ
def luz():
    d = datos('luz'); dst = d['dst']
    f = f'{dst}/api/client.js'
    def cli(t):
        t = put_import(t, f"import {{ avisarLogout }} from '{rp(f, OUTS + '/puente.js')}';")
        t = sub(t, "baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',", "baseURL: '/api/luz', // proxy de la app unificada", f)
        t = sub(t, "window.location.assign('/login');", "avisarLogout(); // vuelve al login único", f)
        return t
    editar(f, cli)
    f = f'{dst}/context/AuthContext.jsx'
    def ctx(t):
        t = put_import(t, f'import {{ avisarLogout }} from "{rp(f, OUTS + "/puente.js")}";')
        t = sub(t, 'sesion.cerrarSesion();\n    setUsuario(null);', 'sesion.cerrarSesion();\n    setUsuario(null);\n    avisarLogout();', f)
        return t
    editar(f, ctx)
    app = leer(SRC['luz'] + '/src/App.jsx')
    app = sub(app, '      <Route path="/login" element={<Login />} />\n', '', 'luz App')
    app = sub(app, 'import Login from "./pages/Login";\n', '', 'luz App')
    app = app.replace('export default function App()', 'export default function Rutas()')
    app = re.sub(r'''from\s*(['"])react-router-dom\1''', "from './router.jsx'", app)
    escribir(f'{dst}/Rutas.jsx', app)
    escribir(f'{dst}/Sitio.jsx', envolver('luz', dst, d['css'], [('ToastProvider', "import { ToastProvider } from './context/ToastContext';"), ('AuthProvider', "import { AuthProvider } from './context/AuthContext';")]))

# ------------------------------------------------------------------ ENVIOS
def envios():
    d = datos('envios'); dst = d['dst']
    f = f'{dst}/services/api.js'
    def api(t):
        t = put_import(t, f"import {{ avisarLogout }} from '{rp(f, OUTS + '/puente.js')}'")
        t = sub(t, r"const BASE = \(import\.meta\.env\.VITE_API_URL.*?\n\nif \(!BASE && !import\.meta\.env\.DEV\) \{.*?\n\}\n", "const BASE = '/api/envios' // proxy de la app unificada\n", f, regex=True)
        t = sub(t, 'fetch(`${BASE}${ruta}`', "fetch(`${BASE}${ruta.replace(/^\\/api/, '')}`", f)
        t = sub(t, "window.location.assign('/login')", "avisarLogout() // vuelve al login único", f)
        return t
    editar(f, api)
    f = f'{dst}/context/AuthContext.jsx'
    def ctx(t):
        t = put_import(t, f"import {{ avisarLogout }} from '{rp(f, OUTS + '/puente.js')}'")
        t = sub(t, "sessionStorage.removeItem('usuario')\n    setUsuario(null)", "sessionStorage.removeItem('usuario')\n    setUsuario(null)\n    avisarLogout()", f)
        return t
    editar(f, ctx)
    app = leer(SRC['envios'] + '/src/App.jsx')
    app = sub(app, "        <Route path=\"/login\" element={<Login />} />\n", '', 'envios App')
    app = sub(app, "import Login from './pages/Login.jsx'\n", '', 'envios App')
    app = app.replace('export default function App()', 'export default function Rutas()')
    app = re.sub(r'''from\s*(['"])react-router-dom\1''', "from './router.jsx'", app)
    escribir(f'{dst}/Rutas.jsx', app)
    # imágenes públicas
    for img in ['aereo.jpg', 'agropecuario.jpg', 'terrestre.jpg']:
        shutil.copy(f'{SRC["envios"]}/public/{img}', f'{OUT}/public/{img}') if os.path.isfile(f'{SRC["envios"]}/public/{img}') else None
    escribir(f'{dst}/Sitio.jsx', envolver('envios', dst, d['css'], [('AuthProvider', "import { AuthProvider } from './context/AuthContext.jsx';")]))

if __name__ == '__main__':
    os.makedirs(OUT + '/public', exist_ok=True)
    for fn in (serenazgo, hospital, luz, envios):
        print('parchando', fn.__name__); fn()
    print('OK')
