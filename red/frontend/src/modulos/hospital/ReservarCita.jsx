import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { pedir } from '../../api/http.js';
import { useToast } from '../../components/Toast.jsx';
import Campo, { Casilla } from '../../components/Campo.jsx';
import Encabezado from '../../components/Encabezado.jsx';
import { ESPECIALIDADES, hoy } from '../../utils/formato.js';

export default function ReservarCita() {
  const { usuario, tokenDe } = useAuth();
  const avisar = useToast();
  const navegar = useNavigate();
  const [f, setF] = useState({
    nombre_paciente: usuario?.nombre ?? '', dni: usuario?.dni ?? '', especialidad: 'medicina-general', fecha_preferida: hoy(),
    tiene_sis: false, fecha_nacimiento: '', telefono: '', correo: usuario?.correo ?? '', motivo: '',
  });
  const [errores, setErrores] = useState({});
  const [guardando, setGuardando] = useState(false);
  const cambia = (k) => (e) => setF({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });

  const validar = () => {
    const er = {};
    if (f.nombre_paciente.trim().length < 4) er.nombre_paciente = 'Escribe el nombre completo (mínimo 4 letras).';
    if (!/^\d{8}$/.test(f.dni)) er.dni = 'El DNI tiene 8 dígitos.';
    if (!f.fecha_preferida || f.fecha_preferida < hoy()) er.fecha_preferida = 'Elige hoy o una fecha futura.';
    if (!f.fecha_nacimiento || f.fecha_nacimiento > hoy()) er.fecha_nacimiento = 'Indica una fecha de nacimiento válida.';
    if (!/^\d{9}$/.test(f.telefono)) er.telefono = 'El teléfono tiene 9 dígitos.';
    if (f.correo && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.correo)) er.correo = 'Correo no válido.';
    if (!f.motivo.trim()) er.motivo = 'Cuéntanos el motivo de la consulta.';
    setErrores(er);
    return !Object.keys(er).length;
  };

  const enviar = async (e) => {
    e.preventDefault();
    if (!validar()) return;
    setGuardando(true);
    try {
      const body = { ...f, nombre_paciente: f.nombre_paciente.trim(), motivo: f.motivo.trim(), correo: f.correo.trim() || undefined };
      const r = await pedir('hospital', '/citas', { method: 'POST', token: tokenDe('hospital'), body });
      avisar(`Cita registrada · ${r.cita.codigo_seguimiento}`);
      navegar('/hospital/mis-citas');
    } catch (err) { avisar(err.message, 'error'); setGuardando(false); }
  };

  return (
    <>
      <Encabezado modulo="hospital" titulo="Reservar cita" subtitulo="Medicina general S/ 15, especialidades S/ 30. Con SIS no pagas." />
      <form className="formulario dos-col" onSubmit={enviar} noValidate>
        <Campo etiqueta="Nombre del paciente" value={f.nombre_paciente} onChange={cambia('nombre_paciente')} error={errores.nombre_paciente} />
        <Campo etiqueta="DNI" inputMode="numeric" maxLength={8} value={f.dni} onChange={cambia('dni')} error={errores.dni} />
        <Campo etiqueta="Especialidad" as="select" value={f.especialidad} onChange={cambia('especialidad')}>
          {ESPECIALIDADES.map(([v, t]) => <option key={v} value={v}>{t}</option>)}
        </Campo>
        <Campo etiqueta="Fecha preferida" type="date" min={hoy()} value={f.fecha_preferida} onChange={cambia('fecha_preferida')} error={errores.fecha_preferida} />
        <Campo etiqueta="Fecha de nacimiento" type="date" max={hoy()} value={f.fecha_nacimiento} onChange={cambia('fecha_nacimiento')} error={errores.fecha_nacimiento} />
        <Campo etiqueta="Teléfono" inputMode="numeric" maxLength={9} value={f.telefono} onChange={cambia('telefono')} error={errores.telefono} />
        <Campo etiqueta="Correo (opcional)" type="email" value={f.correo} onChange={cambia('correo')} error={errores.correo} />
        <Campo etiqueta="Motivo de la consulta" as="textarea" rows={3} maxLength={1000} value={f.motivo} onChange={cambia('motivo')} error={errores.motivo} className="ancho" />
        <Casilla etiqueta="Tengo SIS" checked={f.tiene_sis} onChange={cambia('tiene_sis')} />
        <div className="ancho"><button className="btn" type="submit" disabled={guardando}>{guardando ? 'Guardando…' : 'Reservar cita'}</button></div>
      </form>
    </>
  );
}
