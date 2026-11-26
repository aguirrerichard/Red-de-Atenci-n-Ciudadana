import { useEffect, useState } from 'react'
import { useNavigate } from '../router.jsx'
import estilos from '../styles/login.css?inline'
import useEstilosDePagina from '../hooks/useEstilosDePagina.js'
import CarroSVG from '../components/CarroSVG.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { registrarUsuario } from '../services/api.js'
import { rutaInicioSegunRol } from '../utils/roles.js'

const TIEMPO_MINIMO_CARGA_MS = 1800
const esperar = (ms) => new Promise((r) => setTimeout(r, ms))

export default function Login() {
  useEstilosDePagina(estilos)

  const { login } = useAuth()
  const navigate = useNavigate()
  const [pestana, setPestana] = useState('login')       // 'login' | 'registro'
  const [mensaje, setMensaje] = useState({ texto: '', tipo: 'error' })
  const [cargando, setCargando] = useState(false)

  useEffect(() => {
    document.body.classList.toggle('cargando', cargando)
    return () => document.body.classList.remove('cargando')
  }, [cargando])

  function cambiarPestana(p) {
    setPestana(p)
    setMensaje({ texto: '', tipo: 'error' })
  }

  async function onRegistro(e) {
    e.preventDefault()
    const formEl = e.currentTarget
    const d = new FormData(formEl)
    try {
      await registrarUsuario(d.get('nombre').trim(), d.get('correo').trim(), d.get('contrasena'))
      formEl.reset()
      setPestana('login')
      setMensaje({ texto: 'Cuenta creada correctamente. Ahora puedes iniciar sesión.', tipo: 'exito' })
    } catch {
      setMensaje({ texto: 'Error al registrar. Es posible que el correo ya esté registrado.', tipo: 'error' })
    }
  }

  async function onLogin(e) {
    e.preventDefault()
    const d = new FormData(e.currentTarget)
    setMensaje({ texto: '', tipo: 'error' })
    setCargando(true)
    try {
      const [usuario] = await Promise.all([
        login(d.get('correo').trim(), d.get('contrasena')),
        esperar(TIEMPO_MINIMO_CARGA_MS),
      ])
      if (usuario) {
        navigate(rutaInicioSegunRol(usuario.rol))
        return
      }
      setMensaje({ texto: 'Correo o contraseña incorrectos.', tipo: 'error' })
    } catch (error) {
      setMensaje({
        texto: error.codigo === 'FUERA_DE_TURNO' ? error.message : 'Error al conectar con el servidor.',
        tipo: 'error',
      })
    }
    setCargando(false)
  }

  return (
    <>
      <main className="auth-section">
        <div className="auth-card">
          <div className="tabs-auth">
            <button type="button" className={`tab-btn ${pestana === 'login' ? 'activa' : ''}`}
                    onClick={() => cambiarPestana('login')}>Iniciar Sesión</button>
            <button type="button" className={`tab-btn ${pestana === 'registro' ? 'activa' : ''}`}
                    onClick={() => cambiarPestana('registro')}>Crear Cuenta</button>
          </div>

          <div className={`mensaje-alerta ${mensaje.tipo === 'exito' ? 'exito' : ''}`}
               role="alert" aria-live="polite">{mensaje.texto}</div>

          <form className="form-auth" onSubmit={onLogin}
                style={{ display: pestana === 'login' ? 'block' : 'none' }}>
            <h2>Bienvenido de nuevo</h2>
            <div className="campo">
              <label htmlFor="login-correo">Correo electrónico:</label>
              <input type="email" id="login-correo" name="correo" required placeholder="correo@ejemplo.com" />
            </div>
            <div className="campo">
              <label htmlFor="login-contrasena">Contraseña:</label>
              <input type="password" id="login-contrasena" name="contrasena" required placeholder="••••••••" />
            </div>
            <button type="submit" className="btn-auth" disabled={cargando}>Ingresar</button>
          </form>

          <form className="form-auth" onSubmit={onRegistro}
                style={{ display: pestana === 'registro' ? 'block' : 'none' }}>
            <h2>Crear una cuenta</h2>
            <div className="campo">
              <label htmlFor="reg-nombre">Nombre completo:</label>
              <input type="text" id="reg-nombre" name="nombre" required placeholder="Ej. Juan Pérez" />
            </div>
            <div className="campo">
              <label htmlFor="reg-correo">Correo electrónico:</label>
              <input type="email" id="reg-correo" name="correo" required placeholder="correo@ejemplo.com" />
            </div>
            <div className="campo">
              <label htmlFor="reg-contrasena">Contraseña:</label>
              <input type="password" id="reg-contrasena" name="contrasena" required minLength={6} placeholder="Mínimo 6 caracteres" />
            </div>
            <button type="submit" className="btn-auth">Registrarme</button>
          </form>
        </div>
      </main>

      <div className="pantalla-carga" role="status" aria-live="polite" hidden={!cargando}>
        <div className="carga-contenido">
          <div className="carga-escena">
            <div className="carga-auto"><CarroSVG /></div>
            <div className="carga-ruta" aria-hidden="true"><span></span></div>
          </div>
          <p className="carga-linea">
            <span>Iniciando sesión</span>
            <span className="carga-puntos" aria-hidden="true"><i>.</i><i>.</i><i>.</i></span>
          </p>
        </div>
      </div>
    </>
  )
}
