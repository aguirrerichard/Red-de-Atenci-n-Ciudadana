import { Link } from '../router.jsx';

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div>
          <h2>Serenazgo Alerta Huancayo</h2>
          <p>Subgerencia de Serenazgo de la Municipalidad Provincial de Huancayo. Patrullaje y atención de reportes ciudadanos las 24 horas.</p>
        </div>
        <nav aria-label="Enlaces del pie de página">
          <h2>Secciones</h2>
          <ul>
            <li><Link to="/servicios">Servicios</Link></li>
            <li><Link to="/como-funciona">Cómo funciona</Link></li>
            <li><Link to="/reportar">Reportar un incidente</Link></li>
            <li><Link to="/contacto">Ubicación y contacto</Link></li>
          </ul>
        </nav>
        <div>
          <h2>En caso de emergencia</h2>
          <ul>
            <li><a href="tel:0641234567">Central: (064) 123-4567</a></li>
            <li><a href="tel:105">Policía Nacional: 105</a></li>
          </ul>
        </div>
        <p className="footer-note">© {new Date().getFullYear()} Municipalidad Provincial de Huancayo. Todos los derechos reservados.</p>
      </div>
    </footer>
  );
}
