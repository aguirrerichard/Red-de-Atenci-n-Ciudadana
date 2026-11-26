import { createContext, useContext, useState } from "react";
import * as auth from "../api/auth.api.js";

import { avisarLogout, irAlLogin } from "../../../../puente.js";
const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(auth.obtenerUsuarioActual());
  const [modal, setModal] = useState(null); // null | "login" | "register"

  async function login(correo, contrasena) {
    const r = await auth.iniciarSesion(correo, contrasena);
    if (r.exito) {
      setUsuario(r.usuario);
      setModal(null);
    }
    return r;
  }

  function logout() {
    auth.cerrarSesion();
    setUsuario(null);
    avisarLogout(); // cierra también el login único de la red
  }

  return (
    <AuthContext.Provider
      value={{
        usuario,
        login,
        logout,
        registrar: auth.registrarUsuario,
        modal,
        abrirModal: (m) => (m === "login" ? irAlLogin() : setModal(m)), // el login es único para toda la red
        cerrarModal: () => setModal(null),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}