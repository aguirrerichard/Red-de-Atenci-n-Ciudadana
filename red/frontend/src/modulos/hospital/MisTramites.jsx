import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { pedir } from '../../api/http.js';
import { MODULOS } from '../../config/modulos.js';
import { useCarga } from '../../hooks/useCarga.js';
import Encabezado from '../../components/Encabezado.jsx';
import Badge from '../../components/Badge.jsx';
import Vacio from '../../components/Vacio.jsx';
import { soles, verFecha } from '../../utils/formato.js';

// F2 · El admin del Hospital ve aquí el estado de sus reclamos en LuzCentro (misma cuenta, otro rol)
export default function MisTramites() {
  const { rolEn, tokenDe } = useAuth();
  const tieneLuz = rolEn('luz') === 'cliente';
  const token = tokenDe('luz');
  const { datos, cargando, error, recargar } = useCarga(() => (tieneLuz ? pedir('luz', '/reclamos/mis', { token }) : Promise.resolve([])), [token, tieneLuz]);
  return (
    <>
      <Encabezado modulo="hospital" titulo="Mis trámites en otras apps" subtitulo="Reclamos del Hospital en LuzCentro, con tu misma cuenta.">
        {tieneLuz && <Link className="btn" to="/luz/reclamo" style={{ '--acento': MODULOS.luz.color }}>Nuevo reclamo de luz</Link>}
      </Encabezado>
      {!tieneLuz
        ? <Vacio>Tu cuenta no tiene rol de cliente en LuzCentro todavía.</Vacio>
        : cargando || error || !datos?.length
          ? <Vacio cargando={cargando} error={error} onReintentar={recargar}>Aún no registraste trámites en LuzCentro.</Vacio>
          : datos.map((r) => (
            <article key={r.id} className="registro" style={{ '--acento': MODULOS.luz.color }}>
              <header className="registro-cab">
                <span className="etiqueta">LuzCentro</span><b className="codigo">{r.codigo_seguimiento}</b><Badge estado={r.estado} /><Badge estado={r.estado_pago} />
              </header>
              <p>{r.motivo} · suministro {r.numero_suministro} · {soles(r.monto_calculado)} · {verFecha(r.created_at)}</p>
              {r.respuesta && <p className="meta">Respuesta: {r.respuesta}</p>}
            </article>
          ))}
    </>
  );
}
