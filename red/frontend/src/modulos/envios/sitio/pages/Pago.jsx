import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from '../router.jsx'
import estilos from '../styles/pago.css?inline'
import useEstilosDePagina from '../hooks/useEstilosDePagina.js'
import { pendientesDePago, pagarConTarjeta, pagarConBilletera } from '../services/api.js'
import { formatearSoles } from '../utils/tarifario.js'
import {
  detectarMarca, formatearNumeroTarjeta, formatearVencimiento,
  validarFormularioTarjeta, validarCelular, validarCodigoAprobacion,
} from '../utils/validaciones.js'

const TARJETA_VACIA = { numero: '', vencimiento: '', cvv: '', titular: '' }
const BILLETERA_VACIA = { proveedor: 'andipay', celular: '', codigo: '' }

export default function Pago() {
  useEstilosDePagina(estilos)
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const idUrl = params.get('id')

  const [pendientes, setPendientes] = useState(null)       // null = cargando
  const [idSel, setIdSel] = useState('')
  const [metodo, setMetodo] = useState('tarjeta')          // 'tarjeta' | 'billetera'
  const [tarjeta, setTarjeta] = useState(TARJETA_VACIA)
  const [billetera, setBilletera] = useState(BILLETERA_VACIA)
  const [errores, setErrores] = useState({})
  const [mensaje, setMensaje] = useState({ texto: '', tipo: 'info' })
  const [procesando, setProcesando] = useState(false)
  const [aprobado, setAprobado] = useState(false)
  const temporizador = useRef(null)

  useEffect(() => () => clearTimeout(temporizador.current), [])

  // 1. Cargar las solicitudes pendientes del cliente
  useEffect(() => {
    let activo = true
    pendientesDePago()
      .then((filas) => {
        if (!activo) return
        setPendientes(filas)
        // Si llegó desde el cotizador o la consulta con ?id=, se preselecciona
        setIdSel(filas.some((p) => String(p.id) === idUrl) ? idUrl : String(filas[0]?.id ?? ''))
      })
      .catch((err) => {
        console.error(err)
        if (activo) setMensaje({ texto: 'No se pudieron cargar tus solicitudes. Revisa tu conexión.', tipo: 'error' })
      })
    return () => { activo = false }
  }, [idUrl])

  const registroActual = pendientes?.find((p) => String(p.id) === idSel) ?? null
  const sinPendientes = pendientes?.length === 0
  const msg = sinPendientes
    ? { texto: 'No tienes solicitudes pendientes de pago.', tipo: 'info' }
    : mensaje

  // 2. Formato en vivo
  const marca = detectarMarca(tarjeta.numero)
  function cambiarTarjeta(e) {
    const { name, value } = e.target
    const v = name === 'numero' ? formatearNumeroTarjeta(value)
            : name === 'vencimiento' ? formatearVencimiento(value)
            : value
    setTarjeta((t) => ({ ...t, [name]: v }))
  }
  const cambiarBilletera = (e) => setBilletera((b) => ({ ...b, [e.target.name]: e.target.value }))

  // 3. Procesar un pago (común a tarjeta y billetera)
  async function procesar(operacion, limpiar) {
    if (!registroActual) {
      setMensaje({ texto: 'Selecciona una solicitud pendiente de pago.', tipo: 'error' })
      return
    }
    setProcesando(true)                         // evita el doble clic = doble cobro
    setMensaje({ texto: 'Conectando con la entidad...', tipo: 'info' })
    try {
      const resultado = await operacion()
      if (resultado.aprobado) {
        setAprobado(true)                       // el botón queda bloqueado hasta redirigir
        limpiar()
        setMensaje({ texto: `Pago aprobado. Operación ${resultado.codigo}.`, tipo: 'exito' })
        temporizador.current = setTimeout(
          () => navigate(`/comprobante?op=${encodeURIComponent(resultado.codigo)}`), 1500)
      } else {
        setMensaje({ texto: `Pago rechazado: ${resultado.motivo}`, tipo: 'error' })
      }
    } catch (err) {
      console.error(err)
      setMensaje({ texto: err.message || 'No se pudo procesar el pago. Revisa tu conexión.', tipo: 'error' })
    } finally {
      setProcesando(false)
    }
  }

  async function enviarTarjeta(e) {
    e.preventDefault()
    const { valido, errores: errs } = validarFormularioTarjeta(tarjeta)
    setErrores(errs)
    if (!valido) return
    await procesar(
      () => pagarConTarjeta({ idRegistro: registroActual?.id, ...tarjeta }),
      () => setTarjeta(TARJETA_VACIA),
    )
  }

  async function enviarBilletera(e) {
    e.preventDefault()
    const errs = {}
    if (!validarCelular(billetera.celular)) errs.celular = 'Celular de 9 dígitos que empiece con 9.'
    if (!validarCodigoAprobacion(billetera.codigo)) errs.codigo = 'El código tiene 6 dígitos.'
    setErrores(errs)
    if (Object.keys(errs).length) return
    await procesar(
      () => pagarConBilletera({
        idRegistro: registroActual?.id, proveedor: billetera.proveedor,
        celular: billetera.celular, codigoAprobacion: billetera.codigo,
      }),
      () => setBilletera(BILLETERA_VACIA),
    )
  }

  const bloqueado = procesando || aprobado
  const invalido = (campo) => (errores[campo] ? 'true' : 'false')

  return (
    <main className="pago-contenedor">
      <h1>Pago en línea</h1>
      <p className="aviso-simulacion">
        Simulación académica: usa las tarjetas y billeteras de prueba. Nunca ingreses datos reales.
      </p>

      <section className="tarjeta-pago" aria-labelledby="t-resumen">
        <h2 id="t-resumen">Resumen</h2>
        <label htmlFor="registro">Solicitud a pagar</label>
        <select id="registro" name="registro" value={idSel} onChange={(e) => setIdSel(e.target.value)}>
          {(pendientes ?? []).map((p) => (
            <option key={p.id} value={p.id}>
              {p.codigo_seguimiento} — {formatearSoles(Number(p.monto_calculado))}
            </option>
          ))}
        </select>
        <p className="total-pago">
          Total a pagar: <strong>{registroActual ? formatearSoles(Number(registroActual.monto_calculado)) : '—'}</strong>
        </p>
      </section>

      {!sinPendientes && (
        <div>
          <fieldset className="tarjeta-pago metodos">
            <legend>Método de pago</legend>
            <label className="opcion-metodo">
              <input type="radio" name="metodo" value="tarjeta" checked={metodo === 'tarjeta'}
                     onChange={() => setMetodo('tarjeta')} /> Tarjeta de débito o crédito
            </label>
            <label className="opcion-metodo">
              <input type="radio" name="metodo" value="billetera" checked={metodo === 'billetera'}
                     onChange={() => setMetodo('billetera')} /> Billetera electrónica
            </label>
          </fieldset>

          {metodo === 'tarjeta' ? (
            <form className="tarjeta-pago form-pago" onSubmit={enviarTarjeta} noValidate>
              <label htmlFor="numero">Número de tarjeta</label>
              <input id="numero" name="numero" inputMode="numeric" autoComplete="cc-number" maxLength={23}
                     required aria-describedby="marca-detectada error-numero" placeholder="4111 1111 1111 1111"
                     value={tarjeta.numero} onChange={cambiarTarjeta} aria-invalid={invalido('numero')} />
              <span id="marca-detectada" className="marca">{marca ?? ''}</span>
              <span id="error-numero" className="error">{errores.numero}</span>

              <div className="fila-doble">
                <div>
                  <label htmlFor="vencimiento">Vencimiento (MM/AA)</label>
                  <input id="vencimiento" name="vencimiento" inputMode="numeric" autoComplete="cc-exp"
                         maxLength={5} placeholder="MM/AA" required aria-describedby="error-vencimiento"
                         value={tarjeta.vencimiento} onChange={cambiarTarjeta} aria-invalid={invalido('vencimiento')} />
                  <span id="error-vencimiento" className="error">{errores.vencimiento}</span>
                </div>
                <div>
                  <label htmlFor="cvv">CVV</label>
                  <input id="cvv" name="cvv" type="password" inputMode="numeric" autoComplete="cc-csc"
                         maxLength={4} required aria-describedby="error-cvv"
                         value={tarjeta.cvv} onChange={cambiarTarjeta} aria-invalid={invalido('cvv')} />
                  <span id="error-cvv" className="error">{errores.cvv}</span>
                </div>
              </div>

              <label htmlFor="titular">Nombre del titular</label>
              <input id="titular" name="titular" autoComplete="cc-name" required aria-describedby="error-titular"
                     value={tarjeta.titular} onChange={cambiarTarjeta} aria-invalid={invalido('titular')} />
              <span id="error-titular" className="error">{errores.titular}</span>

              <button type="submit" className="btn-pagar" disabled={bloqueado}>
                {procesando ? 'Procesando...' : 'Pagar con tarjeta'}
              </button>
            </form>
          ) : (
            <form className="tarjeta-pago form-pago" onSubmit={enviarBilletera} noValidate>
              <label htmlFor="proveedor">Billetera</label>
              <select id="proveedor" name="proveedor" value={billetera.proveedor} onChange={cambiarBilletera}>
                <option value="andipay">AndiPay</option>
                <option value="pagomovil">PagoMóvil</option>
              </select>

              <label htmlFor="celular">Celular afiliado</label>
              <input id="celular" name="celular" inputMode="numeric" autoComplete="tel-national" maxLength={9}
                     required aria-describedby="error-celular" placeholder="987654321"
                     value={billetera.celular} onChange={cambiarBilletera} aria-invalid={invalido('celular')} />
              <span id="error-celular" className="error">{errores.celular}</span>

              <label htmlFor="codigo">Código de aprobación (6 dígitos que muestra tu billetera)</label>
              <input id="codigo" name="codigo" inputMode="numeric" autoComplete="one-time-code" maxLength={6}
                     required aria-describedby="error-codigo"
                     value={billetera.codigo} onChange={cambiarBilletera} aria-invalid={invalido('codigo')} />
              <span id="error-codigo" className="error">{errores.codigo}</span>

              <button type="submit" className="btn-pagar" disabled={bloqueado}>
                {procesando ? 'Procesando...' : 'Pagar con billetera'}
              </button>
            </form>
          )}
        </div>
      )}

      <p role="status" aria-live="polite" className={msg.texto ? `mensaje mensaje--${msg.tipo}` : ''}>
        {msg.texto}
      </p>
    </main>
  )
}