import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { pedir } from '../../api/http.js';
import { useToast } from '../../components/Toast.jsx';
import Campo from '../../components/Campo.jsx';
import Encabezado from '../../components/Encabezado.jsx';
import { MOTIVOS_LUZ, montoContraste, soles } from '../../utils/formato.js';

const mesActual = () => new Date().toISOString().slice(0, 7);

// inicial/banner/destino los usa ReclamoLuzHospital (F2) para precargar los datos del Hospital
export default function NuevoReclamo({ inicial = {}, banner, destino = '/luz/mis-reclamos', precargados = [] }) {
  const { usuario, tokenDe } = useAuth();
  const avisar = useToast();
  const navegar = useNavigate();
  const [f, setF] = useState({
    motivo: 'Otros', dni: usuario?.dni ?? '', nombre: usuario?.nombre ?? '', suministro: '', comentario: '', direccion: '',
    mes: mesActual(), montoReclamo: '', tipo_medidor: 'monofasico', km_fuera_zona: 0, ...inicial,
  });
  const [errores, setErrores] = useState({});
  const [guardando, setGuardando] = useState(false);
  const cambia = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const excesivo = f.motivo === 'Reclamo por Monto Excesivo';

  const validar = () => {
    const er = {};
    if (!/^\d{8}$/.test(f.dni) && !(f.motivo === 'Otros' && /^\d{11}$/.test(f.dni))) er.dni = 'El DNI tiene 8 dígitos (RUC de 11 solo en "Otros").';
    if (f.nombre.trim().length < 3) er.nombre = 'Escribe el nombre completo.';
    if (!/^\d{6,10}$/.test(f.suministro)) er.suministro = 'El suministro tiene entre 6 y 10 dígitos.';
    if (f.comentario.trim().length < 5) er.comentario = 'Describe el caso (mínimo 5 caracteres).';
    if (f.motivo === 'Nuevo Suministro' && f.direccion.trim().length < 5) er.direccion = 'La dirección de instalación es obligatoria.';
    if (excesivo && !(Number(f.montoReclamo) > 0)) er.montoReclamo = 'Indica el monto que reclamas.';
    if (excesivo && !/^\d{4}-(0[1-9]|1[0-2])$/.test(f.mes)) er.mes = 'Elige el mes reclamado.';
    setErrores(er);
    return !Object.keys(er).length;
  };

  const enviar = async (e) => {
    e.preventDefault();
    if (!validar()) return;
    setGuardando(true);
    const body = { motivo: f.motivo, dni: f.dni, nombre: f.nombre.trim(), suministro: f.suministro, comentario: f.comentario.trim(), direccion: f.direccion.trim() || undefined };
    if (excesivo) Object.assign(body, { mes: f.mes, montoReclamo: Number(f.montoReclamo), tipo_medidor: f.tipo_medidor, km_fuera_zona: Number(f.km_fuera_zona) || 0 });
    try {
      const r = await pedir('luz', '/reclamos', { method: 'POST', token: tokenDe('luz'), body });
      avisar(`Reclamo registrado · ${r.codigo}`);
      navegar(destino);
    } catch (err) { avisar(err.message, 'error'); setGuardando(false); }
  };

  const pre = (k) => precargados.includes(k);
  return (
    <>
      <Encabezado modulo="luz" titulo="Nuevo reclamo o trámite" subtitulo="Nuevo suministro, cambio de titular, monto excesivo u otros." />
      {banner && <p className="banner" role="note">{banner}</p>}
      <form className="formulario dos-col" onSubmit={enviar} noValidate>
        <Campo etiqueta="Motivo" as="select" value={f.motivo} onChange={cambia('motivo')} className="ancho">
          {MOTIVOS_LUZ.map((m) => <option key={m}>{m}</option>)}
        </Campo>
        <Campo etiqueta="Titular / nombre" value={f.nombre} onChange={cambia('nombre')} error={errores.nombre} precargado={pre('nombre')} />
        <Campo etiqueta="DNI" inputMode="numeric" maxLength={11} value={f.dni} onChange={cambia('dni')} error={errores.dni} precargado={pre('dni')} />
        <Campo etiqueta="N.° de suministro" inputMode="numeric" maxLength={10} value={f.suministro} onChange={cambia('suministro')} error={errores.suministro} />
        {f.motivo === 'Nuevo Suministro' && <Campo etiqueta="Dirección de instalación" value={f.direccion} onChange={cambia('direccion')} error={errores.direccion} maxLength={150} />}
        {excesivo && (<>
          <Campo etiqueta="Mes reclamado" type="month" max={mesActual()} value={f.mes} onChange={cambia('mes')} error={errores.mes} />
          <Campo etiqueta="Monto facturado a reclamar (S/)" type="number" min="0" step="0.01" value={f.montoReclamo} onChange={cambia('montoReclamo')} error={errores.montoReclamo} />
          <Campo etiqueta="Tipo de medidor" as="select" value={f.tipo_medidor} onChange={cambia('tipo_medidor')}>
            <option value="monofasico">Monofásico (S/ 35)</option><option value="trifasico">Trifásico (S/ 75)</option>
          </Campo>
          <Campo etiqueta="Km fuera de zona urbana" type="number" min="0" max="999" value={f.km_fuera_zona} onChange={cambia('km_fuera_zona')} ayuda={`Derecho de contraste a pagar: ${soles(montoContraste(f.tipo_medidor, f.km_fuera_zona))}`} />
        </>)}
        <Campo etiqueta="Descripción / fundamento" as="textarea" rows={4} maxLength={1000} value={f.comentario} onChange={cambia('comentario')} error={errores.comentario} className="ancho" />
        <div className="ancho"><button className="btn" type="submit" disabled={guardando}>{guardando ? 'Guardando…' : 'Registrar reclamo'}</button></div>
      </form>
    </>
  );
}
