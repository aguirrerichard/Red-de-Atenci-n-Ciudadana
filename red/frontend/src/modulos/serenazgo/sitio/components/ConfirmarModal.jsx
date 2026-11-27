import { useModal } from "../hooks/usePageStyles";

// Confirmación propia de la app (reemplaza al cuadro nativo del navegador).
export default function ConfirmarModal({ abierto, titulo, texto, textoBoton = "Confirmar", peligro = false, ocupado = false, onConfirmar, onCancelar }) {
  useModal(abierto, onCancelar); // Escape cierra y se bloquea el scroll de fondo
  if (!abierto) return null;
  return (
    <div className="pz-overlay" onClick={(e) => e.target === e.currentTarget && onCancelar()}>
      <div className="pz-modal pz-confirmar" role="alertdialog" aria-modal="true" aria-labelledby="pz-conf-titulo">
        <h2 id="pz-conf-titulo">{titulo}</h2>
        <p>{texto}</p>
        <div className="pz-modal-botones">
          <button type="button" className="btn btn-outline" onClick={onCancelar} disabled={ocupado}>Cancelar</button>
          <button type="button" className={`btn ${peligro ? "pz-btn-peligro" : ""}`} onClick={onConfirmar} disabled={ocupado}>
            {ocupado ? "Procesando…" : textoBoton}
          </button>
        </div>
      </div>
    </div>
  );
}
