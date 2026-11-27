import { Routes, Route } from './router.jsx';
import Layout from "./components/Layout";
import InicioPage from "./pages/InicioPage";
import ServiciosPage from "./pages/ServiciosPage";
import ComoFuncionaPage from "./pages/ComoFuncionaPage";
import ReportarPage from "./pages/ReportarPage";
import ContactoPage from "./pages/ContactoPage";
import PanelPage from "./pages/PanelPage";
import CajaPage from "./pages/CajaPage";
import RegistrosPage from "./pages/RegistrosPage";
import PendientePage from "./pages/PendientePage";

// Tabla de rutas: cada URL se asocia con una página dentro del Layout común.
export default function Rutas() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<InicioPage />} />
        <Route path="/servicios" element={<ServiciosPage />} />
        <Route path="/como-funciona" element={<ComoFuncionaPage />} />
        <Route path="/reportar" element={<ReportarPage />} />
        <Route path="/contacto" element={<ContactoPage />} />
        <Route path="/panel" element={<PanelPage />} />
        <Route path="/caja" element={<CajaPage />} />
        <Route path="/actualizar" element={<RegistrosPage />} />
        <Route path="*" element={<PendientePage titulo="Página no encontrada" />} />
      </Route>
    </Routes>
  );
}
