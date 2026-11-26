import { useRef, useState } from "react";
import { Link } from '../router.jsx';
import { useAuth } from "../context/AuthContext";
import { usePageStyles } from "../hooks/usePageStyles";
import { API } from "../api/incidencias.api.js";
import Campo from "../components/Campo";
import { TIPOS_INCIDENTE, SECTORES, limpiarCelular, validarReporte } from "../utils/validaciones";
import { calcularMontoServicio, formatearSoles } from "../utils/tarifario";
import css from "../styles/reportar.css?inline";

const VACIO = {
  modalidad: "auxilio", // "auxilio" (gratis) | "resguardo" (evento privado, con tarifa)
  tipo_incidente: "", sector: "", direccion: "", descripcion: "",
  telefono: "", horas_resguardo: "1", efectivos_adicionales: "0", acepta: false,
};
const MAX_DESCRIPCION = 300;

// Reporte de incidentes: formulario controlado con validación por campo.
export default function ReportarPage() {
  usePageStyles(css);
  const { usuario, abrirModal } = useAuth();
  const [f, setF] = useState(VACIO);
  const [errores, setErrores] = useState({});
  const [enviando, setEnviando] = useState(false);
  const [errorServidor, setErrorServidor] = useState("");
  const [registrado, setRegistrado] = useState(null);
  const refs = useRef({});

  const esResguardo = f.modalidad === "resguardo";
  // Vista previa del monto; el servidor lo vuelve a calcular y es el valor oficial
  const monto = esResguardo ? calcularMontoServicio(f) : 0;

  function cambiar(e) {
    const { name, type, checked } = e.target;
    let valor = type === "checkbox" ? checked : e.target.value;
    if (name === "telefono") valor = limpiarCelular(valor);
    if (name === "descripcion") valor = valor.slice(0, MAX_DESCRIPCION);
    setF((prev) => ({ ...prev, [name]: valor }));
    if (errores[name]) setErrores((prev) => ({ ...prev, [name]: undefined }));
  }

  async function enviar(e) {
    e.preventDefault();
    setErrorServidor("");
    if (!usuario) return abrirModal("login");

    const errs = validarReporte(f);
    setErrores(errs);
    const primero = Object.keys(errs)[0];
    if (primero) {
      const el = refs.current[primero];
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
      setTimeout(() => el?.focus(), 250);
      return;
    }

    setEnviando(true);
    const r = await API.crearIncidencia({
      tipo_incidente: f.tipo_incidente,
      sector: f.sector,
      direccion: f.direccion.trim(),
      descripcion: f.descripcion.trim(),
      telefono: f.telefono,
      horas_resguardo: esResguardo ? Number(f.horas_resguardo) : 0,
      efectivos_adicionales: esResguardo ? Number(f.efectivos_adicionales || 0) : 0,
    });
    setEnviando(false);

    if (r.exito) setRegistrado({ codigo: r.codigo ?? r.incidencia?.codigo, monto: r.monto_calculado ?? monto });
    else setErrorServidor(r.mensaje);
  }

  const ref = (campo) => (el) => { refs.current[campo] = el; };
  const attrs = (campo) => ({
    id: campo, name: campo, ref: ref(campo), onChange: cambiar,
    className: errores[campo] ? "input-error" : undefined,
    "aria-invalid": !!errores[campo],
    "aria-describedby": errores[campo] ? `${campo}-error` : undefined,
  });

  if (registrado) {
    return (
      <div className="main-content">
        <section className="form-card-container reporte-ok" aria-live="polite">
          <h1 className="page-title">Reporte registrado</h1>
          {registrado.codigo && <p className="codigo-reporte">{registrado.codigo}</p>}
          <p className="page-subtitle">
            {registrado.monto > 0
              ? `Tu solicitud de resguardo quedó pendiente de pago por ${formatearSoles(registrado.monto)}.`
              : "La central ya recibió tu alerta y despachará la unidad más cercana."}
          </p>
          <div className="reporte-acciones">
            <button type="button" className="btn-submit-report" onClick={() => { setRegistrado(null); setF(VACIO); }}>Hacer otro reporte</button>
            <Link to="/" className="btn btn-outline">Volver al inicio</Link>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="main-content">
      <h1 className="page-title">Reportar un incidente</h1>
      <p className="page-subtitle">
        Cuéntanos qué ocurre y dónde. Si es una emergencia en curso, llama también al <a href="tel:105">105</a>.
      </p>

      <div className="form-card-container">
        <form className="incident-form" onSubmit={enviar} noValidate>
          <fieldset className="form-section">
            <legend className="section-legend">¿Qué necesitas?</legend>
            <div className="radio-options-group">
              <label className="radio-custom-label">
                <input type="radio" name="modalidad" value="auxilio" checked={!esResguardo} onChange={cambiar} />
                <span className="radio-dot"></span>
                <span className="radio-text">Auxilio por una emergencia o incidente (sin costo)</span>
              </label>
              <label className="radio-custom-label">
                <input type="radio" name="modalidad" value="resguardo" checked={esResguardo} onChange={cambiar} />
                <span className="radio-dot"></span>
                <span className="radio-text">Resguardo para un evento privado (con tarifa)</span>
              </label>
            </div>

            {esResguardo && (
              <>
                <div className="form-grid-2">
                  <Campo id="horas_resguardo" etiqueta="Horas de resguardo" obligatorio error={errores.horas_resguardo}>
                    <input type="number" min="1" max="24" value={f.horas_resguardo} {...attrs("horas_resguardo")} />
                  </Campo>
                  <Campo id="efectivos_adicionales" etiqueta="Efectivos adicionales" error={errores.efectivos_adicionales}>
                    <input type="number" min="0" max="10" value={f.efectivos_adicionales} {...attrs("efectivos_adicionales")} />
                  </Campo>
                </div>
                <div className="cotizacion-box" aria-live="polite">
                  Monto estimado: <output>{formatearSoles(monto)}</output>
                  <small>S/ 50.00 por hora más S/ 20.00 por cada efectivo adicional.</small>
                </div>
              </>
            )}
          </fieldset>

          <fieldset className="form-section">
            <legend className="section-legend">El incidente</legend>
            <div className="form-grid-2">
              <Campo id="tipo_incidente" etiqueta="Tipo de incidente" obligatorio error={errores.tipo_incidente}>
                <div className="select-wrapper">
                  <select value={f.tipo_incidente} {...attrs("tipo_incidente")}>
                    <option value="">Selecciona una opción</option>
                    {TIPOS_INCIDENTE.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </Campo>
              <Campo id="sector" etiqueta="Sector" obligatorio error={errores.sector}>
                <div className="select-wrapper">
                  <select value={f.sector} {...attrs("sector")}>
                    <option value="">Selecciona una zona</option>
                    {SECTORES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </Campo>
            </div>
            <Campo id="direccion" etiqueta="Dirección o referencia" obligatorio error={errores.direccion}
              ayuda="Ejemplo: Jr. Real 456, frente al banco.">
              <input type="text" value={f.direccion} maxLength={120} autoComplete="street-address" {...attrs("direccion")} />
            </Campo>
            <Campo id="descripcion" etiqueta="¿Qué está ocurriendo?" obligatorio error={errores.descripcion}
              ayuda={`${f.descripcion.length}/${MAX_DESCRIPCION} caracteres`}>
              <textarea rows={4} value={f.descripcion} {...attrs("descripcion")} />
            </Campo>
          </fieldset>

          <fieldset className="form-section">
            <legend className="section-legend">Tu contacto</legend>
            <Campo id="telefono" etiqueta="Celular" obligatorio error={errores.telefono}
              ayuda="La central te llamará a este número.">
              <div className="phone-prefix-input-wrapper">
                <span className="phone-prefix-addon">+51</span>
                <input type="tel" inputMode="numeric" placeholder="987654321" autoComplete="tel-national"
                  value={f.telefono} {...attrs("telefono")} />
              </div>
            </Campo>
            <div className="field-group">
              <label className="checkbox-custom-label">
                <input type="checkbox" name="acepta" checked={f.acepta} onChange={cambiar} ref={ref("acepta")}
                  aria-describedby={errores.acepta ? "acepta-error" : undefined} />
                <span className="checkbox-box"></span>
                <span className="checkbox-text">Confirmo que los datos del reporte son verdaderos.</span>
              </label>
              {errores.acepta && <span id="acepta-error" className="field-error" role="alert">{errores.acepta}</span>}
            </div>
          </fieldset>

          {errorServidor && <p className="field-error aviso-servidor" role="alert">{errorServidor}</p>}

          <button type="submit" className="btn-submit-report" disabled={enviando}>
            {enviando ? "Enviando…" : esResguardo ? "Solicitar resguardo" : "Enviar alerta"}
          </button>
          {!usuario && <p className="academic-disclaimer">Para enviar el reporte primero debes iniciar sesión.</p>}
        </form>
      </div>
    </div>
  );
}
