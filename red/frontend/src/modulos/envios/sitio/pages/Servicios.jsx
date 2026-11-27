import { Link } from '../router.jsx'
import estilos from '../styles/servicios.css?inline'
import useEstilosDePagina from '../hooks/useEstilosDePagina.js'

export default function Servicios() {
  useEstilosDePagina(estilos)

  return (
    <main>
      {/* ENCABEZADO DE PÁGINA */}
      <section className="page-header">
        <h1>Servicios y Catálogo Tarifario</h1>
        <p className="subtitulo">Soluciones logísticas para la región San Martín y envíos a nivel nacional.</p>
      </section>

      {/* SERVICIOS PRINCIPALES */}
      <section id="servicios" className="seccion-bloque">
        <div className="seccion-titulo">
          <h2>Nuestros servicios de carga</h2>
          <p>Transporte rápido y seguro adaptado a tus necesidades</p>
        </div>

        <div className="servicios-grid">
          <article className="servicio-card">
            <div className="card-img">
              <img src="/aereo.jpg" alt="Express Aéreo" />
            </div>
            <div className="servicio-content">
              <span className="etiqueta-tag tag-aereo">Prioritario</span>
              <h3>Express Aéreo Tarapoto - Lima</h3>
              <p>Conexión directa prioritaria en menos de 24 horas. Ideal para sobres, documentos legales y muestras comerciales.</p>
              <Link to="/servicios/expreso-aereo" className="btn">Ver horarios →</Link>
            </div>
          </article>

          <article className="servicio-card">
            <div className="card-img">
              <img src="/terrestre.jpg" alt="Encomienda Terrestre" />
            </div>
            <div className="servicio-content">
              <span className="etiqueta-tag tag-terrestre">Económico</span>
              <h3>Encomienda Terrestre</h3>
              <p>Salidas diarias hacia Moyobamba, Yurimaguas, Chiclayo, Trujillo y Lima con tarifas accesibles.</p>
              <Link to="/servicios/encomienda-terrestre" className="btn">Ver rutas →</Link>
            </div>
          </article>

          <article className="servicio-card">
            <div className="card-img">
              <img src="/agropecuario.jpg" alt="Courier Agropecuario" />
            </div>
            <div className="servicio-content">
              <span className="etiqueta-tag tag-agro">Especializado</span>
              <h3>Courier Agropecuario</h3>
              <p>Empaque técnico y logística adaptada para emprendedores de café, cacao y productos autóctonos.</p>
              <Link to="/servicios/courier-agropecuario" className="btn">Ver guía →</Link>
            </div>
          </article>
        </div>
      </section>

      {/* TRÁMITES Y LICENCIAS */}
      <section id="tramites" className="seccion-bloque">
        <div className="seccion-titulo">
          <h2>Trámites y gestión documentaria</h2>
          <p>Asesoría y facilitación de permisos de envío</p>
        </div>

        <div className="tramites-container">
          <div className="tramite-box">
            <h3>Guías de Remisión</h3>
            <p>Emisión y validación directa ante SUNAT para traslados comerciales de empresas y personas naturales.</p>
          </div>

          <div className="tramite-box">
            <h3>Permisos SENASA</h3>
            <p>Gestión de certificados fitosanitarios necesarios para el transporte legal de productos agrícolas.</p>
          </div>

          <div className="tramite-box">
            <h3>Seguro de Carga</h3>
            <p>Trámite de pólizas de protección adicional para envíos de alto valor comercial o frágiles.</p>
          </div>
        </div>
      </section>

      {/* CATÁLOGO TARIFARIO */}
      <section id="catalogo" className="seccion-bloque">
        <div className="seccion-titulo">
          <h2>Catálogo tarifario estándar</h2>
          <p>Consulte las tarifas base para los destinos más frecuentes</p>
        </div>

        <div className="tabla-responsive">
          <table className="catalogo-tabla">
            <thead>
              <tr>
                <th scope="col">Tipo de envío</th>
                <th scope="col">Destino principal</th>
                <th scope="col">Tiempo estimado</th>
                <th scope="col">Precio base (hasta 3 kg)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Sobre Documentario</td>
                <td>Lima / Chiclayo</td>
                <td>24 Horas (Aéreo)</td>
                <td>S/ 25.00</td>
              </tr>
              <tr>
                <td>Paquete Estándar</td>
                <td>Moyobamba / Yurimaguas</td>
                <td>24 - 48 Horas (Terrestre)</td>
                <td>S/ 15.00</td>
              </tr>
              <tr>
                <td>Caja Comercial (Cacao/Café)</td>
                <td>Lima Metropolitano</td>
                <td>48 - 72 Horas (Terrestre)</td>
                <td>S/ 35.00</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </main>
  )
}
