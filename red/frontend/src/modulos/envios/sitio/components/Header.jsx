import { Link, NavLink, useNavigate } from '../router.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { rutaInicioSegunRol } from '../utils/roles.js'

export default function Header() {
  const { usuario, logout } = useAuth()
  const navigate = useNavigate()

  return (
    <header>
      <Link to="/" className="logo">LogísticaExpress</Link>
      <nav>
        <ul>
          <li><NavLink to="/" end>Inicio</NavLink></li>
          <li><NavLink to="/servicios">Servicios</NavLink></li>
          <li className="dropdown">
            <NavLink to="/requisitos">Cómo funciona</NavLink>
            <ul className="dropdown-menu">
              <li><Link to="/requisitos#pasos">Pasos para enviar</Link></li>
              <li><Link to="/requisitos#requisitos">Requisitos por tipo</Link></li>
              <li><Link to="/requisitos#prohibidos">Artículos prohibidos</Link></li>
            </ul>
          </li>
          {(!usuario || usuario.rol === 'cliente') && <li><NavLink to="/cotizador">Cotizador</NavLink></li>}
          <li><NavLink to="/contacto">Ubicación</NavLink></li>
          {usuario?.rol === 'administrador' && <li><NavLink to="/caja">Caja</NavLink></li>}
          {usuario ? (
            <>
              <li>
                <Link to={usuario.rol === 'cliente' ? '/consulta' : rutaInicioSegunRol(usuario.rol)}>
                  Mi espacio
                </Link>
              </li>
              <li>
                <a
                  href="#"
                  className="btn-login-nav"
                  onClick={(e) => {
                    e.preventDefault()
                    logout()
                    navigate('/login')
                  }}
                >
                  Cerrar Sesión
                </a>
              </li>
            </>
          ) : (
            <li><Link to="/login" className="btn-login-nav">Iniciar Sesión</Link></li>
          )}
        </ul>
      </nav>
    </header>
  )
}
