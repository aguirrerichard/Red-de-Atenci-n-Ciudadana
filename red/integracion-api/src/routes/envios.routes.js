// ExpressEnvíos: panel con el origen de cada envío (los que vienen del Hospital llevan id_cita)
import { Router } from 'express';
import { pool } from '../db.js';
import { rol } from '../middlewares/auth.js';
import { estadoEnvio } from '../utils/sql.js';
import { h } from '../utils/http.js';

const router = Router();

router.get('/cotizaciones', rol('envios', 'administrador', 'empleado'), h(async (req, res) => {
  const soloHospital = req.query.origen === 'hospital';
  const { rows } = await pool.query(
    `SELECT e.id, e.codigo_seguimiento, e.nombre_remitente, e.origen, e.destino, e.peso_kg,
            e.monto_calculado, e.estado_pago, ${estadoEnvio('e')} AS estado, e.fecha_registro,
            e.id_cita, c.codigo_seguimiento AS cita_codigo, u.nombre AS cliente
       FROM public.cotizaciones_envio e
       LEFT JOIN public.citas_medicas c ON c.id = e.id_cita
       LEFT JOIN public.usuarios u ON u.id = e.id_usuario
      ${soloHospital ? 'WHERE e.id_cita IS NOT NULL' : ''}
      ORDER BY e.fecha_registro DESC, e.id DESC LIMIT 300`
  );
  res.json(rows);
}));

export default router;
