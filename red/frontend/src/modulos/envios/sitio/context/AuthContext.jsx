import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import * as api from '../services/api.js'
import { puedeTrabajar, mensajeFueraDeTurno } from '../utils/turnos.js'

import { avisarLogout } from '../../../../puente.js'
import { notificar } from '../../../../utils/dialogos.js'
const AuthContext = createContext(null)
export const useAuth = () => useContext(AuthContext)

function leerSesion() {
  try { return JSON.parse(sessionStorage.getItem('usuario')) } catch { return null }
}

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(leerSesion)

  const logout = useCallback(() => {
    sessionStorage.removeItem('usuario')
    setUsuario(null)
    avisarLogout()
  }, [])

  async function login(correo, contrasena) {
    const u = await api.iniciarSesion(correo, contrasena)
    if (!u) return null
    if (u.rol === 'empleado' && !puedeTrabajar(u.turno)) {
      const error = new Error(mensajeFueraDeTurno(u.turno))
      error.codigo = 'FUERA_DE_TURNO'
      throw error
    }
    sessionStorage.setItem('usuario', JSON.stringify(u))
    setUsuario(u)
    return u
  }

  // Si el turno del empleado termina mientras trabaja, se cierra la sesión
  useEffect(() => {
    if (usuario?.rol !== 'empleado') return
    const id = setInterval(() => {
      if (!puedeTrabajar(usuario.turno)) {
        notificar('Tu turno ha terminado. Se cerrará tu sesión.', 'aviso', 7000)
        logout()
      }
    }, 30000)
    return () => clearInterval(id)
  }, [usuario, logout])

  return (
    <AuthContext.Provider value={{ usuario, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}
