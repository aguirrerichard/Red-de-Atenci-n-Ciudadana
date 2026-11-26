import { MODULOS } from '../config/modulos.js';

// Título de página + enlace al sitio original (cada app conserva su diseño completo)
export default function Encabezado({ modulo, titulo, subtitulo, children }) {
  const m = MODULOS[modulo];
  return (
    <div className="encabezado">
      <div>
        <h1>{titulo}</h1>
        {subtitulo && <p className="sub">{subtitulo}</p>}
      </div>
      <div className="acciones-enc">
        {children}
        {m && <a className="sitio" href={m.sitio} target="_blank" rel="noreferrer">Abrir sitio original ↗</a>}
      </div>
    </div>
  );
}
