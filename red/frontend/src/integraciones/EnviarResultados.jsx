import { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { pedir } from '../api/http.js';
import { MODULOS } from '../config/modulos.js';
import { CIUDADES, mayuscula, montoEnvio, soles } from '../utils/formato.js';
import { useToast } from '../components/Toast.jsx';
import Modal from '../components/Modal.jsx';
import Campo from '../components/Campo.jsx';

// F3 · Hospital → ExpressEnvíos: envío de resultados desde una cita atendida (con el color de ExpressEnvíos)
export default function EnviarResultados({ cita, onListo, onCerrar }) {
  const { tokenDe } = useAuth();
  const avisar = useToast();
  const [destino, setDestino] = useState('');
  const [peso, setPeso] = useState('0.5');
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);
  const estimado = montoEnvio({ peso_kg: peso, largo_cm: 30, ancho_cm: 22, alto_cm: 3 });

  const enviar = async (e) => {
    e.preventDefault();
    if (!destino) return setError('Elige la ciudad de destino.');
    if (!(Number(peso) > 0)) return setError('El peso debe ser mayor que 0.');
    setError('');
    setGuardando(true);
    try {
      const r = await pedir('integracion', `/hospital/citas/${cita.id}/envio`, { method: 'POST', token: tokenDe('integracion'), body: { destino, peso_kg: Number(peso) } });
      avisar(`Envío registrado · ${r.codigo_seguimiento}`);
      onListo(r);
    } catch (err) { avisar(err.message, 'error'); setGuardando(false); }
  };

  return (
    <Modal titulo="Enviar resultados · ExpressEnvíos" acento={MODULOS.envios.color} onCerrar={onCerrar}>
      <form className="formulario" onSubmit={enviar} noValidate>
        <Campo etiqueta="Origen" precargado value="Hospital Regional del Norte / huancayo" />
        <Campo etiqueta="Destinatario" precargado value={cita.nombre_paciente ?? ''} />
        <Campo etiqueta="Ciudad de destino" as="select" value={destino} onChange={(e) => setDestino(e.target.value)} error={error && !destino ? error : ''}>
          <option value="">Elige una ciudad…</option>
          {CIUDADES.filter((c) => c !== 'huancayo').map((c) => <option key={c} value={c}>{mayuscula(c)}</option>)}
        </Campo>
        <Campo etiqueta="Peso (kg)" type="number" step="0.1" min="0.1" value={peso} onChange={(e) => setPeso(e.target.value)} error={error && destino ? error : ''} ayuda={`Costo estimado: ${soles(estimado)} (sobre de 30×22×3 cm)`} />
        <div className="fila-botones">
          <button type="button" className="btn-sec" onClick={onCerrar}>Cancelar</button>
          <button className="btn" type="submit" disabled={guardando}>{guardando ? 'Guardando…' : 'Confirmar envío'}</button>
        </div>
      </form>
    </Modal>
  );
}
