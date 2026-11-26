import { useEffect, useLayoutEffect } from "react";

// Inyecta el CSS de una página al montarla y lo retira al salir.
// Las hojas originales eran una por página HTML y se pisan entre sí
// (.modal-overlay, .btn-outline, etc.), así que no pueden convivir cargadas a la vez.
export function usePageStyles(css) {
  useLayoutEffect(() => {
    const el = document.createElement("style");
    el.setAttribute("data-page-styles", "");
    el.textContent = css;
    document.head.appendChild(el);
    return () => el.remove();
  }, [css]);
}

// Bloquea el scroll del body mientras un modal está abierto y cierra con Escape.
export function useModal(abierto, cerrar) {
  useEffect(() => {
    if (!abierto) return;
    document.body.style.overflow = "hidden";
    const onKey = (e) => e.key === "Escape" && cerrar();
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", onKey);
    };
  }, [abierto, cerrar]);
}
