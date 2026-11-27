import { Link } from '../router.jsx';

// Marcador para las secciones que todavía no se han migrado a React.
export default function PendientePage({ titulo = "Sección en migración" }) {
  return (
    <section className="container" style={{ padding: "4rem 1.5rem", textAlign: "center" }}>
      <h1>{titulo}</h1>
      <p style={{ margin: "1rem 0 2rem" }}>Esta página aún no está disponible en la nueva versión.</p>
      <Link to="/" className="btn btn-outline">Volver al inicio</Link>
    </section>
  );
}
