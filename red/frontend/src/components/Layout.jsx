import { useEffect, useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { MODULOS } from '../config/modulos.js';
import { PAGINAS, SITIO_PAGINAS, moduloDeRuta, sitioDeRuta } from '../config/rutas.js';
import MenuRoles from './MenuRoles.jsx';
import { confirmar } from '../utils/dialogos.js';

const pedirSalida = () => confirmar({ titulo: 'Cerrar sesión', mensaje: '¿Deseas salir de tu cuenta en la Red de Atención?', textoSi: 'Sí, cerrar sesión' });

// Barra fina que acompaña a cada SITIO ORIGINAL: ruta "App › Página" (UX-5), cambio rápido de app y cerrar sesión.
function MarcoSitio({ modulo, subruta }) {
  const { usuario, rolEn, cerrarSesion } = useAuth();
  const navegar = useNavigate();
  const mod = MODULOS[modulo];
  const pagina = SITIO_PAGINAS[modulo][subruta] ?? 'Página';
  useEffect(() => { document.title = `${pagina} · ${mod.corto}`; }, [pagina, mod]);
  return (
    <>
      <div className="ra" style={{ '--acento': mod.color, '--suave': mod.suave, background: 'transparent' }}>
        <div className="rbar">
          <Link className="rbar-volver" to="/inicio">← Red de Atención</Link>
          <nav className="rbar-apps" aria-label="Cambiar de aplicación">
            {Object.entries(MODULOS).filter(([m]) => rolEn(m)).map(([m, x]) => (
              <Link key={m} to={`/${m}/sitio`} className={`rbar-app ${m === modulo ? 'actual' : ''}`} style={m === modulo ? undefined : { borderColor: x.color }} aria-current={m === modulo ? 'page' : undefined}>{x.corto}</Link>
            ))}
          </nav>
          <nav aria-label="Ruta actual" className="migas">
            <span>{mod.nombre}</span><span aria-hidden="true"> › </span><b aria-current="page">{pagina}</b>
          </nav>
          <span className="usuario">{usuario?.nombre} · {rolEn(modulo)}</span>
          <button type="button" className="btn-sec" onClick={async () => { if (await pedirSalida()) { cerrarSesion(); navegar('/login'); } }}>Cerrar sesión</button>
        </div>
      </div>
      <Outlet />
    </>
  );
}

export default function Layout() {
  const { usuario, cerrarSesion } = useAuth();
  const { pathname } = useLocation();
  const navegar = useNavigate();
  const [abierto, setAbierto] = useState(false);
  const sitio = sitioDeRuta(pathname);
  const modulo = moduloDeRuta(pathname);
  const mod = modulo ? MODULOS[modulo] : null;
  const [app, pagina] = PAGINAS[pathname] ?? ['Red de Atención Ciudadana', ''];

  useEffect(() => { if (!sitio) document.title = `${pagina || 'Red'} · ${mod?.corto ?? 'Red de Atención Ciudadana'}`; setAbierto(false); }, [pagina, mod, pathname, sitio]);

  // Los sitios originales conservan su diseño completo: solo les ponemos la barra fina encima
  if (sitio) return <MarcoSitio modulo={sitio.modulo} subruta={sitio.subruta} />;

  const salir = async () => { if (await pedirSalida()) { cerrarSesion(); navegar('/login'); } };

  return (
    <div className="ra">
      <div className="app" style={mod ? { '--acento': mod.color, '--suave': mod.suave } : undefined}>
        <a className="saltar" href="#contenido">Saltar al contenido</a>
        <aside className={`lateral ${abierto ? 'abierto' : ''}`}>
          <Link to="/inicio" className="marca"><b>Red de Atención</b><span>Ciudadana · Grupo 2</span></Link>
          <MenuRoles moduloActual={modulo} onNavegar={() => setAbierto(false)} />
        </aside>
        <div className="principal">
          <header className="superior">
            <button type="button" className="hamburguesa" aria-expanded={abierto} aria-label="Abrir menú" onClick={() => setAbierto((a) => !a)}>☰</button>
            <nav aria-label="Ruta actual" className="migas">
              <span>{mod ? mod.nombre : app}</span>{pagina && <><span aria-hidden="true"> › </span><b aria-current="page">{pagina}</b></>}
            </nav>
            <div className="usuario"><span>{usuario?.nombre}</span><button type="button" className="btn-sec" onClick={salir}>Cerrar sesión</button></div>
          </header>
          <main id="contenido" tabIndex="-1"><Outlet /></main>
        </div>
      </div>
    </div>
  );
}
