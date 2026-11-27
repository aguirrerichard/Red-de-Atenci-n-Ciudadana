import { normalizarEstado } from '../utils/seguimiento.js'

const CLASE_BADGE = {
  'registrado': 'registrado', 'en tránsito': 'transito', 'en local': 'local',
  'entregado': 'entregado', 'cancelado': 'cancelado',
}

export default function BadgeEstado({ estado }) {
  const normal = normalizarEstado(estado)
  return (
    <span className={`seg-badge seg-badge--${CLASE_BADGE[normal] ?? 'registrado'}`}>
      {normal}
    </span>
  )
}
