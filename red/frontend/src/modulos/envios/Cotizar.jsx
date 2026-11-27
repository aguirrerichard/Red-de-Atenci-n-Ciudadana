import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { pedir } from '../../api/http.js';
import { useToast } from '../../components/Toast.jsx';
import Campo from '../../components/Campo.jsx';
import Encabezado from '../../components/Encabezado.jsx';
import { CIUDADES, mayuscula, montoEnvio, soles } from '../../utils/formato.js';

const OPCIONES = CIUDADES.map((c) => <option key={c} value={c}>{mayuscula(c)}</option>);

export default function Cotizar() {
  const { tokenDe } = useAuth();
  const avisar = useToast();
  const navegar = useNavigate();
  const [f, setF] = useState({ origen: 'huancayo', destino: '', peso_kg: '1', largo_cm: '30', ancho_cm: '20', alto_cm: '10' });
  const [errores, setErrores] = useState({});
  const [guardando, setGuardando] = useState(false);
  const cambia = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const enviar = async (e) => {
    e.preventDefault();
    const er = {};
    if (!f.destino) er.destino = 'Elige la ciudad de destino.';
    if (f.destino && f.destino === f.origen) er.destino = 'El destino debe ser distinto del origen.';
    ['peso_kg', 'largo_cm', 'ancho_cm', 'alto_cm'].forEach((k) => { if (!(Number(f[k]) > 0)) er[k] = 'Debe ser mayor que 0.'; });
    setErrores(er);
    if (Object.keys(er).length) return;
    setGuardando(true);
    try {
      const r = await pedir('envios', '/cotizaciones', { method: 'POST', token: tokenDe('envios'), body: { ...f, peso_kg: Number(f.peso_kg), largo_cm: Number(f.largo_cm), ancho_cm: Number(f.ancho_cm), alto_cm: Number(f.alto_cm) } });
      avisar(`Cotización registrada · ${r.codigo} · ${soles(r.monto)}`);
      navegar('/envios/mis-envios');
    } catch (err) { avisar(err.message, 'error'); setGuardando(false); }
  };

  return (
    <>
      <Encabezado modulo="envios" titulo="Cotizar envío" subtitulo="Se cobra el mayor entre el peso real y el peso volumétrico." />
      <form className="formulario dos-col" onSubmit={enviar} noValidate>
        <Campo etiqueta="Origen" as="select" value={f.origen} onChange={cambia('origen')}>{OPCIONES}</Campo>
        <Campo etiqueta="Destino" as="select" value={f.destino} onChange={cambia('destino')} error={errores.destino}><option value="">Elige una ciudad…</option>{OPCIONES}</Campo>
        <Campo etiqueta="Peso (kg)" type="number" min="0.1" step="0.1" value={f.peso_kg} onChange={cambia('peso_kg')} error={errores.peso_kg} />
        <Campo etiqueta="Largo (cm)" type="number" min="1" value={f.largo_cm} onChange={cambia('largo_cm')} error={errores.largo_cm} />
        <Campo etiqueta="Ancho (cm)" type="number" min="1" value={f.ancho_cm} onChange={cambia('ancho_cm')} error={errores.ancho_cm} />
        <Campo etiqueta="Alto (cm)" type="number" min="1" value={f.alto_cm} onChange={cambia('alto_cm')} error={errores.alto_cm} />
        <p className="estimado ancho" aria-live="polite">Costo estimado: <b>{soles(montoEnvio(f))}</b></p>
        <div className="ancho"><button className="btn" type="submit" disabled={guardando}>{guardando ? 'Guardando…' : 'Confirmar envío'}</button></div>
      </form>
    </>
  );
}
