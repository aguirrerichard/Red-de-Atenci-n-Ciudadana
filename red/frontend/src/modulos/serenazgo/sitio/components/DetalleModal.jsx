import { useModal } from "../hooks/usePageStyles";

// Ventana con el detalle de un incidente. Se cierra con Escape, con la X o al hacer clic fuera.
// Props: incidente (null = cerrado), onCerrar, onAccion (botón principal)
export default function DetalleModal({ incidente, onCerrar, onAccion }) {
  useModal(!!incidente, onCerrar);

  return (
    <div
      className={`modal-overlay ${incidente ? "active" : ""}`}
      aria-hidden={!incidente}
      onClick={(e) => e.target === e.currentTarget && onCerrar()}
    >
      {incidente && (
        <div className="modal-card" role="dialog" aria-modal="true" aria-label={incidente.modalTitulo}>
          <div className="modal-header-img">
            <img src={incidente.image} alt="" />
            <button type="button" className="modal-close-btn" aria-label="Cerrar" onClick={onCerrar}>&times;</button>
          </div>
          <div className="modal-body">
            <span className="modal-badge">{incidente.badge}</span>
            <h2 className="modal-title">{incidente.modalTitulo}</h2>
            <p className="modal-description">{incidente.descripcion}</p>
            <div className="modal-section-details">
              <h4 className="modal-subtitle">Características clave del servicio:</h4>
              <ul className="modal-list">
                {incidente.detalles.map((d) => <li key={d}>{d}</li>)}
              </ul>
            </div>
            <hr className="modal-divider" />
            <div className="modal-footer-action">
              <button type="button" className="btn-modal-primary" onClick={() => onAccion(incidente.link)}>
                {incidente.btnText}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
