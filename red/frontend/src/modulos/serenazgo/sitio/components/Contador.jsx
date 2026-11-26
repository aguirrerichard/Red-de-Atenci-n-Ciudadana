import { useEffect, useRef, useState } from "react";

// Cuenta de 0 a `target` cuando el número entra en pantalla.
// Props: target, prefix, suffix
export default function Contador({ target, prefix = "", suffix = "" }) {
  const ref = useRef(null);
  const [valor, setValor] = useState(0);

  useEffect(() => {
    let timer;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      observer.disconnect();
      const pasos = 60;
      let paso = 0;
      timer = setInterval(() => {
        paso++;
        setValor(Math.min(target, Math.floor((target * paso) / pasos)));
        if (paso >= pasos) clearInterval(timer);
      }, 2000 / pasos);
    }, { threshold: 0.4 });
    observer.observe(ref.current);
    return () => { observer.disconnect(); clearInterval(timer); };
  }, [target]);

  return <dt ref={ref} className="stat-number">{prefix}{valor}{suffix}</dt>;
}
