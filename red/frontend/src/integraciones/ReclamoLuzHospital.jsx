import { useAuth } from '../context/AuthContext.jsx';
import NuevoReclamo from '../modulos/luz/NuevoReclamo.jsx';

// F2 · Mismo formulario de LuzCentro, pero si quien entra es el administrador del Hospital llega precargado
export default function ReclamoLuzHospital() {
  const { rolEn, usuario } = useAuth();
  if (rolEn('hospital') !== 'administrador') return <NuevoReclamo />;
  return (
    <NuevoReclamo
      banner="Tramitas como Hospital Regional del Norte, con tu misma cuenta de administrador."
      inicial={{ nombre: 'Hospital Regional del Norte', dni: usuario?.dni ?? '', motivo: 'Reclamo por Monto Excesivo' }}
      precargados={['nombre']}
      destino="/hospital/mis-tramites"
    />
  );
}
