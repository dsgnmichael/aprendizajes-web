# Changelog

Todos los cambios relevantes de este proyecto se documentan en este archivo.

El formato se basa en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/)
y el proyecto sigue [Versionado Semántico](https://semver.org/lang/es/).

## [Unreleased]

## [1.0.0] - 2026-10-06

Primera versión de la plataforma. Reemplaza por completo la plantilla de Payload CMS
(ver [docs/legacy-audit.md](docs/legacy-audit.md)).

### Added

- **Monorepo** con pnpm workspaces y Turborepo: `apps/web` (sitio público), `apps/admin`
  (backoffice) y paquetes compartidos `domain`, `config`, `database`, `data-access`, `auth`,
  `integrations`, `ui`, `eslint-config` y `typescript-config`.
- **Sitio público** (Next.js 16.3.8, Cache Components):
  - Landing de venta en `/` editable por secciones: hero con *skyline* del equipo, cifras
    verificables (`{equipo}`), "¿te suena familiar?", servicios (bento), cómo trabajamos,
    equipo, testimonios (muro o cinta), compromiso ético, planes, preguntas frecuentes,
    convenios, CTA, contacto, texto libre y galería.
  - Sección `/equipo` con todos los profesionales publicados.
  - Perfil por profesional en `/<slug>` (destino de los QR): hero con fotografía recortada
    sobre panel de marca, testimonios, selector de profesionales, servicios, especialidades,
    trayectoria, contacto y CTA de agendamiento.
  - Raíz configurable: landing, directorio o profesional por defecto.
  - Agendamiento en tres modos: formulario interno (guardado en MongoDB), URL externa
    (Calendly u otro) y WhatsApp con mensaje prellenado.
  - Vista previa de borradores con token HMAC de corta duración, sólo embebible por el admin.
  - SEO: `generateMetadata`, canonical, Open Graph, Twitter cards, sitemap, robots y JSON-LD
    (`Person`, `ProfessionalService`, `Organization`) sin ratings inventados.
  - Capa de analytics abstracta (`profile_view`, `professional_switch`,
    `appointment_cta_click`, `appointment_submit`, `social_click`,
    `testimonial_interaction`, `qr_entry`) compatible con GA4.
  - Navegación entre páginas como documentos con View Transitions entre documentos y
    Speculation Rules (prefetch al pasar el cursor).
- **Backoffice** (Auth.js, roles `SUPER_ADMIN` / `ADMIN` / `EDITOR`): dashboard, profesionales
  (CRUD, orden con drag & drop, duplicar, archivar, QR SVG/PNG con logo), editor con page
  builder generado desde un *section registry* tipado, página de inicio, testimonios, solicitudes
  de cita, integraciones, media, configuración del sitio, usuarios y auditoría.
- **Borrador → vista previa → publicación** para perfiles y landing, con snapshots inmutables,
  historial de revisiones restaurables y concurrencia optimista.
- **Testimonios**: manuales y proveedores opcionales de Google Places API (New) y Google
  Business Profile (OAuth 2.0, tokens cifrados, sincronización manual y cron diario).
- **Invalidación de caché entre apps** mediante endpoint firmado con HMAC.
- **Media**: abstracción de almacenamiento (local en desarrollo, Vercel Blob en producción),
  validación por decodificación real, eliminación de EXIF.
- **Scripts**: `pnpm db:seed` (datos de ejemplo y migración a raíz = landing), `db:indexes`,
  `db:local` (MongoDB local sin Docker) y `secrets:generate`.
- **Tests**: Vitest (dominio, integraciones con mocks, repositorios con MongoDB en memoria,
  auth, web y admin) y Playwright E2E (web desktop/mobile y admin) sobre base aislada.
- **Documentación**: `README.md`, `docs/architecture.md`, `docs/deployment.md`,
  `docs/google-reviews.md` y `docs/legacy-audit.md`.

### Changed

- Tipografías Lato y Loverine convertidas a WOFF2 con subset latino y cargadas con
  `next/font/local`.
- Paleta de marca convertida en tokens de diseño configurables desde el backoffice.
- Gestor de paquetes unificado en pnpm (un único `pnpm-lock.yaml`).

### Removed

- Payload CMS, el adaptador de Postgres, sus colecciones (incluidas FAQs, Colegios,
  Promociones y Referidos) y la API GraphQL.
- Hero y Header con contenido fijo en el código, y el botón **Login** del sitio público.
- `package-lock.json`, `.yarnrc`, Dockerfile y docker-compose de la plantilla.
- Cambios posteriores sobre la app antigua que `master` recibió en paralelo (`29b634e`,
  `3c077b8`): carrusel de testimonios con auto-rotación, campos extra de Especialistas,
  `scripts/import-reviews.ts` y el ajuste de render dinámico para Postgres. La v1.0.0 los
  reemplaza: ya trae su propio carrusel de testimonios, y las reseñas de Google se
  incorporan mediante la integración oficial (Places API / Business Profile). Copiar
  reseñas de Maps a la base de datos no está permitido por las políticas de Google.

### Security

- Secretos sólo en el servidor y validación con Zod en todas las fronteras.
- Autorización verificada en el servidor en cada acción del backoffice.
- Contraseñas con Argon2id, bloqueo de la cuenta tras varios intentos fallidos y rate limit
  en login, formularios y endpoints.
- CSP y cabeceras de seguridad, protección contra *open redirect*, rich text sin HTML
  arbitrario y auditoría sin datos sensibles.

[Unreleased]: https://github.com/dsgnmichael/aprendizajes-web/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/dsgnmichael/aprendizajes-web/releases/tag/v1.0.0
