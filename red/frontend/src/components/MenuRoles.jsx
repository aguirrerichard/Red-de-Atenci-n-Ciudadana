import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { MODULOS } from '../config/modulos.js';
import { opcionesDe, SITIO } from '../config/rutas.js';

// Solo muestra los módulos en los que el usuario tiene rol. La app actual va resaltada con su color (UX-5).
export default function MenuRoles({ moduloActual, onNavegar }) {
  const { rolEn } = useAuth();
  return (
    <nav aria-label="Aplicaciones de la red" className="menu">
      <NavLink to="/inicio" className="menu-inicio" onClick={onNavegar}>Inicio</NavLink>
      {Object.entries(MODULOS).filter(([m]) => rolEn(m)).map(([m, mod]) => {
        const rol = rolEn(m);
        return (
          <section key={m} className={`menu-mod ${moduloActual === m ? 'actual' : ''}`} style={{ '--acento': mod.color, '--suave': mod.suave }}>
            <h2><i aria-hidden="true" />{mod.corto}<small>{rol}</small></h2>
            <ul>
              {opcionesDe(m, rol).map(([ruta, texto]) => (
                <li key={ruta}><NavLink to={ruta} onClick={onNavegar}>{texto}</NavLink></li>
              ))}
              <li><NavLink to={SITIO(m)} onClick={onNavegar}>Sitio completo de {mod.corto}</NavLink></li>
              <li><a href={mod.sitio} target="_blank" rel="noreferrer" className="externo">Abrir sitio original ↗</a></li>
            </ul>
          </section>
        );
      })}
    </nav>
  );
}
