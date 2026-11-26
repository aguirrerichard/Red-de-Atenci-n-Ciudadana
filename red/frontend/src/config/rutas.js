import { MODULOS, esPersonal } from './modulos.js';

// Opciones de menú por módulo y rol: cliente → "Nuevo + Mis registros"; personal → "Panel"
export const OPCIONES = {
  serenazgo: {
    cliente: [['/serenazgo/alerta', 'Pedir auxilio'], ['/serenazgo/mis-alertas', 'Mis alertas']],
    personal: [['/serenazgo/panel', 'Panel de alertas']],
  },
  hospital: {
    cliente: [['/hospital/cita', 'Reservar cita'], ['/hospital/mis-citas', 'Mis citas']],
    personal: [['/hospital/panel', 'Panel de citas']],
  },
  luz: {
    cliente: [['/luz/reclamo', 'Nuevo reclamo'], ['/luz/mis-reclamos', 'Mis reclamos']],
    personal: [['/luz/panel', 'Panel de reclamos']],
  },
  envios: {
    cliente: [['/envios/cotizar', 'Cotizar envío'], ['/envios/mis-envios', 'Mis envíos']],
    personal: [['/envios/panel', 'Panel de envíos']],
  },
};

export const opcionesDe = (modulo, rol, rolHospital) => {
  const base = OPCIONES[modulo][esPersonal(rol) ? 'personal' : 'cliente'];
  // El admin del Hospital ve el estado de sus reclamos de luz sin salir de su app (F2)
  return modulo === 'hospital' && rol === 'administrador' ? [...base, ['/hospital/mis-tramites', 'Mis trámites']] : base;
};

// Nombre de cada página para las migas de pan "App › Página"
export const PAGINAS = {
  '/inicio': ['Red de Atención Ciudadana', 'Inicio'],
  '/serenazgo/alerta': ['serenazgo', 'Pedir auxilio'], '/serenazgo/mis-alertas': ['serenazgo', 'Mis alertas'], '/serenazgo/panel': ['serenazgo', 'Panel de alertas'],
  '/hospital/cita': ['hospital', 'Reservar cita'], '/hospital/mis-citas': ['hospital', 'Mis citas'], '/hospital/panel': ['hospital', 'Panel de citas'], '/hospital/mis-tramites': ['hospital', 'Mis trámites'],
  '/luz/reclamo': ['luz', 'Nuevo reclamo'], '/luz/mis-reclamos': ['luz', 'Mis reclamos'], '/luz/panel': ['luz', 'Panel de reclamos'],
  '/envios/cotizar': ['envios', 'Cotizar envío'], '/envios/mis-envios': ['envios', 'Mis envíos'], '/envios/panel': ['envios', 'Panel de envíos'],
};
export const moduloDeRuta = (ruta) => { const m = ruta.split('/')[1]; return MODULOS[m] ? m : null; };

// Páginas de cada SITIO ORIGINAL (montado en /<modulo>/sitio/...). Sirven para las migas "App › Página".
export const SITIO_PAGINAS = {
  serenazgo: { '/': 'Inicio', '/servicios': 'Servicios', '/como-funciona': 'Cómo funciona', '/reportar': 'Reportar incidente', '/contacto': 'Contacto', '/panel': 'Panel de incidencias', '/caja': 'Caja', '/actualizar': 'Mis registros' },
  hospital: { '/': 'Inicio', '/institucion': 'Institución', '/actualidad': 'Actualidad', '/servicios': 'Especialidades', '/como-funciona': 'Cómo pedir cita', '/contacto': 'Contacto', '/registro': 'Solicitar cita', '/consulta': 'Mis citas', '/actualizar': 'Actualizar cita', '/pago': 'Pago', '/comprobante': 'Comprobante', '/panel': 'Panel de gestión', '/caja': 'Caja', '/reportes': 'Reportes', '/usuarios': 'Usuarios y roles' },
  luz: { '/': 'Inicio', '/servicios': 'Servicios', '/requisitos': 'Requisitos', '/contacto': 'Contacto', '/tramites': 'Trámites', '/formulario': 'Formulario', '/actualizar': 'Actualizar trámite', '/pago': 'Pago', '/recibos': 'Recibos', '/pago-recibo': 'Pago de recibo', '/comprobante': 'Comprobante', '/caja': 'Caja', '/panel': 'Panel de gestión' },
  envios: { '/': 'Inicio', '/servicios': 'Servicios', '/servicios/expreso-aereo': 'Express Aéreo', '/servicios/encomienda-terrestre': 'Encomienda terrestre', '/servicios/courier-agropecuario': 'Courier agropecuario', '/requisitos': 'Requisitos', '/contacto': 'Contacto', '/cotizador': 'Cotizador', '/consulta': 'Mis envíos', '/pago': 'Pago', '/panel': 'Panel de gestión', '/caja': 'Caja', '/actualizar': 'Actualizar', '/comprobante': 'Comprobante' },
};

// "/hospital/sitio/consulta" → { modulo: 'hospital', subruta: '/consulta' }  (o null si no es un sitio original)
export function sitioDeRuta(pathname) {
  const m = pathname.match(/^\/(serenazgo|hospital|luz|envios)\/sitio(\/.*)?$/);
  return m ? { modulo: m[1], subruta: (m[2] || '/').replace(/(.)\/$/, '$1') } : null;
}

// Un sitio original por módulo, para el menú y el inicio
export const SITIO = (m) => `/${m}/sitio`;
