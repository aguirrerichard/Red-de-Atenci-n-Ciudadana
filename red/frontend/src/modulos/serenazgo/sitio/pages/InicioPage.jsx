import { useCallback, useState } from "react";
import { Link, useNavigate } from '../router.jsx';
import { useAuth } from "../context/AuthContext";
import { usePageStyles } from "../hooks/usePageStyles";
import { SLIDES, INCIDENTES } from "../data/inicio";
import Carrusel from "../components/Carrusel";
import Contador from "../components/Contador";
import IncidenteCard from "../components/IncidenteCard";
import DetalleModal from "../components/DetalleModal";
import css from "../styles/index.css?inline";

export default function InicioPage() {
  usePageStyles(css);
  const { usuario, abrirModal } = useAuth();
  const navigate = useNavigate();
  const [detalle, setDetalle] = useState(null);
  const cerrarDetalle = useCallback(() => setDetalle(null), []);

  // Las acciones sensibles piden iniciar sesión antes de continuar
  function irProtegido(e, ruta) {
    e.preventDefault();
    if (!usuario) abrirModal("login");
    else navigate(ruta);
  }

  function irDesdeModal(ruta) {
    setDetalle(null);
    navigate(ruta);
  }

  return (
    <>
      <section className="hero">
        <div className="container">
          <div>
            <p className="hero-eyebrow">Municipalidad Provincial de Huancayo, Subgerencia de Serenazgo</p>
            <h1>Patrullaje y respuesta a emergencias las 24 horas</h1>
            <p>Serenazgo Alerta Huancayo coordina el patrullaje de la provincia y atiende reportes ciudadanos en tiempo real: robos, disturbios, accidentes de tránsito y situaciones de riesgo en la vía pública.</p>
            <div className="hero-actions">
              <a className="btn btn-auxilio" href="/reportar" onClick={(e) => irProtegido(e, "/reportar")}>Botón de auxilio</a>
              <a className="btn btn-outline btn-como-funciona" href="/como-funciona" onClick={(e) => irProtegido(e, "/como-funciona")}>Cómo funciona</a>
            </div>
          </div>
          <Carrusel slides={SLIDES} />
        </div>
      </section>

      <section className="stats">
        <div className="container">
          <dl className="stat"><Contador target={24} suffix="/7" /><dd>Atención permanente todos los días del año</dd></dl>
          <dl className="stat"><Contador target={5} /><dd>Zonas de patrullaje activo en la provincia</dd></dl>
          <dl className="stat"><Contador target={8} prefix="~" suffix=" min" /><dd>Tiempo promedio de respuesta en zona urbana</dd></dl>
          <dl className="stat"><Contador target={42} /><dd>Unidades móviles y a pie en servicio</dd></dl>
        </div>
      </section>

      <section className="section-incidents">
        <div className="container">
          <h2 className="section-title">Atención según el tipo de incidente</h2>
          <p className="section-subtitle">Cada reporte se deriva a la unidad correspondiente según el trámite y el nivel de urgencia.</p>

          <div className="incidents-grid">
            {INCIDENTES.map((inc) => (
              <IncidenteCard key={inc.id} incidente={inc} onVer={() => setDetalle(inc)} />
            ))}
          </div>

          <div className="section-actions" style={{ marginTop: "2rem" }}>
            <Link to="/servicios" className="btn btn-outline">Ver todos los servicios</Link>
          </div>
        </div>
      </section>

      <DetalleModal incidente={detalle} onCerrar={cerrarDetalle} onAccion={irDesdeModal} />
    </>
  );
}
