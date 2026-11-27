import { useEffect, useRef, useState } from 'react';
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
  // Serenazgo
  alertas_nuevas: 'Alertas nuevas', heridos_sin_derivar: 'Con heridos sin derivar', alertas_activas: 'Alertas activas', alertas_total: 'Total de alertas',
  mis_alertas: 'Mis alertas', activas: 'Activas',
  // Hospital
  citas_pendientes: 'Citas pendientes', citas_total: 'Total de citas',
  derivadas_pendientes: 'Derivadas pendientes', atendidas_sin_envio: 'Atendidas sin envío', mis_citas: 'Mis citas', pendientes: 'Pendientes',
  // LuzCentro
  reclamos_nuevos: 'Reclamos nuevos', reclamos_por_atender: 'Por atender', reclamos_pago_pendiente: 'Pagos pendientes', reclamos_total: 'Total de reclamos',
  mis_reclamos: 'Mis reclamos', abiertos: 'Abiertos', por_pagar: 'Por pagar', cerrados: 'Cerrados',
  // ExpressEnvíos
  envios_hospital_activos: 'Envíos del Hospital activos', envios_activos: 'Envíos activos', envios_por_cobrar: 'Por cobrar', envios_total: 'Total de envíos',
  mis_envios: 'Mis envíos', en_curso: 'En curso', envios_por_pagar: 'Por pagar', entregados: 'Entregados',
};

// Número que "cuenta" hasta su nuevo valor y hace un pequeño destello cuando cambia
function Numero({ valor }) {
  const destino = Number(valor) || 0;
  const [mostrado, setMostrado] = useState(destino);
  const [pulso, setPulso] = useState(0);
  const previo = useRef(destino);

  useEffect(() => {
    const desde = previo.current;
    if (desde === destino) {
      setMostrado(destino);
      return undefined;
    }
    setPulso((p) => p + 1);
    const t0 = performance.now();
    let raf;
    const paso = (ahora) => {
      const k = Math.min(1, (ahora - t0) / 600);
      setMostrado(Math.round(desde + (destino - desde) * (1 - (1 - k) ** 3)));
      if (k < 1) {
        raf = requestAnimationFrame(paso);
      } else {
        previo.current = destino;
      }
    };
    raf = requestAnimationFrame(paso);
    return () => cancelAnimationFrame(raf);
  }, [destino]);

  return <dd key={pulso} className={pulso ? 'cambio' : undefined}>{mostrado}</dd>;
}

export default function Inicio() {
  const { usuario, rolEn, tokenDe } = useAuth();
  const token = tokenDe('integracion');
  const resumen = useCarga(() => pedir('integracion', '/resumen', { token }), [token]);

  // Los contadores se mantienen al día: cada 15 s y al volver a la pestaña
  // (así también reflejan lo que se hizo dentro de los "sitios completos").
  const ultimo = useRef(null);
  if (resumen.datos) ultimo.current = resumen.datos;
  const datos = resumen.datos ?? ultimo.current;
  useEffect(() => {
    const t = setInterval(() => { if (!document.hidden) resumen.recargar(); }, 15000);
    const volver = () => { if (!document.hidden) resumen.recargar(); };
    document.addEventListener('visibilitychange', volver);
    window.addEventListener('focus', volver);
    return () => { clearInterval(t); document.removeEventListener('visibilitychange', volver); window.removeEventListener('focus', volver); };
  }, [resumen.recargar]);
  const esVecino = rolEn('serenazgo') === 'cliente';
  const alertas = useCarga(() => (esVecino ? pedir('integracion', '/serenazgo/mis-alertas', { token }) : Promise.resolve([])), [token, esVecino]);
  const conCita = (alertas.datos ?? []).filter((a) => a.cita_codigo);

  return (
    <>
      <Encabezado titulo={`Hola, ${usuario?.nombre?.split(' ')[0] ?? ''}`} subtitulo="Estas son las entidades de la red a las que tu cuenta tiene acceso." />

      {!datos
        ? <Vacio cargando={resumen.cargando} error={resumen.error} onReintentar={resumen.recargar} />
        : (
          <div className="tarjetas">
            {Object.entries(MODULOS).filter(([m]) => rolEn(m)).map(([m, mod]) => {
              const rol = rolEn(m);
              const numeros = datos?.[m] ?? {};
              const [ruta, texto] = opcionesDe(m, rol)[0];
              return (
                <article key={m} className="tarjeta-mod" style={{ '--acento': mod.color, '--suave': mod.suave }}>
                  <header><h2>{mod.nombre}</h2><span className="rol">{rol}</span></header>
                  <dl>
                    {Object.entries(numeros).map(([k, v]) => (<div key={k}><Numero valor={v} /><dt>{ETIQUETAS[k] ?? k}</dt></div>))}
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
