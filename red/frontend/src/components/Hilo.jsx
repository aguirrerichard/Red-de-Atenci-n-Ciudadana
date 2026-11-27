import Badge from './Badge.jsx';
import { verFecha } from '../utils/formato.js';

// Hilo de atención (HU-2.4): Alerta (rojo) → Cita (verde azulado) → Envío (índigo)
export default function Hilo({ alerta }) {
  return (
    <div className="hilo" aria-label={`Hilo de la alerta ${alerta.codigo_seguimiento}`}>
      <div className="eslabon" style={{ '--acento': '#E5492D' }}>
        <small>Alerta · Serenazgo</small>
        <b className="codigo">{alerta.codigo_seguimiento}</b>
        <Badge estado={alerta.estado} />
        {alerta.hay_heridos && <span className="heridos">con heridos</span>}
      </div>
      {alerta.cita_codigo && (<>
        <span className="flecha" aria-hidden="true">→</span>
        <div className="eslabon" style={{ '--acento': '#0F766E' }}>
          <small>Cita · Hospital</small>
          <b className="codigo">{alerta.cita_codigo}</b>
          <Badge estado={alerta.cita_estado} />
          <span className="meta">{verFecha(alerta.cita_fecha)}</span>
        </div>
      </>)}
      {alerta.envio_codigo && (<>
        <span className="flecha" aria-hidden="true">→</span>
        <div className="eslabon" style={{ '--acento': '#3F4FB8' }}>
          <small>Envío · ExpressEnvíos</small>
          <b className="codigo">{alerta.envio_codigo}</b>
          <Badge estado={alerta.envio_estado} />
        </div>
      </>)}
    </div>
  );
}
