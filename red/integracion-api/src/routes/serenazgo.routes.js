// F1 · Alerta con heridos → cita de emergencia (Buendía + Cosme)
import { Router } from 'express';
import { pool, transaccion } from '../db.js';
import { rol } from '../middlewares/auth.js';
import { citaDeAlerta, envioDeCita, ESPECIALIDADES } from '../utils/sql.js';
import { codigoAlerta, codigoCita, exigir, falla, h, hoyLima, idValido, texto } from '../utils/http.js';

const router = Router();
const personal = rol('serenazgo', 'administrador', 'empleado');
const vecino = rol('serenazgo', 'cliente');

const COLUMNAS = `
  a.id, a.codigo_seguimiento, a.id_usuario, a.nombre_vecino, a.ubicacion, a.descripcion,
  a.estado, a.hay_heridos, a.fecha_registro,
  c.id AS cita_id, c.codigo_seguimiento AS cita_codigo, c.estado AS cita_estado,
  c.especialidad AS cita_especialidad, c.fecha_preferida AS cita_fecha,
  e.id AS envio_id, e.codigo_seguimiento AS envio_codigo, e.estado AS envio_estado`;

const DESDE = `FROM public.alertas_auxilio a ${citaDeAlerta('a')} ${envioDeCita('c')}`;

// Vecino: registra su alerta indicando si hay heridos
router.post('/alertas', vecino, h(async (req, res) => {
  const ubicacion = texto(req.body?.ubicacion);
  const descripcion = texto(req.body?.descripcion);
  exigir(ubicacion.length >= 5 && ubicacion.length <= 200, 'Escribe la ubicación (5 a 200 caracteres).');
  exigir(descripcion.length >= 5 && descripcion.length <= 1000, 'Describe lo que pasa (5 a 1000 caracteres).');
  const hayHeridos = req.body?.hay_heridos === true;

  for (let intento = 0; intento < 3; intento++) {
    try {
      const { rows } = await pool.query(
        `INSERT INTO public.alertas_auxilio (codigo_seguimiento, id_usuario, nombre_vecino, ubicacion, descripcion, hay_heridos)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id, codigo_seguimiento, estado, hay_heridos, fecha_registro`,
        [codigoAlerta(), req.usuario.id, req.usuario.nombre, ubicacion, descripcion, hayHeridos]
      );
      return res.status(201).json(rows[0]);
    } catch (e) {
      if (e.code !== '23505' || intento === 2) throw e; // código repetido: se reintenta
    }
  }
}));

// Vecino: sus alertas con la cita y el envío que generaron (un solo lugar)
router.get('/mis-alertas', h(async (req, res) => {
  const { rows } = await pool.query(
    `SELECT ${COLUMNAS} ${DESDE} WHERE a.id_usuario = $1 ORDER BY a.fecha_registro DESC, a.id DESC`,
    [req.usuario.id]
  );
  res.json(rows);
}));

// Personal de Serenazgo: panel de alertas
router.get('/alertas', personal, h(async (req, res) => {
  const filtros = [];
  const valores = [];
  if (req.query.estado) { valores.push(String(req.query.estado)); filtros.push(`a.estado = $${valores.length}`); }
  if (req.query.heridos === 'si') filtros.push('a.hay_heridos = true');
  const where = filtros.length ? `WHERE ${filtros.join(' AND ')}` : '';
  const { rows } = await pool.query(
    `SELECT ${COLUMNAS} ${DESDE} ${where} ORDER BY a.fecha_registro DESC, a.id DESC LIMIT 300`,
    valores
  );
  res.json(rows);
}));

// Personal: marca (o desmarca) que hay heridos
router.patch('/alertas/:id/heridos', personal, h(async (req, res) => {
  const id = idValido(req.params.id);
  exigir(typeof req.body?.hay_heridos === 'boolean', 'Indica hay_heridos: true o false.');
  const { rows } = await pool.query(
    `UPDATE public.alertas_auxilio SET hay_heridos = $2 WHERE id = $1
     RETURNING id, codigo_seguimiento, hay_heridos, estado`,
    [id, req.body.hay_heridos]
  );
  if (!rows[0]) falla(404, 'La alerta no existe.');
  res.json(rows[0]);
}));

// Personal: DERIVAR A HOSPITAL → crea la cita de emergencia enlazada con id_alerta
router.post('/alertas/:id/derivar', personal, h(async (req, res) => {
  const id = idValido(req.params.id);
  const especialidad = texto(req.body?.especialidad) || 'medicina-general';
  exigir(ESPECIALIDADES.includes(especialidad), 'Especialidad inválida.');
  const observacion = texto(req.body?.observacion).slice(0, 500);

  const resultado = await transaccion(async (db) => {
    const { rows: [alerta] } = await db.query(
      `SELECT a.*, u.dni AS dni_usuario
         FROM public.alertas_auxilio a
         LEFT JOIN public.usuarios u ON u.id = a.id_usuario
        WHERE a.id = $1 FOR UPDATE OF a`,
      [id]
    );
    if (!alerta) falla(404, 'La alerta no existe.');
    if (alerta.estado === 'rechazado') falla(409, 'No se puede derivar una alerta rechazada.');
    const { rowCount } = await db.query('SELECT 1 FROM public.citas_medicas WHERE id_alerta = $1', [id]);
    if (rowCount > 0) falla(409, 'Esta alerta ya fue derivada al Hospital.');

    const dni = /^\d{8}$/.test(alerta.dni_usuario || '') ? alerta.dni_usuario : null;
    const datos = {
      origen: 'serenazgo',
      codigo_alerta: alerta.codigo_seguimiento,
      ubicacion: alerta.ubicacion,
      motivo: alerta.descripcion,
      observacion: observacion || null,
      derivado_por: req.usuario.nombre,
    };

    let cita;
    for (let intento = 0; intento < 3 && !cita; intento++) {
      try {
        // Emergencia derivada: se atiende el mismo día y no se cobra (exonerado)
        const { rows } = await db.query(
          `INSERT INTO public.citas_medicas
             (codigo_seguimiento, id_usuario, nombre_paciente, dni, especialidad, fecha_preferida,
              tipo_consulta, tiene_sis, monto_calculado, estado_pago, estado, datos_solicitud, id_alerta)
           VALUES ($1, $2, $3, $4, $5, $6, $7, false, 0, 'exonerado', 'registrado', $8, $9)
           RETURNING id, codigo_seguimiento, estado, especialidad, fecha_preferida, id_alerta`,
          [codigoCita(), alerta.id_usuario, alerta.nombre_vecino || 'Paciente sin identificar', dni, especialidad,
            hoyLima(), especialidad === 'medicina-general' ? 'general' : 'especialidad', JSON.stringify(datos), id]
        );
        cita = rows[0];
      } catch (e) {
        if (e.code !== '23505' || intento === 2) throw e;
      }
    }

    const { rows: [actualizada] } = await db.query(
      `UPDATE public.alertas_auxilio SET estado = 'derivado', hay_heridos = true WHERE id = $1
       RETURNING id, codigo_seguimiento, estado, hay_heridos`,
      [id]
    );
    return { alerta: actualizada, cita };
  });

  res.status(201).json(resultado);
}));

export default router;
