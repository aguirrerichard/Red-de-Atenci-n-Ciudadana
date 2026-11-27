import { useEffect, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { despertar, pedir } from '../api/http.js';
import { MODULOS } from '../config/modulos.js';

const TEXTO = { dormido: 'dormido', despierto: 'listo', conectando: 'conectando…', ok: 'conectado', 'sin-acceso': 'sin acceso', error: 'sin respuesta' };
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

export default function Login() {
  const { sesion, aviso, iniciarSesion } = useAuth();
  const navegar = useNavigate();
  const { state } = useLocation();
  const [correo, setCorreo] = useState('');
  const [clave, setClave] = useState('');
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [nodos, setNodos] = useState(() => Object.fromEntries(Object.keys(MODULOS).map((m) => [m, { estado: 'dormido' }])));

  // Estado de la ventana emergente de registro
  const [modalAbierto, setModalAbierto] = useState(false);
  const [regNombre, setRegNombre] = useState('');
  const [regCorreo, setRegCorreo] = useState('');
  const [regClave, setRegClave] = useState('');
  const [regError, setRegError] = useState('');
  const [registrando, setRegistrando] = useState(false);

  // Mientras el usuario escribe, Render despierta los 5 servidores
  useEffect(() => {
    ['serenazgo', 'hospital', 'luz', 'envios', 'integracion'].forEach((d) => {
      despertar(d).then((ok) => {
        if (ok && MODULOS[d]) setNodos((n) => (n[d].estado === 'dormido' ? { ...n, [d]: { estado: 'despierto' } } : n));
      });
    });
  }, []);

  // Cerrar ventana emergente con tecla Escape
  useEffect(() => {
    if (!modalAbierto) return undefined;
    const onKey = (e) => { if (e.key === 'Escape' && !registrando) setModalAbierto(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [modalAbierto, registrando]);

  if (sesion) return <Navigate to="/inicio" replace />;

  const conectarYEntrar = async (correoUsuario, claveUsuario) => {
    setEnviando(true);
    const lista = Object.keys(MODULOS);
    for (const m of lista) {
      setNodos((n) => ({ ...n, [m]: { estado: 'conectando' } }));
      await esperar(180);
    }

    const inicio = Date.now();
    await iniciarSesion(correoUsuario, claveUsuario, (m, estado, rol) => {
      setTimeout(() => {
        setNodos((n) => ({ ...n, [m]: { estado, rol } }));
      }, 250);
    });
    const restante = Math.max(0, 1200 - (Date.now() - inicio));
    await esperar(restante);
    navegar(state?.desde && state.desde !== '/login' ? state.desde : '/inicio', { replace: true });
  };

  const enviar = async (e) => {
    e.preventDefault();
    setError('');
    if (!correo.trim() || !clave) return setError('Escribe tu correo y tu contraseña.');

    try {
      await conectarYEntrar(correo.trim(), clave);
    } catch (err) {
      setError(err.message);
      setEnviando(false);
    }
  };

  const abrirModal = () => {
    setRegNombre('');
    setRegCorreo('');
    setRegClave('');
    setRegError('');
    setModalAbierto(true);
  };

  const registrar = async (e) => {
    e.preventDefault();
    setRegError('');
    if (!regNombre.trim()) return setRegError('Escribe tu nombre completo.');
    if (!regCorreo.trim() || !regClave) return setRegError('Completa tu correo y contraseña.');
    if (regClave.length < 4) return setRegError('La contraseña debe tener al menos 4 caracteres.');

    setRegistrando(true);
    try {
      await pedir('integracion', '/registro', {
        method: 'POST',
        body: {
          nombre: regNombre.trim(),
          correo: regCorreo.trim(),
          contrasena: regClave,
        },
        timeoutMs: 75000,
      });

      const correoNuevo = regCorreo.trim();
      const claveNueva = regClave;
      setModalAbierto(false);
      setRegistrando(false);
      setCorreo(correoNuevo);
      setClave(claveNueva);
      await conectarYEntrar(correoNuevo, claveNueva);
    } catch (err) {
      setRegError(err.message || 'No se pudo crear la cuenta.');
      setRegistrando(false);
    }
  };

  return (
    <main className="login">
      <section className="login-caja">
        <p className="kicker">Grupo 2 · acceso único</p>
        <h1>Red de Atención Ciudadana</h1>
        <p className="sub">Una emergencia, una sola cuenta, cuatro entidades conectadas.</p>

        <ol className="nodos" aria-label="Estado de las cuatro entidades">
          {Object.entries(MODULOS).map(([m, mod]) => (
            <li key={m} className={`nodo ${nodos[m].estado}`} style={{ '--acento': mod.color }}>
              <i aria-hidden="true" />
              <b>{mod.corto}</b>
              <small>{nodos[m].estado === 'ok' ? nodos[m].rol : TEXTO[nodos[m].estado]}</small>
            </li>
          ))}
        </ol>

        {enviando && (
          <div className="login-progreso" aria-hidden="true">
            <span />
          </div>
        )}

        {aviso && <p className="aviso" role="alert">{aviso}</p>}
        <form onSubmit={enviar} noValidate>
          <div className="campo">
            <label htmlFor="correo">Correo</label>
            <input id="correo" type="email" autoComplete="username" value={correo} onChange={(e) => setCorreo(e.target.value)} disabled={enviando} />
          </div>
          <div className="campo">
            <label htmlFor="clave">Contraseña</label>
            <input id="clave" type="password" autoComplete="current-password" value={clave} onChange={(e) => setClave(e.target.value)} disabled={enviando} />
          </div>
          {error && <p className="error-campo" role="alert">{error}</p>}
          <button className="btn" type="submit" disabled={enviando}>
            {enviando ? 'Sincronizando entidades…' : 'Ingresar'}
          </button>
          <button
            type="button"
            onClick={abrirModal}
            disabled={enviando}
            style={{
              width: '100%',
              marginTop: '0.65rem',
              padding: '0.72rem 1rem',
              borderRadius: '10px',
              border: '1px solid #cbd5e1',
              background: '#f8fafc',
              color: '#1e3a8a',
              fontWeight: 600,
              fontSize: '0.95rem',
              cursor: enviando ? 'not-allowed' : 'pointer',
            }}
          >
            Crear cuenta
          </button>
        </form>
        <p className="ayuda">Si es la primera vez en un rato, los servidores gratuitos pueden tardar hasta un minuto en despertar.</p>
      </section>

      {modalAbierto && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="titulo-registro"
          onClick={(e) => { if (e.target === e.currentTarget && !registrando) setModalAbierto(false); }}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 50,
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'grid',
            placeItems: 'center',
            padding: '1rem',
          }}
        >
          <div className="login-caja" style={{ width: '100%', maxWidth: '420px', position: 'relative', margin: 0 }}>
            <button
              type="button"
              aria-label="Cerrar ventana"
              disabled={registrando}
              onClick={() => setModalAbierto(false)}
              style={{
                position: 'absolute',
                top: '1rem',
                right: '1rem',
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                background: '#f8fafc',
                color: '#475569',
                fontSize: '1.1rem',
                lineHeight: 1,
                cursor: 'pointer',
              }}
            >
              ×
            </button>

            <p className="kicker">Nuevo ciudadano</p>
            <h2 id="titulo-registro" style={{ margin: '0.2rem 0 0.4rem', fontSize: '1.5rem' }}>Crear cuenta</h2>
            <p className="sub">Tu cuenta te dará acceso inmediato a Serenazgo, Hospital, LuzCentro y ExpressEnvíos.</p>

            <form onSubmit={registrar} noValidate>
              <div className="campo">
                <label htmlFor="reg-nombre">Nombre completo</label>
                <input id="reg-nombre" type="text" autoComplete="name" value={regNombre} onChange={(e) => setRegNombre(e.target.value)} disabled={registrando} />
              </div>
              <div className="campo">
                <label htmlFor="reg-correo">Correo</label>
                <input id="reg-correo" type="email" autoComplete="email" value={regCorreo} onChange={(e) => setRegCorreo(e.target.value)} disabled={registrando} />
              </div>
              <div className="campo">
                <label htmlFor="reg-clave">Contraseña</label>
                <input id="reg-clave" type="password" autoComplete="new-password" value={regClave} onChange={(e) => setRegClave(e.target.value)} disabled={registrando} />
              </div>
              {regError && <p className="error-campo" role="alert">{regError}</p>}
              <button className="btn" type="submit" disabled={registrando}>
                {registrando ? 'Creando cuenta…' : 'Registrarme y entrar'}
              </button>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}