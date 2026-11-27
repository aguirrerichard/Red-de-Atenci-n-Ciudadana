import { useState } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { pedir } from '../../api/http.js';
import { useCarga } from '../../hooks/useCarga.js';
import { useToast } from '../../components/Toast.jsx';
import Encabezado from '../../components/Encabezado.jsx';
import Tabla from '../../components/Tabla.jsx';
import Badge from '../../components/Badge.jsx';
import Vacio from '../../components/Vacio.jsx';
import { Casilla } from '../../components/Campo.jsx';
import DerivarAlerta from '../../integraciones/DerivarAlerta.jsx';
import { nombreEstado, verFecha } from '../../utils/formato.js';

const ESTADOS = ['registrado', 'en_proceso', 'atendido', 'rechazado'];

export default function PanelAlertas() {
  const { tokenDe } = useAuth();
  const avisar = useToast();
  const [soloHeridos, setSoloHeridos] = useState(false);
  const [derivando, setDerivando] = useState(null);
  const [ocupado, setOcupado] = useState(null);
  const ti = tokenDe('integracion');
  const { datos, cargando, error, recargar } = useCarga(
    () => pedir('integracion', `/serenazgo/alertas${soloHeridos ? '?heridos=si' : ''}`, { token: ti }), [ti, soloHeridos]);

  const accion = async (id, fn, ok) => {
    setOcupado(id);
    try { await fn(); avisar(ok); await recargar(); } catch (e) { avisar(e.message, 'error'); } finally { setOcupado(null); }
  };
  const cambiarEstado = (a, estado) => accion(a.id,
    () => pedir('serenazgo', `/alertas/${a.codigo_seguimiento}/estado`, { method: 'PATCH', token: tokenDe('serenazgo'), body: { estado } }),
    `Estado actualizado · ${a.codigo_seguimiento}`);
  const heridos = (a) => accion(a.id,
    () => pedir('integracion', `/serenazgo/alertas/${a.id}/heridos`, { method: 'PATCH', token: ti, body: { hay_heridos: !a.hay_heridos } }),
    `${a.codigo_seguimiento}: ${a.hay_heridos ? 'sin heridos' : 'marcada con heridos'}`);

  const columnas = [
    { t: 'Código', r: (a) => <b className="codigo">{a.codigo_seguimiento}</b> },
    { t: 'Vecino', r: (a) => <>{a.nombre_vecino ?? '—'}<span className="meta bloque">{verFecha(a.fecha_registro)}</span></> },
    { t: 'Ubicación', r: (a) => <>{a.ubicacion}<span className="meta bloque">{a.descripcion}</span></> },
    { t: 'Heridos', r: (a) => <button type="button" className={`btn-chip ${a.hay_heridos ? 'si' : ''}`} disabled={ocupado === a.id} onClick={() => heridos(a)} aria-pressed={a.hay_heridos}>{a.hay_heridos ? 'Sí' : 'No'}</button> },
    { t: 'Estado', r: (a) => (
      <div className="celda-estado">
        <Badge estado={a.estado} />
        <select aria-label={`Estado de ${a.codigo_seguimiento}`} value={ESTADOS.includes(a.estado) ? a.estado : ''} disabled={ocupado === a.id} onChange={(e) => cambiarEstado(a, e.target.value)}>
          {!ESTADOS.includes(a.estado) && <option value="" disabled>{nombreEstado(a.estado)}</option>}
          {ESTADOS.map((s) => <option key={s} value={s}>{nombreEstado(s)}</option>)}
        </select>
      </div>) },
    { t: 'Hospital', r: (a) => a.cita_codigo
      ? <><b className="codigo">{a.cita_codigo}</b> <Badge estado={a.cita_estado} /></>
      : a.estado !== 'rechazado' && <button type="button" className="btn" onClick={() => setDerivando(a)}>Derivar a hospital</button> },
  ];

  return (
    <>
      <Encabezado modulo="serenazgo" titulo="Panel de alertas" subtitulo="Cambia el estado, marca heridos y deriva al Hospital.">
        <Casilla etiqueta="Solo con heridos" checked={soloHeridos} onChange={(e) => setSoloHeridos(e.target.checked)} />
      </Encabezado>
      {cargando || error || !datos?.length
        ? <Vacio cargando={cargando} error={error} onReintentar={recargar}>No hay alertas con ese filtro.</Vacio>
        : <Tabla columnas={columnas} filas={datos} resaltar={(a) => a.hay_heridos && !a.cita_codigo} />}
      {derivando && <DerivarAlerta alerta={derivando} onCerrar={() => setDerivando(null)} onListo={() => { setDerivando(null); recargar(); }} />}
    </>
  );
}
