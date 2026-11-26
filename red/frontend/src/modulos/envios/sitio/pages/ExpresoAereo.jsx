import { Link } from '../router.jsx'
import estilos from '../styles/expresaereo.css?inline'
import useEstilosDePagina from '../hooks/useEstilosDePagina.js'

export default function ExpresoAereo() {
  useEstilosDePagina(estilos)
  return (
    <main>
      <div className="service-hero">
        <span className="badge">Envíos Ultra Rápidos</span>
        <h1>Servicio Expreso Aéreo (Tarapoto ⇄ Lima)</h1>
        <p>Entregas prioritarias garantizadas en menos de 24 horas. Ideal para documentos legales, muestras comerciales urgentes y productos livianos.</p>
      </div>

      {/* HORARIOS DE SALIDA */}
      <section className="info-block">
        <h2>Horarios de Recepción y Vuelos Diarios</h2>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th scope="col">Ruta</th>
                <th scope="col">Cierre de Recepción</th>
                <th scope="col">Hora de Vuelo</th>
                <th scope="col">Disponible en Destino</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Tarapoto ➔ Lima</td>
                <td>05:00 PM (Día previo)</td>
                <td>08:30 AM</td>
                <td>01:00 PM (Mismo día)</td>
              </tr>
              <tr>
                <td>Lima ➔ Tarapoto</td>
                <td>06:00 PM (Día previo)</td>
                <td>09:45 AM</td>
                <td>02:30 PM (Mismo día)</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* COMPRA / RESERVA RÁPIDA */}
      <section className="buy-section">
        <h2>Comprar / Reservar Espacio Aéreo</h2>
        <p>Selecciona tu tarifa preferida para procesar el pago o la reserva con prioridad:</p>

        <div className="pricing-grid">
          <div className="price-card">
            <h3>Sobre Documentario</h3>
            <div className="price">S/ 25.00</div>
            <p>Hasta 1 kg — Documentos, contratos o facturas.</p>
            <ul>
              <li>Entrega garantizada 24h</li>
              <li>Monitoreo GPS</li>
            </ul>
            <Link to="/cotizador?servicio=aereo_sobre" className="btn-buy">Comprar / Reservar</Link>
          </div>

          <div className="price-card featured">
            <span className="pop-tag">Más Vendido</span>
            <h3>Paquete Liviano</h3>
            <div className="price">S/ 45.00</div>
            <p>Hasta 5 kg — Muestras, repuestos, aparatos.</p>
            <ul>
              <li>Embalaje de seguridad</li>
              <li>Prioridad en bodega</li>
            </ul>
            <Link to="/cotizador?servicio=aereo_paquete" className="btn-buy">Comprar / Reservar</Link>
          </div>

          <div className="price-card">
            <h3>Carga Aérea Comercial</h3>
            <div className="price">S/ 8.50 <span>/ Kg extra</span></div>
            <p>De 6 kg a 50 kg — Envíos corporativos masivos.</p>
            <ul>
              <li>Guía de Remisión Electrónica</li>
              <li>Seguro opcional</li>
            </ul>
            <Link to="/cotizador?servicio=aereo_carga" className="btn-buy">Comprar / Reservar</Link>
          </div>
        </div>
      </section>
    </main>
  )
}
