import { useEffect, useState } from 'react'
import { Link } from '../router.jsx'
import estilos from '../styles/consulta.css?inline'
import useEstilosDePagina from '../hooks/useEstilosDePagina.js'
import Seguimiento from '../components/Seguimiento.jsx'
import BadgeEstado from '../components/BadgeEstado.jsx'
import { misCotizaciones } from '../services/api.js'
import { formatearSoles } from '../utils/tarifario.js'
import { normalizarEstado } from '../utils/seguimiento.js'

const INTERVALO_REFRESCO_MS = 8000

function EtiquetaPago({ estado }) {
  const texto = estado === 'pagado' ? 'Pagado' : estado === 'exonerado' ? 'Exonerado' : 'Pendiente'
  return <span className={`pago-badge pago-${estado}`}>{texto}</span>
}

// Acciones según el estado operativo y el estado de pago
function Acciones({ r }) {
  const estado = normalizarEstado(r.estado)
  const botones = []
  if (estado === 'registrado' && r.estado_pago !== 'pagado') {
    botones.push(<Link key="e" to={`/actualizar?id=${r.id}`} className="btn-fila btn-editar-fila">Editar cotización</Link>)
  }
  if (r.estado_pago === 'pendiente' && estado !== 'cancelado') {
    botones.push(<Link key="p" to={`/pago?id=${r.id}`} className="btn-fila btn-pagar-fila">Pagar</Link>)
  } else if (r.estado_pago === 'pagado' && r.codigo_operacion) {
    botones.push(
      <Link key="c" to={`/comprobante?op=${encodeURIComponent(r.codigo_operacion)}`}
            className="btn-fila btn-comprobante-fila">Ver comprobante / guía</Link>
    )
  }
  return (
    <div className="acciones-fila">
      {botones.length > 0 ? botones : (
        <span className="solo-lectura">{r.estado_pago === 'exonerado' ? 'Exonerado' : 'Solo lectura'}</span>
      )}
    </div>
  )
}

export default function Consulta() {
  useEstilosDePagina(estilos)

  const [registros, setRegistros] = useState(null)   // null = todavía cargando
  const [error, setError] = useState(false)

  useEffect(() => {
    let activo = true
    async function cargar() {
      try {
        const filas = await misCotizaciones()
        if (!activo) return
        setRegistros(filas.map((f) => ({ ...f, registradoEn: Date.now() - f.segundos * 1000 })))
        setError(false)
      } catch (err) {
        console.error('No se pudo cargar:', err)
        if (activo) setError(true)
      }
    }
    cargar()
    const id = setInterval(() => { if (!document.hidden) cargar() }, INTERVALO_REFRESCO_MS)
    return () => { activo = false; clearInterval(id) }
  }, [])

  let cuerpo
  if (registros === null) {
    cuerpo = (
      <tr><td colSpan={8} style={{ textAlign: 'center', padding: 20 }}>
        {error ? 'No se pudieron cargar tus cotizaciones. Revisa tu conexión.' : 'Cargando…'}
      </td></tr>
    )
  } else if (registros.length === 0) {
    cuerpo = (
      <tr><td colSpan={8} style={{ textAlign: 'center', padding: 20 }}>
        No tienes cotizaciones registradas aún.
      </td></tr>
    )
  } else {
    cuerpo = registros.map((r) => (
      <tr key={r.id}>
        <td><strong>{r.codigo_seguimiento}</strong></td>
        <td style={{ textTransform: 'capitalize' }}>{r.origen}</td>
        <td style={{ textTransform: 'capitalize' }}>{r.destino}</td>
        <td>{r.peso} kg</td>
        <td>{formatearSoles(Number(r.monto_calculado))}</td>
        <td><EtiquetaPago estado={r.estado_pago} /></td>
        <td className="celda-estado">
          <BadgeEstado estado={r.estado} />
          <Seguimiento estado={r.estado} registradoEn={r.registradoEn} compacto />
        </td>
        <td><Acciones r={r} /></td>
      </tr>
    ))
  }

  return (
    <main className="contenedor-consulta">
      <h1>Mis Cotizaciones de Envío</h1>
      <div className="tabla-wrapper">
        <table>
          <thead>
            <tr>
              <th>Código</th><th>Origen</th><th>Destino</th><th>Peso</th>
              <th>Monto</th><th>Pago</th><th>Estado y seguimiento</th><th>Acciones</th>
            </tr>
          </thead>
          <tbody>{cuerpo}</tbody>
        </table>
      </div>
    </main>
  )
}