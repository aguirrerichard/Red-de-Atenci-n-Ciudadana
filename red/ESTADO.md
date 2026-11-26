# Estado del proyecto · Red de Atención Ciudadana (Grupo 2)

> **Nada se ha compilado ni ejecutado.** En esta sesión no había internet, así que no se pudo hacer `npm install`
> ni `npm run build`. Lo único que se comprobó es la **sintaxis** y que **todos los imports relativos existen**
> (con `tsc`). Lo primero que debes hacer es compilar y corregir lo que salga.

## 1. Qué se hizo en esta sesión (según tu petición: "conserva el diseño de cada página, no te olvides de ninguna")

**Idea:** en vez de reescribir las páginas, los **4 sitios originales se portaron completos** (todas sus páginas, su CSS,
sus hooks y su API) dentro de la app unificada, y se montaron como sub-rutas:

| Sitio original | Ruta en la app unificada | Páginas incluidas |
|---|---|---|
| Serenazgo (Buendía) | `/serenazgo/sitio/*` | inicio, servicios, cómo funciona, reportar, contacto, panel, caja, actualizar |
| Hospital (Cosme) | `/hospital/sitio/*` | inicio, institución, actualidad, servicios, cómo funciona, contacto, registro, consulta, actualizar, pago, comprobante, panel, caja, reportes, usuarios |
| LuzCentro (Aguirre) | `/luz/sitio/*` | inicio, servicios, requisitos, contacto, trámites, formulario, actualizar, pago, recibos, pago-recibo, comprobante, caja, panel |
| ExpressEnvíos (Sáenz / "Mark") | `/envios/sitio/*` | inicio, servicios (+ aéreo, terrestre, agropecuario), requisitos, contacto, cotizador, consulta, pago, caja, panel, actualizar, comprobante |

Cómo funciona (carpeta `frontend/src/modulos/<app>/sitio/`):
- **`router.jsx`** (uno por app): capa sobre `react-router-dom` que antepone `/<app>/sitio` a las rutas absolutas del original
  (`/panel` → `/hospital/sitio/panel`) y manda todo `/login` al login único. Los archivos originales solo cambiaron el import.
- **`Sitio.jsx`**: copia la sesión del login único a las llaves de `sessionStorage` que usaba ese sitio, e **inserta su CSS al entrar y lo retira al salir** (así los 4 diseños no se pisan).
- **`Rutas.jsx`**: el `App.jsx` original (sin su página de login).
- Parches mínimos en cada app: la API ahora va por el proxy (`/api/serenazgo`, `/api/hospital`, `/api/luz`, `/api/envios`), y su "cerrar sesión"/"401" avisa al login único (`src/puente.js`).
- `public/hospital/css/` (CSS del Hospital) y las 3 fotos de ExpressEnvíos (`aereo.jpg`, `terrestre.jpg`, `agropecuario.jpg`).
- **Shell unificado**: barra fina sobre cada sitio original con `← Red de Atención`, cambio rápido de app (la actual resaltada) y migas **App › Página** (UX-5); el menú lateral ahora tiene "Sitio completo de X". Todo el CSS del shell quedó bajo la clase `.ra` para no pisar a los sitios.
- `index.html` ahora carga las fuentes e íconos de los 4 sitios (Poppins, Fraunces, Public Sans, Space Grotesk, Font Awesome…).
- Se **mantienen** las páginas de integración de la GUIA (F1 `DerivarAlerta`, F2 `ReclamoLuzHospital`, F3 `EnviarResultados`, Inicio con "Hilo de atención", paneles/"Mis…" de cada módulo) hechas en la sesión anterior.

Las 4 pantallas de login originales se **reemplazan por el login único** (HU-0), por eso no están en la app.

## 2. Hallazgo importante (afecta F2 y el menú por roles)

**Ninguno de los 4 backends usa la tabla `usuario_rol`**: todos leen `usuarios.rol` en el login y firman ese rol en el JWT
(`luz`: `usuarios.repository.js`; `S13`: `usuarios.repository.js`; `hospital`: `usuariosRepository.js`; `server`: `usuarios.repository.js`).
La GUIA decía que F2 "funciona con lo que ya existe": **no es así**. El admin del Hospital entraría a LuzCentro con rol `administrador`, no `cliente`.

**Arreglo propuesto (pendiente, mismo patrón en los 4):** tras buscar al usuario en el login, consultar `usuario_rol`:
```js
// ejemplo (cambia 'luz' por serenazgo / hospital / envios en cada backend)
const { rows } = await pool.query('SELECT modulo, rol, turno FROM usuario_rol WHERE id_usuario = $1', [u.id]);
if (rows.length) { const r = rows.find(x => x.modulo === 'luz'); u.rol = r ? r.rol : null; if (r?.turno) u.turno = r.turno; }
// si u.rol queda null → responder 403 "Sin acceso a esta aplicación" (el login único lo muestra como "sin acceso")
```
Si el usuario no tiene filas en `usuario_rol`, se queda con `usuarios.rol` (así los clientes nuevos siguen funcionando).
Ojo con el **Hospital**: su middleware compara `actual.rol !== datos.rol`, así que aplica el mismo cambio también en `buscarPorId`.
Hay que redesplegar los 4 backends en Render.

## 3. Lo que falta (en orden)

### A. Obligatorio
1. `cd frontend && npm install && npm run build` y corregir errores. Revisa sobre todo:
   - que el `router.jsx` de cada sitio funcione (los `export *` + componentes que lo sobrescriben);
   - rutas con `<a href="/...">` crudos en Serenazgo (`InicioPage.jsx`) y LuzCentro (`Caja.jsx`): llevan `onClick` con `navigate`, pero verifica;
   - CSS de cada sitio (abre cada página y compara con su Vercel original).
2. Parchear los 4 backends con `usuario_rol` (sección 2) y ejecutar el SQL de la GUIA §6 en Neon.
3. Desplegar `integracion-api` en Render y pegar su URL en `frontend/vercel.json` (línea `CAMBIA-ESTO-integracion-api`). Crear su `.env` desde `.env.example`.
4. Subir `frontend/` a GitHub y desplegar en Vercel (Framework Vite, Root `frontend`).

### B. Integraciones dentro del diseño original (opcional pero recomendado)
- Hoy F1/F3 viven en las páginas unificadas (`/serenazgo/panel`, `/hospital/panel`), **no** dentro de los paneles originales
  (`/serenazgo/sitio/panel`, `/hospital/sitio/panel`). Si tu docente quiere ver el botón "Derivar a hospital" y "Enviar resultados" en el diseño original, hay que añadirlos a esos dos paneles reutilizando `integraciones/DerivarAlerta.jsx` y `EnviarResultados.jsx`.
- Hay dos paneles por módulo (el unificado y el original): decide cuál mostrar en la exposición.

### C. Cosas por verificar (supuestas, no probadas)
- Formas de respuesta del login de los 4 backends (`AuthContext.jsx`, función `normalizar`) y que `Sitio.jsx` escriba bien las llaves de sesión (`src/puente.js`). Serenazgo y ExpressEnvíos usan ambos la llave `usuario`: se reescribe al entrar a cada sitio.
- `MisEnvios` → Editar pide `GET /cotizaciones/:id` (¿devuelve `peso_kg, largo_cm, ancho_cm, alto_cm`?).
- `PanelCitas`: una cita derivada con `dni` nulo falla al cambiar de estado (el backend exige 8 dígitos).
- Turnos de empleados (Hospital/LuzCentro) y dictamen de "Monto excesivo" con pago pendiente (ver GUIA §5.6–5.7).
- El Hospital carga su CSS como `<link>` desde `/hospital/css/*.css` y los deja en `<head>` con `media="not all"` al salir; revisa que no se vea mezclado.
- Registro de cuentas nuevas: el login único no tiene "Crear cuenta". Serenazgo conserva su modal de registro; en los demás sitios no hay registro (decide si añadirlo al login único).

### D. Datos de la rúbrica
La BD ya parece traer ~3 registros por cliente (30 alertas, 33 citas, 35 cotizaciones). Falta comprobar: 10 clientes, 1 admin y 1 empleado por app, ≥3 registros enlazados por cada funcionalidad (F1, F2, F3), y las filas de `usuario_rol` de la rúbrica (Vecino: serenazgo+hospital cliente; Empleado Serenazgo: +hospital empleado; Admin Hospital: hospital admin + luz y envios cliente).

### E. Pruebas
Guion con 3 cuentas (GUIA §6): vecino pide auxilio con heridos → empleado deriva → vecino ve el hilo; admin Hospital reclama en LuzCentro → empleado dictamina → admin ve en Mis trámites; empleado Hospital marca atendido → Enviar resultados → envío "en tránsito" a los 2 min. No se escribieron pruebas automáticas ni eslint.

## 4. Herramientas
`herramientas/portar.py` y `parches.py` son los scripts que generaron `modulos/*/sitio` desde los repos originales
(por si quieres volver a portar una app después de cambiarla). Las rutas dentro de los scripts apuntan a la carpeta de trabajo de esta sesión; ajústalas si los usas.
