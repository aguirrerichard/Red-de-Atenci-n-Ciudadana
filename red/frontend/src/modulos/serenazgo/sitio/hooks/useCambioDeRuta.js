import { useEffect } from "react";
import { useLocation } from '../router.jsx';

const TITULOS = {
  "/": "Serenazgo Alerta Huancayo",
  "/servicios": "Servicios",
  "/como-funciona": "Cómo funciona",
  "/contacto": "Ubicación y contacto",
  "/reportar": "Reportar un incidente",
  "/actualizar": "Mis registros y pagos",
  "/caja": "Módulo de caja",
  "/panel": "Panel de gestión",
};

// En cada cambio de URL: vuelve arriba y actualiza el título de la pestaña.
export function useCambioDeRuta() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
    const t = TITULOS[pathname];
    document.title = !t ? "Página no encontrada | Serenazgo Alerta" : pathname === "/" ? t : `${t} | Serenazgo Alerta`;
  }, [pathname]);
}
