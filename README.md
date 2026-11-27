# Red de Atención Ciudadana (Grupo 2)

> **Una emergencia, una sola cuenta, cuatro entidades conectadas.**

Plataforma web unificada que integra cuatro servicios ciudadanos y empresariales en una sola aplicación (**Single Page Application**), permitiendo que ciudadanos, operadores y administradores interactúen entre distintas entidades mediante una única cuenta y una base de datos centralizada[cite: 7].

🌐 **Acceso al sistema en producción:** [https://red-de-atenci-n-ciudadana.vercel.app](https://red-de-atenci-n-ciudadana.vercel.app)

---

## ¿Cómo funciona el sistema integrado?

Tradicionalmente, cada entidad opera con su propia plataforma y registro de usuarios. La **Red de Atención Ciudadana** unifica las cuatro aplicaciones bajo una arquitectura compartida:

1. **Acceso Único (Single Sign-On) y Roles Dinámicos:**  
   Cada persona inicia sesión una sola vez. A través de la tabla relacional `usuario_rol (id_usuario, modulo, rol)`, un mismo usuario puede tener distintos permisos según la entidad (por ejemplo, ser **administrador** en el Hospital y **cliente** en LuzCentro y ExpressEnvíos)[cite: 7]. El menú lateral y las rutas protegidas se adaptan automáticamente a los roles asignados[cite: 7].
2. **Base de Datos Centralizada con Trazabilidad Cruzada:**  
   Todas las entidades comparten una única base de datos PostgreSQL en **Neon**, conectando sus operaciones mediante llaves foráneas (`id_usuario`, `id_alerta`, `id_cita`) para evitar duplicidad de registros y mantener el seguimiento de extremo a extremo[cite: 7].
3. **Interfaz Unificada y Estados en Tiempo Real:**  
   Todas las vistas mantienen una identidad visual coherente, formularios con datos precargados entre módulos, confirmación inmediata con códigos de seguimiento y etiquetas de estado diferenciadas por color (`registrado`, `derivado`, `en camino`, `atendido`, `pagado`, `entregado`)[cite: 7].

---

## Entidades Conectadas

| Módulo | Entidad | Tabla Principal | Responsable |
| :--- | :--- | :--- | :--- |
| **Serenazgo** | Serenazgo Huancayo | `alertas_auxilio` | Buendía Quispe, Joseph Leonardo |
| **Hospital** | Hospital Regional del Norte | `citas_medicas` | Cosme Carlos, Jefry |
| **LuzCentro** | LuzCentro Perú | `reclamos_luz` | Aguirre Vivanco, Richard Luis |
| **ExpressEnvíos** | ExpressEnvíos Perú | `cotizaciones_envio` | Sáenz Ishuiza, Mark Yhojan |

[cite: 7]

---

## Flujos de Integración entre Módulos

### 1. Alerta de Auxilio → Cita de Emergencia (`Serenazgo` + `Hospital`)
* Un vecino registra una alerta de auxilio en **Serenazgo** indicando si existen heridos[cite: 7].
* Desde el panel operativo, el empleado de Serenazgo presiona **Derivar a hospital**[cite: 7].
* El sistema crea automáticamente una cita de emergencia en **Hospital Regional del Norte** vinculada mediante `citas_medicas.id_alerta` (identificada con la etiqueta `Origen: Serenazgo`)[cite: 7].
* El vecino visualiza tanto el estado de su alerta como la cita médica generada desde un mismo lugar[cite: 7].

### 2. Gestión de Reclamos Institucionales (`Hospital` + `LuzCentro`)
* El administrador del **Hospital** ingresa con su cuenta habitual y accede directamente a **LuzCentro** gracias a su rol de cliente asignado en dicha entidad[cite: 7].
* Registra reclamos por facturación eléctrica asociando su mismo `id_usuario`, permitiendo consultar la respuesta y el cambio de estado realizado por los operadores de LuzCentro sin cambiar de cuenta[cite: 7].

### 3. Despacho de Resultados Médicos a Domicilio (`Hospital` + `ExpressEnvíos`)
* Cuando una consulta en el **Hospital** pasa a estado `atendido`, el personal habilita la opción **Enviar resultados**[cite: 7].
* El sistema enlaza la operación con **ExpressEnvíos Perú** precargando los datos de origen, destino y destinatario, generando una orden de envío vinculada mediante `cotizaciones_envio.id_cita`[cite: 7].
* Tanto el Hospital como ExpressEnvíos monitorean el estado del despacho hasta su entrega final[cite: 7].

---

## Arquitectura Tecnológica

* **Frontend:** React + Vite + React Router (desplegado en **Vercel** con enrutamiento proxy hacia los microservicios de cada módulo).
* **Backend de Integración:** API REST en Node.js / Express con autenticación JWT (`integracion-api`, alojada en **Render**).
* **Base de Datos:** PostgreSQL en **Neon** con esquema relacional unificado (`usuarios`, `usuario_rol` y tablas operativas de cada entidad)[cite: 7].

---

**Curso:** Diseño Web (NRC 30239) · **Docente:** Mg. Ing. Guillermo Peña[cite: 7]