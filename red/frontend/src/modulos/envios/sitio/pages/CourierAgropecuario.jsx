import { Link } from '../router.jsx'
import estilos from '../styles/Courieragropecuario.css?inline'
import useEstilosDePagina from '../hooks/useEstilosDePagina.js'

export default function CourierAgropecuario() {
  useEstilosDePagina(estilos)

  return (
    <main>
      <div className="service-hero">
        <span className="badge agro">Especializado para la Selva</span>
        <h1>Courier Especializado Agropecuario</h1>
        <p>Envíos garantizados de muestras de Café, Cacao en grano, Aceites Esenciales y productos autóctonos con manejo de humedad y certificación SENASA.</p>
      </div>

      {/* REQUISITOS Y EMPAQUE */}
      <section className="info-block">
        <h2>Tipos de Carga Aceptada y Especificaciones</h2>
        <div className="agro-grid">
          <div className="agro-item">
            <h3>Café y Cacao en Grano</h3>
            <p>Empaque en sacos GrainPro o doble sellado hermético contra humedad externa durante el viaje.</p>
          </div>
          <div className="agro-item">
            <h3>Muestras de Laboratorio</h3>
            <p>Frascos sellados térmicamente para control de calidad de lotes de exportación a Lima.</p>
          </div>
          <div className="agro-item">
            <h3>Soporte Guía SENASA</h3>
            <p>Ayudamos en la validación y adjunto del certificado fitosanitario de origen en ventanilla.</p>
          </div>
        </div>
      </section>

      {/* SELECCIÓN Y SOLICITUD */}
      <section className="buy-section">
        <h2>Solicitar Transporte Agropecuario</h2>
        <div className="agro-plans">
          <div className="plan-card">
            <h3>Muestras Pequeñas</h3>
            <div className="price">S/ 30.00</div>
            <p>Hasta 3 Kg en caja hermética acolchada.</p>
            <Link to="/cotizador?servicio=agro_muestra" className="btn-agro">Solicitar Envío</Link>
          </div>

          <div className="plan-card featured">
            <h3>Lote Productor (Saco 50 Kg)</h3>
            <div className="price">S/ 65.00</div>
            <p>Transporte Terrestre Prioritario en camión seco con control de temperatura ambiente.</p>
            <Link to="/cotizador?servicio=agro_saco" className="btn-agro">Solicitar Envío</Link>
          </div>
        </div>
      </section>
    </main>
  )
}
