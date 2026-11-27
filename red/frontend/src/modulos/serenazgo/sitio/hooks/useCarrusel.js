import { useEffect, useState } from "react";

// Devuelve el índice activo y avanza solo cada `ms`, salvo que la persona
// prefiera menos movimiento en su sistema.
export function useCarrusel(total, ms = 4500) {
  const [indice, setIndice] = useState(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => setIndice((i) => (i + 1) % total), ms);
    return () => clearInterval(t);
  }, [total, ms]);

  return [indice, setIndice];
}
