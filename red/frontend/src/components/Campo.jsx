import { useId } from 'react';

// Todo campo lleva <label>. precargado = dato que ya se sabe (verde punteado, UX-2)
export default function Campo({ etiqueta, ayuda, error, precargado, as = 'input', children, className = '', ...props }) {
  const id = useId();
  const Control = as;
  return (
    <div className={`campo ${precargado ? 'precargado' : ''} ${className}`}>
      <label htmlFor={id}>{etiqueta}{precargado && <small className="chip-pre">precargado</small>}</label>
      <Control id={id} readOnly={precargado || props.readOnly} aria-invalid={error ? 'true' : undefined} aria-describedby={`${id}-a`} {...props}>{children}</Control>
      {(error || ayuda) && <p id={`${id}-a`} className={error ? 'error-campo' : 'ayuda'}>{error || ayuda}</p>}
    </div>
  );
}

export function Casilla({ etiqueta, ...props }) {
  const id = useId();
  return (
    <div className="casilla">
      <input id={id} type="checkbox" {...props} />
      <label htmlFor={id}>{etiqueta}</label>
    </div>
  );
}
