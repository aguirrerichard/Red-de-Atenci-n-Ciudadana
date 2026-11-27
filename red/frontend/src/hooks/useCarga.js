import { useCallback, useEffect, useRef, useState } from 'react';

// Carga datos al montar y permite recargar: const { datos, cargando, error, recargar } = useCarga(() => pedir(...), [token])
export function useCarga(funcion, deps = []) {
  const [estado, setEstado] = useState({ datos: null, cargando: true, error: '' });
  const fn = useRef(funcion);
  fn.current = funcion;
  const vivo = useRef(true);
  useEffect(() => { vivo.current = true; return () => { vivo.current = false; }; }, []);

  const recargar = useCallback(async () => {
    setEstado((e) => ({ ...e, cargando: true, error: '' }));
    try {
      const datos = await fn.current();
      if (vivo.current) setEstado({ datos, cargando: false, error: '' });
    } catch (e) {
      if (vivo.current) setEstado({ datos: null, cargando: false, error: e.message || 'No se pudo cargar.' });
    }
  }, []);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { recargar(); }, deps);
  return { ...estado, recargar };
}
