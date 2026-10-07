# Auditoría del repositorio legado

Fecha: 2026-10-04 · Commit auditado: `f7df4ac` (rama `master`).

## Qué encontramos

El repositorio era la plantilla **"Payload 3.0 blank"** con algunas colecciones agregadas y un Hero hardcodeado:

| Área | Estado encontrado |
| --- | --- |
| Stack | Next.js 16.3.3 + Payload CMS 3.90 + **Postgres** (`@payloadcms/db-postgres`), aunque README/`.env.example`/docker-compose hablaban de **MongoDB** (inconsistente). |
| Lockfiles | `package-lock.json` (npm) + `.yarnrc` + `engines.pnpm`: tres gestores de paquetes a la vez. `.npmrc` con `legacy-peer-deps=true` ocultando conflictos. |
| Rutas | `(frontend)/page.tsx` → `Hero` y `(payload)/admin` (panel Payload). `app/my-route/route.ts` de ejemplo. |
| Componentes | `Hero.tsx` (≈300 líneas) con **todo el contenido hardcodeado** ("JESSICA DE SOUSA", "MÁS DE 14 AÑOS", testimonio fijo, enlaces `href="#"`), markup duplicado desktop/mobile, SVGs inline repetidos. `Header.tsx` con botón **Login** público que apuntaba a `/admin`. |
| Colecciones Payload | Especialistas, Servicios, Testimonios, FAQs, Colegios, Promociones, Referidos, Media, Users + globals Configuración/Home. Ninguna se consumía desde el frontend. |
| Estilos | Tailwind 3 con tokens útiles (`cream #F5F4F0`, `ink #1A1A1A`, `purple-main #8B7BA8`, `purple-dark #5B4B7A`, `purple-light #B8A8D0`) pero también muchos hex mágicos (`#4d2a80`, `#3a1d66`) repartidos en JSX. |
| Tipografías | Lato (9 archivos TTF, ~700 KB) + **Loverine** (script de marca), cargadas con `@font-face` manual (sin preload, con CLS). |
| Imágenes | Recortes PNG con transparencia de 5 profesionales (~600 KB c/u), 5 avatares circulares, logo, y `img-07.png` (versión de mejor calidad del recorte de Karen Lamadri). |
| Tests | Plantilla de Payload (vitest/playwright) que probaban el admin de Payload. |
| Docker | `Dockerfile`/`docker-compose.yml` genéricos de la plantilla (Node 20, Mongo) incompatibles con el adapter Postgres configurado. |

## Qué conservamos (KEEP / REFACTOR)

| Elemento | Decisión | Dónde quedó |
| --- | --- | --- |
| Logo `logo_aprendizajess.png` | KEEP | `apps/web/public/brand/logo.png` |
| Recortes de profesionales (alpha) | KEEP | `apps/web/public/demo/hero/*.png` (renombrados por slug). Para Karen se usó `img-07.png` (más resolución). |
| Avatares circulares | KEEP | `apps/web/public/demo/avatars/*.png` |
| Lato (400/700/900/900 italic) | REFACTOR | Subset latino + WOFF2 (≈23 KB c/u, −85 %), `next/font/local` con preload y fallback métrico. Se descartaron pesos no usados (Light, Italic regulares). |
| Loverine (script) | REFACTOR | WOFF2 subset, `next/font/local`. Es la tipografía manuscrita de la referencia. |
| Paleta | REFACTOR | Tokens en `packages/domain/src/tokens.ts` (`canvas`, `ink`, `brand #4D2A80`, `brandDeep`, `brandSoft #B8A8D0`…) configurables desde el backoffice. Se añadieron el rojo del corazón y el amarillo del lápiz del logo como acentos. |
| Modelo de datos (Especialistas/Testimonios/Configuración) | REWRITE | Sirvió como inventario de campos (colegiatura → `credentials`, `frase`, `anos_experiencia`, `atiende_online` → `modalities`, `google_review_url` → `testimonials.addReviewUrl`). |
| Texto del Hero de Jessica | KEEP (como contenido) | Movido al seed (`scripts/seed.ts`), editable desde el backoffice. |
| Enlace "Agregar testimonio" (Google Maps) | KEEP | `testimonials.addReviewUrl` del perfil demo. |

## Qué eliminamos (DELETE) y por qué

- **Payload CMS completo** (`payload.config.ts`, `payload-types.ts`, `(payload)/*`, colecciones, globals, importMap, GraphQL): el requerimiento pide un backoffice propio con page builder tipado, draft/preview/publish, roles y MongoDB; Payload + Postgres no aportaba nada que se usara y duplicaba el modelo.
- **FAQs, Colegios, Promociones, Referidos**: no formaban parte del alcance pedido ni se usaban. Quedan en el historial de Git si se requieren.
- **`Hero.tsx` / `Header.tsx`**: contenido hardcodeado, markup duplicado y botón Login público (prohibido en la nueva arquitectura).
- **`package-lock.json`, `.yarnrc`, `legacy-peer-deps`**: se estandarizó en **pnpm workspaces** con un único `pnpm-lock.yaml`.
- **Dockerfile / docker-compose / tests / configs de la plantilla**: reemplazados por configuración del monorepo (Turborepo, Vitest, Playwright, `pnpm db:local`).
- Fuentes TTF no usadas, `test.env`, `.vscode/launch.json` (configurado para Payload), `README` de la plantilla.

No se crearon carpetas `old/`, `legacy/` ni copias: el historial de Git (`f7df4ac` y anteriores) conserva todo.

## Reemplazos

| Antes | Ahora |
| --- | --- |
| Payload admin en `/admin` del sitio público | `apps/admin` en su propio dominio (`admin.dominio.cl`), Auth.js + roles |
| Hero hardcodeado | Section registry tipado + snapshot publicado en MongoDB |
| `@font-face` manual | `next/font/local` WOFF2 subset |
| Postgres (sin usar) | MongoDB Atlas con driver oficial y repositorios |
| Tailwind 3 + hex sueltos | Tailwind 4 `@theme` mapeado a variables generadas desde el tema del backoffice |
