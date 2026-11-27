// Envoltorio de un campo de formulario: etiqueta, ayuda y mensaje de error.
// Props: id, etiqueta, obligatorio, ayuda, error, children (el input)
export default function Campo({ id, etiqueta, obligatorio = false, ayuda, error, children }) {
  return (
    <div className="field-group">
      <label htmlFor={id}>
        {etiqueta}
        {obligatorio ? <span className="required-star"> *</span> : <span className="optional-tag"> (opcional)</span>}
      </label>
      {children}
      {error
        ? <span id={`${id}-error`} className="field-error" role="alert">{error}</span>
        : ayuda && <span className="field-hint">{ayuda}</span>}
    </div>
  );
}
