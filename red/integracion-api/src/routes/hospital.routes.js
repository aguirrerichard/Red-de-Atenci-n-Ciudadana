// Hospital: citas con su origen (Serenazgo) y su envío (ExpressEnvíos)
// F3 · Resultados a domicilio (Cosme + Sáenz)
import { Router } from 'express';
import { pool, transaccion } from '../db.js';
import { rol } from '../middlewares/auth.js';
import { envioDeCita, CIUDADES, montoEnvio } from '../utils/sql.js';
import { codigoEnvio, exigir, falla, h, idValido, texto } from '../utils/http.js';

const router = Router();
const personal = rol('hospital', 'administrador', 'empleado');

const COLUMNAS = `
  c.id, c.codigo_seguimiento, c.id_usuario, c.nombre_paciente, c.dni, c.especialidad,
  c.fecha_preferida, c.estado, c.estado_pago, c.monto_calculado, c.tiene_sis, c.fecha_registro,
  c.id_alerta, a.codigo_seguimiento AS alerta_codigo, a.ubicacion AS alerta_ubicacion,
  a.descripcion AS alerta_descripcion,
  e.id AS envio_id, e.codigo_seguimiento AS envio_codigo, e.estado AS envio_estado, e.destino AS envio_destino`;

const DESDE = `
  FROM public.citas_medicas c
  LEFT JOIN public.alertas_auxilio a ON a.id = c.id_alerta
  ${envioDeCita('c')}`;

// Personal del Hospital: todas las citas (?origen=serenazgo para ver solo las derivadas)
router.get('/citas', personal, h(async (req, res) => {
  const where = req.query.origen === 'serenazgo' ? 'WHERE c.id_alerta IS NOT NULL' : '';
  const { rows } = await pool.query(`SELECT ${COLUMNAS} ${DESDE} ${where} ORDER BY c.id DESC LIMIT 300`);
  res.json(rows);
}));

// Paciente: sus citas, con la alerta que las originó y el envío de resultados
router.get('/mis-citas', h(async (req, res) => {
  const { rows } = await pool.query(
    `SELECT ${COLUMNAS} ${DESDE} WHERE c.id_usuario = $1 ORDER BY c.id DESC`,
    [req.usuario.id]
  );
  res.json(rows);
}));

// Detalle de una cita (personal del hospital o el propio paciente)
router.get('/citas/:id', h(async (req, res) => {
  const id = idValido(req.params.id);
  const { rows: [cita] } = await pool.query(`SELECT ${COLUMNAS} ${DESDE} WHERE c.id = $1`, [id]);
  const esPersonal = ['administrador', 'empleado'].includes(req.usuario.roles.hospital);
  if (!cita || (!esPersonal && cita.id_usuario !== req.usuario.id)) falla(404, 'Cita no encontrada.');
  res.json(cita);
}));

// ENVIAR RESULTADOS: desde una cita atendida se crea el envío en ExpressEnvíos con id_cita
router.post('/citas/:id/envio', personal, h(async (req, res) => {
  const id = idValido(req.params.id);
  const b = req.body ?? {};
  const origen = texto(b.origen).toLowerCase() || 'huancayo';
  const destino = texto(b.destino).toLowerCase();
  exigir(CIUDADES.includes(origen), 'La ciudad de origen no es válida.');
  exigir(CIUDADES.includes(destino), 'Elige una ciudad de destino válida.');
  exigir(origen !== destino, 'El origen y el destino deben ser distintos.');
  const medidas = {
    peso_kg: Number(b.peso_kg ?? 0.5),
    largo_cm: Number(b.largo_cm ?? 30),
    ancho_cm: Number(b.ancho_cm ?? 22),
    alto_cm: Number(b.alto_cm ?? 3),
  };
  exigir(Object.values(medidas).every((n) => Number.isFinite(n) && n > 0 && n <= 1000), 'Peso y medidas deben ser mayores que 0.');

  const envio = await transaccion(async (db) => {
    const { rows: [cita] } = await db.query('SELECT * FROM public.citas_medicas WHERE id = $1 FOR UPDATE', [id]);
    if (!cita) falla(404, 'Cita no encontrada.');
    if (cita.estado !== 'atendido') falla(409, 'Solo se pueden enviar resultados de una cita atendida.');
    const { rowCount } = await db.query(
      "SELECT 1 FROM public.cotizaciones_envio WHERE id_cita = $1 AND estado <> 'cancelado'",
      [id]
    );
    if (rowCount > 0) falla(409, 'Los resultados de esta cita ya tienen un envío activo.');

    const monto = montoEnvio(medidas);
    for (let intento = 0; intento < 3; intento++) {
      try {
        // id_usuario = el paciente: así el envío también aparece en "Mis envíos" de su cuenta
        const { rows } = await db.query(
          `INSERT INTO public.cotizaciones_envio
             (codigo_seguimiento, nombre_remitente, origen, destino, peso, peso_kg, largo_cm, ancho_cm, alto_cm,
              id_usuario, monto_calculado, estado_pago, estado, id_cita)
           VALUES ($1, 'Hospital Regional del Norte', $2, $3, $4, $4, $5, $6, $7, $8, $9, 'pendiente', 'registrado', $10)
           RETURNING id, codigo_seguimiento, origen, destino, monto_calculado, estado, id_cita`,
          [codigoEnvio(), origen, destino, medidas.peso_kg, medidas.largo_cm, medidas.ancho_cm, medidas.alto_cm,
            cita.id_usuario, monto, id]
        );
        return rows[0];
      } catch (e) {
        if (e.code !== '23505' || intento === 2) throw e;
      }
    }
  });

  res.status(201).json(envio);
}));

export default router;
