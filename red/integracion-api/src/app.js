import express from 'express';
import cors from 'cors';
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
