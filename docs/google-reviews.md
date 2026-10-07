# Reseñas de Google

La plataforma funciona **sin credenciales de Google**: en ese caso sólo se muestran testimonios manuales. Las integraciones son opcionales y se activan por profesional desde *Editor → Testimonios*.

Fuente por profesional (`testimonials.source`):

| Valor | Qué muestra |
| --- | --- |
| `MANUAL` | Sólo testimonios manuales (del profesional + los "globales"). |
| `GOOGLE_PLACES` | Reseñas de Places API (New) para un Place ID. Con *fallback manual* si Google falla o no devuelve nada. |
| `GOOGLE_BUSINESS_PROFILE` | Reseñas sincronizadas de una ubicación propia de Business Profile. |
| `MIXED` | Manuales + Google, mezclados según orden/máximo configurados. |

Opciones: `enabled`, `maxReviews`, `minimumRating`, `ordering` (destacadas / recientes / mejor valoradas), `manualFallback`, `showAverageRating`, `showTotalReviews`, `showSourceBadge`, `addReviewUrl` y ocultar reseñas puntuales (`hiddenReviewIds`, sólo identificadores).

## 1. Google Places API (New)

### Configuración

1. En Google Cloud: crear proyecto → habilitar **Places API (New)** → crear una API key.
2. Restringir la key: *API restrictions* → sólo Places API (New); *Application restrictions* → direcciones IP del servidor (o ninguna si el hosting no tiene IP fija, pero **nunca** HTTP referrers: la key es sólo de servidor).
3. `GOOGLE_MAPS_API_KEY=...` en las variables de entorno de **ambas** apps (el admin la usa para buscar/probar el Place; el sitio para mostrar reseñas).
4. Backoffice → Integraciones → Google Places: activar y "Probar conexión".
5. Editor del profesional → Testimonios → fuente `GOOGLE_PLACES` o `MIXED` → buscar el lugar y seleccionar el **Place ID** → Publicar.

### Cumplimiento de políticas (revisado 2026-10)

Fuente: [Places API policies](https://developers.google.com/maps/documentation/places/web-service/policies).

- **Máximo 5 reseñas** por lugar: el diseño nunca asume el historial completo.
- **Almacenamiento**: sólo el **Place ID** se guarda indefinidamente (en el perfil). El contenido de las reseñas **no se persiste ni se cachea en el servidor**: el navegador lo pide a `GET /api/reviews/[slug]` (`Cache-Control: private, no-store`) cuando la sección entra en pantalla. La API key nunca llega al cliente.
- **Atribución del autor**: se muestra avatar, nombre enlazado a su perfil y enlace "Ver en Google" a la reseña original (siempre, aunque `showSourceBadge` esté desactivado).
- **Atribución "Google Maps"**: texto "Google Maps" sin modificar mayúsculas, en Roboto/Arial color `#5E5E5E`, junto al logo "G", siempre visible.
- **Orden y filtrado**: el carrusel describe cómo se ordenan y filtran las reseñas (máximo, rating mínimo y criterio de orden), como exige la política.
- **Texto original**: se muestra `originalText` sin modificar; si Google sólo entrega traducción se indica "Traducido por Google".
- **Ocultar reseñas**: sólo se guarda el identificador (`places/.../reviews/...`) en `hiddenReviewIds`.
- Las reseñas **no** se incluyen en JSON-LD (Google no permite *self-serving reviews* en structured data de la propia organización).

## 2. Google Business Profile (GBP)

Para organizaciones que **administran una ubicación verificada**. Permite traer todas las reseñas (paginadas) de esa ficha.

### Configuración

1. Solicitar acceso a las APIs de Business Profile (formulario de Google) para el proyecto de Cloud.
2. Habilitar *My Business Account Management API*, *My Business Business Information API* y *Google My Business API* (reseñas v4).
3. Pantalla de consentimiento OAuth (tipo *External* o *Internal*) con el scope `https://www.googleapis.com/auth/business.manage`.
4. Crear credencial **OAuth client (Web application)** con *Authorized redirect URI*:
   `https://admin.dominio.cl/api/integrations/google/callback` (local: `http://localhost:3001/api/integrations/google/callback`).
5. Variables (sólo en `apps/admin` + `apps/web` si se quiere mostrar): `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI` (opcional), `INTEGRATION_ENCRYPTION_KEY` (`pnpm secrets:generate`).
6. Backoffice (rol **SUPER_ADMIN**) → Integraciones → *Conectar Google* → consentimiento → elegir cuenta → elegir ubicación → *Probar conexión*.
7. En cada profesional: Testimonios → fuente `GOOGLE_BUSINESS_PROFILE` o `MIXED` → elegir la ubicación asociada → Publicar.

### Cómo funciona

- **Secretos**: client id/secret sólo en variables de entorno (nunca en MongoDB). El **refresh token** se guarda cifrado con AES-256-GCM (`INTEGRATION_ENCRYPTION_KEY`). El `state` OAuth se guarda hasheado con expiración y ligado al usuario que inició la conexión.
- **Sincronización**: `accounts.locations.reviews.list` (v4, `pageSize` 50, sigue `nextPageToken`). Las reseñas se guardan en `externalReviews` (contenido de una ficha propia) y las borradas en Google se eliminan.
  - Manual: botón *Sincronizar* en Integraciones.
  - Programada: `GET /api/cron/sync-reviews` del admin con `Authorization: Bearer $CRON_SECRET`. `apps/admin/vercel.json` lo agenda una vez al día.
  - Tras sincronizar se invalida la caché de los perfiles afectados.
- **Errores**: estado de última sincronización y último error visibles en el admin; si el token fue revocado/expiró el estado pasa a `reauth_required` y se muestra *Reconectar*. Las páginas siguen mostrando los datos ya sincronizados o los manuales.
- **Desconectar**: revoca el token en Google y borra las credenciales cifradas (auditado).

## Pruebas sin consumir APIs

`packages/integrations/test/google.test.ts` cubre ambos adaptadores con `fetch` simulado: headers de la key, normalización con atribución, errores sin filtrar secretos, paginación de GBP, `invalid_grant` → re-autorización. Los proveedores aceptan un `fetcher` inyectable.
