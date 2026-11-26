import crypto from 'node:crypto';

export class AppError extends Error {
  constructor(status, mensaje) {
    super(mensaje);
    this.status = status;
  }
}

export const falla = (status, mensaje) => { throw new AppError(status, mensaje); };
export const exigir = (condicion, mensaje, status = 400) => { if (!condicion) falla(status, mensaje); };

// Envuelve un controlador async para que sus errores lleguen al manejador final
export const h = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

export const texto = (v) => (typeof v === 'string' ? v.trim() : '');

export function idValido(v) {
  exigir(/^\d{1,9}$/.test(String(v)) && Number(v) > 0, 'Identificador inválido.');
  return Number(v);
}

// Fecha de hoy en Lima (AAAA-MM-DD)
export const hoyLima = () =>
  new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Lima', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());

// Mismos formatos de código que usa cada app
export const codigoAlerta = () => `ALR-${Date.now().toString().slice(-8)}${crypto.randomInt(100, 1000)}`; // Serenazgo (≤20)
export const codigoCita = () => `COD-${crypto.randomBytes(4).toString('hex').toUpperCase()}`; // Hospital (12)
export const codigoEnvio = () => `COD-${Date.now().toString().slice(-8)}${crypto.randomInt(10, 100)}`; // ExpressEnvíos (≤30)
