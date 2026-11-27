import { useEffect, useState } from "react";
import { Link, NavLink, useLocation } from '../router.jsx';
import { useAuth } from "../context/AuthContext";

// Barra de emergencia + cabecera con navegación. No recibe props: lee la sesión del contexto.
export default function Header() {
  const { usuario, logout, abrirModal } = useAuth();
  const [menu, setMenu] = useState(false);
  const { pathname } = useLocation();

  // En móvil, el menú se cierra al navegar a otra página
  useEffect(() => setMenu(false), [pathname]);

  return (
    <>
      <div className="emergency-bar">
        <div className="container">
          <span>Central de emergencias 24/7: <a href="tel:0641234567">(064) 123-4567</a></span>
          <span>Línea nacional de emergencia: <a href="tel:105" className="phone-105">105</a></span>
        </div>
      </div>

      <header className="site-header">
        <div className="container">
          <Link className="brand" to="/">
            <svg className="brand-mark" viewBox="0 0 40 40" role="img" aria-label="Escudo de Serenazgo Alerta Huancayo">
              <circle cx="20" cy="20" r="18" fill="#ff5a1f" />
              <path d="M20 8 L28 14 L28 24 L20 32 L12 24 L12 14 Z" fill="#0e1a2b" />
            </svg>
            Serenazgo Alerta Huancayo
          </Link>

          <button type="button" className="nav-toggle" aria-expanded={menu} aria-controls="panel-nav"
            onClick={() => setMenu((m) => !m)}>
            <span className="nav-toggle-icon" aria-hidden="true"></span>
            Menú
          </button>

          <div id="panel-nav" className={`header-panel ${menu ? "open" : ""}`}>
            <nav className="main-nav" aria-label="Navegación principal">
              <ul>
                <li><NavLink to="/">Inicio</NavLink></li>
                <li><NavLink to="/servicios">Servicios</NavLink></li>
                <li><NavLink to="/como-funciona">Cómo funciona</NavLink></li>
                <li><NavLink to="/reportar">Reportar</NavLink></li>
                <li><NavLink to="/contacto">Ubicación y contacto</NavLink></li>
              </ul>
            </nav>

            <div className="nav-auth-container">
              {usuario ? (
                <>
                  {usuario.rol === "cliente" && <Link to="/actualizar" className="btn-nav-login btn-registros">Mis Registros / Pagos</Link>}
                  {usuario.rol === "cajero" && <Link to="/caja" className="btn-nav-login btn-registros">Módulo de Caja</Link>}
                  {usuario.rol === "administrador" && (
                    <>
                      <Link to="/panel" className="btn-nav-login btn-registros">Panel CRUD Global</Link>
                      <Link to="/caja" className="btn-nav-login btn-registros">Caja</Link>
                    </>
                  )}
                  {usuario.rol === "empleado" && <Link to="/panel" className="btn-nav-login btn-registros">Panel CRUD Global</Link>}

                  <div className="user-badge">
                    <span className="user-icon" aria-hidden="true">👤</span>
                    <span style={{ fontWeight: 600 }}>{usuario.nombre}</span>
                    {usuario.rol !== "cliente" && <span className="user-role">{usuario.rol}</span>}
                  </div>
                  <button type="button" className="btn-logout" onClick={logout}>Cerrar sesión</button>
                </>
              ) : (
                <>
                  <button type="button" className="btn-nav-login" onClick={() => abrirModal("login")}>Iniciar sesión</button>
                  <button type="button" className="btn-nav-register" onClick={() => abrirModal("register")}>Crear cuenta</button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>
    </>
  );
}
