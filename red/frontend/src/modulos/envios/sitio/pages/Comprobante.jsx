import { useEffect, useState } from 'react'
import { Link, useSearchParams } from '../router.jsx'
import estilos from '../styles/comprobante.css?inline'
import useEstilosDePagina from '../hooks/useEstilosDePagina.js'
import { useAuth } from '../context/AuthContext.jsx'
import { obtenerComprobante } from '../services/api.js'
import { formatearSoles, calcularPesoVolumetrico, calcularPesoFacturable } from '../utils/tarifario.js'
import { formatearFechaHoraLima } from '../utils/hora.js'

const NOMBRES_METODO = {
  tarjeta_debito: 'Tarjeta de débito', tarjeta_credito: 'Tarjeta de crédito',
  billetera: 'Billetera electrónica', efectivo: 'Efectivo', pos: 'Tarjeta en POS',
}
const RUTA_VOLVER = { cliente: '/consulta', cajero: '/caja', administrador: '/caja', empleado: '/panel' }

const kg = (v) => `${Math.round(Number(v) * 100) / 100} kg`
const cm = (v) => `${Math.round(Number(v) * 100) / 100}`
const ciudad = (t) => String(t ?? '').replace(/^./, (c) => c.toUpperCase())

function Dato({ etiqueta, valor, clase = '' }) {
  return (<><dt>{etiqueta}</dt><dd className={clase}>{valor ?? '—'}</dd></>)
}

export default function Comprobante() {
  useEstilosDePagina(estilos)
  const { usuario } = useAuth()
  const [params] = useSearchParams()
  const op = params.get('op')
  const [pago, setPago] = useState(null)
  const [estado, setEstado] = useState('cargando')   // cargando | ok | no-encontrado | error

  useEffect(() => {
    let activo = true
    obtenerComprobante(op ?? '')
      .then((p) => { if (activo) { setPago(p); setEstado(p ? 'ok' : 'no-encontrado') } })
      .catch((err) => { console.error(err); if (activo) setEstado('error') })
    return () => { activo = false }
  }, [op])

  let hoja
  if (estado === 'cargando') hoja = 'Cargando comprobante...'
  else if (estado === 'no-encontrado') hoja = 'Comprobante no encontrado.'
  else if (estado === 'error') hoja = 'No se pudo cargar el comprobante. Revisa tu conexión.'
  else {
    const paquete = { peso_kg: pago.peso_kg, largo_cm: pago.largo_cm, ancho_cm: pago.ancho_cm, alto_cm: pago.alto_cm }
    const medio = `${NOMBRES_METODO[pago.metodo]} ${pago.marca_tarjeta ?? pago.proveedor_billetera ?? ''} ${pago.referencia ?? ''}`.trim()
    hoja = (
      <>
        <div className="hoja-encabezado">
          <div className="hoja-marca">LogísticaExpress<small>Guía de envío · Encomiendas y courier</small></div>
          <div className="hoja-codigo">N.° de guía<strong>{pago.codigo_seguimiento}</strong></div>
        </div>

        <h2>Datos del envío</h2>
        <dl>
          <Dato etiqueta="Remitente" valor={pago.cliente ?? pago.nombre_remitente} />
          <Dato etiqueta="Origen" valor={ciudad(pago.origen)} />
          <Dato etiqueta="Destino" valor={ciudad(pago.destino)} />
          <Dato etiqueta="Peso real" valor={kg(pago.peso_kg)} />
          <Dato etiqueta="Medidas (L×A×H)" valor={`${cm(pago.largo_cm)} × ${cm(pago.ancho_cm)} × ${cm(pago.alto_cm)} cm`} />
          <Dato etiqueta="Peso volumétrico" valor={kg(calcularPesoVolumetrico(paquete))} />
          <Dato etiqueta="Peso facturable" valor={kg(calcularPesoFacturable(paquete))} />
        </dl>

        <h2>Datos del pago</h2>
        <dl>
          <Dato etiqueta="N.° de operación" valor={pago.codigo_operacion} />
          <Dato etiqueta="Cliente" valor={pago.cliente ?? 'Atención presencial'} />
          <Dato etiqueta="Canal" valor={pago.canal === 'pasarela' ? 'Pago en línea' : 'Ventanilla'} />
          <Dato etiqueta="Medio" valor={medio} />
          <Dato etiqueta="Importe" valor={formatearSoles(Number(pago.monto))} clase="importe" />
          {pago.metodo === 'efectivo' && (
            <>
              <Dato etiqueta="Recibido" valor={formatearSoles(Number(pago.monto_recibido))} />
              <Dato etiqueta="Vuelto" valor={formatearSoles(Number(pago.vuelto))} />
            </>
          )}
          {pago.cajero && <Dato etiqueta="Atendido por" valor={pago.cajero} />}
          <Dato etiqueta="Fecha y hora (Perú)" valor={formatearFechaHoraLima(pago.fecha_pago)} />
        </dl>

        <p className="hoja-pie">Pago aprobado: esta guía autoriza la entrega del paquete en ventanilla.</p>
      </>
    )
  }

  return (
    <main className="comprobante-contenedor">
      <h1>Constancia de pago y guía de envío</h1>
      <section className="hoja" aria-live="polite">{hoja}</section>
      <div className="acciones">
        <button type="button" onClick={() => window.print()} disabled={estado !== 'ok'}>Imprimir guía</button>
        <Link to={RUTA_VOLVER[usuario.rol] ?? '/'}>Volver</Link>
      </div>
    </main>
  )
}