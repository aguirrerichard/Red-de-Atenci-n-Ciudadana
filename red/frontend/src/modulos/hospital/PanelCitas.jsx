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
import EnviarResultados from '../../integraciones/EnviarResultados.jsx';
import { aSlug, etiquetaEspecialidad, soloFecha, verFecha } from '../../utils/formato.js';

const ESTADOS = ['registrado', 'atendido', 'rechazado', 'cancelado'];

export default function PanelCitas() {
  const { tokenDe } = useAuth();
  const avisar = useToast();
  const [soloSerenazgo, setSoloSerenazgo] = useState(false);
  const [enviando, setEnviando] = useState(null);
  const [ocupado, setOcupado] = useState(null);
  const ti = tokenDe('integracion');
  const { datos, cargando, error, recargar } = useCarga(
    () => pedir('integracion', `/hospital/citas${soloSerenazgo ? '?origen=serenazgo' : ''}`, { token: ti }), [ti, soloSerenazgo]);

  const cambiarEstado = async (c, estado) => {
    setOcupado(c.id);
    try {
      await pedir('hospital', `/citas/${c.id}/gestion`, {
        method: 'PATCH', token: tokenDe('hospital'),
        body: { nombre_paciente: c.nombre_paciente, dni: c.dni, especialidad: aSlug(c.especialidad), fecha_preferida: soloFecha(c.fecha_preferida), estado },
      });
      avisar(`Estado actualizado · ${c.codigo_seguimiento}`);
      await recargar();
    } catch (e) { avisar(e.message, 'error'); } finally { setOcupado(null); }
  };

  const columnas = [
    { t: 'Código', r: (c) => <><b className="codigo">{c.codigo_seguimiento}</b>
      {c.alerta_codigo && <span className="etiqueta bloque" style={{ '--acento': MODULOS.serenazgo.color }}>Origen: Serenazgo · {c.alerta_codigo}</span>}</> },
    { t: 'Paciente', r: (c) => <>{c.nombre_paciente}<span className="meta bloque">DNI {c.dni ?? '—'}</span></> },
    { t: 'Cita', r: (c) => <>{etiquetaEspecialidad(c.especialidad)}<span className="meta bloque">{verFecha(c.fecha_preferida)}</span></> },
    { t: 'Pago', r: (c) => <Badge estado={c.estado_pago} /> },
    { t: 'Estado', r: (c) => (
      <div className="celda-estado">
        <Badge estado={c.estado} />
        <select aria-label={`Estado de ${c.codigo_seguimiento}`} value={ESTADOS.includes(c.estado) ? c.estado : 'registrado'} disabled={ocupado === c.id} onChange={(e) => cambiarEstado(c, e.target.value)}>
          {ESTADOS.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>) },
    { t: 'Resultados', r: (c) => c.envio_codigo
      ? <span className="etiqueta" style={{ '--acento': MODULOS.envios.color }}>Envío {c.envio_codigo} · {c.envio_estado}</span>
      : c.estado === 'atendido' && <button type="button" className="btn" onClick={() => setEnviando(c)}>Enviar resultados</button> },
  ];

  return (
    <>
      <Encabezado modulo="hospital" titulo="Panel de citas" subtitulo="Gestiona las citas y envía resultados desde las atendidas.">
        <Casilla etiqueta="Origen: Serenazgo" checked={soloSerenazgo} onChange={(e) => setSoloSerenazgo(e.target.checked)} />
      </Encabezado>
      {cargando || error || !datos?.length
        ? <Vacio cargando={cargando} error={error} onReintentar={recargar}>No hay citas con ese filtro.</Vacio>
        : <Tabla columnas={columnas} filas={datos} resaltar={(c) => !!c.alerta_codigo && c.estado === 'registrado'} />}
      {enviando && <EnviarResultados cita={enviando} onCerrar={() => setEnviando(null)} onListo={() => { setEnviando(null); recargar(); }} />}
    </>
  );
}
