import { Link, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { MODULOS } from '../config/modulos.js';

// <RutaProtegida modulo="hospital" roles={['administrador','empleado']}>
export default function RutaProtegida({ modulo, roles, children }) {
  const { sesion, rolEn } = useAuth();
  const ubicacion = useLocation();
  if (!sesion) return <Navigate to="/login" replace state={{ desde: ubicacion.pathname }} />;
  if (modulo) {
    const rol = rolEn(modulo);
    if (!rol || (roles && !roles.includes(rol))) {
      return (
        <div className="ra"><div className="sin-acceso" role="alert">
          <h1>No tienes acceso</h1>
          <p>Tu cuenta no tiene {roles ? `el rol ${roles.join(' o ')}` : 'rol'} en <b>{MODULOS[modulo].nombre}</b>.</p>
          <Link className="btn" to="/inicio">Volver al inicio</Link>
        </div></div>
      );
    }
  }
  return children;
}
