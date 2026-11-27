export default function Vacio({ children = 'Aún no hay registros.', cargando, error, onReintentar }) {
  if (cargando) return <div className="vacio" role="status"><span className="spinner" aria-hidden="true" /> Cargando…</div>;
  if (error) return <div className="vacio error" role="alert">{error}{onReintentar && <> <button type="button" className="btn-sec" onClick={onReintentar}>Reintentar</button></>}</div>;
  return <div className="vacio">{children}</div>;
}
