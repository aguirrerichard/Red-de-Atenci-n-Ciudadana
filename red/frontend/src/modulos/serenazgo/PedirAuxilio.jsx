import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { pedir } from '../../api/http.js';
import { useToast } from '../../components/Toast.jsx';
import Campo, { Casilla } from '../../components/Campo.jsx';
import Encabezado from '../../components/Encabezado.jsx';

export default function PedirAuxilio() {
  const { usuario, tokenDe } = useAuth();
  const avisar = useToast();
  const navegar = useNavigate();
  const [f, setF] = useState({ ubicacion: '', descripcion: '', hay_heridos: false });
  const [errores, setErrores] = useState({});
  const [guardando, setGuardando] = useState(false);
  const cambia = (k) => (e) => setF({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });

  const enviar = async (e) => {
    e.preventDefault();
    const er = {};
    if (f.ubicacion.trim().length < 5) er.ubicacion = 'Escribe la ubicación (mínimo 5 caracteres).';
    if (f.descripcion.trim().length < 5) er.descripcion = 'Cuéntanos qué pasa (mínimo 5 caracteres).';
    setErrores(er);
    if (Object.keys(er).length) return;
    setGuardando(true);
    try {
      const r = await pedir('integracion', '/serenazgo/alertas', { method: 'POST', token: tokenDe('integracion'), body: { ...f, ubicacion: f.ubicacion.trim(), descripcion: f.descripcion.trim() } });
      avisar(`Alerta registrada · ${r.codigo_seguimiento}`);
      navegar('/serenazgo/mis-alertas');
    } catch (err) { avisar(err.message, 'error'); setGuardando(false); }
  };

  return (
    <>
      <Encabezado modulo="serenazgo" titulo="Alerta de auxilio" subtitulo="Avisa a Serenazgo. Si hay heridos, el personal podrá derivarte al Hospital." />
      <form className="formulario" onSubmit={enviar} noValidate>
        <Campo etiqueta="Vecino" precargado value={usuario?.nombre ?? ''} />
        <Campo etiqueta="Ubicación" value={f.ubicacion} onChange={cambia('ubicacion')} error={errores.ubicacion} placeholder="Av. Ferrocarril 1245" maxLength={200} />
        <Campo etiqueta="¿Qué está pasando?" as="textarea" rows={4} value={f.descripcion} onChange={cambia('descripcion')} error={errores.descripcion} maxLength={1000} />
        <Casilla etiqueta="¿Hay heridos?" checked={f.hay_heridos} onChange={cambia('hay_heridos')} />
        <button className="btn" type="submit" disabled={guardando}>{guardando ? 'Guardando…' : 'Enviar alerta'}</button>
      </form>
    </>
  );
}
