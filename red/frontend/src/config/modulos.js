// Las 4 entidades de la red. "base" es la ruta del proxy (vercel.json / vite.config.js).
export const MODULOS = {
  serenazgo: {
    nombre: 'Serenazgo Huancayo', corto: 'Serenazgo', base: '/api/serenazgo',
    color: '#E5492D', suave: '#FDECE8', sitio: 'https://s12-buendia-quispe-joseph.vercel.app/',
  },
  hospital: {
    nombre: 'Hospital Regional del Norte', corto: 'Hospital', base: '/api/hospital',
    color: '#0F766E', suave: '#E3F4F1', sitio: 'https://hospital-regional-norte.vercel.app/',
  },
  luz: {
    nombre: 'LuzCentro Perú', corto: 'LuzCentro', base: '/api/luz',
    color: '#E89A00', suave: '#FDF3DD', sitio: 'https://luzcentro-frontend.vercel.app/',
  },
  envios: {
    nombre: 'ExpressEnvíos Perú', corto: 'ExpressEnvíos', base: '/api/envios',
    color: '#3F4FB8', suave: '#E8EAF8', sitio: 'https://saenz-react.vercel.app/',
  },
};

export const INTEGRACION = '/api/integracion';
export const PERSONAL = ['administrador', 'empleado'];
export const esPersonal = (rol) => PERSONAL.includes(rol);

// Badges de estado: un color fijo por significado (leyenda UX de la presentación)
const VERDE = ['atendido', 'aprobado', 'pagado', 'entregado', 'programada', 'exonerado'];
const AMBAR = ['derivado', 'en_proceso', 'en proceso', 'en tránsito', 'en local', 'pendiente'];
const ROJO = ['rechazado', 'cancelado'];
export const tonoEstado = (e) =>
  VERDE.includes(e) ? 'verde' : AMBAR.includes(e) ? 'ambar' : ROJO.includes(e) ? 'rojo' : 'gris';
