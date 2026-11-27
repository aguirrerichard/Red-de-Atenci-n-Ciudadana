import { CIUDADES } from '../utils/ciudades.js'

export default function SelectCiudad({ textoInicial, ...props }) {
  const valor = props.value
  const fueraDeLista = valor && !CIUDADES.some(([v]) => v === valor)
  return (
    <select {...props}>
      {textoInicial && <option value="">{textoInicial}</option>}
      {CIUDADES.map(([v, nombre]) => <option key={v} value={v}>{nombre}</option>)}
      {fueraDeLista && <option value={valor}>{valor.charAt(0).toUpperCase() + valor.slice(1)}</option>}
    </select>
  )
}
