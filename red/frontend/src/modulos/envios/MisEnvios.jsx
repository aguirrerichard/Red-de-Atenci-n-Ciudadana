import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { pedir } from '../../api/http.js';
import { MODULOS } from '../../config/modulos.js';
import { useCarga } from '../../hooks/useCarga.js';
import { useToast } from '../../components/Toast.jsx';
import Encabezado from '../../components/Encabezado.jsx';
import Badge from '../../components/Badge.jsx';
import Vacio from '../../components/Vacio.jsx';
import Modal from '../../components/Modal.jsx';
import Campo from '../../components/Campo.jsx';
import { CIUDADES, mayuscula, montoEnvio, soles } from '../../utils/formato.js';

const OPCIONES = CIUDADES.map((c) => <option key={c} value={c}>{mayuscula(c)}</option>);

function EditarEnvio({ envio, onListo, onCerrar }) {
  const { tokenDe } = useAuth();
  const avisar = useToast();
  const token = tokenDe('envios');
  const [f, setF] = useState(null);
  const [guardando, setGuardando] = useState(false);
  // La lista no trae las medidas: se piden al detalle antes de editar
  useCarga(async () => {
    const d = await pedir('envios', `/cotizaciones/${envio.id}`, { token });
    setF({ origen: d.origen, destino: d.destino, peso_kg: d.peso_kg, largo_cm: d.largo_cm, ancho_cm: d.ancho_cm, alto_cm: d.alto_cm });
    return d;
  }, [envio.id]);
  const cambia = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const guardar = async (e) => {
    e.preventDefault();
    setGuardando(true);
    try {
      await pedir('envios', `/cotizaciones/${envio.id}`, { method: 'PUT', token, body: Object.fromEntries(Object.entries(f).map(([k, v]) => [k, ['origen', 'destino'].includes(k) ? v : Number(v)])) });
      avisar(`Envío actualizado · ${envio.codigo_seguimiento}`);
      onListo();
    } catch (err) { avisar(err.message, 'error'); setGuardando(false); }
  };
  return (
    <Modal titulo={`Editar ${envio.codigo_seguimiento}`} acento={MODULOS.envios.color} onCerrar={onCerrar}>
      {!f ? <Vacio cargando /> : (
        <form className="formulario dos-col" onSubmit={guardar}>
          <Campo etiqueta="Origen" as="select" value={f.origen} onChange={cambia('origen')}>{OPCIONES}</Campo>
          <Campo etiqueta="Destino" as="select" value={f.destino} onChange={cambia('destino')}>{OPCIONES}</Campo>
          <Campo etiqueta="Peso (kg)" type="number" min="0.1" step="0.1" value={f.peso_kg} onChange={cambia('peso_kg')} />
          <Campo etiqueta="Largo (cm)" type="number" min="1" value={f.largo_cm} onChange={cambia('largo_cm')} />
          <Campo etiqueta="Ancho (cm)" type="number" min="1" value={f.ancho_cm} onChange={cambia('ancho_cm')} />
          <Campo etiqueta="Alto (cm)" type="number" min="1" value={f.alto_cm} onChange={cambia('alto_cm')} />
          <p className="estimado ancho">Nuevo costo estimado: <b>{soles(montoEnvio(f))}</b></p>
          <div className="fila-botones ancho">
            <button type="button" className="btn-sec" onClick={onCerrar}>Cancelar</button>
            <button className="btn" type="submit" disabled={guardando}>{guardando ? 'Guardando…' : 'Guardar cambios'}</button>
          </div>
        </form>
      )}
    </Modal>
  );
}

export default function MisEnvios() {
  const { tokenDe } = useAuth();
  const token = tokenDe('envios');
  const [editando, setEditando] = useState(null);
  const { datos, cargando, error, recargar } = useCarga(() => pedir('envios', '/cotizaciones/mias', { token }), [token]);
  return (
    <>
      <Encabezado modulo="envios" titulo="Mis envíos" subtitulo="Incluye los resultados que el Hospital te envía. El estado avanza solo.">
        <Link className="btn" to="/envios/cotizar">Cotizar envío</Link>
      </Encabezado>
      {cargando || error || !datos?.length
        ? <Vacio cargando={cargando} error={error} onReintentar={recargar}>Aún no tienes envíos.</Vacio>
        : datos.map((e) => (
          <article key={e.id} className="registro">
            <header className="registro-cab"><b className="codigo">{e.codigo_seguimiento}</b><Badge estado={e.estado} /><Badge estado={e.estado_pago} /></header>
            <p>{mayuscula(e.origen)} → {mayuscula(e.destino)} · {Number(e.peso)} kg · {soles(e.monto_calculado)}</p>
            {e.estado === 'registrado' && <button type="button" className="btn-sec" onClick={() => setEditando(e)}>Editar</button>}
          </article>
        ))}
      {editando && <EditarEnvio envio={editando} onCerrar={() => setEditando(null)} onListo={() => { setEditando(null); recargar(); }} />}
    </>
  );
}
