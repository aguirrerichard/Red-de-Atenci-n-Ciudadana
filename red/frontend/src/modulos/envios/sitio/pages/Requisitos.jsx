import { Link } from '../router.jsx'
import estilos from '../styles/requisitos.css?inline'
import useEstilosDePagina from '../hooks/useEstilosDePagina.js'

export default function Requisitos() {
  useEstilosDePagina(estilos)
  return (
    <main>
      <div className="page-header">
        <span className="badge-sub">Guía Completa del Usuario</span>
        <h1>¿Cómo funciona nuestro servicio de envíos?</h1>
        <p className="subtitulo">
          Sigue estos sencillos pasos y revisa la documentación requerida para garantizar un traslado rápido y sin demoras desde Tarapoto hacia todo el Perú.
        </p>
      </div>

      {/* PASO A PASO */}
      <section id="pasos" className="pasos-section">
        <h2 className="section-title">Paso a Paso para Realizar un Envío</h2>

        <div className="pasos-grid">
          <article className="paso-card">
            <div className="paso-header">
              <span className="paso-num">01</span>
            </div>
            <h3>1. Prepara y Empaca</h3>
            <p>Asegura el producto en una caja rígida o sobre térmico hermético. Si envías café o cacao en grano, utiliza sacos doble sello.</p>
          </article>

          <article className="paso-card">
            <div className="paso-header">
              <span className="paso-num">02</span>
            </div>
            <h3>2. Cotiza y Registra</h3>
            <p>
              Usa nuestro <Link to="/cotizador">Cotizador Online</Link> para calcular el costo aproximado según el peso (Kg), destino y modalidad de transporte.
            </p>
          </article>

          <article className="paso-card">
            <div className="paso-header">
              <span className="paso-num">03</span>
            </div>
            <h3>3. Entrega en Agencias</h3>
            <p>Acércate a nuestra sede en Tarapoto (Jr. San Martín 450) o solicita el servicio opcional de recojo en tu domicilio o empresa.</p>
          </article>

          <article className="paso-card">
            <div className="paso-header">
              <span className="paso-num">04</span>
            </div>
            <h3>4. Monitorea y Recibe</h3>
            <p>Recibe tu N° de Guía para hacer seguimiento en vivo por la web. El destinatario retira con su DNI o recibe en su puerta.</p>
          </article>
        </div>
      </section>

      {/* REQUISITOS Y DOCUMENTACIÓN OBLIGATORIA */}
      <section id="requisitos" className="requisitos-section">
        <div className="requisitos-header">
          <h2>Requisitos Obligatorios según el Tipo de Envío</h2>
          <p>Cumple con las normativas vigentes del MTC, SUNAT y SENASA para evitar demoras administrativas.</p>
        </div>

        <div className="requisitos-grid">
          {/* Requisito 1 */}
          <div className="req-box">
            <div className="req-badge persona">Personas Naturales</div>
            <h3>Encomiendas Personales</h3>
            <ul>
              <li>Presentar DNI, Carnet de Extranjería o Pasaporte físico y vigente.</li>
              <li>Declaración jurada simple de contenido en ventanilla.</li>
              <li>Datos completos del destinatario (Nombre, DNI, Teléfono).</li>
              <li>Peso máximo por paquete individual: 50 kg.</li>
            </ul>
          </div>

          {/* Requisito 2 */}
          <div className="req-box">
            <div className="req-badge empresa">Empresas y Pymes</div>
            <h3>Carga Comercial / Corporativa</h3>
            <ul>
              <li>Ficha RUC activo y habido de la empresa remitente.</li>
              <li>Guía de Remisión Remitente (GRR) electrónica validada por SUNAT.</li>
              <li>Factura o Boleta de Venta que acredite el valor del producto.</li>
              <li>Rotulado claro con Razón Social y dirección exacta de entrega.</li>
            </ul>
          </div>

          {/* Requisito 3 */}
          <div className="req-box">
            <div className="req-badge agro">Productos de la Selva</div>
            <h3>Agrícola (Cacao, Café, Derivados)</h3>
            <ul>
              <li>Certificado Fitosanitario SENASA para traslado entre regiones.</li>
              <li>Empaque sellado de fábrica o grado alimenticio.</li>
              <li>Rotulado con lote, fecha de elaboración y registro sanitario si aplica.</li>
            </ul>
          </div>
        </div>
      </section>

      {/* ARTÍCULOS PROHIBIDOS */}
      <section id="prohibidos" className="prohibidos-box">
        <div className="prohibidos-content">
          <h3>Artículos Prohibidos y Restringidos</h3>
          <p>Por razones de seguridad aeronáutica y terrestre, está estrictamente prohibido el envío de:</p>
          <div className="prohibidos-tags">
            <span>Líquidos Inflamables</span>
            <span>Insumos Químicos Fiscalizados (IQBF)</span>
            <span>Fauna o Flora Silvestre No Autorizada</span>
            <span>Armamento o Pirotecnia</span>
            <span>Perecibles sin Refrigeración Garantizada</span>
          </div>
        </div>
      </section>

      {/* PREGUNTAS FRECUENTES */}
      <section className="faq-section">
        <h2 className="section-title">Preguntas Frecuentes</h2>
        <div className="faq-grid">
          <div className="faq-card">
            <h4>¿Cuánto tiempo se guarda una encomienda no recogida?</h4>
            <p>Permanecerá en el almacén de destino hasta por 15 días calendarios sin costo extra. Luego se aplican cargos por custodia.</p>
          </div>
          <div className="faq-card">
            <h4>¿Se puede solicitar recojo a domicilio en Tarapoto?</h4>
            <p>Sí, coordinando con 4 horas de anticipación a través del cotizador o vía WhatsApp corporativo.</p>
          </div>
        </div>
      </section>
    </main>
  )
}
