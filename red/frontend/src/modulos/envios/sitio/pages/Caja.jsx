import { useEffect, useRef, useState } from 'react'
import { Link } from '../router.jsx'
import estilos from '../styles/caja.css?inline'
import useEstilosDePagina from '../hooks/useEstilosDePagina.js'
import useReloj from '../hooks/useReloj.js'
import { useAuth } from '../context/AuthContext.jsx'
import {
  cajaPendientes, cajaCobrar, cajaPagosEnLinea, cajaVerificar, cajaResumen,
} from '../services/api.js'
import { formatearSoles, redondear, calcularMontoServicio } from '../utils/tarifario.js'
import { notificar, confirmar } from '../../../../utils/dialogos.js'
import { formatearHoraLima, hoyEnLima } from '../utils/hora.js'

const INTERVALO_REFRESCO_MS = 15000
const NOMBRES_METODO = {
  tarjeta_debito: 'Tarjeta de débito', tarjeta_credito: 'Tarjeta de crédito',
  billetera: 'Billetera', efectivo: 'Efectivo', pos: 'POS',
}
const ciudad = (t) => String(t ?? '').replace(/^./, (c) => c.toUpperCase())
const numero = (v) => String(Math.round(Number(v) * 100) / 100)

function describirMedio(p) {
  if (p.metodo === 'billetera') return `Billetera ${p.proveedor_billetera} ${p.referencia}`
  if (p.marca_tarjeta) return `${p.marca_tarjeta} ${p.referencia}`
  return p.referencia ?? p.metodo
}

/* ---------- Diálogo "Registrar cobro" ---------- */
function DialogoCobro({ registro, onCerrar, onCobrado }) {
  const ref = useRef(null)
  const [peso, setPeso] = useState('')
  const [metodo, setMetodo] = useState('efectivo')
  const [recibido, setRecibido] = useState('')
  const [referencia, setReferencia] = useState('')
  const [guardando, setGuardando] = useState(false)

  useEffect(() => {
    const d = ref.current
    if (registro && !d.open) {
      setPeso(numero(registro.peso_kg)); setMetodo('efectivo'); setRecibido(''); setReferencia('')
      d.showModal()
    }
    if (!registro && d.open) d.close()
  }, [registro])

  // Todo lo calculado sale del estado: tarifa por peso verificado, aviso y vuelto
  const esEfectivo = metodo === 'efectivo'
  const pesoNum = Number(peso)
  const monto = !registro ? 0
    : pesoNum > 0 ? calcularMontoServicio({ ...registro, peso_kg: pesoNum })
    : Number(registro.monto_calculado)
  const cambio = registro ? Math.abs(pesoNum - Number(registro.peso_kg)) > 0.004 : false
  const vuelto = Number(recibido) - monto
  const textoVuelto = !recibido ? formatearSoles(0)
    : vuelto >= 0 ? formatearSoles(redondear(vuelto)) : 'Monto insuficiente'

  async function enviar(e) {
    e.preventDefault()
    if (!esEfectivo && !/^\d{6,12}$/.test(referencia)) {
      notificar('Ingresa el número de voucher u operación (6 a 12 dígitos).', 'aviso')
      return
    }
    if (!(pesoNum > 0)) { notificar('Ingresa el peso verificado en balanza.', 'aviso'); return }
    if (!await confirmar({ titulo: 'Confirmar cobro', mensaje: `¿Confirmar el cobro de ${formatearSoles(monto)} por la solicitud ${registro.codigo_seguimiento}?`, textoSi: 'Sí, cobrar' })) return

    setGuardando(true)
    try {
      const cobro = await cajaCobrar({
        idRegistro: registro.id, pesoVerificado: pesoNum, metodo,
        montoRecibido: Number(recibido), referencia,
      })
      onCobrado(cobro)
    } catch (err) {
      console.error(err)
      notificar(err.message || 'No se pudo registrar el cobro.', 'error')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <dialog ref={ref} aria-labelledby="t-dialogo" onClose={onCerrar}>
      {registro && (
        <form onSubmit={enviar}>
          <h2 id="t-dialogo">Registrar cobro</h2>
          <p>Solicitud <strong>{registro.codigo_seguimiento}</strong> — Total <strong>{formatearSoles(monto)}</strong></p>

          <dl className="datos-paquete">
            <dt>Ruta</dt><dd>{ciudad(registro.origen)} → {ciudad(registro.destino)}</dd>
            <dt>Medidas (cm)</dt>
            <dd>{numero(registro.largo_cm)} × {numero(registro.ancho_cm)} × {numero(registro.alto_cm)}</dd>
            <dt>Peso declarado</dt><dd>{numero(registro.peso_kg)} kg</dd>
          </dl>

          <label htmlFor="peso-verificado">Peso verificado en balanza (kg)</label>
          <input id="peso-verificado" name="peso_verificado" type="number" min="0.01" max="9999" step="0.01"
                 required value={peso} onChange={(e) => setPeso(e.target.value)} />
          <p className={`ayuda ${cambio ? 'cambio' : ''}`}>
            {!(pesoNum > 0) ? 'Si el peso cambia, la tarifa se recalcula.'
              : cambio ? `El peso difiere del declarado: la tarifa se recalculó a ${formatearSoles(monto)}.`
              : 'Peso conforme con lo declarado.'}
          </p>

          <label htmlFor="metodo-caja">Medio de pago</label>
          <select id="metodo-caja" name="metodo" value={metodo} onChange={(e) => setMetodo(e.target.value)}>
            <option value="efectivo">Efectivo</option>
            <option value="pos">Tarjeta en POS</option>
            <option value="andipay">Billetera AndiPay (QR)</option>
            <option value="pagomovil">Billetera PagoMóvil (QR)</option>
          </select>

          {esEfectivo ? (
            <div>
              <label htmlFor="monto-recibido">Monto recibido (S/)</label>
              <input id="monto-recibido" name="monto_recibido" type="number" min="0" step="0.01" required
                     value={recibido} onChange={(e) => setRecibido(e.target.value)} />
              <p>Vuelto: <output>{textoVuelto}</output></p>
            </div>
          ) : (
            <div>
              <label htmlFor="referencia">N.° de voucher u operación</label>
              <input id="referencia" name="referencia" inputMode="numeric" maxLength={12} required
                     value={referencia} onChange={(e) => setReferencia(e.target.value)} />
            </div>
          )}

          <div className="dialogo-botones">
            <button type="submit" className="primario" disabled={guardando}>Confirmar cobro</button>
            <button type="button" onClick={onCerrar}>Cancelar</button>
          </div>
        </form>
      )}
    </dialog>
  )
}

/* ---------- Página ---------- */
export default function Caja() {
  useEstilosDePagina(estilos)
  const { usuario } = useAuth()
  const ahora = useReloj()

  // Cobro presencial
  const [criterio, setCriterio] = useState('')
  const [criterioActivo, setCriterioActivo] = useState('')
  const [pendientes, setPendientes] = useState(null)
  const [errorPend, setErrorPend] = useState(false)
  const [versionPend, setVersionPend] = useState(0)
  const [registroEnCobro, setRegistroEnCobro] = useState(null)
  const [avisoCobro, setAvisoCobro] = useState(null)

  // Pagos en línea y resumen
  const [fecha, setFecha] = useState(hoyEnLima)
  const [soloPorVerificar, setSoloPorVerificar] = useState(false)
  const [pagosLinea, setPagosLinea] = useState([])
  const [resumen, setResumen] = useState([])
  const [versionLinea, setVersionLinea] = useState(0)
  const [avisoNuevos, setAvisoNuevos] = useState('')
  const ultimoIdVisto = useRef(null)

  useEffect(() => {
    let activo = true
    cajaPendientes(criterioActivo)
      .then((filas) => { if (activo) { setPendientes(filas); setErrorPend(false) } })
      .catch((err) => { console.error(err); if (activo) setErrorPend(true) })
    return () => { activo = false }
  }, [criterioActivo, versionPend])

  useEffect(() => {
    let activo = true
    Promise.all([cajaPagosEnLinea(fecha, soloPorVerificar), cajaResumen(fecha)])
      .then(([pagos, filas]) => {
        if (!activo) return
        setPagosLinea(pagos)
        setResumen(filas)
        // Aviso de pagos nuevos desde la última revisión
        const ids = pagos.filter((p) => p.estado === 'aprobado').map((p) => p.id)
        const maxId = ids.length ? Math.max(...ids) : 0
        if (ultimoIdVisto.current !== null && maxId > ultimoIdVisto.current) {
          const nuevos = ids.filter((id) => id > ultimoIdVisto.current).length
          setAvisoNuevos(`Ingresaron ${nuevos} pago(s) nuevo(s) por la pasarela.`)
        }
        ultimoIdVisto.current = Math.max(ultimoIdVisto.current ?? 0, maxId)
      })
      .catch((err) => console.error(err))
    return () => { activo = false }
  }, [fecha, soloPorVerificar, versionLinea])

  // Revisa cada 15 s si entraron pagos por la pasarela (solo con la pestaña visible)
  useEffect(() => {
    const id = setInterval(() => { if (!document.hidden) setVersionLinea((v) => v + 1) }, INTERVALO_REFRESCO_MS)
    return () => clearInterval(id)
  }, [])

  function buscar(e) {
    e.preventDefault()
    setCriterioActivo(criterio.trim())
    setVersionPend((v) => v + 1)
  }

  function cambiarFecha(valor) {
    ultimoIdVisto.current = null
    setAvisoNuevos('')
    setFecha(valor)
  }

  function alCobrar({ codigo, vuelto }) {
    setRegistroEnCobro(null)
    setAvisoCobro({ codigo, vuelto })
    setVersionPend((v) => v + 1)
    setVersionLinea((v) => v + 1)
  }

  async function verificar(id) {
    if (!await confirmar({ titulo: 'Verificar pago', mensaje: '¿Confirmas que este pago figura en el estado de cuenta de la entidad?', textoSi: 'Sí, verificar' })) return
    try { await cajaVerificar(id); setVersionLinea((v) => v + 1); notificar('Pago verificado.', 'ok') }
    catch (err) { console.error(err); notificar('No se pudo verificar el pago.', 'error') }
  }

  const totalDia = redondear(resumen.reduce((suma, f) => suma + Number(f.total), 0))

  let filasPendientes
  if (pendientes === null) {
    filasPendientes = <tr><td colSpan={6}>{errorPend ? 'No se pudieron cargar las solicitudes.' : 'Cargando…'}</td></tr>
  } else if (pendientes.length === 0) {
    filasPendientes = <tr><td colSpan={6}>Sin solicitudes pendientes.</td></tr>
  } else {
    filasPendientes = pendientes.map((r) => (
      <tr key={r.id}>
        <td>{r.codigo_seguimiento}</td>
        <td>{r.cliente ?? 'Atención presencial'}</td>
        <td>{r.dni ?? '—'}</td>
        <td>{ciudad(r.origen)} → {ciudad(r.destino)}</td>
        <td>{formatearSoles(Number(r.monto_calculado))}</td>
        <td><button type="button" onClick={() => setRegistroEnCobro(r)}>Cobrar</button></td>
      </tr>
    ))
  }

  return (
    <>
      <main className="caja-contenedor">
        <div className="caja-titulo">
          <h1>Módulo de Caja</h1>
          <p className="caja-usuario">
            Cajero: <strong>{usuario.nombre}</strong> · Hora de Perú: <span>{formatearHoraLima(ahora, true)}</span>
          </p>
        </div>

        <p className="aviso-cobro" role="status" aria-live="polite">
          {avisoCobro && (
            <>
              {`Cobro registrado. Operación ${avisoCobro.codigo}.`}
              {avisoCobro.vuelto !== null && ` Vuelto: ${formatearSoles(avisoCobro.vuelto)}.`}{' '}
              <Link to={`/comprobante?op=${encodeURIComponent(avisoCobro.codigo)}`}>Imprimir guía de envío</Link>
            </>
          )}
        </p>

        <section className="caja-seccion" aria-labelledby="t-cobro">
          <h2 id="t-cobro">Cobro presencial</h2>
          <form className="buscador" role="search" onSubmit={buscar}>
            <label htmlFor="criterio">Código de seguimiento, DNI o nombre</label>
            <div className="buscador-fila">
              <input id="criterio" name="criterio" type="search" autoComplete="off"
                     placeholder="Ej. COD-10000007, 70000006 o Cliente 03"
                     value={criterio} onChange={(e) => setCriterio(e.target.value)} />
              <button type="submit">Buscar</button>
            </div>
          </form>
          <div className="tabla-wrapper">
            <table>
              <caption>Solicitudes pendientes de pago</caption>
              <thead>
                <tr><th scope="col">Código</th><th scope="col">Cliente</th><th scope="col">DNI</th>
                    <th scope="col">Ruta</th><th scope="col">Monto</th><th scope="col">Acción</th></tr>
              </thead>
              <tbody>{filasPendientes}</tbody>
            </table>
          </div>
        </section>

        <section className="caja-seccion" aria-labelledby="t-linea">
          <h2 id="t-linea">Pagos recibidos por la pasarela</h2>
          <p className="aviso-nuevos" role="status" aria-live="polite">{avisoNuevos}</p>
          <div className="filtros">
            <label htmlFor="fecha-caja">Fecha</label>
            <input id="fecha-caja" type="date" value={fecha} onChange={(e) => cambiarFecha(e.target.value)} />
            <label className="check">
              <input type="checkbox" checked={soloPorVerificar}
                     onChange={(e) => setSoloPorVerificar(e.target.checked)} /> Solo pendientes de verificar
            </label>
          </div>
          <div className="tabla-wrapper">
            <table>
              <caption>Operaciones en línea</caption>
              <thead>
                <tr><th scope="col">Hora</th><th scope="col">Operación</th><th scope="col">Solicitud</th>
                    <th scope="col">Cliente</th><th scope="col">Medio</th><th scope="col">Monto</th>
                    <th scope="col">Resultado</th><th scope="col">Verificación</th></tr>
              </thead>
              <tbody>
                {pagosLinea.length === 0 ? (
                  <tr><td colSpan={8}>Sin operaciones en línea para esta fecha.</td></tr>
                ) : pagosLinea.map((p) => (
                  <tr key={p.id} className={p.estado === 'rechazado' ? 'fila-rechazada' : ''}>
                    <td>{formatearHoraLima(p.fecha_pago)}</td>
                    <td>{p.codigo_operacion}</td>
                    <td>{p.codigo_seguimiento}</td>
                    <td>{p.cliente ?? '—'}</td>
                    <td>{describirMedio(p)}</td>
                    <td>{formatearSoles(Number(p.monto))}</td>
                    <td>{p.estado === 'aprobado' ? 'Aprobado' : `Rechazado: ${p.motivo_rechazo}`}</td>
                    <td>
                      {p.estado === 'aprobado' && !p.verificado && (
                        <button type="button" onClick={() => verificar(p.id)}>Verificar</button>
                      )}
                      {p.verificado && `Verificado por ${p.verificador}`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="caja-seccion" aria-labelledby="t-resumen">
          <h2 id="t-resumen">Resumen del día (cierre de caja)</h2>
          <div className="tabla-wrapper">
            <table>
              <thead>
                <tr><th scope="col">Canal</th><th scope="col">Medio</th>
                    <th scope="col">Operaciones</th><th scope="col">Total</th></tr>
              </thead>
              <tbody>
                {resumen.length === 0 ? (
                  <tr><td colSpan={4}>Sin cobros para esta fecha.</td></tr>
                ) : resumen.map((f) => (
                  <tr key={`${f.canal}-${f.metodo}`}>
                    <td>{f.canal === 'pasarela' ? 'En línea' : 'Ventanilla'}</td>
                    <td>{NOMBRES_METODO[f.metodo] ?? f.metodo}</td>
                    <td>{f.operaciones}</td>
                    <td>{formatearSoles(Number(f.total))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="total-dia">Total recaudado: <strong>{formatearSoles(totalDia)}</strong></p>
        </section>
      </main>

      <DialogoCobro registro={registroEnCobro} onCerrar={() => setRegistroEnCobro(null)} onCobrado={alCobrar} />
    </>
  )
}