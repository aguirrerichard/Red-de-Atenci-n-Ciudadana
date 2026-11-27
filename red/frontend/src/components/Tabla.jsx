// columnas: [{ t: 'Título', r: (fila) => contenido }]
export default function Tabla({ columnas, filas, clave = 'id', resaltar }) {
  return (
    <div className="tabla-scroll">
      <table className="tabla">
        <thead><tr>{columnas.map((c) => <th key={c.t} scope="col">{c.t}</th>)}</tr></thead>
        <tbody>
          {filas.map((f) => (
            <tr key={f[clave]} className={resaltar?.(f) ? 'resaltada' : ''}>
              {columnas.map((c) => <td key={c.t} data-label={c.t}>{c.r(f)}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
