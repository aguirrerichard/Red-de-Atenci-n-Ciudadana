import estilos from '../styles/contacto.css?inline'
import useEstilosDePagina from '../hooks/useEstilosDePagina.js'

export default function Contacto() {
  useEstilosDePagina(estilos)

  return (
    <main>
      <section className="page-header">
        <h1>Nuestras Agencias y Puntos de Recojo</h1>
        <p className="subtitulo">Encuentra la sucursal más cercana para enviar o recoger tus paquetes.</p>
      </section>

      {/* PUNTOS DE RECOJO CON ANIMACIÓN ESCALONADA */}
      <section className="puntos-recojo-grid">
        <div className="punto-card" style={{ '--i': 1 }}>
          <h3>Agencia Tarapoto Central</h3>
          <p>Jr. San Martín 450</p>
        </div>
        <div className="punto-card" style={{ '--i': 2 }}>
          <h3>Agencia Morales</h3>
          <p>Av. Perú 120</p>
        </div>
        <div className="punto-card" style={{ '--i': 3 }}>
          <h3>Agencia Banda de Shilcayo</h3>
          <p>Jr. Recreo 230</p>
        </div>
      </section>
    </main>
  )
}
