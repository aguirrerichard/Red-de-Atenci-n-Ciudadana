// Datos del usuario y resumen para la pantalla de inicio
import { Router } from 'express';
import { pool } from '../db.js';
import { estadoEnvio } from '../utils/sql.js';
import { h } from '../utils/http.js';

const router = Router();
const PERSONAL = ['administrador', 'empleado'];

router.get('/yo', (req, res) => res.json(req.usuario));

router.get('/resumen', h(async (req, res) => {
  const { id, roles } = req.usuario;
  const { rows: [n] } = await pool.query(
    `SELECT
       (SELECT count(*) FROM public.alertas_auxilio WHERE id_usuario = $1)::int AS mis_alertas,
       (SELECT count(*) FROM public.alertas_auxilio WHERE id_usuario = $1 AND estado IN ('registrado','en_proceso','derivado'))::int AS mis_alertas_activas,
       (SELECT count(*) FROM public.alertas_auxilio WHERE estado = 'registrado')::int AS alertas_nuevas,
       (SELECT count(*) FROM public.alertas_auxilio a WHERE a.hay_heridos AND a.estado NOT IN ('derivado','rechazado','atendido')
           AND NOT EXISTS (SELECT 1 FROM public.citas_medicas c WHERE c.id_alerta = a.id))::int AS heridos_sin_derivar,

       (SELECT count(*) FROM public.citas_medicas WHERE id_usuario = $1)::int AS mis_citas,
       (SELECT count(*) FROM public.citas_medicas WHERE id_usuario = $1 AND estado NOT IN ('atendido','rechazado','cancelado'))::int AS mis_citas_pendientes,
       (SELECT count(*) FROM public.citas_medicas WHERE id_alerta IS NOT NULL AND estado NOT IN ('atendido','rechazado','cancelado'))::int AS derivadas_pendientes,
       (SELECT count(*) FROM public.citas_medicas c WHERE c.estado = 'atendido'
           AND NOT EXISTS (SELECT 1 FROM public.cotizaciones_envio e WHERE e.id_cita = c.id AND e.estado <> 'cancelado'))::int AS atendidas_sin_envio,

       (SELECT count(*) FROM public.reclamos_luz WHERE id_usuario = $1)::int AS mis_reclamos,
       (SELECT count(*) FROM public.reclamos_luz WHERE id_usuario = $1 AND estado IN ('registrado','en_proceso'))::int AS mis_reclamos_abiertos,
       (SELECT count(*) FROM public.reclamos_luz WHERE estado = 'registrado')::int AS reclamos_nuevos,

       (SELECT count(*) FROM public.cotizaciones_envio WHERE id_usuario = $1)::int AS mis_envios,
       (SELECT count(*) FROM public.cotizaciones_envio e WHERE e.id_usuario = $1
           AND ${estadoEnvio('e')} NOT IN ('entregado','cancelado'))::int AS mis_envios_en_curso,
       (SELECT count(*) FROM public.cotizaciones_envio e WHERE e.id_cita IS NOT NULL
           AND ${estadoEnvio('e')} NOT IN ('entregado','cancelado'))::int AS envios_hospital_activos`,
    [id]
  );

  // Cada módulo devuelve solo los números que le corresponden al rol del usuario
  const r = {};
  if (roles.serenazgo) r.serenazgo = PERSONAL.includes(roles.serenazgo)
    ? { alertas_nuevas: n.alertas_nuevas, heridos_sin_derivar: n.heridos_sin_derivar }
    : { mis_alertas: n.mis_alertas, activas: n.mis_alertas_activas };
  if (roles.hospital) r.hospital = PERSONAL.includes(roles.hospital)
    ? { derivadas_pendientes: n.derivadas_pendientes, atendidas_sin_envio: n.atendidas_sin_envio }
    : { mis_citas: n.mis_citas, pendientes: n.mis_citas_pendientes };
  if (roles.luz) r.luz = PERSONAL.includes(roles.luz)
    ? { reclamos_nuevos: n.reclamos_nuevos }
    : { mis_reclamos: n.mis_reclamos, abiertos: n.mis_reclamos_abiertos };
  if (roles.envios) r.envios = PERSONAL.includes(roles.envios)
    ? { envios_hospital_activos: n.envios_hospital_activos }
    : { mis_envios: n.mis_envios, en_curso: n.mis_envios_en_curso };
  res.json(r);
}));

export default router;
