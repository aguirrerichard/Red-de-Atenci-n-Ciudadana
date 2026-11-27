import { useState } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { pedir } from '../../api/http.js';
import { MODULOS } from '../../config/modulos.js';
import { useCarga } from '../../hooks/useCarga.js';
import { useToast } from '../../components/Toast.jsx';
import Encabezado from '../../components/Encabezado.jsx';
import Tabla from '../../components/Tabla.jsx';
import Badge from '../../components/Badge.jsx';
import Vacio from '../../components/Vacio.jsx';
import Modal from '../../components/Modal.jsx';
import Campo from '../../components/Campo.jsx';
import { soles, verFecha } from '../../utils/formato.js';

function Dictamen({ r, onListo, onCerrar }) {
  const { tokenDe } = useAuth();
  const avisar = useToast();
  const [estado, setEstado] = useState('atendido');
  const [comentario, setComentario] = useState('');
  const [guardando, setGuardando] = useState(false);
  const guardar = async (e) => {
    e.preventDefault();
    setGuardando(true);
    try {
      await pedir('luz', `/reclamos/${r.id}/dictamen`, { method: 'PUT', token: tokenDe('luz'), body: { estado, comentario } });
      avisar(`Dictamen registrado · ${r.codigo_seguimiento}`);
      onListo();
    } catch (err) { avisar(err.message, 'error'); setGuardando(false); }
  };
  return (
    <Modal titulo={`Dictamen ${r.codigo_seguimiento}`} acento={MODULOS.luz.color} onCerrar={onCerrar}>
      <form className="formulario" onSubmit={guardar}>
        <p className="sub">{r.motivo} · {r.nombre_cliente}</p>
        <Campo etiqueta="Estado" as="select" value={estado} onChange={(e) => setEstado(e.target.value)}>
          <option value="en_proceso">En proceso</option><option value="atendido">Atendido</option><option value="rechazado">Rechazado</option>
        </Campo>
        <Campo etiqueta="Comentario para el cliente" as="textarea" rows={3} maxLength={1000} value={comentario} onChange={(e) => setComentario(e.target.value)} />
        <div className="fila-botones">
          <button type="button" className="btn-sec" onClick={onCerrar}>Cancelar</button>
          <button className="btn" type="submit" disabled={guardando}>{guardando ? 'Guardando…' : 'Emitir dictamen'}</button>
        </div>
      </form>
    </Modal>
  );
}

export default function PanelReclamos() {
  const { tokenDe } = useAuth();
  const token = tokenDe('luz');
  const [dictaminando, setDictaminando] = useState(null);
  const { datos, cargando, error, recargar } = useCarga(() => pedir('luz', '/reclamos', { token }), [token]);
  const columnas = [
    { t: 'Código', r: (r) => <b className="codigo">{r.codigo_seguimiento}</b> },
    { t: 'Titular', r: (r) => <>{r.nombre_cliente}<span className="meta bloque">Suministro {r.numero_suministro}</span></> },
    { t: 'Motivo', r: (r) => <>{r.motivo}<span className="meta bloque">{verFecha(r.created_at)}</span></> },
    { t: 'Monto', r: (r) => <>{soles(r.monto_calculado)}<span className="bloque"><Badge estado={r.estado_pago} /></span></> },
    { t: 'Estado', r: (r) => <Badge estado={r.estado} /> },
    { t: 'Acción', r: (r) => <button type="button" className="btn" onClick={() => setDictaminando(r)}>Dictamen</button> },
  ];
  return (
    <>
      <Encabezado modulo="luz" titulo="Panel de reclamos" subtitulo="Emite el dictamen. Un monto excesivo con pago pendiente solo puede rechazarse." />
      {cargando || error || !datos?.length
        ? <Vacio cargando={cargando} error={error} onReintentar={recargar}>No hay reclamos registrados.</Vacio>
        : <Tabla columnas={columnas} filas={datos} resaltar={(r) => r.estado === 'registrado'} />}
      {dictaminando && <Dictamen r={dictaminando} onCerrar={() => setDictaminando(null)} onListo={() => { setDictaminando(null); recargar(); }} />}
    </>
  );
}
