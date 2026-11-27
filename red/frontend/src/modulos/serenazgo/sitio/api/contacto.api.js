import { http, SIN_CONEXION } from "./client.js";

// Envía el formulario de contacto. Devuelve { exito, mensaje } sin lanzar errores.
export async function enviarMensajeContacto(datos) {
  try {
    const { ok, datos: r } = await http("/contacto", { method: "POST", body: datos });
    return { exito: ok, mensaje: r?.mensaje ?? (ok ? "" : "No se pudo registrar el mensaje.") };
  } catch {
    return { exito: false, mensaje: SIN_CONEXION };
  }
}
