import jwt from 'jsonwebtoken';
import { pool } from '../db.js';
import { AppError } from '../utils/http.js';

/*
 * Acepta el token de CUALQUIERA de los 4 backends (todos firman con el mismo JWT_SECRET).
 * Del token solo se usa el id: los roles se leen SIEMPRE de public.usuario_rol,
 * porque el "rol" de cada token solo vale para su propia app.
 */
export async function autenticar(req, res, next) {
  try {
    const [tipo, token] = (req.headers.authorization || '').split(' ');
    if (tipo !== 'Bearer' || !token) throw new AppError(401, 'Debes iniciar sesión.');

    let datos;
    try {
      datos = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] });
    } catch (e) {
      throw new AppError(401, e.name === 'TokenExpiredError' ? 'Tu sesión expiró. Inicia sesión de nuevo.' : 'Token inválido.');
    }
    if (!/^\d{1,9}$/.test(String(datos.id))) throw new AppError(401, 'Token inválido.');

    const { rows } = await pool.query(
      `SELECT u.id, u.nombre, u.correo, u.dni,
              COALESCE(json_object_agg(r.modulo, r.rol) FILTER (WHERE r.modulo IS NOT NULL), '{}') AS roles
         FROM public.usuarios u
         LEFT JOIN public.usuario_rol r ON r.id_usuario = u.id
        WHERE u.id = $1
        GROUP BY u.id`,
      [Number(datos.id)]
    );
    if (!rows[0]) throw new AppError(401, 'La cuenta ya no existe.');
    req.usuario = rows[0];
    next();
  } catch (e) {
    next(e);
  }
}

// rol('hospital', 'administrador', 'empleado') → solo pasa quien tenga ese rol EN ese módulo
export const rol = (modulo, ...permitidos) => (req, res, next) => {
  const suyo = req.usuario?.roles?.[modulo];
  if (!suyo || !permitidos.includes(suyo)) {
    return next(new AppError(403, `Esta acción requiere el rol ${permitidos.join(' o ')} en ${modulo}.`));
  }
  next();
};
