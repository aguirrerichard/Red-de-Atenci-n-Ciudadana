import { useEffect, useState } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from '../router.jsx'
import estilos from '../styles/actualizar.css?inline'
import useEstilosDePagina from '../hooks/useEstilosDePagina.js'
import { useAuth } from '../context/AuthContext.jsx'
import SelectCiudad from '../components/SelectCiudad.jsx'
import { obtenerCotizacion, actualizarCotizacion, cancelarCotizacion } from '../services/api.js'
import { calcularMontoServicio, formatearSoles } from '../utils/tarifario.js'
import { normalizarCiudad } from '../utils/ciudades.js'
import { normalizarEstado } from '../utils/seguimiento.js'

export default function Actualizar() {
  useEstilosDePagina(estilos)
  const { usuario } = useAuth()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const id = Number(params.get('id'))

  const esCliente = usuario.rol === 'cliente'
  const paginaInicio = esCliente ? '/consulta' : '/panel'

  const [reg, setReg] = useState(null)
  const [datos, setDatos] = useState(null)
  const [estadoSel, setEstadoSel] = useState('registrado')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!id) return
    let activo = true
    obtenerCotizacion(id)
      .then((r) => {
        if (!activo) return
        if (!r) {
          alert('Registro no encontrado o sin permisos.')
          navigate(paginaInicio)
          return
        }
        setReg(r)
        setDatos({
          origen: normalizarCiudad(r.origen), destino: normalizarCiudad(r.destino),
          peso_kg: String(Number(r.peso_kg)), largo_cm: String(Number(r.largo_cm)),
          ancho_cm: String(Number(r.ancho_cm)), alto_cm: String(Number(r.alto_cm)),
        })
        setEstadoSel(normalizarEstado(r.estado))
      })
      .catch((err) => { console.error(err); alert('No se pudo cargar la cotización.') })
    return () => { activo = false }
  }, [id, navigate, paginaInicio])

  if (!id) return <Navigate to={paginaInicio} replace />
  if (!reg || !datos) return <main className="act-main"><p>Cargando…</p></main>

  const cambiar = (e) => setDatos((d) => ({ ...d, [e.target.name]: e.target.value }))

  const estadoActual = normalizarEstado(reg.estado)
  const pagado = reg.estado_pago === 'pagado'
  const soloLectura = estadoActual !== 'registrado' || pagado   // solo se edita si está registrado y NO pagado

  const medidasValidas = [datos.peso_kg, datos.largo_cm, datos.ancho_cm, datos.alto_cm].every((v) => Number(v) > 0)
  const montoTexto = soloLectura
    ? formatearSoles(Number(reg.monto_calculado))
    : medidasValidas ? formatearSoles(calcularMontoServicio(datos)) : '—'
  const textoPago = pagado ? '(ya pagado)' : reg.estado_pago === 'exonerado' ? '(exonerado)' : '(pendiente de pago)'

  let textoBoton = 'Guardar Cambios'
  let deshabilitado = false
  let peligro = false
  if (soloLectura) {
    if (esCliente) {
      deshabilitado = true
      textoBoton = pagado ? 'Solo lectura (ya pagado)' : 'Solo lectura (Trámite iniciado)'
    } else if (estadoActual === 'cancelado') {
      deshabilitado = true
      textoBoton = 'Cotización Cancelada'
    } else {
      textoBoton = 'Actualizar a Cancelado'
      peligro = true
    }
  }

  async function guardar(e) {
    e.preventDefault()
    setError('')
    try {
      if (!esCliente && estadoSel === 'cancelado' && estadoActual !== 'cancelado') {
        await cancelarCotizacion(id)
      } else if (!soloLectura) {
        if (datos.origen === datos.destino) {
          setError('El origen y el destino no pueden ser iguales.')
          return
        }
        await actualizarCotizacion(id, datos)
      }
      alert('Modificación guardada exitosamente.')
      navigate(paginaInicio)
    } catch (err) {
      if (err.status === 409) {
        alert('No se pudo guardar: la cotización ya no se puede editar (pagada o en trámite).')
        navigate(paginaInicio)
      } else {
        console.error(err)
        alert('Ocurrió un error al intentar guardar.')
      }
    }
  }

  return (
    <main className="act-main">
      <div className="act-card">
        <h2>Detalle de Cotización</h2>

        <form onSubmit={guardar}>
          <div className="act-campo">
            <label htmlFor="edit-origen">Origen:</label>
            <SelectCiudad id="edit-origen" name="origen" required value={datos.origen}
                          onChange={cambiar} disabled={soloLectura} />
          </div>
          <div className="act-campo">
            <label htmlFor="edit-destino">Destino:</label>
            <SelectCiudad id="edit-destino" name="destino" required value={datos.destino}
                          onChange={cambiar} disabled={soloLectura} />
          </div>
          <div className="act-campo">
            <label htmlFor="edit-peso">Peso real (kg):</label>
            <input type="number" id="edit-peso" name="peso_kg" min="0.1" max="9999" step="0.1" required
                   value={datos.peso_kg} onChange={cambiar} disabled={soloLectura} />
          </div>

          <div className="medidas-edit">
            <div><label htmlFor="edit-largo">Largo (cm):</label>
              <input type="number" id="edit-largo" name="largo_cm" min="1" max="9999" step="0.1" required
                     value={datos.largo_cm} onChange={cambiar} disabled={soloLectura} /></div>
            <div><label htmlFor="edit-ancho">Ancho (cm):</label>
              <input type="number" id="edit-ancho" name="ancho_cm" min="1" max="9999" step="0.1" required
                     value={datos.ancho_cm} onChange={cambiar} disabled={soloLectura} /></div>
            <div><label htmlFor="edit-alto">Alto (cm):</label>
              <input type="number" id="edit-alto" name="alto_cm" min="1" max="9999" step="0.1" required
                     value={datos.alto_cm} onChange={cambiar} disabled={soloLectura} /></div>
          </div>

          <p className="monto-edit">Monto: <strong>{montoTexto}</strong> <span>{textoPago}</span></p>
          <p className="edit-error" role="alert">{error}</p>

          {/* Solo administrador / empleado */}
          {!esCliente && (
            <div className="act-estado">
              <label htmlFor="edit-estado">Actualizar Estado del Envío:</label>
              <select id="edit-estado" value={estadoSel} onChange={(e) => setEstadoSel(e.target.value)}>
                {estadoActual === 'cancelado' ? (
                  <option value="cancelado">Cancelado</option>
                ) : (
                  <>
                    <option value={estadoActual}>{estadoActual.toUpperCase()} (Estado actual)</option>
                    <option value="cancelado">CANCELAR COTIZACIÓN</option>
                  </>
                )}
              </select>
            </div>
          )}

          <button type="submit" className={`act-guardar ${peligro ? 'peligro' : ''}`} disabled={deshabilitado}>
            {textoBoton}
          </button>
        </form>

        <Link to={paginaInicio} className="act-volver">Volver</Link>
      </div>
    </main>
  )
}