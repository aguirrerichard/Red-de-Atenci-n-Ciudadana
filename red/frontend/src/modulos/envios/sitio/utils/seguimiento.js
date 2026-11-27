export const ETAPAS = [
  { estado: 'registrado',  etiqueta: 'Recepción',   detalle: 'Recibimos tu solicitud de envío.',          desdeSeg: 0 },
  { estado: 'en tránsito', etiqueta: 'En tránsito', detalle: 'Tu paquete va en camino a su destino.',     desdeSeg: 120 },
  { estado: 'en local',    etiqueta: 'En local',    detalle: 'Tu paquete llegó a la agencia de destino.', desdeSeg: 180 },
  { estado: 'entregado',   etiqueta: 'Entregado',   detalle: '¡Tu paquete fue entregado!',                desdeSeg: 240 },
]

const EQUIVALENCIAS = { 'en proceso': 'en tránsito', 'finalizado': 'entregado' }
export const normalizarEstado = (estado) => EQUIVALENCIAS[estado] ?? estado

export function indiceEtapa(estado) {
  const i = ETAPAS.findIndex((e) => e.estado === normalizarEstado(estado))
  return i === -1 ? 0 : i
}
