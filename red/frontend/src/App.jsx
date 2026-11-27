import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import RutaProtegida from './components/RutaProtegida.jsx';
import Login from './pages/Login.jsx';
import Inicio from './pages/Inicio.jsx';
import PedirAuxilio from './modulos/serenazgo/PedirAuxilio.jsx';
import MisAlertas from './modulos/serenazgo/MisAlertas.jsx';
import PanelAlertas from './modulos/serenazgo/PanelAlertas.jsx';
import ReservarCita from './modulos/hospital/ReservarCita.jsx';
import MisCitas from './modulos/hospital/MisCitas.jsx';
import PanelCitas from './modulos/hospital/PanelCitas.jsx';
import MisTramites from './modulos/hospital/MisTramites.jsx';
import MisReclamos from './modulos/luz/MisReclamos.jsx';
import PanelReclamos from './modulos/luz/PanelReclamos.jsx';
import ReclamoLuzHospital from './integraciones/ReclamoLuzHospital.jsx';
import Cotizar from './modulos/envios/Cotizar.jsx';
import MisEnvios from './modulos/envios/MisEnvios.jsx';
import PanelEnvios from './modulos/envios/PanelEnvios.jsx';

// Los 4 sitios originales completos (todas sus páginas, con su diseño), cargados bajo demanda
const SitioSerenazgo = lazy(() => import('./modulos/serenazgo/sitio/Sitio.jsx'));
const SitioHospital = lazy(() => import('./modulos/hospital/sitio/Sitio.jsx'));
const SitioLuz = lazy(() => import('./modulos/luz/sitio/Sitio.jsx'));
const SitioEnvios = lazy(() => import('./modulos/envios/sitio/Sitio.jsx'));
const Cargando = <div className="ra"><p style={{ padding: 24 }} role="status">Cargando sitio…</p></div>;
const sitio = (path, modulo, el) => (
  <Route path={path} element={<RutaProtegida modulo={modulo}><Suspense fallback={Cargando}>{el}</Suspense></RutaProtegida>} />
);

const PERSONAL = ['administrador', 'empleado'];
const CLIENTE = ['cliente'];
const ruta = (path, modulo, roles, el) => <Route path={path} element={<RutaProtegida modulo={modulo} roles={roles}>{el}</RutaProtegida>} />;

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<div className="ra"><Login /></div>} />
      <Route element={<RutaProtegida><Layout /></RutaProtegida>}>
        <Route path="/inicio" element={<Inicio />} />

        {ruta('/serenazgo/alerta', 'serenazgo', CLIENTE, <PedirAuxilio />)}
        {ruta('/serenazgo/mis-alertas', 'serenazgo', CLIENTE, <MisAlertas />)}
        {ruta('/serenazgo/panel', 'serenazgo', PERSONAL, <PanelAlertas />)}

        {ruta('/hospital/cita', 'hospital', CLIENTE, <ReservarCita />)}
        {ruta('/hospital/mis-citas', 'hospital', CLIENTE, <MisCitas />)}
        {ruta('/hospital/panel', 'hospital', PERSONAL, <PanelCitas />)}
        {ruta('/hospital/mis-tramites', 'hospital', ['administrador'], <MisTramites />)}

        {ruta('/luz/reclamo', 'luz', CLIENTE, <ReclamoLuzHospital />)}
        {ruta('/luz/mis-reclamos', 'luz', CLIENTE, <MisReclamos />)}
        {ruta('/luz/panel', 'luz', PERSONAL, <PanelReclamos />)}

        {ruta('/envios/cotizar', 'envios', CLIENTE, <Cotizar />)}
        {ruta('/envios/mis-envios', 'envios', CLIENTE, <MisEnvios />)}
        {ruta('/envios/panel', 'envios', PERSONAL, <PanelEnvios />)}

        {sitio('/serenazgo/sitio/*', 'serenazgo', <SitioSerenazgo />)}
        {sitio('/hospital/sitio/*', 'hospital', <SitioHospital />)}
        {sitio('/luz/sitio/*', 'luz', <SitioLuz />)}
        {sitio('/envios/sitio/*', 'envios', <SitioEnvios />)}
      </Route>
      <Route path="*" element={<Navigate to="/inicio" replace />} />
    </Routes>
  );
}
