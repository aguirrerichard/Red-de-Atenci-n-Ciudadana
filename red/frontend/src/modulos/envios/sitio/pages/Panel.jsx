import { useEffect, useRef, useState } from 'react'
import { Link } from '../router.jsx'
import estilos from '../styles/panel.css?inline'
import useEstilosDePagina from '../hooks/useEstilosDePagina.js'
import useReloj from '../hooks/useReloj.js'
import { useAuth } from '../context/AuthContext.jsx'
import BadgeEstado from '../components/BadgeEstado.jsx'
import SelectCiudad from '../components/SelectCiudad.jsx'
import {
  listarRegistrosPanel, crearRegistroPanel, cancelarCotizacion, eliminarCotizacion,
} from '../services/api.js'
import { formatearSoles } from '../utils/tarifario.js'
import { TURNOS } from '../utils/turnos.js'
import { formatearFechaLima, formatearHoraLima } from '../utils/hora.js'

const etiquetaPago = (r) => {
  if (r.estado_pago === 'pagado') return `Pagado (${r.canal_pago === 'caja' ? 'caja' : 'en línea'})`
  if (r.estado_pago === 'exonerado') return 'Exonerado'
  return 'Pendiente'
}

const NUEVO_VACIO = {
  nombre_remitente: '', origen: '', destino: '',
  peso_kg: '', largo_cm: '', ancho_cm: '', alto_cm: '',
}

/* ---------- Diálogo "Nuevo registro presencial" ---------- */
function DialogoNuevo({ abierto, onCerrar, onCreado }) {
  const ref = useRef(null)
  const [datos, setDatos] = useState(NUEVO_VACIO)
  const [error, setError] = useState('')
  const [guardando, setGuardando] = useState(false)

  // El <dialog> nativo se controla desde un efecto con showModal() / close()
  useEffect(() => {
    const d = ref.current
    if (abierto && !d.open) { setDatos(NUEVO_VACIO); setError(''); d.showModal() }
    if (!abierto && d.open) d.close()
  }, [abierto])

  const cambiar = (e) => setDatos((d) => ({ ...d, [e.target.name]: e.target.value }))

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
    try {
      const creado = await crearRegistroPanel({ ...datos, nombre_remitente: datos.nombre_remitente.trim() })
      onCreado(creado)
    } catch (err) {
      console.error(err)
      setError('No se pudo crear el registro. Intenta nuevamente.')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <dialog ref={ref} aria-labelledby="t-nuevo" onClose={onCerrar}>
      <form onSubmit={enviar} noValidate>
        <h2 id="t-nuevo">Nuevo registro presencial</h2>
        <label htmlFor="nuevo-remitente">Nombre del remitente</label>
        <input id="nuevo-remitente" name="nombre_remitente" required maxLength={120}
               value={datos.nombre_remitente} onChange={cambiar} />
        <div className="fila-2">
          <div>
            <label htmlFor="nuevo-origen">Origen</label>
            <SelectCiudad id="nuevo-origen" name="origen" required textoInicial="Seleccione origen"
                          value={datos.origen} onChange={cambiar} />
          </div>
          <div>
            <label htmlFor="nuevo-destino">Destino</label>
            <SelectCiudad id="nuevo-destino" name="destino" required textoInicial="Seleccione destino"
                          value={datos.destino} onChange={cambiar} />
          </div>
        </div>
        <label htmlFor="nuevo-peso">Peso real (kg)</label>
        <input id="nuevo-peso" name="peso_kg" type="number" min="0.1" max="9999" step="0.1" required
               value={datos.peso_kg} onChange={cambiar} />
        <div className="fila-3">
          <div><label htmlFor="nuevo-largo">Largo (cm)</label>
            <input id="nuevo-largo" name="largo_cm" type="number" min="1" max="9999" step="0.1" required
                   value={datos.largo_cm} onChange={cambiar} /></div>
          <div><label htmlFor="nuevo-ancho">Ancho (cm)</label>
            <input id="nuevo-ancho" name="ancho_cm" type="number" min="1" max="9999" step="0.1" required
                   value={datos.ancho_cm} onChange={cambiar} /></div>
          <div><label htmlFor="nuevo-alto">Alto (cm)</label>
            <input id="nuevo-alto" name="alto_cm" type="number" min="1" max="9999" step="0.1" required
                   value={datos.alto_cm} onChange={cambiar} /></div>
        </div>
        <p className="error-nuevo" role="alert">{error}</p>
        <div className="dialogo-botones">
          <button type="submit" className="primario" disabled={guardando}>Crear registro</button>
          <button type="button" onClick={onCerrar}>Cancelar</button>
        </div>
      </form>
    </dialog>
  )
}

/* ---------- Página ---------- */
export default function Panel() {
  useEstilosDePagina(estilos)
  const { usuario } = useAuth()
  const ahora = useReloj()
  const turno = TURNOS[usuario.turno]

  const [registros, setRegistros] = useState(null)       // null = cargando
  const [error, setError] = useState(false)
  const [busqueda, setBusqueda] = useState('')           // lo que se escribe
  const [termino, setTermino] = useState('')             // lo que se consultó
  const [version, setVersion] = useState(0)              // sube para recargar la tabla
  const [aviso, setAviso] = useState('')
  const [dialogoAbierto, setDialogoAbierto] = useState(false)

  const recargar = () => setVersion((v) => v + 1)

  useEffect(() => {
    let activo = true
    listarRegistrosPanel(termino)
      .then((filas) => { if (activo) { setRegistros(filas); setError(false) } })
      .catch((err) => { console.error('Error al cargar panel:', err); if (activo) setError(true) })
    return () => { activo = false }
  }, [termino, version])

  function buscar() {
    const t = busqueda.trim()
    if (t) setTermino(t)
  }
  function limpiar() {
    setBusqueda('')
    setTermino('')
  }

  async function cancelar(id) {
    if (!confirm('¿Estás seguro de marcar esta cotización como CANCELADA?')) return
    try { await cancelarCotizacion(id); recargar() }
    catch (err) { console.error(err); alert('Error al cancelar el registro.') }
  }

  async function eliminar(id) {
    if (!confirm('¿Eliminar definitivamente este registro de la base de datos?')) return
    try { await eliminarCotizacion(id); recargar() }
    catch (err) {
      if (err.status === 409) alert('No se puede eliminar: tiene historial de pagos. Cambie su estado a "cancelado".')
      else { console.error(err); alert('Error al eliminar.') }
    }
  }

  function alCrear({ codigo, monto }) {
    setDialogoAbierto(false)
    setAviso(`Registro ${codigo} creado por ${formatearSoles(monto)}. El cliente paga en caja con ese código.`)
    recargar()
  }

  let cuerpo
  if (registros === null) {
    cuerpo = (
      <tr><td colSpan={10} style={{ textAlign: 'center', padding: 20 }}>
        {error ? 'No se pudieron cargar los registros. Revisa tu conexión.' : 'Cargando…'}
      </td></tr>
    )
  } else if (registros.length === 0) {
    cuerpo = (
      <tr><td colSpan={10} style={{ textAlign: 'center', padding: 20 }}>No se encontraron registros.</td></tr>
    )
  } else {
    cuerpo = registros.map((r) => (
      <tr key={r.id}>
        <td style={{ fontWeight: 700 }}>{r.codigo_seguimiento}</td>
        <td>{r.cliente_base || r.nombre_remitente || '—'}</td>
        <td style={{ textTransform: 'capitalize' }}>{r.origen}</td>
        <td style={{ textTransform: 'capitalize' }}>{r.destino}</td>
        <td>{r.peso} kg</td>
        <td>{formatearSoles(Number(r.monto_calculado))}</td>
        <td><span className={`pago-badge pago-${r.estado_pago}`}>{etiquetaPago(r)}</span></td>
        <td>
          <div className="fecha-dia">{formatearFechaLima(r.fecha_registro)}</div>
          <div className="fecha-hora">{formatearHoraLima(r.fecha_registro)}</div>
        </td>
        <td><BadgeEstado estado={r.estado} /></td>
        <td>
          <div className="acciones-col">
            <Link to={`/actualizar?id=${r.id}`} className="btn-accion btn-editar">Editar</Link>
            {r.estado !== 'cancelado' && (
              <button type="button" className="btn-accion btn-cancelar" onClick={() => cancelar(r.id)}>Cancelar</button>
            )}
            <button type="button" className="btn-accion btn-eliminar" onClick={() => eliminar(r.id)}>Eliminar</button>
          </div>
        </td>
      </tr>
    ))
  }

  return (
    <>
      <main className="panel-container">
        <div className="panel-header">
          <h1>Panel Global de Envíos (CRUD)</h1>
          <span className="user-rol">
            {usuario.rol.toUpperCase() + (turno ? ` · ${turno.etiqueta.toUpperCase()}` : '')}
          </span>
        </div>
        <p className="panel-info">
          Hora de Perú: <strong>{formatearFechaLima(ahora)} {formatearHoraLima(ahora, true)}</strong>{' '}
          {turno && <span>Horario: {turno.horario} (hora de Perú)</span>}
        </p>
        <p className="aviso-panel" role="status" aria-live="polite">{aviso}</p>

        <div className="panel-herramientas">
          <div className="panel-buscador">
            <input type="text" placeholder="Buscar por código o cliente..." value={busqueda}
                   onChange={(e) => setBusqueda(e.target.value)}
                   onKeyDown={(e) => e.key === 'Enter' && buscar()} />
            <button type="button" className="panel-btn-consultar" onClick={buscar}>Consultar</button>
            {termino && <button type="button" className="panel-btn-limpiar" onClick={limpiar}>Limpiar</button>}
          </div>
          <button type="button" className="panel-btn-nuevo" onClick={() => setDialogoAbierto(true)}>
            + Crear Nuevo Registro
          </button>
        </div>

        <div className="tabla-wrapper">
          <table>
            <thead>
              <tr>
                <th>Código</th><th>Remitente</th><th>Origen</th><th>Destino</th><th>Peso</th>
                <th>Monto</th><th>Pago</th><th>Fecha y Hora (Perú)</th><th>Estado</th><th>Acciones</th>
              </tr>
            </thead>
            <tbody>{cuerpo}</tbody>
          </table>
        </div>
      </main>

      <DialogoNuevo abierto={dialogoAbierto} onCerrar={() => setDialogoAbierto(false)} onCreado={alCrear} />
    </>
  )
}