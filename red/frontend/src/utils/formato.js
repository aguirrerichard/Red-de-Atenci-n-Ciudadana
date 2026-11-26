// Listas y ayudantes compartidos por todos los módulos
export const ESPECIALIDADES = [
  ['medicina-general', 'Medicina general'], ['pediatria', 'Pediatría'], ['ginecologia', 'Ginecología'],
  ['cardiologia', 'Cardiología'], ['traumatologia', 'Traumatología'], ['cirugia-general', 'Cirugía general'],
  ['medicina-interna', 'Medicina interna'], ['odontologia', 'Odontología'], ['oftalmologia', 'Oftalmología'],
  ['psicologia', 'Psicología'],
];

export const CIUDADES = [
  'tarapoto', 'moyobamba', 'yurimaguas', 'lima', 'chiclayo', 'trujillo', 'piura', 'arequipa', 'cuzco', 'iquitos',
  'pucallpa', 'huancayo', 'ayacucho', 'cajamarca', 'ica', 'puno', 'tacna', 'tumbes', 'moquegua',
];

export const MOTIVOS_LUZ = ['Nuevo Suministro', 'Cambio de Titular', 'Reclamo por Monto Excesivo', 'Otros'];

export const mayuscula = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : '');
export const sinTildes = (s) => String(s ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '');

// "Ginecología" → "ginecologia"; lo que no esté en la lista (p. ej. "Emergencia") pasa a medicina-general
export function aSlug(texto) {
  const s = sinTildes(texto).toLowerCase().trim().replace(/\s+/g, '-');
  return ESPECIALIDADES.some(([v]) => v === s) ? s : 'medicina-general';
}
export const etiquetaEspecialidad = (v) => ESPECIALIDADES.find(([k]) => k === aSlug(v))?.[1] ?? v ?? '—';

export const soloFecha = (v) => (v ? String(v).slice(0, 10) : '');
export const hoy = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Lima' }).format(new Date());
export const verFecha = (v) => {
  if (!v) return '—';
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? String(v) : d.toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'America/Lima' });
};
export const soles = (n) => `S/ ${Number(n ?? 0).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
export const nombreEstado = (e) => String(e ?? '—').replace(/_/g, ' ');

// Mismo tarifario que ExpressEnvíos / API de integración
export function montoEnvio({ peso_kg, largo_cm, ancho_cm, alto_cm }) {
  const vol = (Number(largo_cm) * Number(ancho_cm) * Number(alto_cm)) / 5000 || 0;
  return Math.round((12 + 4 * Math.max(Number(peso_kg) || 0, vol)) * 100) / 100;
}
// Contraste de medidor de LuzCentro
export const montoContraste = (tipo, km) => Math.round(((tipo === 'trifasico' ? 75 : 35) + 2.5 * Math.max(0, Number(km) || 0)) * 100) / 100;
