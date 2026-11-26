import { Routes, Route } from './router.jsx'
import Layout from './components/Layout.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import Inicio from './pages/Inicio.jsx'
import Servicios from './pages/Servicios.jsx'
import Requisitos from './pages/Requisitos.jsx'
import Contacto from './pages/Contacto.jsx'
import ExpresoAereo from './pages/ExpresoAereo.jsx'
import EncomiendaTerrestre from './pages/EncomiendaTerrestre.jsx'
import CourierAgropecuario from './pages/CourierAgropecuario.jsx'
import Cotizador from './pages/Cotizador.jsx'
import Consulta from './pages/Consulta.jsx'
import Comprobante from './pages/Comprobante.jsx'
import Panel from './pages/Panel.jsx'
import Actualizar from './pages/Actualizar.jsx'
import Pago from './pages/Pago.jsx'
import Caja from './pages/Caja.jsx'

export default function Rutas() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Inicio />} />
        <Route path="/servicios" element={<Servicios />} />
        <Route path="/requisitos" element={<Requisitos />} />
        <Route path="/contacto" element={<Contacto />} />
        <Route path="/servicios/expreso-aereo" element={<ExpresoAereo />} />
        <Route path="/servicios/encomienda-terrestre" element={<EncomiendaTerrestre />} />
        <Route path="/servicios/courier-agropecuario" element={<CourierAgropecuario />} />

        <Route element={<ProtectedRoute roles={['cliente']} />}>
          <Route path="/cotizador" element={<Cotizador />} />
          <Route path="/consulta" element={<Consulta />} />
          <Route path="/pago" element={<Pago />} />
        </Route>

        <Route element={<ProtectedRoute roles={['administrador', 'empleado']} />}>
          <Route path="/panel" element={<Panel />} />
        </Route>

        <Route element={<ProtectedRoute roles={['cajero', 'administrador']} />}>
          <Route path="/caja" element={<Caja />} />
        </Route>

        <Route element={<ProtectedRoute roles={['cliente', 'administrador', 'empleado']} />}>
          <Route path="/actualizar" element={<Actualizar />} />
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route path="/comprobante" element={<Comprobante />} />
        </Route>
      </Route>
    </Routes>
  )
}
