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
import { Casilla } from '../../components/Campo.jsx';
import { mayuscula, soles, verFecha } from '../../utils/formato.js';

export default function PanelEnvios() {
  const { tokenDe } = useAuth();
  const avisar = useToast();
  const [soloHospital, setSoloHospital] = useState(false);
  const [ocupado, setOcupado] = useState(null);
  const ti = tokenDe('integracion');
  const { datos, cargando, error, recargar } = useCarga(
    () => pedir('integracion', `/envios/cotizaciones${soloHospital ? '?origen=hospital' : ''}`, { token: ti }), [ti, soloHospital]);

  const cancelar = async (e) => {
    if (!window.confirm(`¿Cancelar el envío ${e.codigo_seguimiento}?`)) return;
    setOcupado(e.id);
    try {
      await pedir('envios', `/cotizaciones/${e.id}/cancelar`, { method: 'PATCH', token: tokenDe('envios') });
      avisar(`Envío cancelado · ${e.codigo_seguimiento}`);
      await recargar();
    } catch (err) { avisar(err.message, 'error'); } finally { setOcupado(null); }
  };

  const columnas = [
    { t: 'Código', r: (e) => <><b className="codigo">{e.codigo_seguimiento}</b>
      {e.id_cita && <span className="etiqueta bloque" style={{ '--acento': MODULOS.hospital.color }}>Desde Hospital · cita {e.cita_codigo}</span>}</> },
    { t: 'Remitente', r: (e) => <>{e.nombre_remitente ?? e.cliente ?? '—'}<span className="meta bloque">{verFecha(e.fecha_registro)}</span></> },
    { t: 'Ruta', r: (e) => <>{mayuscula(e.origen)} → {mayuscula(e.destino)}<span className="meta bloque">{Number(e.peso_kg)} kg</span></> },
    { t: 'Monto', r: (e) => <>{soles(e.monto_calculado)}<span className="bloque"><Badge estado={e.estado_pago} /></span></> },
    { t: 'Estado', r: (e) => <Badge estado={e.estado} /> },
    { t: 'Acción', r: (e) => !['cancelado', 'entregado'].includes(e.estado) && <button type="button" className="btn-sec peligro" disabled={ocupado === e.id} onClick={() => cancelar(e)}>Cancelar</button> },
  ];

  return (
    <>
      <Encabezado modulo="envios" titulo="Panel de envíos" subtitulo="Cotizaciones y envíos. Los que vienen del Hospital llevan su cita.">
        <Casilla etiqueta="Solo desde Hospital" checked={soloHospital} onChange={(e) => setSoloHospital(e.target.checked)} />
      </Encabezado>
      {cargando || error || !datos?.length
        ? <Vacio cargando={cargando} error={error} onReintentar={recargar}>No hay envíos con ese filtro.</Vacio>
        : <Tabla columnas={columnas} filas={datos} resaltar={(e) => !!e.id_cita} />}
    </>
  );
}
