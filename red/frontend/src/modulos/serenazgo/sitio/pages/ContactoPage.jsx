import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { enviarMensajeContacto } from "../api/contacto.api.js";
import { limpiarCelular, validarCorreo } from "../utils/validaciones";
import { usePageStyles, useModal } from "../hooks/usePageStyles";
import css from "../styles/contacto.css?inline";

const TARJETAS = [
  { tag: "CENTRAL DE RADIO", texto: "(064) 123-4567", resto: " — atención 24 horas" },
  { tag: "CORREO INSTITUCIONAL", texto: "central.serenazgo@munihuancayo-ficticio.gob.pe" },
  { tag: "PUESTO DE AUXILIO PRINCIPAL", texto: "Jr. Real 456, Huancayo Centro" },
  { tag: "PUESTO DE AUXILIO EL TAMBO", texto: "Av. Mariscal Castilla 1230, El Tambo" },
  { tag: "PUESTO DE AUXILIO CHILCA", texto: "Jr. Ancash 210, Chilca" },
  { tag: "HORARIO DE ATENCIÓN", texto: "Lunes a viernes, 8:00 a.m. – 4:00 p.m." },
];

const ASUNTOS = [
  "Consulta Administrativa",
  "Solicitud de Capacitación / Charla Vecinal",
  "Sugerencia de Mejora",
  "Felicitación al Personal",
  "Queja o Reclamo",
  "Otro Motivo",
];

const VACIO = { nombres: "", apellidos: "", dni: "", telefono: "", correo: "", asunto: "", mensaje: "" };

export default function ContactoPage() {
  usePageStyles(css);
  const { usuario, abrirModal } = useAuth();
  const [f, setF] = useState(VACIO);
  const [errorCampo, setErrorCampo] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [aviso, setAviso] = useState(null); // { titulo, mensaje }
  const refs = useRef({});
  const cerrarAviso = useCallback(() => setAviso(null), []);
  useModal(!!aviso, cerrarAviso);

  // Prellenar nombre y correo con la sesión activa (solo si el campo está vacío)
  useEffect(() => {
    if (!usuario) return;
    setF((prev) => ({
      ...prev,
      nombres: prev.nombres || usuario.nombre || "",
      correo: prev.correo || usuario.correo || "",
    }));
  }, [usuario]);

  function cambiar(e) {
    const { name } = e.target;
    let v = e.target.value;
    if (name === "nombres" || name === "apellidos") v = v.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, "");
    if (name === "dni") v = v.replace(/\D/g, "").slice(0, 8);
    if (name === "telefono") {
      v = limpiarCelular(v);
    }
    setF((prev) => ({ ...prev, [name]: v }));
    if (errorCampo === name) setErrorCampo(null);
  }

  function fallo(campo, titulo, mensaje) {
    setAviso({ titulo, mensaje });
    setErrorCampo(campo);
    const el = refs.current[campo];
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
    setTimeout(() => el?.focus(), 300);
  }

  async function enviar(e) {
    e.preventDefault();
    if (!usuario) {
      abrirModal("login");
      return;
    }

    const nombres = f.nombres.trim();
    const apellidos = f.apellidos.trim();
    const dni = f.dni.trim();
    const tel = f.telefono.trim();
    const correo = f.correo.trim();
    const mensaje = f.mensaje.trim();

    if (nombres.length < 2) return fallo("nombres", "Nombres Inválidos", "Por favor ingresa un nombre válido de al menos 2 letras.");
    if (apellidos.length < 2) return fallo("apellidos", "Apellidos Inválidos", "Por favor ingresa tus apellidos completos.");
    if (dni.length > 0 && dni.length !== 8) return fallo("dni", "DNI Incorrecto", "El número de DNI debe contener exactamente 8 dígitos.");
    if (tel.length !== 9 || !tel.startsWith("9")) return fallo("telefono", "Teléfono Inválido", "El teléfono debe empezar obligatoriamente con 9 y tener 9 dígitos.");
    if (!validarCorreo(correo)) return fallo("correo", "Correo Electrónico Inválido", "Ingresa un formato de correo válido (ejemplo@dominio.com).");
    if (!f.asunto) return fallo("asunto", "Asunto Requerido", "Por favor selecciona el motivo de tu contacto.");
    if (mensaje.length < 10) return fallo("mensaje", "Mensaje Muy Corto", "El mensaje debe tener al menos 10 caracteres explicativos.");

    setEnviando(true);
    try {
      const r = await enviarMensajeContacto({ nombres, apellidos, dni, telefono: tel, correo, asunto: f.asunto, mensaje });
      if (!r.exito) throw new Error(r.mensaje);
      setAviso({
        titulo: "¡Mensaje Enviado!",
        mensaje: "Tu consulta ha sido registrada exitosamente en la base de datos de Serenazgo. Nos comunicaremos contigo en breve.",
      });
      setF({ ...VACIO, nombres: usuario.nombre || "", correo: usuario.correo || "" });
    } catch (err) {
      console.error("Error al enviar el mensaje:", err);
      setAviso({
        titulo: "Error de Conexión",
        mensaje: "No se pudo registrar el mensaje en la base de datos. Verifica tu conexión a internet e inténtalo nuevamente.",
      });
    } finally {
      setEnviando(false);
    }
  }

  const cls = (campo) => (errorCampo === campo ? "input-error" : undefined);
  const setRef = (campo) => (el) => { refs.current[campo] = el; };

  return (
    <>
      <div className="main-content">
        <section className="hero-section">
          <h1 className="page-title">Ubicación y canales de contacto</h1>
          <p className="page-subtitle">Bases de patrullaje y vías de comunicación con la Central de Serenazgo.</p>
        </section>

        <section className="contact-info-grid">
          {TARJETAS.map((t) => (
            <div key={t.tag} className="info-card">
              <span className="card-tag">{t.tag}</span>
              <p className="card-content"><strong>{t.texto}</strong>{t.resto}</p>
            </div>
          ))}
        </section>

        <section className="contact-form-section">
          <div className="form-card-container">
            <h2 className="form-title">Envíanos un mensaje directo</h2>
            <p className="form-subtitle">Completa el formulario para consultas administrativas, felicitaciones o reclamos.</p>

            <form className="contact-form" onSubmit={enviar} noValidate>
              <div className="form-grid-2">
                <div className="field-group">
                  <label htmlFor="contact-nombres">Nombres <span className="required-star">*</span></label>
                  <input id="contact-nombres" name="nombres" type="text" placeholder="Ej. Juan Carlos"
                    value={f.nombres} onChange={cambiar} ref={setRef("nombres")} className={cls("nombres")} />
                </div>
                <div className="field-group">
                  <label htmlFor="contact-apellidos">Apellidos <span className="required-star">*</span></label>
                  <input id="contact-apellidos" name="apellidos" type="text" placeholder="Ej. Pérez Gómez"
                    value={f.apellidos} onChange={cambiar} ref={setRef("apellidos")} className={cls("apellidos")} />
                </div>
              </div>

              <div className="form-grid-2 margin-top-field">
                <div className="field-group">
                  <label htmlFor="contact-dni">DNI <span className="optional-tag">(opcional)</span></label>
                  <input id="contact-dni" name="dni" type="text" placeholder="8 dígitos" maxLength={8} inputMode="numeric"
                    value={f.dni} onChange={cambiar} ref={setRef("dni")} className={cls("dni")} />
                </div>
                <div className="field-group">
                  <label htmlFor="contact-telefono">Teléfono <span className="required-star">*</span></label>
                  <div className="phone-prefix-input-wrapper">
                    <span className="phone-prefix-addon">+51</span>
                    <input id="contact-telefono" name="telefono" type="tel" placeholder="964123456" maxLength={9} inputMode="numeric"
                      value={f.telefono} onChange={cambiar} ref={setRef("telefono")} className={cls("telefono")} />
                  </div>
                </div>
              </div>

              <div className="form-grid-2 margin-top-field">
                <div className="field-group">
                  <label htmlFor="contact-correo">Correo electrónico <span className="required-star">*</span></label>
                  <input id="contact-correo" name="correo" type="email" placeholder="correo@ejemplo.com"
                    value={f.correo} onChange={cambiar} ref={setRef("correo")} className={cls("correo")} />
                </div>
                <div className="field-group">
                  <label htmlFor="contact-asunto">Asunto / Motivo <span className="required-star">*</span></label>
                  <div className="select-wrapper">
                    <select id="contact-asunto" name="asunto" value={f.asunto} onChange={cambiar}
                      ref={setRef("asunto")} className={cls("asunto")}>
                      <option value="" disabled>Selecciona el motivo</option>
                      {ASUNTOS.map((a) => <option key={a} value={a}>{a}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              <div className="field-group margin-top-field">
                <label htmlFor="contact-mensaje">Mensaje <span className="required-star">*</span></label>
                <textarea id="contact-mensaje" name="mensaje" rows={4} placeholder="Escribe detalladamente tu mensaje..."
                  value={f.mensaje} onChange={cambiar} ref={setRef("mensaje")} className={cls("mensaje")} />
              </div>

              <button type="submit" className="btn-submit-contact" disabled={enviando}>
                <span>{enviando ? "Guardando en Central..." : "Enviar mensaje"}</span>
              </button>
            </form>
          </div>
        </section>
      </div>

      <footer className="main-footer">
        <div className="footer-container">
          <div className="footer-left">
            <strong>Serenazgo Alerta Huancayo</strong>
            <span>Central: (064) 123-4567 · Emergencia nacional: 105</span>
          </div>
          <div className="footer-right">
            <span>Proyecto académico — Diseño Web, Unidad 1. Nombres y datos de contacto son ficticios, con fines educativos.</span>
          </div>
        </div>
      </footer>

      <div className={`custom-modal-overlay ${aviso ? "active" : ""}`} aria-hidden={!aviso}
        onClick={(e) => e.target === e.currentTarget && cerrarAviso()}>
        <div className="custom-modal-card" role="alertdialog" aria-modal="true">
          <h3 className="custom-modal-title">{aviso?.titulo}</h3>
          <p className="custom-modal-body">{aviso?.mensaje}</p>
          <div className="custom-modal-actions">
            <button type="button" className="btn-alert" onClick={cerrarAviso}>Entendido</button>
          </div>
        </div>
      </div>
    </>
  );
}
