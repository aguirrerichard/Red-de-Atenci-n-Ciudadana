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
import Campo, { Casilla } from '../../components/Campo.jsx';
import { ESPECIALIDADES, aSlug, etiquetaEspecialidad, hoy, soles, soloFecha, verFecha } from '../../utils/formato.js';

function EditarCita({ cita, onListo, onCerrar }) {
  const { tokenDe } = useAuth();
  const avisar = useToast();
  const [f, setF] = useState({ nombre_paciente: cita.nombre_paciente ?? '', dni: cita.dni ?? '', especialidad: aSlug(cita.especialidad), fecha_preferida: soloFecha(cita.fecha_preferida), tiene_sis: !!cita.tiene_sis });
  const [guardando, setGuardando] = useState(false);
  const cambia = (k) => (e) => setF({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });
  const guardar = async (e) => {
    e.preventDefault();
    setGuardando(true);
    try {
      await pedir('hospital', `/citas/${cita.id}`, { method: 'PATCH', token: tokenDe('hospital'), body: f });
      avisar(`Cita actualizada · ${cita.codigo_seguimiento}`);
      onListo();
    } catch (err) { avisar(err.message, 'error'); setGuardando(false); }
  };
  return (
    <Modal titulo={`Editar cita ${cita.codigo_seguimiento}`} acento={MODULOS.hospital.color} onCerrar={onCerrar}>
      <form className="formulario" onSubmit={guardar}>
        <Campo etiqueta="Nombre del paciente" value={f.nombre_paciente} onChange={cambia('nombre_paciente')} />
        <Campo etiqueta="DNI" maxLength={8} value={f.dni} onChange={cambia('dni')} />
        <Campo etiqueta="Especialidad" as="select" value={f.especialidad} onChange={cambia('especialidad')}>
          {ESPECIALIDADES.map(([v, t]) => <option key={v} value={v}>{t}</option>)}
        </Campo>
        <Campo etiqueta="Fecha preferida" type="date" min={hoy()} value={f.fecha_preferida} onChange={cambia('fecha_preferida')} />
        <Casilla etiqueta="Tengo SIS" checked={f.tiene_sis} onChange={cambia('tiene_sis')} />
        <div className="fila-botones">
          <button type="button" className="btn-sec" onClick={onCerrar}>Cancelar</button>
          <button className="btn" type="submit" disabled={guardando}>{guardando ? 'Guardando…' : 'Guardar cambios'}</button>
        </div>
      </form>
    </Modal>
  );
}

export default function MisCitas() {
  const { tokenDe } = useAuth();
  const token = tokenDe('integracion');
  const [editando, setEditando] = useState(null);
  const { datos, cargando, error, recargar } = useCarga(() => pedir('integracion', '/hospital/mis-citas', { token }), [token]);
  return (
    <>
      <Encabezado modulo="hospital" titulo="Mis citas" subtitulo="Tus citas, con la alerta que las originó y el envío de resultados.">
        <Link className="btn" to="/hospital/cita">Reservar cita</Link>
      </Encabezado>
      {cargando || error || !datos?.length
        ? <Vacio cargando={cargando} error={error} onReintentar={recargar}>Aún no tienes citas.</Vacio>
        : datos.map((c) => (
          <article key={c.id} className="registro">
            <header className="registro-cab">
              <b className="codigo">{c.codigo_seguimiento}</b><Badge estado={c.estado} />
              <Badge estado={c.estado_pago} />
              {c.alerta_codigo && <span className="etiqueta" style={{ '--acento': MODULOS.serenazgo.color }}>Origen: Serenazgo · {c.alerta_codigo}</span>}
            </header>
            <p>{etiquetaEspecialidad(c.especialidad)} · {verFecha(c.fecha_preferida)} · {soles(c.monto_calculado)}</p>
            {c.envio_codigo && <p className="meta">Resultados: envío <b className="codigo">{c.envio_codigo}</b> <Badge estado={c.envio_estado} /> → {c.envio_destino}</p>}
            {c.estado === 'registrado' && c.estado_pago !== 'pagado' && <button type="button" className="btn-sec" onClick={() => setEditando(c)}>Editar</button>}
          </article>
        ))}
      {editando && <EditarCita cita={editando} onCerrar={() => setEditando(null)} onListo={() => { setEditando(null); recargar(); }} />}
    </>
  );
}
