import { TONO, normal, etiqueta } from "../utils/panel";

// Etiqueta de color para un estado (incidencia, alerta o pago).
export default function EstadoBadge({ valor }) {
  return <span className={`pz-badge pz-${TONO[normal(valor)] ?? "gris"}`}>{etiqueta(valor)}</span>;
}
