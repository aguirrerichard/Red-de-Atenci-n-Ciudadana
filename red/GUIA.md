# Grupo 2 · Red de Atención Ciudadana · Guía para terminar el proyecto

## 1. Qué está hecho y qué falta

| Parte | Estado |
|---|---|
| `integracion-api/` (backend nuevo para F1 y F3) | **Terminado y probado** contra una copia local del esquema de Neon |
| `frontend/vercel.json` y `vite.config.js` (proxy a los 5 backends) | Terminado |
| `frontend/src/api/http.js` (peticiones, errores unificados, reintento si Render duerme) | Terminado |
| `frontend/src/context/AuthContext.jsx` (login único en los 4 backends) | Terminado |
| `frontend/src/config/modulos.js` (colores, rutas, badges) | Terminado |
| Componentes, layout, páginas de los módulos e integraciones | **Falta** (sección 5) |

### Lo que descubrí al revisar la BD y los backends (importante para la sustentación)

- La BD ya tiene `usuario_rol`, `citas_medicas.id_alerta` y `cotizaciones_envio.id_cita`, pero **ningún backend las usaba**.
- Serenazgo no guarda `hay_heridos` al crear una alerta y no tiene un endpoint de "mis alertas".
- ExpressEnvíos no conoce `id_cita`.
- **F2 (Hospital → LuzCentro) funciona con lo que ya existe:** el admin del Hospital inicia sesión en LuzCentro con rol `cliente` (sale de `usuario_rol`) y registra el reclamo con su mismo `id_usuario`.
- Por eso escribí la **API de integración**: un backend aparte que resuelve F1 y F3 **sin tocar ninguno de los 4 backends que ya funcionan**.

---

## 2. Arquitectura final

```
 Navegador ──► Vercel (app React unificada)
                 │  vercel.json reenvía (proxy, sin CORS):
                 ├─ /api/serenazgo/*   → s13-buendiaquispe-josephleonardo.onrender.com/api/*
                 ├─ /api/hospital/*    → hospital-backend-h077.onrender.com/api/*
                 ├─ /api/luz/*         → luzcentro-backend.onrender.com/api/*
                 ├─ /api/envios/*      → server-zpof.onrender.com/api/*
                 └─ /api/integracion/* → (nuevo) integracion-api.onrender.com/api/*
                                   todos ──► 1 sola BD Neon
```

**¿Por qué un proxy?** El backend del Hospital solo acepta un origen en CORS (`FRONTEND_URL`), y los demás solo aceptan su propio Vercel. Con el proxy, el navegador solo habla con el dominio de la app unificada, así que **no hay que cambiar el CORS de ningún backend**.

**Login único:** `AuthContext` envía el mismo correo y contraseña a los 4 `/auth/login` a la vez. Cada backend devuelve **su** token con **su** rol. Si uno responde 401, ese usuario no tiene rol en esa app y la app no aparece en su menú. Para la API de integración sirve cualquiera de esos tokens (todos comparten `JWT_SECRET`), y esa API lee los roles directamente de `usuario_rol`.

---

## 3. Desplegar la API de integración (unos 10 minutos)

1. Sube la carpeta `integracion-api/` a un repo nuevo de GitHub (el `.gitignore` ya excluye el `.env`).
2. En Render: **New → Web Service**, elige el repo y configura:
   - Build command: `npm install`
   - Start command: `npm start`
   - Variables de entorno:
     - `DATABASE_URL` = la **misma** de los 4 backends
     - `JWT_SECRET` = el **mismo** de los 4 backends
3. Abre `https://TU-URL.onrender.com/api/salud`. Debe responder `{"ok":true,"bd":"conectada"}`.
4. Copia esa URL en `frontend/vercel.json`, en la línea que dice `CAMBIA-ESTO-integracion-api`.

**Para probarla en local:** `cd integracion-api`, `cp .env.example .env`, completa el `.env`, `npm install` y `npm run dev` (queda en el puerto 4000).

### Endpoints (todos exigen `Authorization: Bearer <token de cualquier app>`)

| Método y ruta | Quién | Qué hace |
|---|---|---|
| `GET /api/yo` | todos | Usuario + `roles` (`{hospital:'administrador', luz:'cliente', …}`) |
| `GET /api/resumen` | todos | Contadores para el inicio, según el rol en cada módulo |
| `POST /api/serenazgo/alertas` | cliente serenazgo | Crea una alerta. Body: `{ubicacion, descripcion, hay_heridos}` |
| `GET /api/serenazgo/mis-alertas` | todos | Sus alertas con `cita_*` y `envio_*` enlazados (HU-2.4) |
| `GET /api/serenazgo/alertas?heridos=si&estado=` | personal serenazgo | Panel de alertas con su cita |
| `PATCH /api/serenazgo/alertas/:id/heridos` | personal serenazgo | Body: `{hay_heridos: true}` |
| `POST /api/serenazgo/alertas/:id/derivar` | personal serenazgo | **F1:** crea la cita con `id_alerta` y pasa la alerta a `derivado`. Body opcional: `{especialidad, observacion}`. Si ya estaba derivada, responde 409 |
| `GET /api/hospital/citas?origen=serenazgo` | personal hospital | Citas con `alerta_*` (origen Serenazgo) y `envio_*` |
| `GET /api/hospital/mis-citas` | todos | Citas del paciente con su alerta y su envío |
| `GET /api/hospital/citas/:id` | personal o dueño | Detalle de la cita |
| `POST /api/hospital/citas/:id/envio` | personal hospital | **F3:** solo si la cita está `atendido`. Body: `{destino, origen?='huancayo', peso_kg?, largo_cm?, ancho_cm?, alto_cm?}`. Crea `cotizaciones_envio` con `id_cita`; si ya hay un envío activo, responde 409 |
| `GET /api/envios/cotizaciones?origen=hospital` | personal envíos | Panel con `id_cita` y `cita_codigo` |

**Reglas que aplica:**
- La cita derivada se crea con `estado='registrado'`, fecha de hoy, `estado_pago='exonerado'`, y en `datos_solicitud` se guarda `{origen:'serenazgo', codigo_alerta, …}`.
- El envío se crea a nombre del paciente (`id_usuario` = paciente), así también le aparece en "Mis envíos" de ExpressEnvíos.
- El monto se calcula con el mismo tarifario de ExpressEnvíos.
- Las ciudades válidas son la lista de `utils/sql.js`, la misma que usa ExpressEnvíos.
- Los estados de envío se calculan igual que en ExpressEnvíos: avanzan solos a "en tránsito" a los 2 min, "en local" a los 3 y "entregado" a los 4.

---

## 4. Montar el frontend

```bash
npm create vite@latest   # no hace falta: ya están package.json, index.html y vite.config.js
cd frontend
npm install
npm run dev              # http://localhost:5173 (para la integración local: INTEGRACION_URL=http://localhost:4000)
```

En Vercel: importa el repo con **Framework: Vite** y **Root: frontend**. No necesita variables de entorno: las URLs están en `vercel.json`.

**Cómo usar lo que ya está hecho:**

```jsx
// main.jsx
<BrowserRouter><AuthProvider><App /></AuthProvider></BrowserRouter>

// en cualquier página
const { usuario, rolEn, tokenDe, iniciarSesion, cerrarSesion } = useAuth();
const citas = await pedir('integracion', '/hospital/mis-citas', { token: tokenDe('integracion') });
await pedir('luz', '/reclamos', { method: 'POST', body: {...}, token: tokenDe('luz') });
```

---

## 5. Lo que falta construir (en este orden)

### 5.1 Estructura de carpetas (la de la diapositiva "Arquitectura React")

```
src/
├── main.jsx, App.jsx (rutas), styles.css
├── components/  Layout.jsx, MenuRoles.jsx, RutaProtegida.jsx, Badge.jsx,
│                Toast.jsx, Modal.jsx, Campo.jsx, Tabla.jsx, Vacio.jsx
├── pages/       Login.jsx, Inicio.jsx
├── modulos/
│   ├── serenazgo/  PedirAuxilio.jsx, MisAlertas.jsx, PanelAlertas.jsx
│   ├── hospital/   ReservarCita.jsx, MisCitas.jsx, PanelCitas.jsx, MisTramites.jsx
│   ├── luz/        NuevoReclamo.jsx, MisReclamos.jsx, PanelReclamos.jsx
│   └── envios/     Cotizar.jsx, MisEnvios.jsx, PanelEnvios.jsx
└── integraciones/  DerivarAlerta.jsx, ReclamoLuzHospital.jsx, EnviarResultados.jsx
```

### 5.2 Componentes base

- **`RutaProtegida`**: `<RutaProtegida modulo="hospital" roles={['administrador','empleado']}>`. Sin sesión → `/login`. Sin ese rol en ese módulo → pantalla "No tienes acceso".
- **`MenuRoles`**: recorre `MODULOS` y muestra solo los que tienen `rolEn(m)`. Cada módulo lleva su color y debajo el rol. Las opciones dependen del rol: cliente → "Nuevo + Mis registros"; personal → "Panel".
- **`Layout`**: barra lateral con el menú, barra superior con el nombre y "Cerrar sesión", y migas de pan **App › Página** (criterio UX-5). La app actual va resaltada con su color.
- **`Badge`**: `<span className={'badge ' + tonoEstado(estado)}>`, con colores verde, ámbar, rojo y gris.
- **`Toast`**: mensaje de éxito **con el código** (por ejemplo "Alerta registrada · ALR-…"), criterio UX-3.
- **Botones:** mientras guardan muestran "Guardando…" y quedan deshabilitados.

### 5.3 Login (`pages/Login.jsx`)

- Al montar la página, llama `despertar(m)` para los 5 destinos. Así Render despierta mientras el usuario escribe.
- Muestra los **4 nodos** (uno por entidad, con su color) unidos por una línea:
  - gris = dormido
  - pulsando = conectando
  - encendido + rol = ok
  - tachado = sin acceso
- `iniciarSesion(correo, clave, (m, estado, rol) => setNodos(...))` y después `navigate('/inicio')`.
- Si aparece el aviso `aviso` del contexto (sesión vencida), muéstralo arriba.

### 5.4 Inicio (`pages/Inicio.jsx`)

- `GET integracion /resumen` → una tarjeta por módulo con sus contadores y un botón a su página principal.
- **"Hilo de atención"** (para clientes): `GET /serenazgo/mis-alertas`. Para cada alerta con `cita_codigo`, dibuja la cadena **Alerta (rojo) → Cita (verde azulado) → Envío (índigo)**, cada eslabón con su código y su badge. Es la vista de la HU-2.4.

### 5.5 Serenazgo (Buendía)

| Página | Rol | API |
|---|---|---|
| PedirAuxilio | cliente | `POST integracion /serenazgo/alertas` `{ubicacion, descripcion, hay_heridos}` (casilla "¿Hay heridos?") |
| MisAlertas | cliente | `GET integracion /serenazgo/mis-alertas` (muestra la cita enlazada si existe) |
| PanelAlertas | admin/empleado | `GET integracion /serenazgo/alertas` + filtro "solo con heridos" |

**Acciones del panel:**
- Cambiar estado → `PATCH serenazgo /alertas/:codigo_seguimiento/estado` `{estado}`. Los estados válidos en su backend son `registrado`, `en_proceso`, `atendido` y `rechazado`.
- Marcar heridos → `PATCH integracion /serenazgo/alertas/:id/heridos`.
- **Derivar a hospital (F1)** → `DerivarAlerta.jsx`: un modal con la especialidad (por defecto `medicina-general`) y una observación. Llama `POST integracion /serenazgo/alertas/:id/derivar`, muestra el toast "Cita de emergencia creada · COD-…" y la fila cambia a `derivado`. El botón se oculta si la fila ya tiene `cita_codigo`.

### 5.6 Hospital (Cosme)

| Página | Rol | API |
|---|---|---|
| ReservarCita | cliente | `POST hospital /citas`. Body: `{nombre_paciente, dni(8), especialidad, fecha_preferida(AAAA-MM-DD, ≥ hoy), tiene_sis(bool), fecha_nacimiento, telefono(9), correo?, motivo}`. Respuesta: `{cita:{codigo_seguimiento,…}}` |
| MisCitas | cliente | `GET integracion /hospital/mis-citas`. Editar si `estado==='registrado'` → `PATCH hospital /citas/:id` (mismo body sin fecha_nacimiento) |
| PanelCitas | admin/empleado | `GET integracion /hospital/citas` + filtro "Origen: Serenazgo" |
| MisTramites | admin con rol en luz | `GET luz /reclamos/mis` con `tokenDe('luz')` + botón "Nuevo reclamo de luz" |

**Valores válidos:** especialidades `medicina-general, pediatria, ginecologia, cardiologia, traumatologia, cirugia-general, medicina-interna, odontologia, oftalmologia, psicologia`; estados `registrado, atendido, rechazado, cancelado`.

**Acciones del panel:**
- Etiqueta **"Origen: Serenazgo · ALR-…"** cuando `alerta_codigo` existe (RF-2.2).
- Cambiar estado → `PATCH hospital /citas/:id/gestion` `{nombre_paciente, dni, especialidad, fecha_preferida, estado}`. Convierte la especialidad a slug: `"Ginecología"` → `"ginecologia"`; las que no estén en la lista (por ejemplo "Emergencia") pasan a `medicina-general`.
- **Enviar resultados (F3)**, solo si `estado==='atendido'` y no hay `envio_codigo`: `EnviarResultados.jsx` abre un formulario **con el color de ExpressEnvíos**:
  - Precargados (verde, punteados): Origen "Hospital Regional del Norte / huancayo" y Destinatario `nombre_paciente`.
  - A llenar: ciudad destino (select con las ciudades) y peso.
  - Llama `POST integracion /hospital/citas/:id/envio` y muestra el toast "Envío registrado · COD-…".
  - En la fila aparece "Envío COD-… · registrado → en tránsito".

**Ojo:** el backend del Hospital valida el **turno** de los empleados (mañana 6–14, tarde 14–22, noche 22–6). El administrador no tiene esa restricción. Para la demo usen el admin o un empleado del turno de la exposición.

### 5.7 LuzCentro (tú, Aguirre) · F2

| Página | Rol | API |
|---|---|---|
| NuevoReclamo | cliente | `POST luz /reclamos`. Body: `{motivo, dni(8), nombre, suministro(6–10 díg.), comentario(5–1000), direccion?, mes:'AAAA-MM', montoReclamo, tipo_medidor:'monofasico'|'trifasico', km_fuera_zona}` |
| MisReclamos | cliente | `GET luz /reclamos/mis`. Editar si `estado==='registrado'` → `PUT luz /reclamos/:id` `{comentario, tipo_medidor, km_fuera_zona}` |
| PanelReclamos | admin/empleado | `GET luz /reclamos` y dictamen `PUT luz /reclamos/:id/dictamen` `{estado:'en_proceso'|'atendido'|'rechazado', comentario}` |

**Reglas del formulario:**
- Motivos: `Nuevo Suministro`, `Cambio de Titular`, `Reclamo por Monto Excesivo` y `Otros`.
- `mes` y `montoReclamo` solo se piden en **Monto Excesivo** (contraste: S/35 monofásico o S/75 trifásico, + S/2.50 por km).
- `direccion` es obligatoria en **Nuevo Suministro**.

**`ReclamoLuzHospital.jsx` (F2):**
- Es el mismo formulario, pero cuando `rolEn('hospital')==='administrador'` muestra el banner "Tramitas como Hospital Regional del Norte".
- Precarga `nombre = 'Hospital Regional del Norte'`, `dni = usuario.dni` y motivo `Reclamo por Monto Excesivo`.
- Ruta: `/luz/reclamo`. Después el admin ve el estado en `/hospital/mis-tramites`.
- El dictamen del personal de LuzCentro tiene la misma restricción de turno que el Hospital (salvo que `VALIDAR_TURNO=false`). Además, un reclamo de Monto Excesivo con pago pendiente **no se puede atender** hasta que se pague: para la demo, paguen primero en su app o usen el motivo "Otros".

### 5.8 ExpressEnvíos (Sáenz)

| Página | Rol | API |
|---|---|---|
| Cotizar | cliente | `POST envios /cotizaciones` `{origen, destino, peso_kg, largo_cm, ancho_cm, alto_cm}` → `{id, codigo, monto}` (ciudades en minúsculas) |
| MisEnvios | cliente | `GET envios /cotizaciones/mias`. Editar si `registrado` → `PUT envios /cotizaciones/:id` |
| PanelEnvios | admin/empleado | `GET integracion /envios/cotizaciones` (etiqueta "Desde Hospital · cita COD-…" si hay `id_cita`). Cancelar → `PATCH envios /cotizaciones/:id/cancelar` |

### 5.9 Rutas (`App.jsx`)

```
/login  /inicio
/serenazgo/alerta   /serenazgo/mis-alertas   /serenazgo/panel
/hospital/cita      /hospital/mis-citas      /hospital/panel   /hospital/mis-tramites
/luz/reclamo        /luz/mis-reclamos        /luz/panel
/envios/cotizar     /envios/mis-envios       /envios/panel
```

Cada ruta va envuelta en `RutaProtegida` con su módulo y sus roles. Agrega en cada módulo un enlace "Abrir sitio original ↗" (`MODULOS[m].sitio`), así cada app conserva su diseño completo.

### 5.10 Diseño propuesto

- **Paleta:**
  - Base: tinta `#16233A`, fondo `#F3F5F7`, superficie `#FFFFFF`, líneas `#DCE2E8` y texto secundario `#5B6B7F`.
  - Acentos (ya están en `modulos.js`): Serenazgo `#E5492D`, Hospital `#0F766E`, LuzCentro `#E89A00` y ExpressEnvíos `#3F4FB8`.
- **Tipografía:** Bricolage Grotesque para títulos e Instrument Sans para el texto (ya cargadas en `index.html`). Usa `font-variant-numeric: tabular-nums` en los códigos.
- **Badges:** verde `#DCFCE7/#166534`, ámbar `#FEF3C7/#92400E`, rojo `#FEE2E2/#991B1B` y gris `#E2E8F0/#334155`.
- **Responsive:** en celular la barra lateral pasa a ser un menú desplegable. Todos los campos llevan `<label>`, el foco debe ser visible y hay que respetar `prefers-reduced-motion`.

---

## 6. Datos de prueba para la demo

Ejecuta esto en Neon con los ids reales de tus usuarios (revisa antes `SELECT id, correo FROM usuarios;`):

```sql
-- El admin del Hospital también es cliente de LuzCentro y ExpressEnvíos (F2)
INSERT INTO usuario_rol (id_usuario, modulo, rol) VALUES
  (<id_admin_hospital>, 'luz', 'cliente'), (<id_admin_hospital>, 'envios', 'cliente')
ON CONFLICT (id_usuario, modulo) DO NOTHING;

-- El empleado de Serenazgo también es empleado del Hospital
INSERT INTO usuario_rol (id_usuario, modulo, rol, turno) VALUES (<id_empleado_serenazgo>, 'hospital', 'empleado', 'mañana')
ON CONFLICT (id_usuario, modulo) DO NOTHING;
```

**Guion de la demo en vivo:**

1. **F1:**
   1. El vecino (cliente1) pide auxilio marcando "hay heridos".
   2. El empleado de Serenazgo lo deriva desde su panel.
   3. El vecino ve "alerta derivada + cita" en Mis alertas.
2. **F2:**
   1. El admin del Hospital entra una sola vez, va a LuzCentro y registra el reclamo.
   2. El personal de LuzCentro emite el dictamen.
   3. El admin ve el estado en Mis trámites.
3. **F3:**
   1. El personal del Hospital marca la cita como `atendido`.
   2. Pulsa "Enviar resultados".
   3. A los 2 minutos el envío aparece "en tránsito".

---

## 7. Checklist final

- [ ] `integracion-api` desplegada y `/api/salud` responde `ok`
- [ ] URL de la integración pegada en `vercel.json`
- [ ] Filas de `usuario_rol` de la demo insertadas
- [ ] Frontend: componentes base, Login, Inicio, 4 módulos y 3 integraciones
- [ ] Probado con 3 cuentas: vecino, admin del Hospital y empleado
- [ ] Desplegado en Vercel (Root `frontend`)
- [ ] 5 minutos antes de exponer, abrir la app para que Render despierte
