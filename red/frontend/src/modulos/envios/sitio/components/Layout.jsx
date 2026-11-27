import { Outlet } from '../router.jsx'
import Header from './Header.jsx'
import Footer from './Footer.jsx'
import ScrollToHash from './ScrollToHash.jsx'

export default function Layout() {
  return (
    <>
      <ScrollToHash />
      <Header />
      <Outlet />
      <Footer />
    </>
  )
}
