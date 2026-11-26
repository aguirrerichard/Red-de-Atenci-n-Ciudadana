import { Link } from '../router.jsx'

export default function Footer() {
  return (
    <footer>
      <div className="footer-container">
        <div className="footer-col">
          <h3>LogísticaExpress</h3>
          <p>Tu socio logístico de confianza en la región San Martín y todo el Perú.</p>
        </div>
        <div className="footer-col">
          <h4>Enlaces rápidos</h4>
          <ul>
            <li><Link to="/">Inicio</Link></li>
            <li><Link to="/servicios">Servicios</Link></li>
            <li><Link to="/requisitos">Requisitos</Link></li>
            <li><Link to="/contacto">Contacto</Link></li>
          </ul>
        </div>
        <div className="footer-col">
          <h4>Sede Principal</h4>
          <p>Jr. San Martín 450, Tarapoto</p>
          <p>Teléfono: (042) 55-0192</p>
        </div>
      </div>
      <div className="footer-bottom">
        <p>&copy; 2026 LogísticaExpress Envíos Perú. Todos los derechos reservados.</p>
      </div>
    </footer>
  )
}
