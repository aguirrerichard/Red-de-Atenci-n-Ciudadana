import { useEffect, useRef } from 'react';

export default function Modal({ titulo, acento, onCerrar, children }) {
  const ref = useRef(null);
  useEffect(() => {
    const previo = document.activeElement;
    ref.current?.querySelector('input,select,textarea,button')?.focus();
    const tecla = (e) => e.key === 'Escape' && onCerrar();
    document.addEventListener('keydown', tecla);
    return () => { document.removeEventListener('keydown', tecla); previo?.focus?.(); };
  }, [onCerrar]);
  return (
    <div className="modal-fondo" onMouseDown={(e) => e.target === e.currentTarget && onCerrar()}>
      <div className="modal" role="dialog" aria-modal="true" aria-label={titulo} ref={ref} style={{ '--acento': acento }}>
        <header><h2>{titulo}</h2><button type="button" className="cerrar" aria-label="Cerrar" onClick={onCerrar}>×</button></header>
        {children}
      </div>
    </div>
  );
}
