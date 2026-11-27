import { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { pedir } from '../api/http.js';
import { MODULOS } from '../config/modulos.js';
import { ESPECIALIDADES } from '../utils/formato.js';
import { useToast } from '../components/Toast.jsx';
import Modal from '../components/Modal.jsx';
import Campo from '../components/Campo.jsx';

// F1 · Serenazgo → Hospital: crea la cita de emergencia con id_alerta
export default function DerivarAlerta({ alerta, onListo, onCerrar }) {
  const { tokenDe } = useAuth();
  const avisar = useToast();
  const [especialidad, setEspecialidad] = useState('medicina-general');
  const [observacion, setObservacion] = useState('');
  const [guardando, setGuardando] = useState(false);

  const derivar = async (e) => {
    e.preventDefault();
    setGuardando(true);
    try {
      const r = await pedir('integracion', `/serenazgo/alertas/${alerta.id}/derivar`, { method: 'POST', token: tokenDe('integracion'), body: { especialidad, observacion } });
      avisar(`Cita de emergencia creada · ${r.cita.codigo_seguimiento}`);
      onListo(r);
    } catch (err) { avisar(err.message, 'error'); setGuardando(false); }
  };

  return (
    <Modal titulo="Derivar a hospital" acento={MODULOS.hospital.color} onCerrar={onCerrar}>
      <form onSubmit={derivar} className="formulario">
        <p className="sub">Se creará una cita de emergencia en el <b>Hospital Regional del Norte</b> para la alerta <b className="codigo">{alerta.codigo_seguimiento}</b> ({alerta.nombre_vecino}). La cita no se cobra.</p>
        <Campo etiqueta="Especialidad" as="select" value={especialidad} onChange={(e) => setEspecialidad(e.target.value)}>
          {ESPECIALIDADES.map(([v, t]) => <option key={v} value={v}>{t}</option>)}
        </Campo>
        <Campo etiqueta="Observación (opcional)" as="textarea" rows={3} maxLength={500} value={observacion} onChange={(e) => setObservacion(e.target.value)} />
        <div className="fila-botones">
          <button type="button" className="btn-sec" onClick={onCerrar}>Cancelar</button>
          <button className="btn" type="submit" disabled={guardando}>{guardando ? 'Guardando…' : 'Derivar a hospital'}</button>
        </div>
      </form>
    </Modal>
  );
}
