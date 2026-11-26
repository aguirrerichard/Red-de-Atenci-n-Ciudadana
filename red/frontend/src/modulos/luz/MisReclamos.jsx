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
import { montoContraste, soles, verFecha } from '../../utils/formato.js';

function EditarReclamo({ r, onListo, onCerrar }) {
  const { tokenDe } = useAuth();
  const avisar = useToast();
  const conCobro = r.motivo === 'Reclamo por Monto Excesivo';
  const [f, setF] = useState({ comentario: r.comentario ?? '', tipo_medidor: r.tipo_medidor ?? 'monofasico', km_fuera_zona: r.km_fuera_zona ?? 0 });
  const [guardando, setGuardando] = useState(false);
  const cambia = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const guardar = async (e) => {
    e.preventDefault();
    setGuardando(true);
    try {
      await pedir('luz', `/reclamos/${r.id}`, { method: 'PUT', token: tokenDe('luz'), body: { comentario: f.comentario.trim(), tipo_medidor: f.tipo_medidor, km_fuera_zona: Number(f.km_fuera_zona) || 0 } });
      avisar(`Reclamo actualizado · ${r.codigo_seguimiento}`);
      onListo();
    } catch (err) { avisar(err.message, 'error'); setGuardando(false); }
  };
  return (
    <Modal titulo={`Editar ${r.codigo_seguimiento}`} acento={MODULOS.luz.color} onCerrar={onCerrar}>
      <form className="formulario" onSubmit={guardar}>
        <Campo etiqueta="Descripción / fundamento" as="textarea" rows={4} maxLength={1000} value={f.comentario} onChange={cambia('comentario')} />
        {conCobro && (<>
          <Campo etiqueta="Tipo de medidor" as="select" value={f.tipo_medidor} onChange={cambia('tipo_medidor')}>
            <option value="monofasico">Monofásico (S/ 35)</option><option value="trifasico">Trifásico (S/ 75)</option>
          </Campo>
          <Campo etiqueta="Km fuera de zona urbana" type="number" min="0" max="999" value={f.km_fuera_zona} onChange={cambia('km_fuera_zona')} ayuda={`Contraste: ${soles(montoContraste(f.tipo_medidor, f.km_fuera_zona))}`} />
        </>)}
        <div className="fila-botones">
          <button type="button" className="btn-sec" onClick={onCerrar}>Cancelar</button>
          <button className="btn" type="submit" disabled={guardando}>{guardando ? 'Guardando…' : 'Guardar cambios'}</button>
        </div>
      </form>
    </Modal>
  );
}

export default function MisReclamos() {
  const { tokenDe } = useAuth();
  const token = tokenDe('luz');
  const [editando, setEditando] = useState(null);
  const { datos, cargando, error, recargar } = useCarga(() => pedir('luz', '/reclamos/mis', { token }), [token]);
  return (
    <>
      <Encabezado modulo="luz" titulo="Mis reclamos" subtitulo="Tus trámites en LuzCentro y su estado.">
        <Link className="btn" to="/luz/reclamo">Nuevo reclamo</Link>
      </Encabezado>
      {cargando || error || !datos?.length
        ? <Vacio cargando={cargando} error={error} onReintentar={recargar}>Aún no registraste reclamos.</Vacio>
        : datos.map((r) => (
          <article key={r.id} className="registro">
            <header className="registro-cab"><b className="codigo">{r.codigo_seguimiento}</b><Badge estado={r.estado} /><Badge estado={r.estado_pago} /></header>
            <p>{r.motivo} · suministro {r.numero_suministro} · {soles(r.monto_calculado)} · {verFecha(r.created_at)}</p>
            <p className="meta">{r.comentario}</p>
            {r.respuesta && <p className="meta"><b>Respuesta:</b> {r.respuesta}</p>}
            {r.estado === 'registrado' && r.estado_pago !== 'pagado' && <button type="button" className="btn-sec" onClick={() => setEditando(r)}>Editar</button>}
          </article>
        ))}
      {editando && <EditarReclamo r={editando} onCerrar={() => setEditando(null)} onListo={() => { setEditando(null); recargar(); }} />}
    </>
  );
}
