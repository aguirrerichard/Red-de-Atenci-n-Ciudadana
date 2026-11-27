// Avisos (toasts) y confirmaciones propias de la red. Funcionan desde CUALQUIER sitio
// (Hospital, Envíos, etc.) sin necesidad de providers: solo se importa y se llama.
//
//   import { notificar, confirmar } from '.../utils/dialogos.js';
//   notificar('Cita guardada', 'ok');                 // 'ok' | 'error' | 'aviso' | 'info'
//   if (await confirmar({ titulo: 'Eliminar cita', mensaje: '¿Seguro?', textoSi: 'Eliminar', peligro: true })) { ... }
//
// El componente <ToastProvider> (components/Toast.jsx) es quien los dibuja.

const EVENTO = 'ra:dialogo';
let secuencia = 0;

const TIPOS = { ok: 'ok', exito: 'ok', error: 'error', aviso: 'aviso', advertencia: 'aviso', info: 'info' };
const emitir = (detalle) => window.dispatchEvent(new CustomEvent(EVENTO, { detail: detalle }));

export function notificar(texto, tipo = 'ok', ms) {
  if (!texto) return;
  const t = TIPOS[tipo] ?? 'info';
  emitir({ clase: 'aviso', id: ++secuencia, texto: String(texto), tipo: t, ms: ms ?? (t === 'error' ? 7000 : 5000) });
}

export function confirmar(opciones) {
  const o = typeof opciones === 'string' ? { mensaje: opciones } : (opciones ?? {});
  return new Promise((resolve) => {
    emitir({
      clase: 'confirmar', id: ++secuencia, resolve,
      titulo: o.titulo ?? 'Confirmar acción', mensaje: o.mensaje ?? '',
      textoSi: o.textoSi ?? 'Confirmar', textoNo: o.textoNo ?? 'Cancelar', peligro: !!o.peligro,
    });
  });
}

export const suscribir = (fn) => {
  const h = (e) => fn(e.detail);
  window.addEventListener(EVENTO, h);
  return () => window.removeEventListener(EVENTO, h);
};
