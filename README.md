# Aprendizajess · Plataforma de perfiles profesionales

Sitio de **Aprendizajess** con tres piezas, todas administradas desde un **backoffice** independiente (page builder, borradores, vista previa y publicación):

1. **Landing de venta** en `/`: la presentación comercial del consultorio (hero con el equipo, cifras verificables, servicios, proceso, equipo, testimonios, compromiso ético, planes, preguntas frecuentes, CTA y contacto). Se edita en *Backoffice → Página de inicio*.
2. **Sección Equipo** en `/equipo`: todos los profesionales publicados.
3. **Perfil de cada profesional** en `/<slug>` (ej. `dominio.cl/jessica-de-sousa`), pensado para llegar desde un **código QR impreso**: presentación premium, testimonios, reseñas de Google y CTA de **agendar cita**.

```
apps/web    → sitio público   (http://localhost:3000)   sin login
apps/admin  → backoffice      (http://localhost:3001)   Auth.js + roles
```

## Stack

Next.js **16.3.8** (App Router, Cache Components, `proxy.ts`) · React 19.3 · TypeScript strict · pnpm workspaces + Turborepo · MongoDB (driver oficial, Atlas) · Tailwind CSS 4 · shadcn/ui (admin) · Zod 4 · React Hook Form · Motion · dnd-kit · Lucide · Auth.js (`next-auth` v4, línea estable) · Argon2id · sharp · Vercel Blob · Vitest · Playwright.

Efectos visuales inspirados en **React Bits** (SplitText/BlurText, Magnet, SpotlightCard) integrados selectivamente como componentes propios y livianos en `apps/web/src/components/fx` (sin instalar la librería).

## Estructura

```
apps/
  web/                 Sitio público: perfiles, directorio, preview firmado, APIs privadas
  admin/               Backoffice: profesionales, page builder, testimonios, citas, integraciones…
packages/
  domain/              Esquemas Zod, tipos, section registry, permisos, tokens, lógica pura
  config/              Variables de entorno validadas + feature flags
  database/            Cliente MongoDB, colecciones tipadas, índices
  data-access/         Repositorios (único lugar con queries)
  auth/                Opciones de Auth.js, Argon2id
  integrations/        Google Places / Business Profile, testimonios, cifrado, HMAC, media
  ui/                  Componentes shadcn/ui del backoffice
  eslint-config/ typescript-config/
scripts/               seed, índices, MongoDB local, generador de secretos
e2e/                   Playwright (web + admin)
docs/                  architecture · legacy-audit · google-reviews · deployment
```

Más detalle en [docs/architecture.md](docs/architecture.md).

## Requisitos

- Node.js **≥ 20.9** (probado con 22) y **pnpm 10** (`corepack enable`).
- Una base MongoDB: **Atlas** (producción) o local con `pnpm db:local` (sin Docker ni instalación; usa el binario de `mongodb-memory-server` con datos persistentes en `.mongo-data/`).

## Puesta en marcha (5 minutos)

```bash
pnpm install
cp .env.example .env
pnpm secrets:generate          # pega los valores en .env
#   y define SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD (≥ 12 caracteres) en .env

pnpm db:local                  # terminal 1 (o usa tu URI de Atlas en MONGODB_URI)
pnpm db:seed                   # terminal 2: índices, admin, 5 perfiles DEMO, testimonios demo
pnpm dev                       # web :3000 + admin :3001
```

- Sitio público: http://localhost:3000 (landing de venta), http://localhost:3000/equipo y perfiles como http://localhost:3000/jessica-de-sousa.
- Backoffice: http://localhost:3001 → inicia sesión con `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` (rol SUPER_ADMIN).

> Si los puertos 3000/3001 están ocupados: `PUBLIC_BASE_URL=http://localhost:3020 ADMIN_BASE_URL=http://localhost:3021 pnpm --filter @repo/web exec next dev --port 3020` (y lo análogo para admin en 3021).

### Comandos

| Comando | Qué hace |
| --- | --- |
| `pnpm dev` / `pnpm dev:web` / `pnpm dev:admin` | Desarrollo (3000 / 3001) |
| `pnpm build` | Build de producción de ambas apps (Turborepo) |
| `pnpm lint` · `pnpm typecheck` | ESLint · TypeScript (paquetes, apps, scripts y e2e) |
| `pnpm test` | Vitest: dominio, integraciones (Google con mocks), repositorios contra MongoDB en memoria, auth, web, admin |
| `pnpm test:e2e` | Playwright: levanta ambas apps (3100/3101) contra la base aislada `aprendizajess_e2e` (requiere `pnpm build` y MongoDB en `MONGODB_URI`) |
| `pnpm db:seed` / `pnpm db:seed --reset` | Datos demo idempotentes (incluye la landing de ejemplo y migra instalaciones existentes a raíz = landing) / elimina lo marcado como demo y re-crea |
| `pnpm db:indexes` | Crea/asegura índices |
| `pnpm db:local` | MongoDB local persistente en `mongodb://127.0.0.1:27017` |
| `pnpm secrets:generate` | Genera secretos aleatorios |

## Variables de entorno

Todas documentadas en [`.env.example`](.env.example). Un único `.env` en la raíz sirve para ambas apps y los scripts. Las opcionales nunca impiden arrancar: sin ellas la funcionalidad correspondiente se desactiva.

| Variable | Requerida | Uso |
| --- | --- | --- |
| `MONGODB_URI`, `MONGODB_DB_NAME` | Sí | Base de datos |
| `PUBLIC_BASE_URL`, `ADMIN_BASE_URL` | Sí (prod) | Dominios; el QR siempre usa `PUBLIC_BASE_URL` |
| `AUTH_SECRET` | Admin | Sesiones Auth.js |
| `REVALIDATION_SECRET` | Ambas | HMAC para invalidar la caché pública desde el admin |
| `PREVIEW_SECRET` | Ambas | Tokens de vista previa de borradores |
| `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD` | Seed | Super admin inicial |
| `MEDIA_PROVIDER`, `LOCAL_MEDIA_DIR`, `BLOB_READ_WRITE_TOKEN` | Opcional | Almacenamiento de imágenes |
| `GOOGLE_MAPS_API_KEY` | Opcional | Places API (New), sólo servidor |
| `GOOGLE_CLIENT_ID/SECRET`, `GOOGLE_REDIRECT_URI`, `INTEGRATION_ENCRYPTION_KEY` | Opcional | Google Business Profile (OAuth) |
| `CRON_SECRET` | Opcional | Sincronización programada de reseñas |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | Opcional | GA4 (también configurable en el admin) |

## MongoDB Atlas

1. Crear cluster → *Database Access*: usuario con rol `readWrite` sobre la base → *Network Access*: IPs de tu hosting.
2. `MONGODB_URI=mongodb+srv://usuario:clave@cluster.xxxxx.mongodb.net/?retryWrites=true&w=majority` y `MONGODB_DB_NAME=aprendizajess`.
3. `pnpm db:indexes` y, opcionalmente, `pnpm db:seed`.

## Cómo funciona

### Publicación (draft → preview → publish)
Editar un profesional modifica sólo su **borrador**. "Vista previa" muestra el borrador (Desktop/Tablet/Mobile) en un iframe del sitio público mediante un token HMAC de 15 minutos. "Publicar" crea un **snapshot** inmutable en `publishedProfiles` (el único dato que lee el sitio) y guarda la revisión; las revisiones anteriores pueden restaurarse al borrador. Despublicar o archivar elimina el snapshot: la URL pasa a **404 real**.

### Landing de venta (página de inicio)
`/` muestra la landing editable en *Backoffice → Página de inicio*, con el mismo modelo que los perfiles: secciones tipadas que se agregan, ocultan, reordenan y editan; borrador, vista previa (Desktop/Tablet/Mobile), publicación con revisiones restaurables. Tipos disponibles: hero con *skyline* del equipo, cifras (`{equipo}` se calcula con los profesionales publicados), "¿te suena familiar?", servicios (bento), cómo trabajamos, equipo, muro/cinta de testimonios, compromiso ético, planes (precio opcional), preguntas frecuentes, convenios, llamado a la acción, contacto (datos de *Configuración → Contacto público*), texto libre y galería. El seed crea contenido de ejemplo con una línea **ética**: sin cifras infladas, sin precios inventados y con testimonios marcados como demo.

La raíz es configurable en *Configuración → Raíz*: **Landing** (por defecto), **Directorio** o **Profesional por defecto**. La sección `/equipo` siempre lista a todo el equipo publicado.

### Page builder
Secciones tipadas (hero, sobre mí, trayectoria, especialidades, servicios, modalidades, testimonios, redes, CTA de cita, galería, contacto, ubicación, texto libre, selector de profesionales, CTA personalizado) definidas en un **section registry** con esquema Zod propio, variantes, estilos y opciones responsive. Se pueden agregar, ocultar, reordenar (drag & drop o teclado) y editar con formularios generados desde el registry. No hay ejecución de código ni HTML arbitrario.

### Caché e invalidación
El sitio usa Cache Components (`'use cache'` + `cacheTag`). Al publicar/editar, el admin llama a `POST /api/revalidate` del sitio con firma HMAC (`REVALIDATION_SECRET`, anti-replay de 5 min) y se invalidan sólo los tags afectados (`profile:<slug>`, `directory`, `site`, `testimonials:<id>`). Funciona aunque web y admin estén en dominios/deployments distintos.

### Selector de profesionales
Muestra sólo profesionales publicados, en el orden definido en el admin. Con **uno solo** no se renderiza; con muchos se desplaza (swipe/flechas/teclado). Pre-carga sólo los perfiles vecinos, nunca todas las imágenes.

### Agendar cita
Por profesional: **formulario interno** (se guarda en `appointmentRequests`; gestión con estados new → contacted → scheduled → completed/cancelled), **URL externa** (Calendly u otro) o **WhatsApp** con mensaje prellenado. Validación Zod, honeypot y rate limit.

### Testimonios y Google
Testimonios manuales (CRUD, ocultar, destacar, ordenar) + **Google Places API (New)** (máx. 5 reseñas, en vivo, sin persistir contenido) y **Google Business Profile** (OAuth, tokens cifrados, sincronización manual y diaria). Sin credenciales todo funciona con testimonios manuales. Guía completa: [docs/google-reviews.md](docs/google-reviews.md).

### QR
En *Profesionales → Generar QR*: QR con corrección de errores **H** apuntando siempre a `PUBLIC_BASE_URL/<slug>?src=qr` (el parámetro permite medir `qr_entry` y se limpia de la barra de direcciones), descarga SVG/PNG, copiar enlace y logo central opcional.

### Media
Las imágenes se validan decodificándolas (PNG/JPEG/WebP/AVIF, ≤ 8 MB), se les quita EXIF y se guardan en almacenamiento local (dev, servido por `/media/*`) o **Vercel Blob** (prod). MongoDB guarda sólo metadatos (dimensiones, alpha, alt, punto focal). Las fotos recortadas con transparencia se componen "saliendo" del panel; las rectangulares se enmarcan en arco.

### Usuarios y roles
`SUPER_ADMIN` (todo), `ADMIN` (todo salvo usuarios y conexión OAuth), `EDITOR` (profesionales, testimonios, citas, media). Los permisos se verifican en el servidor en cada acción. Todas las operaciones relevantes quedan en **Auditoría**.

### Analytics
Eventos `profile_view`, `professional_switch`, `appointment_cta_click`, `appointment_submit`, `social_click`, `testimonial_interaction`, `qr_entry` mediante una capa abstracta (`apps/web/src/lib/analytics.ts`) que envía a `dataLayer`/GA4 si está configurado y nunca bloquea la página.

## Despliegue

Dos proyectos (Vercel recomendado) con *Root Directory* `apps/web` y `apps/admin`, misma base de datos y secretos compartidos. Paso a paso, cron y checklist: [docs/deployment.md](docs/deployment.md).

## Contenido DEMO

El seed crea 5 perfiles con las fotos reales del repositorio original. El texto de Jessica de Sousa proviene del sitio anterior; el resto (títulos, biografías, servicios, testimonios) es **contenido demo** marcado con `isDemo` (badge "DEMO" en el admin) y textos "(DEMO)". Reemplázalo desde el backoffice o elimínalo con `pnpm db:seed --reset`. No se generan reseñas de Google ficticias.

## Historia

Este repositorio reemplaza una plantilla de Payload CMS. Qué se conservó y por qué: [docs/legacy-audit.md](docs/legacy-audit.md).
