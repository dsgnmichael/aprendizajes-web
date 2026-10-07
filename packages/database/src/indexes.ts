import type { Collections } from './collections'

/** Idempotent: safe to run on every deploy (`pnpm db:indexes`) and in seeds. */
export async function ensureIndexes(c: Collections): Promise<void> {
  await Promise.all([
    c.users.createIndex({ email: 1 }, { unique: true }),

    c.professionals.createIndex({ slug: 1 }, { unique: true }),
    c.professionals.createIndex({ status: 1, displayOrder: 1 }),
    c.professionals.createIndex({ updatedAt: -1 }),

    c.publishedProfiles.createIndex({ slug: 1 }, { unique: true }),
    c.publishedProfiles.createIndex({ professionalId: 1 }, { unique: true }),
    c.publishedProfiles.createIndex({ displayOrder: 1, publishedAt: 1 }),

    c.homePageRevisions.createIndex({ revision: -1 }, { unique: true }),

    c.profileRevisions.createIndex({ professionalId: 1, revision: -1 }, { unique: true }),

    c.testimonials.createIndex({ professionalId: 1, enabled: 1, displayOrder: 1 }),

    c.externalReviews.createIndex({ provider: 1, reviewId: 1 }, { unique: true }),
    c.externalReviews.createIndex({ locationName: 1, updateTime: -1 }),

    c.appointmentRequests.createIndex({ createdAt: -1 }),
    c.appointmentRequests.createIndex({ status: 1, createdAt: -1 }),
    c.appointmentRequests.createIndex({ professionalId: 1, createdAt: -1 }),

    c.media.createIndex({ createdAt: -1 }),
    c.media.createIndex({ key: 1 }, { unique: true }),

    c.auditLogs.createIndex({ timestamp: -1 }),
    c.auditLogs.createIndex({ entityType: 1, entityId: 1, timestamp: -1 }),

    // TTL: expired rate-limit windows are removed automatically.
    c.rateLimits.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
  ])
}
