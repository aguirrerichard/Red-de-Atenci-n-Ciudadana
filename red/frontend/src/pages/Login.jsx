import { useEffect, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { despertar } from '../api/http.js';
import { MODULOS } from '../config/modulos.js';

const TEXTO = { dormido: 'dormido', despierto: 'listo', conectando: 'conectando…', ok: 'conectado', 'sin-acceso': 'sin acceso', error: 'sin respuesta' };

export default function Login() {
  const { sesion, aviso, iniciarSesion } = useAuth();
  const navegar = useNavigate();
  const { state } = useLocation();
  const [correo, setCorreo] = useState('');
  const [clave, setClave] = useState('');
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [nodos, setNodos] = useState(() => Object.fromEntries(Object.keys(MODULOS).map((m) => [m, { estado: 'dormido' }])));

  // Mientras el usuario escribe, Render despierta los 5 servidores
  useEffect(() => {
    ['serenazgo', 'hospital', 'luz', 'envios', 'integracion'].forEach((d) => {
      despertar(d).then((ok) => {
        if (ok && MODULOS[d]) setNodos((n) => (n[d].estado === 'dormido' ? { ...n, [d]: { estado: 'despierto' } } : n));
      });
    });
  }, []);

  if (sesion) return <Navigate to="/inicio" replace />;

  const enviar = async (e) => {
    e.preventDefault();
    setError('');
    if (!correo.trim() || !clave) return setError('Escribe tu correo y tu contraseña.');
    setEnviando(true);
    try {
      await iniciarSesion(correo.trim(), clave, (m, estado, rol) => setNodos((n) => ({ ...n, [m]: { estado, rol } })));
      navegar(state?.desde && state.desde !== '/login' ? state.desde : '/inicio', { replace: true });
    } catch (err) {
      setError(err.message);
      setEnviando(false);
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

        {aviso && <p className="aviso" role="alert">{aviso}</p>}
        <form onSubmit={enviar} noValidate>
          <div className="campo">
            <label htmlFor="correo">Correo</label>
            <input id="correo" type="email" autoComplete="username" value={correo} onChange={(e) => setCorreo(e.target.value)} />
          </div>
          <div className="campo">
            <label htmlFor="clave">Contraseña</label>
            <input id="clave" type="password" autoComplete="current-password" value={clave} onChange={(e) => setClave(e.target.value)} />
          </div>
          {error && <p className="error-campo" role="alert">{error}</p>}
          <button className="btn" type="submit" disabled={enviando}>{enviando ? 'Conectando…' : 'Ingresar'}</button>
        </form>
        <p className="ayuda">Si es la primera vez en un rato, los servidores gratuitos pueden tardar hasta un minuto en despertar.</p>
      </section>
    </main>
  );
}
