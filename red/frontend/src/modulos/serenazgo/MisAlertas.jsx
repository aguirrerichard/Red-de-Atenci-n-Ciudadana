import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { pedir } from '../../api/http.js';
import { useCarga } from '../../hooks/useCarga.js';
import Encabezado from '../../components/Encabezado.jsx';
import Hilo from '../../components/Hilo.jsx';
import Vacio from '../../components/Vacio.jsx';
import { verFecha } from '../../utils/formato.js';

export default function MisAlertas() {
  const { tokenDe } = useAuth();
  const token = tokenDe('integracion');
  const { datos, cargando, error, recargar } = useCarga(() => pedir('integracion', '/serenazgo/mis-alertas', { token }), [token]);
  return (
    <>
      <Encabezado modulo="serenazgo" titulo="Mis alertas" subtitulo="Cada alerta con la cita y el envío que generó.">
        <Link className="btn" to="/serenazgo/alerta">Pedir auxilio</Link>
      </Encabezado>
      {cargando || error || !datos?.length
        ? <Vacio cargando={cargando} error={error} onReintentar={recargar}>Aún no registraste alertas.</Vacio>
        : datos.map((a) => (
          <article key={a.id} className="registro">
            <p className="meta">{verFecha(a.fecha_registro)} · {a.ubicacion}</p>
            <p>{a.descripcion}</p>
            <Hilo alerta={a} />
          </article>
        ))}
    </>
  );
}
