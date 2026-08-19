# MHESUS — Frontend (Angular)

Sistema interno del taller MHESUS (Chincha, Perú), implementado según el
**Design Doc v1.0**. Este frontend consume una **API REST real** (backend
Java/Spring Boot o .NET/ASP.NET Core — ambos exponen el mismo contrato) vía
`HttpClient`, con autenticación JWT. Ya no usa `localStorage` como fuente de
datos: `StoreService` hace `GET`/`POST`/`PATCH`/`DELETE` contra el backend y
mantiene los mismos `Signals` reactivos de siempre, así que ningún componente
de `features/` necesita cambiar su plantilla.

## Antes de arrancar: levanta un backend

Este frontend **necesita** uno de los dos backends corriendo en
`http://localhost:8080` (o edita `src/environments/environment.ts` con la URL
que uses):

- `mhesus-backend-java/` — `mvn spring-boot:run`
- `mhesus-backend-dotnet/` — `dotnet run` (fija el puerto con
  `ASPNETCORE_URLS=http://localhost:8080 dotnet run` si hace falta)

Cualquiera de los dos sirve — tienen exactamente los mismos endpoints y datos
de demostración. Si el backend no está corriendo, la pantalla de login mostrará
un error de conexión al intentar entrar (y el resto de la app quedará vacía,
ya que no hay datos que cargar).

## Requisitos

- Node.js 20 o superior
- npm 10 o superior

## Instalación y ejecución

```bash
npm install
npm start
```

La app queda disponible en `http://localhost:4200`.

Para generar una build de producción:

```bash
npm run build
```

Los archivos quedan en `dist/mhesus-frontend/browser`. Puedes servirlos con
cualquier servidor de archivos estáticos.

## Accesos de demostración

Usuarios sembrados por el backend al arrancar por primera vez, todos con
contraseña `demo1234` (esta sí se valida de verdad contra el hash guardado en
la base de datos — a diferencia de la versión anterior 100% local). En la
pantalla de login hay botones para autocompletar cada rol.

| Usuario      | Rol             |
|--------------|-----------------|
| `recepcion`  | Recepción       |
| `mecanico`   | Mecánico        |
| `mecanico2`  | Mecánico        |
| `almacen`    | Almacén         |
| `jefe`       | Jefe de Taller  |
| `admin`      | Administración  |

## Qué incluye

- **Login** con control de sesión por rol (simula JWT + RBAC de la sección 8
  del Design Doc).
- **Dashboard** con métricas del taller y accesos rápidos según el rol.
- **Clientes**: búsqueda por DNI, alta de clientes y motocicletas (RF-01 a
  RF-03).
- **Órdenes de Trabajo**: vista en lista con filtro por estado, creación
  guiada en 4 pasos (cliente, moto lineal, detalle de ingreso, asignar
  mecánico con notificación automática), diagnóstico, pedidos a almacén con
  buscador de productos, cotización y máquina de estados con la secuencia
  exacta de la sección 7 (`Creada → Asignada → Pedido de repuestos → En
  diagnóstico → En espera de autorización → En ejecución → Control de calidad
  → Lista para entrega → Cerrada`). Administración puede forzar saltos de
  estado como excepción auditada. Incluye un temporizador real del tiempo de
  servicio del mecánico (desde que Almacén despacha los repuestos hasta que
  marca el servicio como concluido). Al cerrar una OT, se puede descargar la
  **Orden de Trabajo en PDF** con todos los datos ya completados sobre la
  plantilla oficial de MHESUS (`public/assets/orden-trabajo-template.pdf`),
  lista para entregar al cliente.
- **Almacén**: catálogo de productos, alertas de stock mínimo, pedidos
  pendientes de despacho (con descuento de stock atómico) y bitácora de
  movimientos.
- **Cotizaciones**: listado consolidado con estado de autorización del
  cliente.
- **Reportes**: ventas por cliente, productividad por mecánico y rotación de
  inventario (RF-16).
- **Administración**: alta de usuarios y roles, auditoría completa de
  acciones sensibles, y reinicio de los datos de demostración.

El control de acceso por módulo replica exactamente la matriz RBAC de la
sección 8 del Design Doc (`src/app/core/services/permissions.ts`).

## Estructura

```
src/app/
├── core/
│   ├── models/         # Modelos de dominio (mismo esquema que la sección 5 del Design Doc)
│   ├── services/        # StoreService (datos vía HTTP), AuthService, ApiService, RBAC, máquina de estados
│   └── guards/           # authGuard, moduloGuard(rol)
├── shared/
│   ├── components/       # Shell (sidebar + topbar), badges reutilizables
│   └── utils/
└── features/
    ├── login/
    ├── dashboard/
    ├── clientes/
    ├── ot/                # lista (kanban/tabla), creación, detalle
    ├── almacen/
    ├── cotizaciones/
    ├── reportes/
    └── administracion/
```

## Solución de problemas

**`Cannot find module 'xlsx'` al compilar**: casi siempre significa que `node_modules` quedó desactualizado (por ejemplo, si copiaste una carpeta del proyecto de una versión anterior). Solución:

```bash
rm -rf node_modules package-lock.json
npm install
```

**La app carga pero no aparece ningún dato (clientes, OT, productos, etc. vacíos)**: el backend no está corriendo, no está en `http://localhost:8080`, o CORS está bloqueando la petición. Revisa la consola del navegador (pestaña Network) — si ves errores de conexión rechazada, arranca el backend; si ves errores de CORS, revisa `Mhesus.Cors.OrigenPermitido` (.NET) o `mhesus.cors.origenes-permitidos` (Java) en la configuración del backend.

**"Usuario o contraseña incorrectos" con las credenciales de demostración**: el backend solo siembra los usuarios la primera vez que arranca (cuando su base de datos está vacía). Si ya lo corriste antes con datos distintos, borra `mhesus-backend-java/data/` o `mhesus-backend-dotnet/data/` y vuelve a arrancarlo para que se resiembre.

**401 inesperado después de un rato usando la app**: el JWT expiró (por defecto dura 8 horas, configurable en el backend) o el temporizador de inactividad del frontend cerró la sesión (5 minutos sin actividad, ver `AuthService.SESION_INACTIVIDAD_MS`). En ambos casos el interceptor te manda de vuelta a `/login` automáticamente.

## Arquitectura de datos: cómo se conecta con el backend

- `src/environments/environment.ts` — define `apiUrl` (por defecto `http://localhost:8080/api/v1`). Es el único lugar que hay que tocar para apuntar a otro backend o puerto.
- `core/services/api.service.ts` — envoltorio delgado sobre `HttpClient`; todos los métodos de `StoreService` pasan por aquí.
- `core/interceptors/auth.interceptor.ts` — agrega `Authorization: Bearer <token>` a cada petición y cierra sesión ante un 401.
- `core/services/token.service.ts` — guarda el JWT de la sesión activa (separado de `AuthService` para evitar una dependencia circular con el interceptor).
- `core/services/store.service.ts` — la capa de datos de la app: cada colección vive en un `Signal`, poblado con `GET` al backend; las mutaciones llaman al endpoint (`POST`/`PATCH`/`DELETE`) y luego refrescan las colecciones afectadas. `cargarTodo()` la llama `ShellComponent` en su `ngOnInit`, una vez autenticado.

Ningún componente de `features/` necesita conocer estos detalles: todos siguen consumiendo datos a través de los mismos `Signals` de siempre.
