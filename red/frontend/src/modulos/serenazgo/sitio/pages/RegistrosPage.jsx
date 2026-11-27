import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from '../router.jsx';
import { useAuth } from "../context/AuthContext";
import { useModal } from "../hooks/usePageStyles";
import { soles } from "../utils/formato";
import { etiqueta, fecha } from "../utils/panel";
import EstadoBadge from "../components/EstadoBadge";
import * as api from "../api/panel.api.js";

// "Mis Registros / Pagos": el vecino ve sus reportes, paga en línea los pendientes y revisa su historial de pagos.
const VACIO = { numero: "", vencimiento: "", cvv: "", titular: "", proveedor: "andipay", celular: "", codigo_aprobacion: "" };

export default function RegistrosPage() {
  const { usuario, abrirModal, logout } = useAuth();
  const puede = usuario?.rol === "cliente";

  const [tab, setTab] = useState("registros");
  const [incidencias, setIncidencias] = useState([]);
  const [pagos, setPagos] = useState([]);
  const [alertas, setAlertas] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  const [aviso, setAviso] = useState("");
  const [pago, setPago] = useState(null); // solicitud que se está pagando
  const [metodo, setMetodo] = useState("tarjeta");
  const [f, setF] = useState(VACIO);
  const [errorModal, setErrorModal] = useState("");
  const [enviando, setEnviando] = useState(false);

  const logoutRef = useRef(logout);
  logoutRef.current = logout;

  const cargar = useCallback(async () => {
    setCargando(true);
    setError("");
    const [i, p, a] = await Promise.all([api.listarIncidencias(), api.listarPagos(), api.misAlertas()]);
    if ([i, p, a].some((r) => r.status === 401)) { logoutRef.current(); return; } // sesión vencida
    setIncidencias(i.exito ? i.datos : []);
    setPagos(p.exito ? p.datos : []);
    setAlertas(a.exito ? a.datos : []);
    const fallo = [i, p, a].find((r) => !r.exito);
    if (fallo) setError(fallo.mensaje);
    setCargando(false);
  }, []);

  useEffect(() => { if (puede) cargar(); }, [puede, cargar]);

  const cerrarPago = useCallback(() => setPago(null), []);
  useModal(Boolean(pago), cerrarPago);

  const cambiar = (e) => setF({ ...f, [e.target.name]: e.target.value });

  function abrirPago(inc) {
    setF(VACIO);
    setMetodo("tarjeta");
    setErrorModal("");
    setPago(inc);
  }

  async function enviarPago(e) {
    e.preventDefault();
    setEnviando(true);
    setErrorModal("");
    const r = metodo === "tarjeta"
      ? await api.pagarConTarjeta({ id_registro: pago.id, numero: f.numero, vencimiento: f.vencimiento, cvv: f.cvv, titular: f.titular.trim() })
      : await api.pagarConBilletera({ id_registro: pago.id, proveedor: f.proveedor, celular: f.celular, codigo_aprobacion: f.codigo_aprobacion });
    setEnviando(false);
    if (!r.exito) { // incluye el rechazo de la entidad (402): se muestra el motivo y se puede reintentar
      setErrorModal(r.mensaje);
      cargar(); // el intento rechazado también queda en el historial
      return;
    }
    setAviso(`Pago aprobado · ${r.datos.codigo} · ${soles(r.datos.monto)}`);
    setPago(null);
    cargar();
  }

  // ---------- acceso ----------
  if (!usuario) {
    return (
      <section className="container pz-aviso-acceso">
        <h1>Mis Registros / Pagos</h1>
        <p>Inicia sesión para ver tus reportes y pagos.</p>
        <button type="button" className="btn" onClick={() => abrirModal("login")}>Iniciar sesión</button>
      </section>
    );
  }
  if (!puede) {
    return (
      <section className="container pz-aviso-acceso">
        <h1>Esta sección es para vecinos</h1>
        <p>Tu rol ({usuario.rol}) gestiona los reportes desde su propio módulo.</p>
        <Link to="/" className="btn btn-outline">Volver al inicio</Link>
      </section>
    );
  }

  const porPagar = incidencias.filter((x) => x.estado_pago === "pendiente" && Number(x.monto_calculado) > 0);
  const totalPorPagar = porPagar.reduce((t, x) => t + Number(x.monto_calculado), 0);

  return (
    <section className="container pz-panel">
      <header className="pz-cabecera">
        <div>
          <h1>Mis Registros / Pagos</h1>
          <p className="pz-sub">{usuario.nombre}</p>
        </div>
        <div className="pz-acciones">
          <Link to="/reportar" className="btn">Nuevo reporte</Link>
          <button type="button" className="btn btn-outline" onClick={cargar} disabled={cargando}>
            {cargando ? "Actualizando…" : "Actualizar"}
          </button>
        </div>
      </header>

      <div className="pz-metricas">
        <div className="pz-metrica"><strong>{incidencias.length}</strong><span>Reportes realizados</span></div>
        <div className="pz-metrica"><strong>{porPagar.length}</strong><span>Pagos pendientes</span></div>
        <div className="pz-metrica"><strong>{soles(totalPorPagar)}</strong><span>Total por pagar</span></div>
      </div>

      {error && <p className="pz-mensaje pz-error" role="alert">{error}</p>}
      {aviso && <p className="pz-mensaje" role="status">{aviso}</p>}

      <div className="pz-tabs" role="tablist">
        {[["registros", `Mis reportes (${incidencias.length})`], ["alertas", `Mis alertas (${alertas.length})`], ["pagos", `Historial de pagos (${pagos.length})`]].map(([id, texto]) => (
          <button key={id} type="button" role="tab" aria-selected={tab === id}
            className={`pz-tab ${tab === id ? "activa" : ""}`} onClick={() => { setTab(id); setAviso(""); }}>{texto}</button>
        ))}
      </div>

      <div className="pz-tabla-wrap">
        {tab === "registros" && (
          <table className="pz-tabla">
            <thead><tr><th>Código</th><th>Tipo</th><th>Zona</th><th>Estado</th><th>Respuesta de la central</th><th>Pago</th><th>Fecha</th><th>Acción</th></tr></thead>
            <tbody>
              {incidencias.map((x) => (
                <tr key={x.codigo}>
                  <td className="pz-codigo">{x.codigo}</td>
                  <td>{x.tipo_incidente}</td>
                  <td>{x.suministro_zona}</td>
                  <td><EstadoBadge valor={x.estado} /></td>
                  <td className="pz-texto">{x.respuesta ?? "—"}</td>
                  <td><EstadoBadge valor={x.estado_pago} />{Number(x.monto_calculado) > 0 && <><br /><small>{soles(x.monto_calculado)}</small></>}</td>
                  <td>{fecha(x.fecha_registro)}</td>
                  <td>{x.estado_pago === "pendiente" && Number(x.monto_calculado) > 0 && (
                    <button type="button" className="pz-btn" onClick={() => abrirPago(x)}>Pagar</button>
                  )}</td>
                </tr>
              ))}
              {!incidencias.length && <tr><td colSpan={8} className="pz-vacio">{cargando ? "Cargando…" : "Todavía no has hecho ningún reporte."}</td></tr>}
            </tbody>
          </table>
        )}

        {tab === "alertas" && (
          <table className="pz-tabla">
            <thead><tr><th>Alerta</th><th>Ubicación</th><th>Estado</th><th>Heridos</th><th>Cita en el Hospital</th><th>Fecha</th></tr></thead>
            <tbody>
              {alertas.map((x) => (
                <tr key={x.codigo_alerta}>
                  <td className="pz-codigo">{x.codigo_alerta}</td>
                  <td>{x.ubicacion}</td>
                  <td><EstadoBadge valor={x.estado_alerta} /></td>
                  <td>{x.hay_heridos ? "Sí" : "No"}</td>
                  <td>{x.codigo_cita
                    ? <><span className="pz-codigo">{x.codigo_cita}</span> <EstadoBadge valor={x.estado_cita} /><br /><small>{x.especialidad}</small></>
                    : "—"}</td>
                  <td>{fecha(x.fecha_registro)}</td>
                </tr>
              ))}
              {!alertas.length && <tr><td colSpan={6} className="pz-vacio">{cargando ? "Cargando…" : "No tienes alertas de auxilio registradas."}</td></tr>}
            </tbody>
          </table>
        )}

        {tab === "pagos" && (
          <table className="pz-tabla">
            <thead><tr><th>Operación</th><th>Solicitud</th><th>Canal</th><th>Método</th><th>Monto</th><th>Estado</th><th>Fecha</th></tr></thead>
            <tbody>
              {pagos.map((x) => (
                <tr key={x.id}>
                  <td className="pz-codigo">{x.codigo_operacion}</td>
                  <td>{x.codigo_registro}</td>
                  <td>{x.canal}</td>
                  <td>{etiqueta(x.metodo)}{x.referencia && <><br /><small>{x.referencia}</small></>}</td>
                  <td>{soles(x.monto)}</td>
                  <td><EstadoBadge valor={x.estado} />{x.motivo_rechazo && <><br /><small>{x.motivo_rechazo}</small></>}</td>
                  <td>{fecha(x.fecha_pago)}</td>
                </tr>
              ))}
              {!pagos.length && <tr><td colSpan={7} className="pz-vacio">{cargando ? "Cargando…" : "Aún no tienes pagos registrados."}</td></tr>}
            </tbody>
          </table>
        )}
      </div>

      {pago && (
        <div className="pz-overlay" onClick={(e) => e.target === e.currentTarget && cerrarPago()}>
          <form className="pz-modal" role="dialog" aria-modal="true" onSubmit={enviarPago}>
            <h2>Pagar {pago.codigo}</h2>
            <p className="pz-sub">Total a pagar: <strong>{soles(pago.monto_calculado)}</strong> · {pago.tipo_incidente}</p>

            <div className="pz-tabs">
              {[["tarjeta", "Tarjeta"], ["billetera", "Billetera digital"]].map(([id, texto]) => (
                <button key={id} type="button" className={`pz-tab ${metodo === id ? "activa" : ""}`}
                  onClick={() => { setMetodo(id); setErrorModal(""); }}>{texto}</button>
              ))}
            </div>

            {metodo === "tarjeta" ? (
              <>
                <label htmlFor="pg-numero">Número de tarjeta</label>
                <input id="pg-numero" name="numero" required inputMode="numeric" autoComplete="cc-number" maxLength={23}
                  value={f.numero} onChange={cambiar} placeholder="4111 1111 1111 1111" />
                <div className="pz-fila">
                  <div>
                    <label htmlFor="pg-venc">Vencimiento (MM/AA)</label>
                    <input id="pg-venc" name="vencimiento" required pattern="\d{2}/\d{2}" maxLength={5}
                      value={f.vencimiento} onChange={cambiar} placeholder="08/29" />
                  </div>
                  <div>
                    <label htmlFor="pg-cvv">CVV</label>
                    <input id="pg-cvv" name="cvv" required inputMode="numeric" maxLength={4} type="password"
                      value={f.cvv} onChange={cambiar} placeholder="•••" />
                  </div>
                </div>
                <label htmlFor="pg-titular">Titular (como figura en la tarjeta)</label>
                <input id="pg-titular" name="titular" required minLength={5} maxLength={60}
                  value={f.titular} onChange={cambiar} placeholder="NOMBRE APELLIDO" />
              </>
            ) : (
              <>
                <label htmlFor="pg-prov">Billetera</label>
                <select id="pg-prov" name="proveedor" value={f.proveedor} onChange={cambiar}>
                  <option value="andipay">AndiPay</option>
                  <option value="pagomovil">PagoMóvil</option>
                </select>
                <label htmlFor="pg-cel">Celular afiliado</label>
                <input id="pg-cel" name="celular" required inputMode="numeric" maxLength={9}
                  value={f.celular} onChange={cambiar} placeholder="9XXXXXXXX" />
                <label htmlFor="pg-cod">Código de aprobación (6 dígitos)</label>
                <input id="pg-cod" name="codigo_aprobacion" required inputMode="numeric" maxLength={6} type="password"
                  value={f.codigo_aprobacion} onChange={cambiar} placeholder="••••••" />
              </>
            )}

            {errorModal && <p className="pz-mensaje pz-error" role="alert">{errorModal}</p>}
            <div className="pz-modal-botones">
              <button type="button" className="btn btn-outline" onClick={cerrarPago}>Cancelar</button>
              <button type="submit" className="btn" disabled={enviando}>{enviando ? "Procesando…" : `Pagar ${soles(pago.monto_calculado)}`}</button>
            </div>
          </form>
        </div>
      )}
    </section>
  );
}
