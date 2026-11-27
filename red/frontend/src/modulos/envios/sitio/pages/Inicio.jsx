import { Link } from '../router.jsx'

export default function Inicio() {
  return (
    <main>
      {/* HERO SECTION */}
      <section className="hero">
        <div className="hero-overlay"></div>
        <div className="hero-content">
          <span className="badge">Envíos Nacionales</span>
          <h1>Transporte y Logística Sin Complicaciones</h1>
          <p>Conectamos la región San Martín con todo el Perú de forma rápida y segura.</p>

          {/* SEGUIMIENTO Y RASTREO */}
          <div className="tracking-container">
            <div className="rastreo-header">
              <svg className="svg-paquete-animado" viewBox="0 0 64 64" width="64" height="64">
                <path fill="#ffb800" d="M32 4L4 18v28l28 14 28-14V18L32 4z" />
                <path fill="#e0a200" d="M32 4v28l28-14L32 4z" />
                <path fill="#0d2c6c" d="M4 18l28 14v28L4 46V18z" />
              </svg>
              <h3>Seguimiento de envío en tiempo real</h3>
            </div>

            {/* Línea de tiempo */}
            <div className="timeline">
              <div className="timeline-bar"></div>
              <div className="timeline-step active">
                <div className="step-dot"></div>
                <span className="step-label">Recibido</span>
              </div>
              <div className="timeline-step active">
                <div className="step-dot"></div>
                <span className="step-label">Tránsito</span>
              </div>
              <div className="timeline-step active">
                <div className="step-dot"></div>
                <span className="step-label">Reparto</span>
              </div>
              <div className="timeline-step">
                <div className="step-dot"></div>
                <span className="step-label">Entregado</span>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ESTADÍSTICAS */}
      <section className="stats-bar">
        <div className="stat-item">
          <h2>+15,000</h2>
          <p>Envíos entregados</p>
        </div>
        <div className="stat-item">
          <h2>99.8%</h2>
          <p>Entregas a tiempo</p>
        </div>
        <div className="stat-item">
          <h2>24/7</h2>
          <p>Monitoreo GPS</p>
        </div>
        <div className="stat-item">
          <h2>12+</h2>
          <p>Rutas en San Martín</p>
        </div>
      </section>

      {/* CATÁLOGO DE SERVICIOS */}
      <section className="resumen-inicio" id="servicios">
        <div className="section-title">
          <h2>Servicios de transporte y encomiendas</h2>
          <p>Conectando la Región San Martín con Lima y las principales ciudades del país.</p>
        </div>

        <div className="resumen-grid">
          <article className="resumen-card">
            <div className="card-img-wrapper">
              <img src="/aereo.jpg" alt="Carga Aérea Express" />
              <span className="card-badge">Menos de 24 hrs</span>
            </div>
            <div className="resumen-card-body">
              <h3>Express Aéreo</h3>
              <p>Conexiones diarias directas entre Tarapoto y Lima. Ideal para documentos urgentes y muestras comerciales.</p>
              <Link to="/servicios/expreso-aereo" className="link-btn">Ver horarios →</Link>
            </div>
          </article>

          <article className="resumen-card">
            <div className="card-img-wrapper">
              <img src="/terrestre.jpg" alt="Encomienda Terrestre" />
              <span className="card-badge">Salidas Diarias</span>
            </div>
            <div className="resumen-card-body">
              <h3>Encomienda Terrestre</h3>
              <p>Salidas diarias hacia Moyobamba, Yurimaguas, Chiclayo, Trujillo y Lima con tarifas accesibles.</p>
              <Link to="/servicios/encomienda-terrestre" className="link-btn">Ver rutas →</Link>
            </div>
          </article>

          <article className="resumen-card">
            <div className="card-img-wrapper">
              <img src="/agropecuario.jpg" alt="Courier Agropecuario" />
              <span className="card-badge">Especializado</span>
            </div>
            <div className="resumen-card-body">
              <h3>Courier Agropecuario</h3>
              <p>Empaque técnico y logística adaptada para emprendedores de café, cacao y productos autóctonos.</p>
              <Link to="/servicios/courier-agropecuario" className="link-btn">Ver guía →</Link>
            </div>
          </article>
        </div>
      </section>

      {/* VENTAJAS / POR QUÉ ELEGIRNOS */}
      <section className="features-section" id="beneficios">
        <div className="section-title">
          <h2>¿Por qué confiar en LogísticaExpress?</h2>
          <p>Garantía, rapidez y cuidado total en cada envío.</p>
        </div>

        <div className="features-grid">
          <div className="feature-box">
            <h3>Seguridad garantizada</h3>
            <p>Tu paquete viaja asegurado con protocolo de embalaje y precinto de seguridad.</p>
          </div>
          <div className="feature-box">
            <h3>Rastreo en tiempo real</h3>
            <p>Monitorea el estado exacto de tu encomienda desde el origen hasta el punto final.</p>
          </div>
          <div className="feature-box">
            <h3>Sedes cercanas</h3>
            <p>Múltiples oficinas estratégicas para recojo y envío directo en San Martín.</p>
          </div>
        </div>
      </section>

      {/* TESTIMONIOS */}
      <section className="testimonials-section" id="testimonios">
        <div className="section-title">
          <h2>Lo que dicen nuestros clientes</h2>
        </div>

        <div className="testimonials-grid">
          <div className="testimonial-card">
            <p>"Enviamos muestras de café orgánico desde Tarapoto a Lima semanalmente. La rapidez del servicio aéreo es impecable."</p>
            <h4>— Cooperativa Agrícola San Martín</h4>
          </div>
          <div className="testimonial-card">
            <p>"Excelente atención en la oficina central. Mis encomiendas familiares llegan siempre a tiempo."</p>
            <h4>— María Fernández</h4>
          </div>
        </div>
      </section>
    </main>
  )
}
