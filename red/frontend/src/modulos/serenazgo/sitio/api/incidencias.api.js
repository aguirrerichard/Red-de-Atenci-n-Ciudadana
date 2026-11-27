// serenazgo-react/src/services/api.js  (REEMPLAZA al actual; ya no hay SQL ni datos de prueba)
import { http } from './client.js';

export const API = {
  async obtenerIncidencias() {
    try {
      const { ok, datos } = await http('/incidencias');
      return ok ? datos : [];
    } catch {
      return [];
    }
  },

  // El monto lo calcula el servidor
  async crearIncidencia(nuevaAlerta) {
    try {
      const { ok, datos } = await http('/incidencias', { method: 'POST', body: nuevaAlerta });
      return ok
        ? { exito: true, ...datos }
        : { exito: false, mensaje: datos?.mensaje ?? 'No se pudo registrar.' };
    } catch {
      return { exito: false, mensaje: 'No se pudo conectar con el servidor.' };
    }
  },

  async actualizarEstadoIncidencia(codigo, nuevoEstado, respuesta) {
    try {
      const { ok, datos } = await http(`/incidencias/${encodeURIComponent(codigo)}/estado`, {
        method: 'PATCH',
        body: { estado: nuevoEstado, respuesta },
      });
      return ok ? { exito: true } : { exito: false, mensaje: datos?.mensaje };
    } catch {
      return { exito: false, mensaje: 'No se pudo conectar con el servidor.' };
    }
  },

  async eliminarIncidencia(codigo) {
    try {
      const { ok, datos } = await http(`/incidencias/${encodeURIComponent(codigo)}`, { method: 'DELETE' });
      return ok ? { exito: true } : { exito: false, mensaje: datos?.mensaje };
    } catch {
      return { exito: false, mensaje: 'No se pudo conectar con el servidor.' };
    }
  },
};
