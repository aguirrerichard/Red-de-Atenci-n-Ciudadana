// Utilidades compartidas por Panel, Caja y Mis Registros.
export const normal = (e) => String(e ?? "").toLowerCase();
export const etiqueta = (e) => normal(e).replace(/_/g, " ");
export const fecha = (v) => (v ? new Date(v).toLocaleString("es-PE", { dateStyle: "short", timeStyle: "short" }) : "—");

// Color de cada estado (misma convención del resto del grupo: registrado gris, en proceso/derivado ámbar, atendido verde, rechazado rojo).
export const TONO = {
  pendiente: "gris", registrado: "gris", exonerado: "gris", aprobado: "verde",
  en_proceso: "ambar", derivado: "ambar",
  atendido: "verde", pagado: "verde",
  rechazado: "rojo",
};
