// Fragmentos SQL compartidos. Todas las tablas van con "public." porque la DATABASE_URL
// de algún backend puede traer un search_path propio (luz, hospital, serenazgo, envios).

// ExpressEnvíos avanza el estado de sus envíos con el tiempo (simulación de seguimiento).
// Aquí se calcula el MISMO estado al leer, sin modificar la tabla.
export const estadoEnvio = (a) => `
  CASE
    WHEN ${a}.estado IN ('cancelado', 'entregado') THEN ${a}.estado
    WHEN ${a}.estado = 'finalizado' THEN 'entregado'
    WHEN EXTRACT(EPOCH FROM (NOW() - ${a}.fecha_registro)) >= 240 THEN 'entregado'
    WHEN EXTRACT(EPOCH FROM (NOW() - ${a}.fecha_registro)) >= 180 THEN 'en local'
    WHEN EXTRACT(EPOCH FROM (NOW() - ${a}.fecha_registro)) >= 120 THEN 'en tránsito'
    WHEN ${a}.estado = 'en proceso' THEN 'en tránsito'
    ELSE ${a}.estado
  END`;

// Última cita creada a partir de una alerta
export const citaDeAlerta = (a) => `
  LEFT JOIN LATERAL (
    SELECT id, codigo_seguimiento, estado, especialidad, fecha_preferida
      FROM public.citas_medicas WHERE id_alerta = ${a}.id
     ORDER BY id DESC LIMIT 1
  ) c ON true`;

// Último envío (no cancelado primero) generado desde una cita
export const envioDeCita = (c) => `
  LEFT JOIN LATERAL (
    SELECT ce.id, ce.codigo_seguimiento, ce.destino, ${estadoEnvio('ce')} AS estado
      FROM public.cotizaciones_envio ce WHERE ce.id_cita = ${c}.id
     ORDER BY (ce.estado = 'cancelado'), ce.id DESC LIMIT 1
  ) e ON true`;

export const CIUDADES = [
  'tarapoto', 'moyobamba', 'yurimaguas', 'lima', 'chiclayo', 'trujillo', 'piura', 'arequipa', 'cuzco', 'iquitos',
  'pucallpa', 'huancayo', 'ayacucho', 'cajamarca', 'ica', 'puno', 'tacna', 'tumbes', 'moquegua',
];

export const ESPECIALIDADES = [
  'medicina-general', 'pediatria', 'ginecologia', 'cardiologia', 'traumatologia', 'cirugia-general',
  'medicina-interna', 'odontologia', 'oftalmologia', 'psicologia',
];

// Tarifario de ExpressEnvíos (copiado de su backend para cobrar exactamente igual)
export function montoEnvio({ peso_kg, largo_cm, ancho_cm, alto_cm }) {
  const volumetrico = (Number(largo_cm) * Number(ancho_cm) * Number(alto_cm)) / 5000 || 0;
  const facturable = Math.max(Number(peso_kg) || 0, volumetrico);
  return Math.round((12 + 4 * facturable) * 100) / 100;
}
