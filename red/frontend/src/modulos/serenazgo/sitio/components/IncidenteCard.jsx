// Tarjeta de un tipo de incidente. Se repite con .map() en la página de inicio.
// Props: incidente = { titulo, resumen, cardImg }, onVer = función que abre el detalle
export default function IncidenteCard({ incidente, onVer }) {
  return (
    <article className="incident-card" onClick={onVer}>
      <div className="incident-media">
        <img src={incidente.cardImg} alt="" loading="lazy" />
        <button type="button" className="btn-card-details" aria-label={`Ver detalles: ${incidente.titulo}`}>
          Ver detalles &rarr;
        </button>
      </div>
      <div className="incident-content">
        <h3>{incidente.titulo}</h3>
        <p>{incidente.resumen}</p>
      </div>
    </article>
  );
}
