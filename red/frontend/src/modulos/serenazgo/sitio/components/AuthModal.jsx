import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import "../styles/auth-modal.css"; // estilos propios del modal: así se ven igual en TODAS las páginas

export default function AuthModal() {
  const { modal, abrirModal, cerrarModal, login, registrar } = useAuth();
  const [mensaje, setMensaje] = useState("");
  const [f, setF] = useState({ nombre: "", correo: "", pass: "" });

  const cambiar = (e) => setF({ ...f, [e.target.name]: e.target.value });

  async function enviarLogin(e) {
    e.preventDefault();
    const r = await login(f.correo, f.pass);
    setMensaje(r.exito ? "" : r.mensaje);
  }

  async function enviarRegistro(e) {
    e.preventDefault();
    const r = await registrar(f.nombre, f.correo, f.pass);
    setMensaje(r.mensaje);
    if (r.exito) abrirModal("login");
  }

  return (
    <div
      className={`modal-overlay auth-modal-overlay ${modal ? "active" : ""}`}
      aria-hidden={!modal}
      onClick={(e) => e.target === e.currentTarget && cerrarModal()}
    >
      <div className="auth-modal-card" role="dialog" aria-modal="true">
        <button type="button" className="modal-close-btn auth-modal-close" aria-label="Cerrar modal" onClick={cerrarModal}>
          &times;
        </button>

        <div className="auth-modal-tabs auth-tabs">
          <button type="button" className={`auth-tab ${modal === "login" ? "active" : ""}`}
            onClick={() => { setMensaje(""); abrirModal("login"); }}>
            Iniciar Sesión
          </button>
          <button type="button" className={`auth-tab ${modal === "register" ? "active" : ""}`}
            onClick={() => { setMensaje(""); abrirModal("register"); }}>
            Crear Cuenta
          </button>
        </div>

        {modal === "register" ? (
          <form className="auth-form active" onSubmit={enviarRegistro}>
            <h2 className="auth-modal-title">Crear Cuenta</h2>
            <p className="auth-modal-subtitle auth-subtitle">Regístrate para enviar reportes y solicitar asistencia en tiempo real.</p>
            <div className="form-group auth-form-group">
              <label htmlFor="reg-nombre">Nombre completo</label>
              <input id="reg-nombre" name="nombre" required value={f.nombre} onChange={cambiar} placeholder="Joseph Buendia" />
            </div>
            <div className="form-group auth-form-group">
              <label htmlFor="reg-correo">Correo electrónico</label>
              <input id="reg-correo" name="correo" type="email" required value={f.correo} onChange={cambiar} placeholder="ejemplo@correo.com" />
            </div>
            <div className="form-group auth-form-group">
              <label htmlFor="reg-pass">Contraseña</label>
              <input id="reg-pass" name="pass" type="password" required minLength={4} value={f.pass} onChange={cambiar} placeholder="Mínimo 4 caracteres" />
            </div>
            {mensaje && <p className="auth-modal-subtitle auth-subtitle">{mensaje}</p>}
            <button type="submit" className="btn-submit-auth auth-submit-btn">Crear Cuenta</button>
          </form>
        ) : (
          <form className="auth-form active" onSubmit={enviarLogin}>
            <h2 className="auth-modal-title">Ingreso a la Central</h2>
            <p className="auth-modal-subtitle auth-subtitle">Accede con tu cuenta registrada de vecino o personal autorizado.</p>
            <div className="form-group auth-form-group">
              <label htmlFor="log-correo">Correo electrónico</label>
              <input id="log-correo" name="correo" type="email" required value={f.correo} onChange={cambiar} placeholder="ejemplo@correo.com" />
            </div>
            <div className="form-group auth-form-group">
              <label htmlFor="log-pass">Contraseña</label>
              <input id="log-pass" name="pass" type="password" required value={f.pass} onChange={cambiar} placeholder="••••••••" />
            </div>
            {mensaje && <p className="auth-modal-subtitle auth-subtitle">{mensaje}</p>}
            <button type="submit" className="btn-submit-auth auth-submit-btn">Ingresar a la Central</button>
          </form>
        )}
      </div>
    </div>
  );
}
