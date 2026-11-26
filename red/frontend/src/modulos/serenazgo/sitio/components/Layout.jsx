import { Outlet } from '../router.jsx';
import { useCambioDeRuta } from "../hooks/useCambioDeRuta";
import Header from "./Header";
import Footer from "./Footer";
import AuthModal from "./AuthModal";

// Estructura común de todas las páginas: cabecera, contenido (Outlet) y pie.
export default function Layout() {
  useCambioDeRuta();

  return (
    <>
      <a className="skip-link" href="#contenido">Saltar al contenido</a>
      <Header />
      <main id="contenido" tabIndex={-1}>
        <Outlet />
      </main>
      <Footer />
      <AuthModal />
    </>
  );
}
