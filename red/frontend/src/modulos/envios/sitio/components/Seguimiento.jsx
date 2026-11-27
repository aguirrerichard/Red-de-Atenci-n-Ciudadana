import { useEffect, useState } from 'react'
import CarroSVG from './CarroSVG.jsx'
import { ETAPAS, indiceEtapa, normalizarEstado } from '../utils/seguimiento.js'

const formatearCuenta = (segundos) => {
  const total = Math.max(0, Math.ceil(segundos))
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`
}

export default function Seguimiento({ estado, registradoEn = null, compacto = false }) {
  const normal = normalizarEstado(estado)
  const cancelado = normal === 'cancelado'
  const idx = indiceEtapa(normal)
  const llego = !cancelado && idx === ETAPAS.length - 1
  const destino = cancelado ? 0 : idx / (ETAPAS.length - 1)

  // El carro entra desde la izquierda y luego avanza a su etapa
  const [avance, setAvance] = useState(-0.2)
  useEffect(() => {
    let vigente = true
    requestAnimationFrame(() =>
      requestAnimationFrame(() => { if (vigente) setAvance(destino) })
    )
    return () => { vigente = false }
  }, [destino])

  // Cuenta regresiva: un re-render por segundo mientras haya una etapa siguiente
  const [, setTick] = useState(0)
  useEffect(() => {
    if (compacto || cancelado || llego) return
    const id = setInterval(() => setTick((t) => t + 1), 1000)
    return () => clearInterval(id)
  }, [compacto, cancelado, llego])

  let mensaje = cancelado
    ? 'Este envío fue cancelado.'
    : `${ETAPAS[idx].etiqueta}: ${ETAPAS[idx].detalle}`
  if (!cancelado && idx < ETAPAS.length - 1 && registradoEn != null) {
    const falta = ETAPAS[idx + 1].desdeSeg - (Date.now() - registradoEn) / 1000
    mensaje += falta > 0 ? ` · Siguiente etapa en ${formatearCuenta(falta)}` : ' · Actualizando…'
  }

  const clases = ['seg', compacto && 'seg--compacto', llego && 'seg--final', cancelado && 'seg--cancelado']
    .filter(Boolean).join(' ')

  return (
    <div className={clases} style={{ '--avance': avance }}
         data-estado={cancelado ? 'cancelado' : normal} data-etapa={idx}>
      <div className="seg-pista" aria-hidden="true">
        <div className="seg-linea" />
        <div className="seg-progreso" />
        <div className="seg-auto"><CarroSVG girando={!llego && !cancelado} /></div>
      </div>
      <ol className="seg-pasos">
        {ETAPAS.map((e, i) => {
          const hecho = !cancelado && i < idx
          const actual = !cancelado && i === idx
          return (
            <li key={e.estado} className={`seg-paso ${hecho ? 'hecho' : ''} ${actual ? 'actual' : ''}`}
                aria-current={actual ? 'step' : undefined}>
              <span className="seg-punto" />
              <span className="seg-etiqueta">{e.etiqueta}</span>
            </li>
          )
        })}
      </ol>
      {!compacto && <p className="seg-texto" role="status" aria-live="polite">{mensaje}</p>}
    </div>
  )
}
