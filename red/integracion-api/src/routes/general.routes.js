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

  // Contadores EXTRA: cuentan TODO lo de cada entidad (afuera en la red + adentro en los "sitios completos").
  const opcional = async (sql, params = []) => {
    try { return (await pool.query(sql, params)).rows[0] ?? {}; }
    catch (e) { console.warn('[resumen] contador opcional omitido:', e.message); return {}; }
  };

  // Reportes internos de Serenazgo (/api/serenazgo/incidencias -> public.incidencias)
  const incTot = await opcional(`SELECT count(*)::int AS inc_total FROM public.incidencias`);
  const incAct = await opcional(
    `SELECT count(*)::int AS inc_activas FROM public.incidencias
      WHERE LOWER(COALESCE(estado, 'pendiente')) NOT IN ('atendido','rechazado','cerrado','resuelto','cancelado')`
  );

  const x = await opcional(
    `SELECT
       ((SELECT count(*) FROM public.alertas_auxilio) + ${incTot.inc_total ?? 0})::int AS alertas_total,
       ((SELECT count(*) FROM public.alertas_auxilio WHERE estado IN ('registrado','en_proceso','derivado')) + ${incAct.inc_activas ?? 0})::int AS alertas_activas,
       (SELECT count(*) FROM public.citas_medicas)::int AS citas_total,
       (SELECT count(*) FROM public.citas_medicas WHERE estado NOT IN ('atendido','rechazado','cancelado'))::int AS citas_pendientes,
       (SELECT count(*) FROM public.reclamos_luz)::int AS reclamos_total,
       (SELECT count(*) FROM public.reclamos_luz WHERE estado IN ('registrado','en_proceso'))::int AS reclamos_por_atender,
       (SELECT count(*) FROM public.reclamos_luz WHERE estado NOT IN ('registrado','en_proceso'))::int AS reclamos_cerrados_total,
       (SELECT count(*) FROM public.reclamos_luz WHERE id_usuario = $1 AND estado NOT IN ('registrado','en_proceso'))::int AS mis_reclamos_cerrados,
       (SELECT count(*) FROM public.cotizaciones_envio)::int AS envios_total,
       (SELECT count(*) FROM public.cotizaciones_envio e WHERE ${estadoEnvio('e')} NOT IN ('entregado','cancelado'))::int AS envios_activos,
       (SELECT count(*) FROM public.cotizaciones_envio e WHERE ${estadoEnvio('e')} = 'entregado')::int AS envios_entregados_total,
       (SELECT count(*) FROM public.cotizaciones_envio e WHERE e.id_usuario = $1 AND ${estadoEnvio('e')} = 'entregado')::int AS mis_envios_entregados`,
    [id]
  );
  const pagos = await opcional(
    `SELECT
       (SELECT count(*) FROM public.reclamos_luz WHERE estado_pago = 'pendiente' AND estado NOT IN ('rechazado','cancelado'))::int AS reclamos_pago_pendiente,
       (SELECT count(*) FROM public.reclamos_luz WHERE id_usuario = $1 AND estado_pago = 'pendiente' AND estado NOT IN ('rechazado','cancelado'))::int AS mis_reclamos_por_pagar,
       (SELECT count(*) FROM public.cotizaciones_envio WHERE estado_pago = 'pendiente' AND estado <> 'cancelado')::int AS envios_por_cobrar,
       (SELECT count(*) FROM public.cotizaciones_envio WHERE id_usuario = $1 AND estado_pago = 'pendiente' AND estado <> 'cancelado')::int AS mis_envios_por_pagar`,
    [id]
  );
  const m = { ...n, ...x, ...pagos };
  // Quita los contadores que no se pudieron calcular (undefined) para no mostrar huecos
  const solo = (o) => Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined && v !== null));

  // Devuelve los totales globales (afuera + adentro) tanto para personal como para cliente
  const r = {};
  if (roles.serenazgo) r.serenazgo = PERSONAL.includes(roles.serenazgo)
    ? solo({ alertas_nuevas: m.alertas_nuevas, alertas_activas: m.alertas_activas, heridos_sin_derivar: m.heridos_sin_derivar, alertas_total: m.alertas_total })
    : solo({ mis_alertas: m.alertas_total, activas: m.alertas_activas });
  if (roles.hospital) r.hospital = PERSONAL.includes(roles.hospital)
    ? solo({ citas_pendientes: m.citas_pendientes, citas_total: m.citas_total, derivadas_pendientes: m.derivadas_pendientes, atendidas_sin_envio: m.atendidas_sin_envio })
    : solo({ mis_citas: m.citas_total, pendientes: m.citas_pendientes });
  if (roles.luz) r.luz = PERSONAL.includes(roles.luz)
    ? solo({ reclamos_nuevos: m.reclamos_nuevos, reclamos_por_atender: m.reclamos_por_atender, reclamos_pago_pendiente: m.reclamos_pago_pendiente, reclamos_total: m.reclamos_total })
    : solo({ mis_reclamos: m.reclamos_total, abiertos: m.reclamos_por_atender, por_pagar: m.reclamos_pago_pendiente, cerrados: m.reclamos_cerrados_total });
  if (roles.envios) r.envios = PERSONAL.includes(roles.envios)
    ? solo({ envios_activos: m.envios_activos, envios_hospital_activos: m.envios_hospital_activos, envios_por_cobrar: m.envios_por_cobrar, envios_total: m.envios_total })
    : solo({ mis_envios: m.envios_total, en_curso: m.envios_activos, envios_por_pagar: m.envios_por_cobrar, entregados: m.envios_entregados_total });
  res.json(r);
}));

export default router;