# Despliegue

Dos aplicaciones independientes desde el mismo repositorio:

| App | Dominio sugerido | Directorio raíz |
| --- | --- | --- |
| Sitio público | `www.dominio.cl` (y `dominio.cl`) | `apps/web` |
| Backoffice | `admin.dominio.cl` | `apps/admin` |

## Vercel (recomendado)

1. **MongoDB Atlas**: crear cluster (M0 sirve para empezar) → usuario de base de datos → *Network Access*: permitir las IPs de Vercel (o `0.0.0.0/0` con contraseña fuerte) → copiar la URI `mongodb+srv://…`.
2. Crear **dos proyectos** en Vercel apuntando al mismo repositorio:
   - Proyecto `web`: *Root Directory* `apps/web`, framework Next.js. Vercel detecta pnpm + Turborepo y construye sólo lo necesario (`turbo build --filter=@repo/web...`).
   - Proyecto `admin`: *Root Directory* `apps/admin`.
3. **Variables de entorno** (ver `.env.example`):

   | Variable | web | admin |
   | --- | :-: | :-: |
   | `MONGODB_URI`, `MONGODB_DB_NAME` | ✅ | ✅ |
   | `PUBLIC_BASE_URL` (`https://www.dominio.cl`) | ✅ | ✅ |
   | `ADMIN_BASE_URL` (`https://admin.dominio.cl`) | ✅ (CSP del preview) | ✅ |
   | `REVALIDATION_SECRET` (mismo valor) | ✅ | ✅ |
   | `PREVIEW_SECRET` (mismo valor) | ✅ | ✅ |
   | `AUTH_SECRET` | — | ✅ |
   | `MEDIA_PROVIDER=vercel-blob`, `BLOB_READ_WRITE_TOKEN` | — | ✅ |
   | `GOOGLE_MAPS_API_KEY` | ✅ | ✅ |
   | `GOOGLE_CLIENT_ID/SECRET`, `GOOGLE_REDIRECT_URI`, `INTEGRATION_ENCRYPTION_KEY` | opcional | ✅ |
   | `CRON_SECRET` | — | ✅ |

   Genera secretos con `pnpm secrets:generate`. **Nunca** reutilices los valores de desarrollo.
4. **Vercel Blob**: Storage → crear Blob store → conectarlo al proyecto `admin` (crea `BLOB_READ_WRITE_TOKEN`). Las URLs públicas `*.public.blob.vercel-storage.com` ya están permitidas en `next/image` y CSP.
5. **Base de datos inicial**: desde tu máquina con la URI de producción:
   ```bash
   MONGODB_URI="mongodb+srv://…" SEED_ADMIN_EMAIL=tu@dominio.cl SEED_ADMIN_PASSWORD='…' pnpm db:indexes
   # Opcional: datos demo
   MONGODB_URI="…" SEED_ADMIN_EMAIL=… SEED_ADMIN_PASSWORD=… pnpm db:seed
   ```
   El seed sólo crea lo que falta; nunca sobrescribe configuración editada.
6. **Cron**: `apps/admin/vercel.json` define la sincronización diaria de Google Business Profile. Vercel envía `Authorization: Bearer $CRON_SECRET` automáticamente.
7. Dominios: asignar `www.dominio.cl` al proyecto web y `admin.dominio.cl` al admin.

> **URLs en tiempo de build**: `PUBLIC_BASE_URL` y `ADMIN_BASE_URL` también se leen durante `next build` (cabeceras CSP — p. ej. `frame-ancestors` del preview — y dominios permitidos de `next/image`). Defínelas en el entorno de build con los mismos valores que en runtime; si cambias un dominio, vuelve a desplegar ambas apps.

> Build del sitio público: los perfiles publicados se prerenderizan durante `next build`, por lo que el build necesita acceso a MongoDB. Sin `MONGODB_URI` el build igualmente pasa (usa valores por defecto y un parámetro *placeholder*), útil para CI de PRs.

## Otros hostings (Docker / Node)

- `pnpm install --frozen-lockfile && pnpm build`, luego `pnpm --filter @repo/web start` y `pnpm --filter @repo/admin start` (puertos 3000/3001) detrás de un proxy TLS.
- Con varias instancias del sitio público, configura un `cacheHandlers` compartido (Redis) para que `revalidateTag` afecte a todas (ver *self-hosting* en la documentación de Next.js).
- Media: implementa `MediaStorage` para S3/R2/GCS en `packages/integrations/src/media/storage.ts` (interfaz de 2 métodos) o usa `MEDIA_PROVIDER=local` con un volumen persistente compartido montado en `LOCAL_MEDIA_DIR` y servido por el sitio público en `/media/*`.
- Cron: cualquier scheduler que haga `GET https://admin.dominio.cl/api/cron/sync-reviews` con el header `Authorization: Bearer $CRON_SECRET`.

## Checklist de producción

- [ ] Secretos únicos y largos; `AUTH_SECRET` ≠ `REVALIDATION_SECRET` ≠ `PREVIEW_SECRET`.
- [ ] `PUBLIC_BASE_URL`/`ADMIN_BASE_URL` con `https://` (activa cookies `Secure` y HSTS).
- [ ] Atlas con usuario de privilegios mínimos (readWrite sobre la base) y backups.
- [ ] `pnpm db:indexes` ejecutado.
- [ ] Usuario SUPER_ADMIN creado y contraseña de seed rotada.
- [ ] Contenido DEMO reemplazado o eliminado (`pnpm db:seed --reset` elimina sólo lo marcado como demo).
- [ ] Key de Google restringida a Places API (New).
