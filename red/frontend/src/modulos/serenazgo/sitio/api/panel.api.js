// Llamadas del Panel de gestión (empleado y administrador). Siempre devuelven { exito, ... } sin lanzar errores.
import { http, SIN_CONEXION } from "./client.js";

async function pedir(ruta, opciones) {
  try {
    const { ok, status, datos } = await http(ruta, opciones);
    if (ok) return { exito: true, status, datos };
    return { exito: false, status, mensaje: datos?.mensaje ?? "No se pudo completar la operación." };
  } catch {
    return { exito: false, mensaje: SIN_CONEXION };
  }
}

export const listarIncidencias = () => pedir("/incidencias");
export const listarAlertas = () => pedir("/alertas");
export const listarMensajes = () => pedir("/contacto");

// "respuesta" solo se envía si tiene texto: vacía borraría la respuesta anterior en el servidor.
export const cambiarEstadoIncidencia = (codigo, estado, respuesta) =>
  pedir(`/incidencias/${encodeURIComponent(codigo)}/estado`, {
    method: "PATCH",
    body: { estado, ...(respuesta ? { respuesta } : {}) },
  });

export const eliminarIncidencia = (codigo) =>
  pedir(`/incidencias/${encodeURIComponent(codigo)}`, { method: "DELETE" });

export const cambiarEstadoAlerta = (codigo, estado) =>
  pedir(`/alertas/${encodeURIComponent(codigo)}/estado`, { method: "PATCH", body: { estado } });

// ---------- Caja (cajero / administrador) ----------
export const pendientesCaja = () => pedir("/caja/pendientes");
export const cobrarEnCaja = (body) => pedir("/caja/cobrar", { method: "POST", body });
export const listarPagos = () => pedir("/pagos"); // cliente: los suyos · cajero y administrador: todos
export const verificarPago = (id) => pedir(`/pagos/${encodeURIComponent(id)}/verificar`, { method: "PATCH" });

// ---------- Pago en línea (cliente) ----------
// Si la entidad rechaza, el servidor responde 402 con el motivo en "mensaje": llega como { exito: false, mensaje }.
export const pagarConTarjeta = (body) => pedir("/pagos/tarjeta", { method: "POST", body });
export const pagarConBilletera = (body) => pedir("/pagos/billetera", { method: "POST", body });

// ---------- Derivación Serenazgo -> Hospital ----------
export const derivarAlerta = (codigo) => pedir(`/alertas/${encodeURIComponent(codigo)}/derivar`, { method: "POST" });
export const misAlertas = () => pedir("/alertas/mias");
