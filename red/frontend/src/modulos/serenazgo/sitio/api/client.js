// Cliente HTTP único del frontend: todas las llamadas a la API pasan por aquí.
// En desarrollo, Vite redirige /api a localhost:3000 (vite.config.js).
// En producción (Vercel) se define VITE_API_URL con la URL del backend en Render.
const BASE = "/api/serenazgo"; // proxy de la app unificada (vercel.json / vite.config.js)

export const SIN_CONEXION = "No se pudo conectar con el servidor. Intenta de nuevo.";

export async function http(ruta, { method = "GET", body } = {}) {
  const token = sessionStorage.getItem("token");
  const res = await fetch(BASE + ruta, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  let datos = null;
  try { datos = await res.json(); } catch { /* respuesta sin cuerpo */ }
  return { ok: res.ok, status: res.status, datos };
}
