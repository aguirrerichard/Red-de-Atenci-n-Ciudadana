import { Link } from '../router.jsx'
import estilos from '../styles/encomiendaterrestre.css?inline'
import useEstilosDePagina from '../hooks/useEstilosDePagina.js'

export default function EncomiendaTerrestre() {
  useEstilosDePagina(estilos)

  return (
    <main>
      <div className="service-hero">
        <span className="badge econo">Transporte Terrestre Económico</span>
        <h1>Encomienda Terrestre Interprovincial</h1>
        <p>Servicio diario de carga general, cajas y fardos conectando Tarapoto con Moyobamba, Yurimaguas, Chiclayo, Trujillo y Lima.</p>
      </div>

      {/* HORARIOS DE SALIDA */}
      <section className="info-block">
        <h2>Salidas Diarias y Tiempos Estimados</h2>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th scope="col">Destino desde Tarapoto</th>
                <th scope="col">Horario de Salida</th>
                <th scope="col">Frecuencia</th>
                <th scope="col">Tiempo de Llegada</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Moyobamba / Rioja</td>
                <td>08:00 AM y 02:00 PM</td>
                <td>Lunes a Domingo</td>
                <td>3 a 4 Horas</td>
              </tr>
              <tr>
                <td>Yurimaguas</td>
                <td>10:00 AM</td>
                <td>Lunes a Sábado</td>
                <td>5 Horas</td>
              </tr>
              <tr>
                <td>Chiclayo / Trujillo</td>
                <td>05:00 PM</td>
                <td>Diario</td>
                <td>18 a 24 Horas</td>
              </tr>
              <tr>
                <td>Lima Metropolitana</td>
                <td>06:30 PM</td>
                <td>Diario</td>
                <td>28 a 32 Horas</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* COMPRA DE ESPACIO */}
      <section className="buy-section">
        <h2>Elige el Tamaño de tu Carga</h2>
        <div className="routes-grid">
          <div className="route-card">
            <h3>Caja Estándar (hasta 10 kg)</h3>
            <p className="price-tag">Desde S/ 15.00</p>
            <p>Ideal para ropa, repuestos peq. y encomiendas familiares.</p>
            <Link to="/cotizador?servicio=terrestre_caja" className="btn-select">Reservar Espacio</Link>
          </div>

          <div className="route-card">
            <h3>Fardo / Bulto Mediano (20-40 kg)</h3>
            <p className="price-tag">Desde S/ 35.00</p>
            <p>Ideal para mercadería comercial o mudanzas ligeras.</p>
            <Link to="/cotizador?servicio=terrestre_fardo" className="btn-select">Reservar Espacio</Link>
          </div>

          <div className="route-card">
            <h3>Carga Completa / Tarima</h3>
            <p className="price-tag">Tarifa por Volumen (m³)</p>
            <p>Transporte corporativo masivo con boleta/factura.</p>
            <Link to="/cotizador?servicio=terrestre_masivo" className="btn-select">Cotizar Carga</Link>
          </div>
        </div>
      </section>
    </main>
  )
}
