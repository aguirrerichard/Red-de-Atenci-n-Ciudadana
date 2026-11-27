import { tonoEstado } from '../config/modulos.js';
import { nombreEstado } from '../utils/formato.js';

export default function Badge({ estado }) {
  return <span className={'badge ' + tonoEstado(estado)}>{nombreEstado(estado)}</span>;
}
