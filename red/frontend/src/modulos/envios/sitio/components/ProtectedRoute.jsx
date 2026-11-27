import { Navigate, Outlet } from '../router.jsx'
import { useAuth } from '../context/AuthContext.jsx'

export default function ProtectedRoute({ roles }) {
  const { usuario } = useAuth()
  if (!usuario) return <Navigate to="/login" replace />
  if (roles && !roles.includes(usuario.rol)) return <Navigate to="/" replace />
  return <Outlet />
}
