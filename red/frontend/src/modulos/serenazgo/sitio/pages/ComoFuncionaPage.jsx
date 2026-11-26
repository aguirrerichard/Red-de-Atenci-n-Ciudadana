import { useCallback, useState } from "react";
import { usePageStyles, useModal } from "../hooks/usePageStyles";
import css from "../styles/como-funciona.css?inline";

const PASOS = [
  { n: "01", titulo: "Identifica la situación", desc: "Determina si es una emergencia en curso (robo, agresión, accidente) o una solicitud de patrullaje preventivo." },
  { n: "02", titulo: "Comunícate con la Central", desc: "Llama al (064) 123-4567 o completa el formulario de reporte en línea desde esta web." },
  { n: "03", titulo: "Brinda tu ubicación exacta", desc: "Indica calle, referencia y zona. Cuanto más precisa sea la dirección, más rápida será la respuesta." },
  { n: "04", titulo: "Recibe indicaciones de seguridad", desc: "El operador te guiará mientras la unidad se traslada: mantente en un lugar seguro y a la espera." },
  { n: "05", titulo: "Llegada de la unidad", desc: "La unidad de Serenazgo más cercana a tu zona acude al lugar y, de ser necesario, coordina con la PNP." },
  { n: "06", titulo: "Seguimiento y cierre", desc: "Recibes un número de caso para consultar el estado de tu reporte y su resolución final." },
];

const REQUISITOS = [
  {
    id: "emergencia",
    titulo: "Emergencia en curso",
    badge: "Atención Inmediata",
    badgeClass: "badge-alert",
    imagen: "https://images.unsplash.com/photo-1582139329536-e7284fece509?auto=format&fit=crop&w=800&q=80",
    resumen: "Ubicación exacta, número de contacto y descripción breve del riesgo. No se requiere DNI para reportar.",
    descripcion: "Plataforma digital optimizada para el despacho prioritario de patrullas y serenos en tiempo real. Al reportar, se genera un ticket de alerta instantáneo para despliegue prioritario.",
    requisitos: [
      "Ubicación exacta con referencias claras de calle, manzana o intersección.",
      "Número de teléfono de contacto activo para comunicación directa con la Central.",
      "Descripción breve y precisa del riesgo o delito en curso.",
      "No se requiere DNI de forma obligatoria para realizar el reporte inicial.",
    ],
  },
  {
    id: "patrullaje",
    titulo: "Solicitud de patrullaje preventivo",
    badge: "Atención Programada",
    badgeClass: "badge-warning",
    imagen: "https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&w=800&q=80",
    resumen: "Nombre completo, dirección del sector y horario en que se necesita presencia de la unidad.",
    descripcion: "Programación estratégica de rondas periódicas de unidades móviles y motorizadas en sectores residenciales o zonas comerciales de alta vulnerabilidad.",
    requisitos: [
      "Nombre completo y DNI del solicitante o representante vecinal.",
      "Dirección exacta del sector, junta vecinal o manzana requerida.",
      "Rango de horario en el que se solicita mayor presencia operativa de la unidad.",
      "Breve sustento o antecedentes de incidencias en la zona.",
    ],
  },
  {
    id: "nocturno",
    titulo: "Acompañamiento nocturno",
    badge: "Resguardo Vecinal Nocturno",
    badgeClass: "badge-info",
    imagen: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=800&q=80",
    resumen: "DNI, punto de partida y destino dentro de la provincia, y horario aproximado del recorrido.",
    descripcion: "Servicio de resguardo preventivo diseñado para ciudadanos que se desplazan durante la madrugada o retornos en horarios de alto riesgo dentro de la jurisdicción.",
    requisitos: [
      "Documento Nacional de Identidad (DNI) físico o digital.",
      "Punto de partida y destino final dentro de la provincia de Huancayo.",
      "Horario aproximado del recorrido y confirmación telefónica activa.",
      "Solicitud registrada con un mínimo de 30 minutos de anticipación.",
    ],
  },
];

export default function ComoFuncionaPage() {
  usePageStyles(css);
  const [req, setReq] = useState(null);
  const cerrar = useCallback(() => setReq(null), []);
  useModal(!!req, cerrar);

  return (
    <>
      <div className="main-content">
        <section className="hero-intro">
          <div className="hero-tag">MUNICIPALIDAD PROVINCIAL DE HUANCAYO — SUBGERENCIA DE SERENAZGO</div>
          <h1 className="page-title">Cómo funciona un reporte a Serenazgo</h1>
          <p className="page-subtitle">Sigue estos pasos para que tu emergencia o solicitud de patrullaje sea atendida lo antes posible.</p>
        </section>

        <section className="steps-section">
          {PASOS.map((p) => (
            <div key={p.n} className="step-item">
              <span className="step-number">{p.n}</span>
              <div className="step-content">
                <h3 className="step-title">{p.titulo}</h3>
                <p className="step-desc">{p.desc}</p>
              </div>
            </div>
          ))}
        </section>

        <section className="requirements-section">
          <h2 className="section-title">Requisitos según el tipo de solicitud</h2>
          <div className="requirements-grid">
            {REQUISITOS.map((r) => (
              <article key={r.id} className="req-card" onClick={() => setReq(r)}>
                <div className="req-card-image-wrapper">
                  <img src={r.imagen} alt={r.titulo} className="req-card-image" />
                  <span className={`req-card-badge ${r.badgeClass}`}>{r.badge}</span>
                </div>
                <div className="req-card-body">
                  <h3 className="req-card-title">{r.titulo}</h3>
                  <p className="req-card-desc">{r.resumen}</p>
                  <div className="card-click-hint">Ver información completa &rarr;</div>
                </div>
              </article>
            ))}
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

      <div
        className={`modal-overlay ${req ? "active" : ""}`}
        aria-hidden={!req}
        onClick={(e) => e.target === e.currentTarget && cerrar()}
      >
        {req && (
          <div className="info-modal-card">
            <button type="button" className="modal-close-btn" aria-label="Cerrar modal" onClick={cerrar}>&times;</button>
            <div className="info-modal-header">
              <div className="info-modal-image-container">
                <img src={req.imagen} alt={req.titulo} className="info-modal-img" />
              </div>
            </div>
            <div className="info-modal-body">
              <span className={`req-card-badge ${req.badgeClass}`}>{req.badge}</span>
              <h2 className="info-modal-title">{req.titulo}</h2>
              <p className="info-modal-desc">{req.descripcion}</p>
              <h4 className="info-modal-subheading">Características clave y requisitos del servicio:</h4>
              <ul className="info-modal-list">
                {req.requisitos.map((t) => (
                  <li key={t}><span className="check-icon">✓</span> <span>{t}</span></li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
