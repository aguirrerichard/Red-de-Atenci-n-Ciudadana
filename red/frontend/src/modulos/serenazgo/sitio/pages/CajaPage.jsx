import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from '../router.jsx';
import { useAuth } from "../context/AuthContext";
import { useModal } from "../hooks/usePageStyles";
import { soles } from "../utils/formato";
import { etiqueta, fecha } from "../utils/panel";
import EstadoBadge from "../components/EstadoBadge";
import * as api from "../api/panel.api.js";

// Módulo de Caja: el cajero cobra en ventanilla (efectivo o POS) y el administrador además verifica los pagos.
export default function CajaPage() {
  const { usuario, abrirModal, logout } = useAuth();
  const puede = usuario?.rol === "cajero" || usuario?.rol === "administrador";
  const esAdmin = usuario?.rol === "administrador";

  const [tab, setTab] = useState("cobrar");
  const [pendientes, setPendientes] = useState([]);
  const [pagos, setPagos] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  const [aviso, setAviso] = useState("");
  const [cobro, setCobro] = useState(null); // solicitud que se está cobrando
  const [form, setForm] = useState({ metodo: "efectivo", monto_recibido: "", referencia: "" });
  const [errorModal, setErrorModal] = useState("");
  const [guardando, setGuardando] = useState(false);

  const logoutRef = useRef(logout);
  logoutRef.current = logout;

  const cargar = useCallback(async () => {
    setCargando(true);
    setError("");
    const [p, g] = await Promise.all([api.pendientesCaja(), api.listarPagos()]);
    if ([p, g].some((r) => r.status === 401)) { logoutRef.current(); return; } // sesión vencida
    setPendientes(p.exito ? p.datos : []);
    setPagos(g.exito ? g.datos : []);
    const fallo = [p, g].find((r) => !r.exito);
    if (fallo) setError(fallo.mensaje);
    setCargando(false);
  }, []);

  useEffect(() => { if (puede) cargar(); }, [puede, cargar]);

  const cerrarCobro = useCallback(() => setCobro(null), []);
  useModal(Boolean(cobro), cerrarCobro);

  function abrirCobro(reg) {
    setForm({ metodo: "efectivo", monto_recibido: "", referencia: "" });
    setErrorModal("");
    setCobro(reg);
  }

  const monto = Number(cobro?.monto_calculado ?? 0);
  const recibido = Number(form.monto_recibido);
  const vuelto = form.metodo === "efectivo" && recibido >= monto && monto > 0 ? recibido - monto : null;

  async function enviarCobro(e) {
    e.preventDefault();
    setGuardando(true);
    setErrorModal("");
    const body = {
      id_registro: cobro.id,
      metodo: form.metodo,
      ...(form.metodo === "efectivo" ? { monto_recibido: recibido } : { referencia: form.referencia.trim() }),
    };
    const r = await api.cobrarEnCaja(body);
    setGuardando(false);
    if (!r.exito) { setErrorModal(r.mensaje); return; }
    const p = r.datos.pago;
    setAviso(`Cobro registrado · ${p.codigo_operacion}${p.vuelto != null ? ` · vuelto ${soles(p.vuelto)}` : ""}`);
    setCobro(null);
    cargar();
  }

  async function verificar(p) {
    const r = await api.verificarPago(p.id);
    if (!r.exito) { setAviso(r.mensaje); return; } // p. ej. "No puedes verificar un pago que cobraste tú."
    setPagos((lista) => lista.map((x) => (x.id === p.id ? { ...x, verificado: true } : x)));
    setAviso(`Pago ${p.codigo_operacion} verificado.`);
  }

  // ---------- acceso ----------
  if (!usuario) {
    return (
      <section className="container pz-aviso-acceso">
        <h1>Módulo de Caja</h1>
        <p>Inicia sesión con una cuenta de cajero o administrador.</p>
        <button type="button" className="btn" onClick={() => abrirModal("login")}>Iniciar sesión</button>
      </section>
    );
  }
  if (!puede) {
    return (
      <section className="container pz-aviso-acceso">
        <h1>Acceso restringido</h1>
        <p>Tu rol ({usuario.rol}) no tiene permiso para usar la caja.</p>
        <Link to="/" className="btn btn-outline">Volver al inicio</Link>
      </section>
    );
  }

  const totalPendiente = pendientes.reduce((t, x) => t + Number(x.monto_calculado), 0);
  const sinVerificar = pagos.filter((x) => x.estado === "aprobado" && !x.verificado).length;

  return (
    <section className="container pz-panel">
      <header className="pz-cabecera">
        <div>
          <h1>Módulo de Caja</h1>
          <p className="pz-sub">Sesión de {usuario.nombre} · {usuario.rol}</p>
        </div>
        <button type="button" className="btn btn-outline" onClick={cargar} disabled={cargando}>
          {cargando ? "Actualizando…" : "Actualizar datos"}
        </button>
      </header>

      <div className="pz-metricas">
        <div className="pz-metrica"><strong>{pendientes.length}</strong><span>Solicitudes por cobrar</span></div>
        <div className="pz-metrica"><strong>{soles(totalPendiente)}</strong><span>Total pendiente</span></div>
        <div className="pz-metrica"><strong>{pagos.length}</strong><span>Pagos registrados</span></div>
        <div className="pz-metrica"><strong>{sinVerificar}</strong><span>Pagos sin verificar</span></div>
      </div>

      {error && <p className="pz-mensaje pz-error" role="alert">{error}</p>}
      {aviso && <p className="pz-mensaje" role="status">{aviso}</p>}

      <div className="pz-tabs" role="tablist">
        {[["cobrar", `Por cobrar (${pendientes.length})`], ["pagos", `Pagos registrados (${pagos.length})`]].map(([id, texto]) => (
          <button key={id} type="button" role="tab" aria-selected={tab === id}
            className={`pz-tab ${tab === id ? "activa" : ""}`} onClick={() => { setTab(id); setAviso(""); }}>{texto}</button>
        ))}
      </div>

      <div className="pz-tabla-wrap">
        {tab === "cobrar" && (
          <table className="pz-tabla">
            <thead><tr><th>Código</th><th>Vecino</th><th>DNI</th><th>Tipo</th><th>Monto</th><th>Fecha</th><th>Acción</th></tr></thead>
            <tbody>
              {pendientes.map((x) => (
                <tr key={x.id}>
                  <td className="pz-codigo">{x.codigo}</td>
                  <td>{x.cliente ?? "—"}</td>
                  <td>{x.dni ?? "—"}</td>
                  <td>{x.tipo_incidente}</td>
                  <td><strong>{soles(x.monto_calculado)}</strong></td>
                  <td>{fecha(x.fecha_registro)}</td>
                  <td><button type="button" className="pz-btn" onClick={() => abrirCobro(x)}>Cobrar</button></td>
                </tr>
              ))}
              {!pendientes.length && <tr><td colSpan={7} className="pz-vacio">{cargando ? "Cargando…" : "No hay solicitudes pendientes de cobro."}</td></tr>}
            </tbody>
          </table>
        )}

        {tab === "pagos" && (
          <table className="pz-tabla">
            <thead><tr><th>Operación</th><th>Solicitud</th><th>Canal</th><th>Método</th><th>Monto</th><th>Estado</th><th>Verificado</th><th>Fecha</th>{esAdmin && <th>Acción</th>}</tr></thead>
            <tbody>
              {pagos.map((x) => (
                <tr key={x.id}>
                  <td className="pz-codigo">{x.codigo_operacion}</td>
                  <td>{x.codigo_registro}</td>
                  <td>{x.canal}</td>
                  <td>{etiqueta(x.metodo)}{x.referencia && <><br /><small>{x.referencia}</small></>}</td>
                  <td>{soles(x.monto)}</td>
                  <td><EstadoBadge valor={x.estado} />{x.motivo_rechazo && <><br /><small>{x.motivo_rechazo}</small></>}</td>
                  <td>{x.estado !== "aprobado" ? "—" : x.verificado ? "Sí" : "Pendiente"}</td>
                  <td>{fecha(x.fecha_pago)}</td>
                  {esAdmin && (
                    <td>{x.estado === "aprobado" && !x.verificado && (
                      <button type="button" className="pz-btn" onClick={() => verificar(x)}>Verificar</button>
                    )}</td>
                  )}
                </tr>
              ))}
              {!pagos.length && <tr><td colSpan={esAdmin ? 9 : 8} className="pz-vacio">{cargando ? "Cargando…" : "Aún no hay pagos registrados."}</td></tr>}
            </tbody>
          </table>
        )}
      </div>

      {cobro && (
        <div className="pz-overlay" onClick={(e) => e.target === e.currentTarget && cerrarCobro()}>
          <form className="pz-modal" role="dialog" aria-modal="true" onSubmit={enviarCobro}>
            <h2>Cobrar {cobro.codigo}</h2>
            <dl className="pz-datos">
              <dt>Vecino</dt><dd>{cobro.cliente ?? "—"} {cobro.dni && `· DNI ${cobro.dni}`}</dd>
              <dt>Servicio</dt><dd>{cobro.tipo_incidente}</dd>
              <dt>Total a cobrar</dt><dd><strong>{soles(monto)}</strong></dd>
            </dl>

            <label htmlFor="cj-metodo">Método de pago</label>
            <select id="cj-metodo" value={form.metodo} onChange={(e) => setForm({ ...form, metodo: e.target.value })}>
              <option value="efectivo">Efectivo</option>
              <option value="pos">Tarjeta (POS)</option>
            </select>

            {form.metodo === "efectivo" ? (
              <>
                <label htmlFor="cj-recibido">Monto recibido (S/)</label>
                <input id="cj-recibido" type="number" min="0" step="0.01" required value={form.monto_recibido}
                  onChange={(e) => setForm({ ...form, monto_recibido: e.target.value })} />
                <p className="pz-sub">{vuelto !== null ? `Vuelto a entregar: ${soles(vuelto)}` : `Debe cubrir al menos ${soles(monto)}.`}</p>
              </>
            ) : (
              <>
                <label htmlFor="cj-ref">N.° de voucher del POS</label>
                <input id="cj-ref" required minLength={4} maxLength={30} value={form.referencia}
                  onChange={(e) => setForm({ ...form, referencia: e.target.value })} placeholder="Mínimo 4 caracteres" />
              </>
            )}

            {errorModal && <p className="pz-mensaje pz-error" role="alert">{errorModal}</p>}
            <div className="pz-modal-botones">
              <button type="button" className="btn btn-outline" onClick={cerrarCobro}>Cancelar</button>
              <button type="submit" className="btn" disabled={guardando}>{guardando ? "Registrando…" : "Confirmar cobro"}</button>
            </div>
          </form>
        </div>
      )}
    </section>
  );
}
