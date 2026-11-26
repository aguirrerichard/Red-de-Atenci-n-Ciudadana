import 'dotenv/config';
import pg from 'pg';

if (!process.env.DATABASE_URL) {
  throw new Error('Falta DATABASE_URL. Copia .env.example como .env y pega la cadena de Neon del grupo.');
}

// NUMERIC llega como texto: lo convertimos a número
pg.types.setTypeParser(1700, (v) => Number(v));
// timestamp sin zona horaria: lo devolvemos en ISO marcado como UTC
pg.types.setTypeParser(1114, (v) => v.replace(' ', 'T') + 'Z'); // Neon guarda now() en UTC
// date: se devuelve tal cual (AAAA-MM-DD), sin convertirlo a Date
pg.types.setTypeParser(1082, (v) => v);

const local = /@(localhost|127\.0\.0\.1)/.test(process.env.DATABASE_URL);

export const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: local || process.env.DB_SSL === 'false' ? false : { rejectUnauthorized: false },
  max: 4, // el plan gratuito de Neon admite pocas conexiones y ya hay 4 backends conectados
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 15_000,
});

pool.on('error', (e) => console.error('Conexión inactiva con Neon cerrada:', e.message));

// Todo o nada: si una consulta falla, se deshacen todas
export async function transaccion(trabajo) {
  const cliente = await pool.connect();
  try {
    await cliente.query('BEGIN');
    const r = await trabajo(cliente);
    await cliente.query('COMMIT');
    return r;
  } catch (e) {
    try { await cliente.query('ROLLBACK'); } catch { /* conexión rota */ }
    throw e;
  } finally {
    cliente.release();
  }
}
