# Arquitectura

## Visión general

```
                    ┌──────────────────────────┐        ┌──────────────────────────┐
  Visitante / QR ─▶ │ apps/web  (www.dominio)  │        │ apps/admin (admin.dominio)│ ◀─ Equipo (Auth.js)
                    │ Next 16 · Cache Components│        │ Next 16 · dinámico        │
                    │ proxy.ts (404 reales)     │        │ proxy.ts (sesión)         │
                    └────────────┬─────────────┘        └───────┬──────────┬───────┘
                                 │ lectura (snapshots)          │ escritura│ POST firmado HMAC
                                 ▼                              ▼          ▼
                          ┌──────────────────────────────────────┐   /api/revalidate (web)
                          │ MongoDB Atlas  (packages/database)   │   → revalidateTag()
                          └──────────────────────────────────────┘
```

Ambas apps comparten repositorio, paquetes y base de datos, pero **se despliegan por separado**. El sitio público no contiene ninguna ruta de login ni de administración (`/admin`, `/login` → 404).

## Monorepo

| Paquete | Responsabilidad |
| --- | --- |
| `apps/web` | Sitio público: perfiles `/[slug]`, raíz configurable, preview firmado, API de reseñas en vivo, invalidación de caché, media local. |
| `apps/admin` | Backoffice: dashboard, profesionales, editor + page builder, testimonios, citas, integraciones, media, configuración, usuarios, auditoría. |
| `packages/domain` | **Núcleo puro** (sin IO): esquemas Zod, tipos, section registry, permisos, tokens de diseño, lógica de testimonios, enlaces (WhatsApp/QR), rich text seguro, JSON-LD. Reemplaza los paquetes sugeridos `types` + `validation`. |
| `packages/config` | Variables de entorno validadas (Zod), *feature flags* derivadas de credenciales opcionales. |
| `packages/database` | Cliente MongoDB (driver oficial, singleton), colecciones tipadas, índices. |
| `packages/data-access` | Repositorios: **único lugar con queries**. Auditoría, rate limit, publicación. |
| `packages/auth` | Opciones de Auth.js (credentials + JWT), Argon2id, tipos de sesión. |
| `packages/integrations` | Google Places / Business Profile, proveedores de testimonios, cifrado AES-GCM, firmas HMAC, invalidación cross-app, almacenamiento de media. |
| `packages/ui` | Componentes shadcn/ui del backoffice. |
| `packages/eslint-config`, `packages/typescript-config` | Configuración compartida. |

Los paquetes internos se consumen como TypeScript fuente (*just-in-time*, `transpilePackages`), sin build propio.

## Modelo de datos (colecciones)

| Colección | Contenido | Índices |
| --- | --- | --- |
| `professionals` | **Borrador** editable: identidad, contenido, imágenes, servicios, contacto, agendamiento, config. de testimonios, SEO, tema, `sections[]`, `status`, `revision`, `publishedRevision`. | `slug` único, `{status, displayOrder}`, `updatedAt` |
| `publishedProfiles` | **Snapshot público** inmutable por publicación (`profile: PublicProfile`) + `hiddenReviewIds` (sólo servidor). | `slug` único, `professionalId` único, `displayOrder` |
| `profileRevisions` | Historial de snapshots publicados (revisión, autor, fecha). | `{professionalId, revision}` único |
| `testimonials` | Testimonios manuales (`professionalId` o `null` = de toda la organización). | `{professionalId, enabled, displayOrder}` |
| `externalReviews` | Reseñas sincronizadas de **Google Business Profile** (ubicaciones propias). Nunca contenido de Places API. | `{provider, reviewId}` único |
| `appointmentRequests` | Solicitudes de cita del formulario interno. IP sólo como hash. | `createdAt`, `{status, createdAt}`, `{professionalId, createdAt}` |
| `siteSettings` | Documento único `_id: "site"`. | — |
| `homePage` / `homePageRevisions` | Landing: borrador + snapshot publicado / historial de publicaciones. | `revision` único |
| `integrations` | Estado de integraciones; refresh token **cifrado**; nonce OAuth hasheado. | — |
| `media` | Metadatos de archivos (URL, dimensiones, alpha, alt, foco). Nunca binarios. | `key` único, `createdAt` |
| `users` | Usuarios del backoffice (hash Argon2id, rol, activo, bloqueo por intentos). | `email` único |
| `auditLogs` | Acciones administrativas con metadata saneada. | `timestamp`, `{entityType, entityId, timestamp}` |
| `rateLimits` | Ventanas de rate limit compartidas entre instancias. | TTL en `expiresAt` |

> Mejora frente a la propuesta inicial: en lugar de una colección `profilePages` separada, las secciones viven dentro del borrador del profesional (se editan y versionan juntas) y la "página publicada" es el snapshot de `publishedProfiles`. Así una publicación es atómica (un único documento) y no hay joins en la ruta crítica.

## Rutas públicas

| Ruta | Contenido |
| --- | --- |
| `/` | Landing de venta (`homePage.published`), o directorio / profesional por defecto según *Configuración → Raíz* |
| `/equipo` | Sección del equipo: todos los profesionales publicados |
| `/<slug>` | Perfil completo del profesional (destino de los QR) |
| `/preview/<token>` | Borrador de un perfil o de la landing (token `pid: 'home'`), sólo desde el admin |

## Landing (página de inicio)

`packages/domain/src/landing/registry.ts` define un **segundo registry** con el mismo contrato que el de perfiles (`define`, esquema Zod por tipo, variantes, `FieldDescriptor`). El admin reutiliza el mismo `PageBuilder` (recibe el registry por props) y los mismos editores generados. Persistencia en la colección `homePage` (documento único `home` con `draft`, `revision`, `published` inmutable y `publishedRevision`) + `homePageRevisions`. El sitio lee sólo `published` (tag de caché `landing`); el admin invalida `landing` al publicar, al cambiar testimonios, profesionales o configuración.

## Section registry (page builder)

`packages/domain/src/sections/registry.ts` declara cada tipo de sección (`hero`, `about`, `experience`, `specialties`, `services`, `modalities`, `testimonialCarousel`, `socialLinks`, `appointmentCTA`, `gallery`, `contact`, `location`, `richText`, `professionalSwitcher`, `customCTA`) con:

- `content`: esquema Zod propio del tipo;
- `variants`, `singleton`, `defaultStyle`;
- `fields: FieldDescriptor[]` → el backoffice **genera el editor** a partir de esto;
- campos comunes por instancia: `id`, `type`, `enabled`, `order`, `variant`, `style` (fondo/espaciado/alineación) y `responsive` (ocultar en mobile/desktop).

`sectionSchema` es una unión discriminada por `type`; datos desconocidos o URLs peligrosas (`javascript:`) se rechazan en la frontera. En el sitio público `apps/web/src/components/sections/registry.tsx` mapea cada tipo a su componente, y TypeScript obliga a que **todo tipo registrado tenga renderer**. Agregar una sección = definirla en el registry + crear su componente; el modelo de datos existente no cambia.

El rich text usa un subconjunto Markdown seguro parseado a AST y renderizado como elementos React (sin `dangerouslySetInnerHTML`, sin HTML del usuario).

## Draft → Preview → Publish

1. **Editar / guardar borrador** (`saveProfessionalDraft`): concurrencia optimista por `revision` (dos editores no se pisan). El sitio público no cambia.
2. **Preview**: el admin firma un token HMAC de 15 min (`PREVIEW_SECRET`) y abre `PUBLIC_BASE_URL/preview/<token>` en un iframe (Desktop/Tablet/Mobile). La ruta es `no-store`, `noindex` y sólo enmarcable por `ADMIN_BASE_URL` (CSP `frame-ancestors`).
3. **Publicar** (`publishProfessional`): re-valida el borrador, construye `PublicProfile`, hace *upsert* atómico del snapshot, guarda la revisión y llama a la invalidación del sitio público.
4. **Despublicar / archivar** elimina el snapshot → la URL responde 404 real.

## Caché e invalidación cross-app

- `apps/web` usa **Cache Components** (`cacheComponents: true`). Las lecturas (`src/lib/data.ts`) son funciones `'use cache'` con `cacheTag` (`site`, `directory`, `profile:<slug>`, `testimonials:<id>`) y `cacheLife('hours')` como red de seguridad.
- Los perfiles publicados se prerenderizan en build (`generateStaticParams`); los publicados después reciben *App Shell* instantáneo y se completan en segundo plano.
- Con Cache Components el shell se transmite con estado 200, así que el **404 real** se decide en `proxy.ts` (búsqueda indexada del slug, recomendación oficial de Next 16).
- El admin invalida llamando `POST /api/revalidate` del sitio público con `HMAC-SHA256(timestamp.body)` y `REVALIDATION_SECRET`, ventana anti-replay de 5 min y lista blanca de formatos de tag. El endpoint ejecuta `revalidateTag(tag, { expire: 0 })` y vacía la memoria de slugs del proxy. `partialPrefetching: true` es necesario junto a Cache Components (guía oficial de ISR): sin él, las páginas prerenderizadas en build seguían sirviendo datos antiguos tras invalidar y la navegación cliente posterior fallaba. Comportamiento conocido: la *primera* navegación cliente hacia un perfil recién invalidado puede recibir una respuesta pospuesta y el router la resuelve con una carga completa de página (el usuario termina en la página correcta).

## Testimonios y reseñas

`TestimonialProvider` (`packages/integrations/src/testimonials`) normaliza todas las fuentes a `TestimonialDTO`:

| Proveedor | Origen | Caché |
| --- | --- | --- |
| `manual` | Colección `testimonials` | Cacheado (tag `testimonials:<id>`) |
| `google_business_profile` | `externalReviews` sincronizadas vía OAuth (cron diario o manual) | Cacheado |
| `google_places` | Places API (New) en vivo, máx. 5 reseñas | **Nunca** cacheado ni persistido; el cliente lo pide a `/api/reviews/[slug]` cuando la sección es visible |

`buildTestimonialFeed` aplica rating mínimo, ids ocultos, orden, máximo y *fallback* manual; si Google falla la página sigue funcionando (`degraded`). Ver [google-reviews.md](./google-reviews.md).

## Agendamiento

`resolveAppointmentAction(config)` (dominio) decide el comportamiento del CTA: `INTERNAL_FORM` (diálogo/bottom-sheet cargado bajo demanda → server action con Zod, honeypot y rate limit), `EXTERNAL_URL` (https obligatorio) o `WHATSAPP` (`wa.me` con mensaje prellenado `{name}`). Para agregar Calendly embebido o Google Calendar basta con un nuevo modo en `APPOINTMENT_MODES` y su rama en el resolver: el resto del dominio no cambia.

## Seguridad

- Secretos sólo en servidor (`@repo/config`); la API key de Google se envía como header desde el servidor.
- Zod en todas las fronteras (server actions, route handlers, repositorios, publicación).
- Autorización server-side por permiso (`can(role, permission)`) en cada acción del admin; ocultar botones es sólo UX.
- Auth.js JWT en cookie `HttpOnly`/`Secure`/`SameSite=Lax`, CSRF de Auth.js, re-validación del rol/estado cada 60 s, bloqueo tras intentos fallidos, rate limit por IP y email.
- Argon2id (OWASP) para contraseñas; refresh tokens de Google con AES-256-GCM; `state` OAuth con hash + expiración.
- CSP, `X-Frame-Options`, `nosniff`, `Referrer-Policy`, `Permissions-Policy`, HSTS en producción.
- Uploads: validación por decodificación real (sharp), lista blanca de formatos (sin SVG), límite 8 MB, EXIF eliminado, keys sin path traversal.
- Redirecciones sólo a rutas relativas propias (`safeRedirectPath`).
- Auditoría con metadata saneada (descarta claves tipo `password/token/secret`).

## Motion y rendimiento

- Tokens `fast/normal/slow` + curvas en `tokens.ts` y `globals.css`.
- Entradas con CSS (`rise`, `lift`, `draw`) y *scroll-driven animations* (`animation-timeline: view()`), sin JS. Motion (`LazyMotion` + `domAnimation`) sólo en islas: carrusel, anillo del selector.
- La foto del hero (LCP) sólo se anima con `transform`, `fetchPriority="high"`, art direction con `getImageProps`.
- `prefers-reduced-motion` y la intensidad `off` desactivan animaciones.
- El diálogo de citas (react-hook-form) se descarga sólo al abrirse; reseñas de Google sólo al ser visibles.
