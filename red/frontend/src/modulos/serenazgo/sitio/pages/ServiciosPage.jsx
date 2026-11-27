import { useCallback, useRef, useState } from "react";
import { useNavigate } from '../router.jsx';
import { usePageStyles, useModal } from "../hooks/usePageStyles";
import css from "../styles/servicios.css?inline";

const SERVICIOS = [
  {
    id: "auxilio",
    cardImg: "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?auto=format&fit=crop&w=800&q=80",
    alt: "Botón de auxilio en smartphone",
    resumen: "Formulario de emergencia disponible desde cualquier dispositivo, con envío directo a la unidad más cercana.",
    title: "Botón de auxilio en línea",
    meta: "Atención de Emergencia Inmediata",
    image: "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?auto=format&fit=crop&w=1000&q=80",
    description: "Plataforma digital optimizada para el despacho prioritario de patrullas y serenos en tiempo real. Al presionar el botón de auxilio, se genera un ticket de alerta instantáneo con tu ubicación registrada.",
    features: [
      "Geolocalización referencial directa a la Central de Cómputo",
      "Asignación automática de la unidad móvil o motorizada más cercana",
      "Comunicación directa con el radio operador de turno",
      "Disponible las 24 horas del día, los 365 días del año",
    ],
    actionText: "Reportar Emergencia Ahora",
    actionLink: "/reportar",
  },
  {
    id: "patrullaje",
    cardImg: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT3VvmKqZOLNcpbsL5IRANWflcq3WR57iGuGjvEu342kQ&s=10",
    alt: "Patrulla de seguridad y vigilancia",
    resumen: "Recorridos programados por zona, reforzados en horario nocturno y puntos identificados como críticos.",
    title: "Patrullaje motorizado y a pie",
    meta: "Prevención y Disuasión en Campo",
    image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT3VvmKqZOLNcpbsL5IRANWflcq3WR57iGuGjvEu342kQ&s=10",
    description: "Unidades móviles (camionetas), motocicletas y serenos caminantes patrullan estratégicamente todos los sectores de Huancayo para prevenir ilícitos, ordenar el espacio público y brindar seguridad a los vecinos.",
    features: [
      "Rutas de supervisión continua e itinerante en los 5 sectores",
      "Refuerzo preventivo en horarios nocturnos de mayor concurrencia",
      "Patrullaje integrado coordinado con la Policía Nacional del Perú (PNP)",
      "Intervención inmediata en alteración del orden público y ruidos molestos",
    ],
    actionText: "Ver Cobertura por Zonas",
    actionLink: null,
  },
  {
    id: "accidentes",
    cardImg: "https://images.unsplash.com/photo-1587745416684-47953f16f02f?auto=format&fit=crop&w=800&q=80",
    alt: "Respuesta de emergencia y primeros auxilios",
    resumen: "Aislamiento del área, coordinación con la Policía Nacional y traslado de heridos a centros de salud.",
    title: "Apoyo en accidentes de tránsito",
    meta: "Primera Respuesta y Traslado Médico",
    image: "https://static.vecteezy.com/system/resources/thumbnails/056/711/038/small/ambulance-on-duty-on-the-expressway-photo.jpg",
    description: "Ante emergencias viales o choques de gravedad, las unidades de Serenazgo actúan como primeros respondedores asegurando el perímetro, desviando el tráfico y coordinando auxilio médico especializado.",
    features: [
      "Aislamiento y cercado de la escena del accidente para seguridad vial",
      "Primeros auxilios básicos brindados por personal capacitado",
      "Traslado de emergencia de heridos a hospitales y clínicas cercanas",
      "Coordinación y traspaso directo a la Comisaría del sector y PNP Tránsito",
    ],
    actionText: "Contactar a la Central",
    actionLink: "/contacto",
  },
];

const ZONAS = [
  {
    id: "zona-1", titulo: "Zona 1 — Centro", sector: "Huancayo Centro, Parque Constitución",
    horario: "19:00 – 02:00", nivel: "high", nivelTxt: "Incidencia alta",
    modalTitle: "Zona 1 — Huancayo Centro", meta: "Nivel de Incidencia: Alta",
    sectors: "Parque Constitución, Calle Real, Av. Giráldez, Paseo de la Breña y Damero Central.",
    schedule: "Horario reforzado nocturno: 19:00 – 02:00 hrs",
    details: [
      "3 Camionetas móviles permanentes y 6 motocicletas de respuesta rápida.",
      "Patrullaje a pie en zonas comerciales, agencias bancarias y plazas públicas.",
      "Punto focal de videovigilancia monitoreado desde la Central de Monitoreo.",
    ],
  },
  {
    id: "zona-2", titulo: "Zona 2 — El Tambo", sector: "Real, Mercado Mayorista, San Carlos",
    horario: "18:00 – 01:00", nivel: "high", nivelTxt: "Incidencia alta",
    modalTitle: "Zona 2 — El Tambo", meta: "Nivel de Incidencia: Alta",
    sectors: "Av. Real, Mercado Mayorista, Mercado Malecón, San Carlos y alrededores.",
    schedule: "Horario reforzado nocturno: 18:00 – 01:00 hrs",
    details: [
      "Enfoque especial en control de comercio informal y prevención de hurtos.",
      "Coordinación directa con la Comisaría de El Tambo.",
      "4 Unidades patrulleras asignadas al sector.",
    ],
  },
  {
    id: "zona-3", titulo: "Zona 3 — Chilca", sector: "Chilca centro, Auquimarca",
    horario: "19:00 – 00:00", nivel: "medium", nivelTxt: "Incidencia media",
    modalTitle: "Zona 3 — Chilca", meta: "Nivel de Incidencia: Media",
    sectors: "Chilca Centro, Av. Jacinto Ibarra, Auquimarca y Av. Arterial.",
    schedule: "Horario reforzado nocturno: 19:00 – 00:00 hrs",
    details: [
      "Operativos de fiscalización en locales nocturnos y canchitas deportivas.",
      "Presencia disuasiva constante en accesos y avenidas principales.",
      "2 Unidades camionetas y cuadrilla de serenos a pie.",
    ],
  },
  {
    id: "zona-4", titulo: "Zona 4 — Pilcomayo", sector: "Pilcomayo, Umuto",
    horario: "20:00 – 23:00", nivel: "low", nivelTxt: "Incidencia baja",
    modalTitle: "Zona 4 — Pilcomayo", meta: "Nivel de Incidencia: Baja",
    sectors: "Pilcomayo Centro, Umuto, Av. Las Rosas y accesos al puente.",
    schedule: "Horario reforzado nocturno: 20:00 – 23:00 hrs",
    details: [
      "Rondas periódicas de vigilancia en zonas residenciales y agrícolas.",
      "Atención prioritaria a emergencias por llamadas telefónicas.",
      "Patrullaje perimetral de enlace con distritos vecinos.",
    ],
  },
  {
    id: "zona-5", titulo: "Zona 5 — San Agustín de Cajas", sector: "San Agustín, Cajas Chico",
    horario: "20:00 – 23:00", nivel: "low", nivelTxt: "Incidencia baja",
    modalTitle: "Zona 5 — San Agustín de Cajas", meta: "Nivel de Incidencia: Baja",
    sectors: "San Agustín, Cajas Chico, Prolongación Huancavelica.",
    schedule: "Horario reforzado nocturno: 20:00 – 23:00 hrs",
    details: [
      "Patrullaje disuasivo preventivo en avenidas conectoras.",
      "Apoyo a Juntas Vecinales de Seguridad Ciudadana.",
      "Supervisión nocturna de la vía pública y parque de la zona.",
    ],
  },
];

export default function ServiciosPage() {
  usePageStyles(css);
  const navigate = useNavigate();
  const zonasRef = useRef(null);
  const [info, setInfo] = useState(null); // { tipo: "servicio" | "zona", data }
  const cerrar = useCallback(() => setInfo(null), []);
  useModal(!!info, cerrar);

  function irAZonas() {
    cerrar();
    zonasRef.current?.scrollIntoView({ behavior: "smooth" });
  }

  function accion(link) {
    cerrar();
    navigate(link);
  }

  return (
    <>
      <section className="services-hero">
        <div className="container">
          <h1>Servicios de Serenazgo</h1>
          <p>Trámites y modalidades de atención que gestiona la subgerencia de Serenazgo de Huancayo.</p>
        </div>
      </section>

      <section className="section services-grid-section">
        <div className="container">
          <div className="card-grid">
            {SERVICIOS.map((s) => (
              <article key={s.id} className="card service-card" onClick={() => setInfo({ tipo: "servicio", data: s })}>
                <div className="card-media-wrapper">
                  <img className="card-media" src={s.cardImg} alt={s.alt} />
                  <span className="card-badge-action">Ver detalles &rarr;</span>
                </div>
                <div className="card-body">
                  <h3>{s.title}</h3>
                  <p>{s.resumen}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section zones-section" id="zonas-patrullaje" ref={zonasRef}>
        <div className="container">
          <div className="section-head">
            <h2>Zonas de patrullaje</h2>
            <p>Cobertura actual de las unidades de Serenazgo en la provincia de Huancayo.</p>
          </div>

          <div className="zones-grid">
            {ZONAS.map((z) => (
              <div key={z.id} className="zone-card" onClick={() => setInfo({ tipo: "zona", data: z })}>
                <div className="zone-header">
                  <h3>{z.titulo}</h3>
                  <p className="zone-sector">{z.sector}</p>
                </div>
                <div className="zone-info">
                  <p><strong>Horario reforzado:</strong> {z.horario}</p>
                  <span className={`badge badge-${z.nivel}`}>{z.nivelTxt}</span>
                </div>
                <div className="zone-footer">
                  <span>Clic para más información &rarr;</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="site-footer">
        <div className="container">
          <div>
            <p><strong>Serenazgo Alerta Huancayo</strong><br />Central: (064) 123-4567 · Emergencia nacional: 105</p>
          </div>
          <p>Proyecto académico — Diseño Web, Unidad 1. Nombres y datos de contacto son ficticios, con fines educativos.</p>
        </div>
      </footer>

      <div
        className={`info-modal-overlay ${info ? "active" : ""}`}
        aria-hidden={!info}
        onClick={(e) => e.target === e.currentTarget && cerrar()}
      >
        <div className="info-modal-card">
          <button type="button" className="info-modal-close" aria-label="Cerrar ventana" onClick={cerrar}>&times;</button>

          {info?.tipo === "servicio" && (
            <div>
              <img className="modal-header-img" src={info.data.image} alt={info.data.title} />
              <div className="modal-body-padding">
                <span className="modal-meta-tag">{info.data.meta}</span>
                <h2>{info.data.title}</h2>
                <p className="modal-description">{info.data.description}</p>
                <h3 style={{ fontSize: "1rem", marginBottom: "0.6rem", color: "var(--paper-100)" }}>Características clave del servicio:</h3>
                <ul className="modal-feature-list">
                  {info.data.features.map((f) => <li key={f}>{f}</li>)}
                </ul>
                <div className="modal-actions-bar">
                  {info.data.actionLink ? (
                    <button type="button" className="btn btn-alert" onClick={() => accion(info.data.actionLink)}>{info.data.actionText}</button>
                  ) : (
                    <button type="button" className="btn btn-alert" onClick={irAZonas}>{info.data.actionText}</button>
                  )}
                </div>
              </div>
            </div>
          )}

          {info?.tipo === "zona" && (
            <div>
              <div className="modal-body-padding">
                <span className="modal-meta-tag">{info.data.meta}</span>
                <h2>{info.data.modalTitle}</h2>
                <p className="modal-description"><strong>Sectores cubiertos:</strong> {info.data.sectors}</p>
                <p className="modal-description" style={{ color: "var(--signal-400)", fontWeight: 600 }}>{info.data.schedule}</p>
                <h3 style={{ fontSize: "1rem", marginBottom: "0.6rem", color: "var(--paper-100)" }}>Detalles de despliegue operacional:</h3>
                <ul className="modal-feature-list">
                  {info.data.details.map((d) => <li key={d}>{d}</li>)}
                </ul>
                <div className="modal-actions-bar">
                  <button type="button" className="btn btn-outline" onClick={cerrar}>Entendido</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
