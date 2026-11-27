import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from './db.js';
import { autenticar } from './middlewares/auth.js';
import { AppError } from './utils/http.js';
import generalRoutes from './routes/general.routes.js';
import serenazgoRoutes from './routes/serenazgo.routes.js';
import hospitalRoutes from './routes/hospital.routes.js';
import enviosRoutes from './routes/envios.routes.js';

const app = express();
app.disable('x-powered-by');

const origenes = (process.env.CORS_ORIGINS || '').split(',').map((o) => o.trim()).filter(Boolean);
app.use(cors(origenes.length ? { origin: origenes } : undefined));
app.use(express.json({ limit: '32kb' }));

app.get('/', (req, res) => res.json({ servicio: 'API de integración · Grupo 2 · Red de Atención Ciudadana', salud: '/api/salud' }));
app.get('/api/salud', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ ok: true, servicio: 'Integración', bd: 'conectada' });
  } catch {
    res.status(503).json({ ok: false, servicio: 'Integración', bd: 'sin conexión' });
  }
});

// Registro ciudadano unificado (crea usuario + rol 'cliente' en los 4 módulos)
app.post('/api/registro', async (req, res, next) => {
  const client = await pool.connect();
  try {
    const nombre = String(req.body?.nombre || '').trim();
    const correo = String(req.body?.correo || '').trim().toLowerCase();
    const dni = String(req.body?.dni || '').trim() || null;
    const contrasena = String(req.body?.contrasena || req.body?.clave || '');

    if (!nombre) throw new AppError(400, 'Escribe tu nombre completo.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) throw new AppError(400, 'Ingresa un correo electrónico válido.');
    if (dni && !/^\d{8}$/.test(dni)) throw new AppError(400, 'El DNI debe tener 8 dígitos.');
    if (contrasena.length < 4) throw new AppError(400, 'La contraseña debe tener al menos 4 caracteres.');

    const { rows: cols } = await client.query(
      `SELECT column_name FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'usuarios'`
    );
    const nombresCol = cols.map((c) => c.column_name);
    const colClave = ['contrasena', 'contrasena_hash', 'password', 'password_hash', 'clave'].find((c) => nombresCol.includes(c));
    if (!colClave) throw new AppError(500, 'No se encontró la columna de contraseña en usuarios.');

    const existe = await client.query('SELECT id FROM public.usuarios WHERE LOWER(correo) = $1 LIMIT 1', [correo]);
    if (existe.rows[0]) throw new AppError(409, 'Ese correo ya está registrado. Inicia sesión.');

    const hash = await bcrypt.hash(contrasena, 10);

    await client.query('BEGIN');
    const columnas = ['nombre', 'correo', colClave];
    const valores = [nombre, correo, hash];
    if (nombresCol.includes('dni')) {
      columnas.push('dni');
      valores.push(dni);
    }
    if (nombresCol.includes('rol')) {
      columnas.push('rol');
      valores.push('cliente');
    }
    const placeholders = valores.map((_, i) => `$${i + 1}`).join(', ');
    const retorno = nombresCol.includes('dni') ? 'id, nombre, correo, dni' : 'id, nombre, correo';

    const { rows: [nuevo] } = await client.query(
      `INSERT INTO public.usuarios (${columnas.join(', ')}) VALUES (${placeholders}) RETURNING ${retorno}`,
      valores
    );

    for (const modulo of ['serenazgo', 'hospital', 'luz', 'envios']) {
      await client.query(
        `INSERT INTO public.usuario_rol (id_usuario, modulo, rol)
         VALUES ($1, $2, 'cliente')
         ON CONFLICT DO NOTHING`,
        [nuevo.id, modulo]
      );
    }
    await client.query('COMMIT');

    const token = jwt.sign({ id: nuevo.id, correo: nuevo.correo, rol: 'cliente' }, process.env.JWT_SECRET, { expiresIn: '12h' });
    res.status(201).json({ ok: true, token, usuario: { ...nuevo, rol: 'cliente' } });
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    if (err.code === '23505') return next(new AppError(409, 'El correo o DNI ya se encuentra registrado.'));
    next(err);
  } finally {
    client.release();
  }
});

// Todo lo demás exige sesión (token de cualquiera de las 4 apps)
app.use('/api', autenticar);
app.use('/api', generalRoutes);
app.use('/api/serenazgo', serenazgoRoutes);
app.use('/api/hospital', hospitalRoutes);
app.use('/api/envios', enviosRoutes);

app.use((req, res) => res.status(404).json({ mensaje: 'Ruta no encontrada.' }));

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  if (err instanceof AppError) return res.status(err.status).json({ mensaje: err.message });
  if (err.type === 'entity.parse.failed') return res.status(400).json({ mensaje: 'El cuerpo no es un JSON válido.' });
  if (err.code === '23503') return res.status(409).json({ mensaje: 'El registro está enlazado con otro y no se puede modificar.' });
  if (err.code === '23514') return res.status(400).json({ mensaje: 'Algún dato no cumple las reglas de la base de datos.' });
  console.error('Error de la API de integración:', err);
  res.status(500).json({ mensaje: 'Error interno del servidor.' });
});

export default app;