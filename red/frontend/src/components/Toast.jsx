import { createContext, useCallback, useContext, useMemo, useState } from 'react';

const ToastContext = createContext(() => {});

// UX-3: mensaje de éxito con el código de seguimiento (p. ej. "Alerta registrada · ALE-00015")
export function ToastProvider({ children }) {
  const [items, setItems] = useState([]);
  const quitar = (id) => setItems((l) => l.filter((t) => t.id !== id));
  const avisar = useCallback((texto, tipo = 'ok') => {
    const id = Date.now() + Math.random();
    setItems((l) => [...l, { id, texto, tipo }]);
    setTimeout(() => quitar(id), tipo === 'error' ? 7000 : 5000);
  }, []);
  const valor = useMemo(() => avisar, [avisar]);
  return (
    <ToastContext.Provider value={valor}>
      {children}
      <div className="ra toasts-raiz"><div className="toasts" role="status" aria-live="polite">
        {items.map((t) => (
          <div key={t.id} className={`toast toast-${t.tipo}`}>
            <span>{t.texto}</span>
            <button type="button" aria-label="Cerrar aviso" onClick={() => quitar(t.id)}>×</button>
          </div>
        ))}
      </div></div>
    </ToastContext.Provider>
  );
}
export const useToast = () => useContext(ToastContext);
