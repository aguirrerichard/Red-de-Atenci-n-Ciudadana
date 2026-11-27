import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { notificar, suscribir } from '../utils/dialogos.js';

// Un solo sistema de avisos y confirmaciones para TODA la red (app unificada + sitios originales).
// useToast() sigue devolviendo la función avisar(texto, tipo) para no tocar el código existente.
const ToastContext = createContext(notificar);

const ICONOS = {
  ok: <path d="M5 12.5l4.2 4.2L19 7" />,
  error: <path d="M6 6l12 12M18 6L6 18" />,
  aviso: <path d="M12 7v6m0 3.5v.01" />,
  info: <path d="M12 11v6m0-9.5v.01" />,
};
const Icono = ({ tipo }) => (
  <span className="ico" aria-hidden="true">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">{ICONOS[tipo] ?? ICONOS.info}</svg>
  </span>
);

function Confirmacion({ d, onResponder }) {
  const [saliendo, setSaliendo] = useState(false);
  const refSi = useRef(null);
  const refNo = useRef(null);
  const responder = useCallback((valor) => {
    setSaliendo(true);
    onResponder(valor);
  }, [onResponder]);

  useEffect(() => {
    const previo = document.activeElement;
    (d.peligro ? refNo : refSi).current?.focus();
    const tecla = (e) => {
      if (e.key === 'Escape') responder(false);
      if (e.key === 'Tab') { // atrapa el foco dentro del diálogo
        const a = [refNo.current, refSi.current].filter(Boolean);
        const i = a.indexOf(document.activeElement);
        e.preventDefault();
        a[(i + (e.shiftKey ? a.length - 1 : 1)) % a.length].focus();
      }
    };
    document.addEventListener('keydown', tecla);
    return () => { document.removeEventListener('keydown', tecla); previo?.focus?.(); };
  }, [d.peligro, responder]);

  return (
    <div className={`dlg-fondo ${saliendo ? 'saliendo' : ''}`} onMouseDown={(e) => e.target === e.currentTarget && responder(false)}>
      <div className={`dlg ${d.peligro ? 'peligro' : ''}`} role="alertdialog" aria-modal="true" aria-labelledby="dlg-t" aria-describedby="dlg-m">
        <span className="ico grande" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            {d.peligro ? <><path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 002 2h6a2 2 0 002-2l1-12M9 7V4h6v3" /></> : <><path d="M9.5 9a2.5 2.5 0 114 2c-.9.6-1.5 1.1-1.5 2.2" /><path d="M12 17v.01" /></>}
          </svg>
        </span>
        <h2 id="dlg-t">{d.titulo}</h2>
        {d.mensaje && <p id="dlg-m">{d.mensaje}</p>}
        <div className="acciones">
          <button type="button" className="dlg-no" ref={refNo} onClick={() => responder(false)}>{d.textoNo}</button>
          <button type="button" className="dlg-si" ref={refSi} onClick={() => responder(true)}>{d.textoSi}</button>
        </div>
      </div>
    </div>
  );
}

export function ToastProvider({ children }) {
  const [items, setItems] = useState([]);
  const [cola, setCola] = useState([]); // confirmaciones pendientes (se muestran de a una)

  const quitar = useCallback((id) => {
    setItems((l) => l.map((t) => (t.id === id ? { ...t, saliendo: true } : t)));
    setTimeout(() => setItems((l) => l.filter((t) => t.id !== id)), 280);
  }, []);

  useEffect(() => suscribir((d) => {
    if (d.clase === 'aviso') {
      setItems((l) => [...l.slice(-3), d]); // máximo 4 a la vez
      setTimeout(() => quitar(d.id), d.ms);
    } else if (d.clase === 'confirmar') {
      setCola((c) => [...c, d]);
    }
  }), [quitar]);

  const actual = cola[0];
  const refActual = useRef(null);
  refActual.current = actual;
  const responder = useCallback((valor) => {
    refActual.current?.resolve(valor);
    setTimeout(() => setCola((c) => c.slice(1)), 160);
  }, []);

  return (
    <ToastContext.Provider value={notificar}>
      {children}
      <div className="ra toasts-raiz">
        <div className="toasts" role="status" aria-live="polite">
          {items.map((t) => (
            <div key={t.id} className={`toast toast-${t.tipo} ${t.saliendo ? 'saliendo' : ''}`} style={{ '--dur': `${t.ms}ms` }}>
              <Icono tipo={t.tipo} />
              <span className="txt">{t.texto}</span>
              <button type="button" aria-label="Cerrar aviso" onClick={() => quitar(t.id)}>×</button>
            </div>
          ))}
        </div>
        {actual && <Confirmacion key={actual.id} d={actual} onResponder={responder} />}
      </div>
    </ToastContext.Provider>
  );
}
export const useToast = () => useContext(ToastContext);
