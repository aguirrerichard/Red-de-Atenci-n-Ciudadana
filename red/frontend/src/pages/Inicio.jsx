import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { pedir } from '../api/http.js';
import { MODULOS } from '../config/modulos.js';
import { opcionesDe } from '../config/rutas.js';
import { useCarga } from '../hooks/useCarga.js';
import Encabezado from '../components/Encabezado.jsx';
import Hilo from '../components/Hilo.jsx';
import Vacio from '../components/Vacio.jsx';

const ETIQUETAS = {
  alertas_nuevas: 'Alertas nuevas', heridos_sin_derivar: 'Con heridos sin derivar', mis_alertas: 'Mis alertas', activas: 'Activas',
  derivadas_pendientes: 'Derivadas pendientes', atendidas_sin_envio: 'Atendidas sin envío', mis_citas: 'Mis citas', pendientes: 'Pendientes',
  reclamos_nuevos: 'Reclamos nuevos', mis_reclamos: 'Mis reclamos', abiertos: 'Abiertos',
  envios_hospital_activos: 'Envíos del Hospital activos', mis_envios: 'Mis envíos', en_curso: 'En curso',
};

export default function Inicio() {
  const { usuario, rolEn, tokenDe } = useAuth();
  const token = tokenDe('integracion');
  const resumen = useCarga(() => pedir('integracion', '/resumen', { token }), [token]);
  const esVecino = rolEn('serenazgo') === 'cliente';
  const alertas = useCarga(() => (esVecino ? pedir('integracion', '/serenazgo/mis-alertas', { token }) : Promise.resolve([])), [token, esVecino]);
  const conCita = (alertas.datos ?? []).filter((a) => a.cita_codigo);

  return (
    <>
      <Encabezado titulo={`Hola, ${usuario?.nombre?.split(' ')[0] ?? ''}`} subtitulo="Estas son las entidades de la red a las que tu cuenta tiene acceso." />

      {resumen.cargando || resumen.error
        ? <Vacio cargando={resumen.cargando} error={resumen.error} onReintentar={resumen.recargar} />
        : (
          <div className="tarjetas">
            {Object.entries(MODULOS).filter(([m]) => rolEn(m)).map(([m, mod]) => {
              const rol = rolEn(m);
              const numeros = resumen.datos?.[m] ?? {};
              const [ruta, texto] = opcionesDe(m, rol)[0];
              return (
                <article key={m} className="tarjeta-mod" style={{ '--acento': mod.color, '--suave': mod.suave }}>
                  <header><h2>{mod.nombre}</h2><span className="rol">{rol}</span></header>
                  <dl>
                    {Object.entries(numeros).map(([k, v]) => (<div key={k}><dd>{v}</dd><dt>{ETIQUETAS[k] ?? k}</dt></div>))}
                  </dl>
                  <Link className="btn" to={ruta}>{texto}</Link>
                </article>
              );
            })}
          </div>
        )}

      {esVecino && (
        <section className="seccion" aria-labelledby="hilo">
          <h2 id="hilo">Hilo de atención</h2>
          <p className="sub">Tu alerta y la cita que generó, en un solo lugar.</p>
          {alertas.cargando || alertas.error ? <Vacio cargando={alertas.cargando} error={alertas.error} onReintentar={alertas.recargar} />
            : conCita.length === 0 ? <Vacio>Cuando Serenazgo derive una de tus alertas al Hospital, la verás aquí.</Vacio>
            : conCita.map((a) => <Hilo key={a.id} alerta={a} />)}
        </section>
      )}
    </>
  );
}
