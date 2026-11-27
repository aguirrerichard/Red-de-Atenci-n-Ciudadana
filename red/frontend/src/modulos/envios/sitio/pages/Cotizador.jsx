import { useEffect, useState } from 'react'
import { Link } from '../router.jsx'
import estilos from '../styles/formulario.css?inline'
import useEstilosDePagina from '../hooks/useEstilosDePagina.js'
import SelectCiudad from '../components/SelectCiudad.jsx'
import Seguimiento from '../components/Seguimiento.jsx'
import { crearCotizacion, estadoCotizacion } from '../services/api.js'
import {
  calcularMontoServicio, calcularPesoVolumetrico, calcularPesoFacturable, formatearSoles,
} from '../utils/tarifario.js'
import { normalizarEstado } from '../utils/seguimiento.js'

const VACIO = { origen: '', destino: '', peso_kg: '', largo_cm: '', ancho_cm: '', alto_cm: '' }
const INTERVALO_SEGUIMIENTO_MS = 5000
const formatearKg = (kg) => `${(Math.round(kg * 100) / 100).toLocaleString('es-PE')} kg`

export default function Cotizador() {
  useEstilosDePagina(estilos)

  const [datos, setDatos] = useState(VACIO)
  const [error, setError] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [textoBoton, setTextoBoton] = useState('Cotizar y registrar envío')
  const [resultado, setResultado] = useState(null)         // { id, codigo, monto }
  const [seguimiento, setSeguimiento] = useState(null)     // { id, estado, registradoEn }

  const cambiar = (e) => setDatos((d) => ({ ...d, [e.target.name]: e.target.value }))

  // ---------- Cotización en vivo (valores derivados, sin efectos) ----------
  const completas = [datos.peso_kg, datos.largo_cm, datos.ancho_cm, datos.alto_cm]
    .every((v) => Number(v) > 0)
  const monto = completas ? calcularMontoServicio(datos) : 0

  // ---------- Seguimiento animado: consulta cada 5 s ----------
  const idSeg = seguimiento?.id
  const terminado = ['entregado', 'cancelado'].includes(normalizarEstado(seguimiento?.estado))
  useEffect(() => {
    if (!idSeg || terminado) return
    let activo = true
    const id = setInterval(async () => {
      try {
        const p = await estadoCotizacion(idSeg)
        if (activo && p) {
          setSeguimiento({ id: idSeg, estado: p.estado, registradoEn: Date.now() - p.segundos * 1000 })
        }
      } catch (err) {
        console.error('No se pudo actualizar el seguimiento:', err)
      }
    }, INTERVALO_SEGUIMIENTO_MS)
    return () => { activo = false; clearInterval(id) }
  }, [idSeg, terminado])

  // ---------- Guardar ----------
  async function enviar(e) {
    e.preventDefault()
    const form = e.currentTarget
    setError('')
    if (!form.checkValidity()) { form.reportValidity(); return }
    if (datos.origen === datos.destino) {
      setError('El origen y el destino no pueden ser iguales.')
      return
    }

    setGuardando(true)
    setTextoBoton('Guardando en la base de datos...')
    try {
      const c = await crearCotizacion(datos)
      setResultado({ id: c.id, codigo: c.codigo, monto: c.monto })
      setSeguimiento({ id: c.id, estado: 'registrado', registradoEn: Date.now() })
      setDatos(VACIO)
      setTextoBoton('Cotizar otro envío')
    } catch (err) {
      console.error('Error al registrar:', err)
      setError('Ocurrió un error al registrar el envío. Intenta nuevamente.')
      setTextoBoton('Reintentar')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <main>
      <section className="page-header">
        <h1>Cotizador de Envíos</h1>
        <p className="subtitulo">Calcula el costo de tu paquete al instante, con peso real y volumétrico.</p>
      </section>

      <div className="cotizador-wrapper">
        <section className="form-card">
          <form className="cotizador-form" onSubmit={enviar} noValidate>
            <div className="form-group">
              <label htmlFor="origen">Origen <span className="req">*</span></label>
              <SelectCiudad id="origen" name="origen" required textoInicial="Seleccione origen"
                            value={datos.origen} onChange={cambiar} />
            </div>

            <div className="form-group">
              <label htmlFor="destino">Destino <span className="req">*</span></label>
              <SelectCiudad id="destino" name="destino" required textoInicial="Seleccione destino"
                            value={datos.destino} onChange={cambiar} />
            </div>

            <div className="form-group">
              <label htmlFor="peso">Peso real (kg) <span className="req">*</span></label>
              <input type="number" id="peso" name="peso_kg" min="0.1" max="9999" step="0.1"
                     required placeholder="Ej: 2" value={datos.peso_kg} onChange={cambiar} />
            </div>

            <fieldset className="medidas">
              <legend>Medidas de la caja (cm) <span className="req">*</span></legend>
              <div className="medidas-grid">
                <div className="form-group">
                  <label htmlFor="largo">Largo</label>
                  <input type="number" id="largo" name="largo_cm" min="1" max="9999" step="0.1"
                         required placeholder="40" value={datos.largo_cm} onChange={cambiar} />
                </div>
                <div className="form-group">
                  <label htmlFor="ancho">Ancho</label>
                  <input type="number" id="ancho" name="ancho_cm" min="1" max="9999" step="0.1"
                         required placeholder="30" value={datos.ancho_cm} onChange={cambiar} />
                </div>
                <div className="form-group">
                  <label htmlFor="alto">Alto</label>
                  <input type="number" id="alto" name="alto_cm" min="1" max="9999" step="0.1"
                         required placeholder="30" value={datos.alto_cm} onChange={cambiar} />
                </div>
              </div>
            </fieldset>

            <div className="cotizacion-vivo" aria-live="polite">
              <dl className="desglose">
                <div><dt>Peso real</dt>
                  <dd>{completas ? formatearKg(Number(datos.peso_kg)) : '—'}</dd></div>
                <div><dt>Peso volumétrico</dt>
                  <dd>{completas ? formatearKg(calcularPesoVolumetrico(datos)) : '—'}</dd></div>
                <div><dt>Peso facturable</dt>
                  <dd>{completas ? formatearKg(calcularPesoFacturable(datos)) : '—'}</dd></div>
              </dl>
              <p className="monto-linea">Monto estimado:{' '}
                <output htmlFor="peso largo ancho alto">{formatearSoles(monto)}</output>
              </p>
              <p className="regla">
                S/ 12.00 base + S/ 4.00 por kg facturable. Peso volumétrico = largo × ancho × alto ÷ 5000.
              </p>
            </div>

            <p className="error-form" role="alert">{error}</p>

            <button type="submit" className="btn-cotizar" disabled={guardando}>{textoBoton}</button>
          </form>

          {resultado && (
            <div className="confirmacion-cotizacion confirmacion-pop">
              <p>¡Envío registrado! Código: {resultado.codigo}</p>
              <p>Total a pagar: {formatearSoles(resultado.monto)}</p>
              <div className="acciones-post">
                <Link to={`/pago?id=${resultado.id}`} className="principal">Pagar ahora</Link>
                <Link to="/consulta">Ver mis cotizaciones</Link>
              </div>
            </div>
          )}

          {seguimiento && (
            <div className="timeline-wrapper">
              <p className="timeline-title">Estado de tu nuevo envío:</p>
              <Seguimiento estado={seguimiento.estado} registradoEn={seguimiento.registradoEn} />
            </div>
          )}
        </section>

        <aside className="info-sidebar">
          <div className="sidebar-box">
            <h3>¿Necesitas ayuda personalizada?</h3>
            <p>Escríbenos por WhatsApp para cotizaciones corporativas o carga pesada.</p>
            <a href="https://web.whatsapp.com/" target="_blank" rel="noopener noreferrer"
               className="btn-whatsapp">Contactar por WhatsApp</a>
          </div>
        </aside>
      </div>
    </main>
  )
}