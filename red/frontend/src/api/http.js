import { INTEGRACION, MODULOS } from '../config/modulos.js';

// Cada backend responde los errores con una clave distinta: los unificamos
function mensajeDe(datos, status) {
  if (datos && typeof datos === 'object') {
    if (datos.errores && typeof datos.errores === 'object') return Object.values(datos.errores).join(' ');
    return datos.mensaje || datos.error || datos.message || `Error ${status}`;
  }
  if (status >= 502 && status <= 504) return 'El servidor está despertando (Render gratuito). Intenta de nuevo en unos segundos.';
  return `Error ${status}`;
}

export class ErrorApi extends Error {
  constructor(status, mensaje) { super(mensaje); this.status = status; }
}

let alExpirar = () => {};
export const onSesionExpirada = (fn) => { alExpirar = fn; };

/**
 * Petición a un backend.
 *   pedir('luz', '/reclamos/mis', { token })
 *   pedir('integracion', '/hospital/citas', { token })
 * Reintenta solo cuando Render responde 502/503/504 (servidor dormido).
 */
export async function pedir(destino, ruta, { method = 'GET', body, token, reintentos = 2, timeoutMs = 60000 } = {}) {
  const base = destino === 'integracion' ? INTEGRACION : MODULOS[destino].base;
  for (let intento = 0; ; intento++) {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), timeoutMs);
    let r;
    try {
      r = await fetch(base + ruta, {
        method,
        signal: ctrl.signal,
        headers: {
          ...(body !== undefined && { 'Content-Type': 'application/json' }),
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: body !== undefined ? JSON.stringify(body) : undefined,
      });
    } catch {
      clearTimeout(t);
      if (intento < reintentos) continue;
      throw new ErrorApi(0, 'No se pudo conectar con el servidor. Revisa tu internet.');
    }
    clearTimeout(t);
    if ([502, 503, 504].includes(r.status) && intento < reintentos) {
      await new Promise((ok) => setTimeout(ok, 4000));
      continue;
    }
    if (r.status === 204) return null;
    const txt = await r.text();
    let datos = null;
    try { datos = txt ? JSON.parse(txt) : null; } catch { datos = txt; }
    if (!r.ok) {
      if (r.status === 401 && token) alExpirar(destino);
      throw new ErrorApi(r.status, mensajeDe(datos, r.status));
    }
    return datos;
  }
}

// Despierta un servidor de Render: cualquier respuesta HTTP (incluso 404) significa "despierto"
export async function despertar(destino) {
  const base = destino === 'integracion' ? INTEGRACION : MODULOS[destino].base;
  const fin = Date.now() + 90000;
  while (Date.now() < fin) {
    try {
      const r = await fetch(`${base}/salud`, { cache: 'no-store' });
      if (![502, 503, 504].includes(r.status)) return true;
    } catch { /* sigue intentando */ }
    await new Promise((ok) => setTimeout(ok, 4000));
  }
  return false;
}
