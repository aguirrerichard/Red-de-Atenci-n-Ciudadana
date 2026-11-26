import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from '../router.jsx';
import { useAuth } from "../context/AuthContext";
import { useModal } from "../hooks/usePageStyles";
import { soles } from "../utils/formato";
import * as api from "../api/panel.api.js";
import EstadoBadge from "../components/EstadoBadge";
import ConfirmarModal from "../components/ConfirmarModal";
import { etiqueta, fecha } from "../utils/panel";

// Panel de gestión: empleado y administrador ven incidencias, alertas de auxilio y mensajes de contacto.
const ESTADOS_INCIDENCIA = ["PENDIENTE", "EN_PROCESO", "ATENDIDO", "RECHAZADO"];
const ESTADOS_ALERTA = ["registrado", "en_proceso", "atendido", "rechazado"]; // "derivado" lo asigna la derivación al Hospital

export default function PanelPage() {
  const { usuario, abrirModal, logout } = useAuth();
  const puede = usuario?.rol === "administrador" || usuario?.rol === "empleado";

  const [tab, setTab] = useState("incidencias");
  const [incidencias, setIncidencias] = useState([]);
  const [alertas, setAlertas] = useState([]);
  const [mensajes, setMensajes] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  const [aviso, setAviso] = useState("");
  const [filtro, setFiltro] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [detalle, setDetalle] = useState(null); // incidencia abierta en el modal
  const [form, setForm] = useState({ estado: "PENDIENTE", respuesta: "" });
  const [guardando, setGuardando] = useState(false);
  const [confirmar, setConfirmar] = useState(null); // { tipo: "derivar" | "eliminar", item }
  const [ocupado, setOcupado] = useState(false);

  const logoutRef = useRef(logout);
  logoutRef.current = logout;

  const cargar = useCallback(async () => {
    setCargando(true);
    setError("");
    const [i, a, m] = await Promise.all([api.listarIncidencias(), api.listarAlertas(), api.listarMensajes()]);
    if ([i, a, m].some((r) => r.status === 401)) { logoutRef.current(); return; } // sesión vencida
    setIncidencias(i.exito ? i.datos : []);
    setAlertas(a.exito ? a.datos : []);
    setMensajes(m.exito ? m.datos : []);
    const fallo = [i, a, m].find((r) => !r.exito);
    if (fallo) setError(fallo.mensaje);
    setCargando(false);
  }, []);

  useEffect(() => { if (puede) cargar(); }, [puede, cargar]);

  const cerrarDetalle = useCallback(() => setDetalle(null), []);
  useModal(Boolean(detalle), cerrarDetalle);
  const cancelarConfirmar = useCallback(() => { if (!ocupado) setConfirmar(null); }, [ocupado]);

  function cambiarTab(t) { setTab(t); setFiltro(""); setBusqueda(""); setAviso(""); }

  const q = busqueda.trim().toLowerCase();
  const incidenciasVista = useMemo(() => incidencias.filter((x) =>
    (!filtro || x.estado === filtro) &&
    (!q || [x.codigo, x.cliente, x.dni, x.tipo_incidente, x.suministro_zona].some((c) => String(c ?? "").toLowerCase().includes(q)))
  ), [incidencias, filtro, q]);
  const alertasVista = useMemo(() => alertas.filter((x) =>
    (!filtro || x.estado === filtro) &&
    (!q || [x.codigo_seguimiento, x.nombre_vecino, x.ubicacion, x.descripcion].some((c) => String(c ?? "").toLowerCase().includes(q)))
  ), [alertas, filtro, q]);
  const mensajesVista = useMemo(() => mensajes.filter((x) =>
    !q || [x.nombres, x.apellidos, x.correo, x.asunto, x.mensaje].some((c) => String(c ?? "").toLowerCase().includes(q))
  ), [mensajes, q]);

  function abrirDetalle(inc) {
    setForm({ estado: inc.estado ?? "PENDIENTE", respuesta: "" });
    setDetalle(inc);
  }

  async function guardarIncidencia(e) {
    e.preventDefault();
    setGuardando(true);
    const r = await api.cambiarEstadoIncidencia(detalle.codigo, form.estado, form.respuesta.trim());
    setGuardando(false);
    if (!r.exito) { setAviso(r.mensaje); return; }
    setIncidencias((lista) => lista.map((x) => x.codigo === detalle.codigo
      ? { ...x, estado: form.estado, respuesta: form.respuesta.trim() || x.respuesta } : x));
    setAviso(`Incidencia ${detalle.codigo} actualizada.`);
    setDetalle(null);
  }

  async function borrarIncidencia(inc) {
    const r = await api.eliminarIncidencia(inc.codigo);
    if (!r.exito) { setAviso(r.mensaje); return; } // p. ej. 409: tiene pagos registrados
    setIncidencias((lista) => lista.filter((x) => x.codigo !== inc.codigo));
    setAviso(`Incidencia ${inc.codigo} eliminada.`);
  }

  async function cambiarAlerta(alerta, estado) {
    const r = await api.cambiarEstadoAlerta(alerta.codigo_seguimiento, estado);
    if (!r.exito) { setAviso(r.mensaje); return; }
    setAlertas((lista) => lista.map((x) => x.codigo_seguimiento === alerta.codigo_seguimiento ? { ...x, estado } : x));
    setAviso(`Alerta ${alerta.codigo_seguimiento}: ${etiqueta(estado)}.`);
  }

  async function ejecutarConfirmacion() {
    setOcupado(true);
    if (confirmar.tipo === "derivar") await derivar(confirmar.item);
    else await borrarIncidencia(confirmar.item);
    setOcupado(false);
    setConfirmar(null);
  }

  async function derivar(alerta) {
    const r = await api.derivarAlerta(alerta.codigo_seguimiento);
    if (!r.exito) { setAviso(r.mensaje); return; }
    setAlertas((lista) => lista.map((x) => x.codigo_seguimiento === alerta.codigo_seguimiento ? { ...x, estado: "derivado", hay_heridos: true } : x));
    setAviso(`Alerta ${alerta.codigo_seguimiento} derivada · cita de emergencia ${r.datos.codigo_cita}.`);
  }

  // ---------- acceso ----------
  if (!usuario) {
    return (
      <section className="container pz-aviso-acceso">
        <h1>Panel de gestión</h1>
        <p>Inicia sesión con una cuenta de personal para continuar.</p>
        <button type="button" className="btn" onClick={() => abrirModal("login")}>Iniciar sesión</button>
      </section>
    );
  }
  if (!puede) {
    return (
      <section className="container pz-aviso-acceso">
        <h1>Acceso restringido</h1>
        <p>Tu rol ({usuario.rol}) no tiene permiso para ver el panel de gestión.</p>
        <Link to="/" className="btn btn-outline">Volver al inicio</Link>
      </section>
    );
  }

  const pendientes = incidencias.filter((x) => x.estado === "PENDIENTE").length;
  const sinAtender = alertas.filter((x) => x.estado === "registrado").length;
  const derivadas = alertas.filter((x) => x.estado === "derivado").length;

  return (
    <section className="container pz-panel">
      <header className="pz-cabecera">
        <div>
          <h1>Panel de gestión</h1>
          <p className="pz-sub">Sesión de {usuario.nombre} · {usuario.rol}</p>
        </div>
        <button type="button" className="btn btn-outline" onClick={cargar} disabled={cargando}>
          {cargando ? "Actualizando…" : "Actualizar datos"}
        </button>
      </header>

      <div className="pz-metricas">
        <div className="pz-metrica"><strong>{pendientes}</strong><span>Incidencias pendientes</span></div>
        <div className="pz-metrica"><strong>{sinAtender}</strong><span>Alertas por atender</span></div>
        <div className="pz-metrica"><strong>{derivadas}</strong><span>Alertas derivadas</span></div>
        <div className="pz-metrica"><strong>{mensajes.length}</strong><span>Mensajes recibidos</span></div>
      </div>

      {error && <p className="pz-mensaje pz-error" role="alert">{error}</p>}
      {aviso && <p className="pz-mensaje" role="status">{aviso}</p>}

      <div className="pz-tabs" role="tablist">
        {[["incidencias", `Incidencias (${incidencias.length})`], ["alertas", `Alertas de auxilio (${alertas.length})`], ["mensajes", `Mensajes (${mensajes.length})`]].map(([id, texto]) => (
          <button key={id} type="button" role="tab" aria-selected={tab === id}
            className={`pz-tab ${tab === id ? "activa" : ""}`} onClick={() => cambiarTab(id)}>{texto}</button>
        ))}
      </div>

      <div className="pz-filtros">
        <input type="search" placeholder="Buscar…" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} aria-label="Buscar" />
        {tab === "incidencias" && (
          <select value={filtro} onChange={(e) => setFiltro(e.target.value)} aria-label="Filtrar por estado">
            <option value="">Todos los estados</option>
            {ESTADOS_INCIDENCIA.map((e) => <option key={e} value={e}>{etiqueta(e)}</option>)}
          </select>
        )}
        {tab === "alertas" && (
          <select value={filtro} onChange={(e) => setFiltro(e.target.value)} aria-label="Filtrar por estado">
            <option value="">Todos los estados</option>
            {[...ESTADOS_ALERTA, "derivado"].map((e) => <option key={e} value={e}>{etiqueta(e)}</option>)}
          </select>
        )}
      </div>

      <div className="pz-tabla-wrap">
        {tab === "incidencias" && (
          <table className="pz-tabla">
            <thead><tr><th>Código</th><th>Vecino</th><th>Tipo</th><th>Zona</th><th>Urgencia</th><th>Estado</th><th>Pago</th><th>Fecha</th><th>Acciones</th></tr></thead>
            <tbody>
              {incidenciasVista.map((x) => (
                <tr key={x.codigo}>
                  <td className="pz-codigo">{x.codigo}</td>
                  <td>{x.cliente ?? "—"}</td>
                  <td>{x.tipo_incidente}</td>
                  <td>{x.suministro_zona}</td>
                  <td>{x.urgencia ?? "—"}</td>
                  <td><EstadoBadge valor={x.estado} /></td>
                  <td><EstadoBadge valor={x.estado_pago} /> {Number(x.monto_calculado) > 0 && <small>{soles(x.monto_calculado)}</small>}</td>
                  <td>{fecha(x.fecha_registro)}</td>
                  <td className="pz-acciones">
                    <button type="button" className="pz-btn" onClick={() => abrirDetalle(x)}>Gestionar</button>
                    <button type="button" className="pz-btn pz-peligro" onClick={() => setConfirmar({ tipo: "eliminar", item: x })}>Eliminar</button>
                  </td>
                </tr>
              ))}
              {!incidenciasVista.length && <tr><td colSpan={9} className="pz-vacio">{cargando ? "Cargando…" : "No hay incidencias con ese filtro."}</td></tr>}
            </tbody>
          </table>
        )}

        {tab === "alertas" && (
          <table className="pz-tabla">
            <thead><tr><th>Código</th><th>Vecino</th><th>Ubicación</th><th>Descripción</th><th>Heridos</th><th>Estado</th><th>Fecha</th><th>Cambiar estado</th></tr></thead>
            <tbody>
              {alertasVista.map((x) => (
                <tr key={x.codigo_seguimiento}>
                  <td className="pz-codigo">{x.codigo_seguimiento}</td>
                  <td>{x.nombre_vecino ?? "Anónimo"}</td>
                  <td>{x.ubicacion}</td>
                  <td className="pz-texto">{x.descripcion}</td>
                  <td>{x.hay_heridos === undefined ? "—" : x.hay_heridos ? "Sí" : "No"}</td>
                  <td><EstadoBadge valor={x.estado} /></td>
                  <td>{fecha(x.fecha_registro)}</td>
                  <td>
                    {x.estado === "derivado" ? <small>Derivada al hospital</small> : (
                      <div className="pz-acciones">
                        <select value={x.estado} onChange={(e) => cambiarAlerta(x, e.target.value)} aria-label={`Estado de ${x.codigo_seguimiento}`}>
                          {ESTADOS_ALERTA.map((e) => <option key={e} value={e}>{etiqueta(e)}</option>)}
                        </select>
                        {(x.estado === "registrado" || x.estado === "en_proceso") && (
                          <button type="button" className="pz-btn" onClick={() => setConfirmar({ tipo: "derivar", item: x })}>Derivar a hospital</button>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {!alertasVista.length && <tr><td colSpan={8} className="pz-vacio">{cargando ? "Cargando…" : "No hay alertas con ese filtro."}</td></tr>}
            </tbody>
          </table>
        )}

        {tab === "mensajes" && (
          <table className="pz-tabla">
            <thead><tr><th>Fecha</th><th>Nombre</th><th>Contacto</th><th>Asunto</th><th>Mensaje</th></tr></thead>
            <tbody>
              {mensajesVista.map((x) => (
                <tr key={x.id}>
                  <td>{fecha(x.fecha_envio)}</td>
                  <td>{x.nombres} {x.apellidos}</td>
                  <td>{x.correo}<br /><small>{x.telefono}</small></td>
                  <td>{x.asunto}</td>
                  <td className="pz-texto">{x.mensaje}</td>
                </tr>
              ))}
              {!mensajesVista.length && <tr><td colSpan={5} className="pz-vacio">{cargando ? "Cargando…" : "No hay mensajes."}</td></tr>}
            </tbody>
          </table>
        )}
      </div>

      <ConfirmarModal
        abierto={Boolean(confirmar)}
        peligro={confirmar?.tipo === "eliminar"}
        ocupado={ocupado}
        titulo={confirmar?.tipo === "derivar" ? "Derivar al Hospital" : "Eliminar incidencia"}
        texto={confirmar?.tipo === "derivar"
          ? `Se creará una cita de emergencia en el Hospital para la alerta ${confirmar?.item.codigo_seguimiento} (${confirmar?.item.ubicacion}). La alerta pasará a «derivado».`
          : `Vas a eliminar la incidencia ${confirmar?.item?.codigo}. Esta acción no se puede deshacer.`}
        textoBoton={confirmar?.tipo === "derivar" ? "Derivar a hospital" : "Eliminar"}
        onConfirmar={ejecutarConfirmacion}
        onCancelar={cancelarConfirmar}
      />

      {detalle && (
        <div className="pz-overlay" onClick={(e) => e.target === e.currentTarget && cerrarDetalle()}>
          <form className="pz-modal" role="dialog" aria-modal="true" onSubmit={guardarIncidencia}>
            <h2>Incidencia {detalle.codigo}</h2>
            <dl className="pz-datos">
              <dt>Vecino</dt><dd>{detalle.cliente ?? "—"} {detalle.dni && `· DNI ${detalle.dni}`}</dd>
              <dt>Teléfono</dt><dd>{detalle.telefono ?? "—"}</dd>
              <dt>Tipo</dt><dd>{detalle.tipo_incidente}</dd>
              <dt>Zona</dt><dd>{detalle.suministro_zona}</dd>
              <dt>Descripción</dt><dd>{detalle.sustento}</dd>
              <dt>Unidad</dt><dd>{detalle.unidad ?? "—"}</dd>
              <dt>Respuesta actual</dt><dd>{detalle.respuesta ?? "—"}</dd>
            </dl>
            <label htmlFor="pz-estado">Estado</label>
            <select id="pz-estado" value={form.estado} onChange={(e) => setForm({ ...form, estado: e.target.value })}>
              {ESTADOS_INCIDENCIA.map((e) => <option key={e} value={e}>{etiqueta(e)}</option>)}
            </select>
            <label htmlFor="pz-resp">Nueva respuesta al vecino (opcional)</label>
            <textarea id="pz-resp" rows={3} maxLength={500} value={form.respuesta}
              onChange={(e) => setForm({ ...form, respuesta: e.target.value })} placeholder="Se envió la unidad Móvil-01…" />
            <div className="pz-modal-botones">
              <button type="button" className="btn btn-outline" onClick={cerrarDetalle}>Cancelar</button>
              <button type="submit" className="btn" disabled={guardando}>{guardando ? "Guardando…" : "Guardar cambios"}</button>
            </div>
          </form>
        </div>
      )}
    </section>
  );
}
