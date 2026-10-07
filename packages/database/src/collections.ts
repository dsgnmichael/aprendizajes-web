import type { Collection, Db } from 'mongodb'
import { COLLECTIONS } from '@repo/domain'
import { getDb } from './client'
import type {
  AppointmentRequestModel,
  AuditLogModel,
  ExternalReviewModel,
  HomePageModel,
  HomePageRevisionModel,
  IntegrationModel,
  MediaModel,
  ProfessionalModel,
  ProfileRevisionModel,
  PublishedProfileModel,
  RateLimitModel,
  SiteSettingsModel,
  TestimonialModel,
  UserModel,
} from './models'

export interface Collections {
  users: Collection<UserModel>
  professionals: Collection<ProfessionalModel>
  homePage: Collection<HomePageModel>
  homePageRevisions: Collection<HomePageRevisionModel>
  publishedProfiles: Collection<PublishedProfileModel>
  profileRevisions: Collection<ProfileRevisionModel>
  testimonials: Collection<TestimonialModel>
  externalReviews: Collection<ExternalReviewModel>
  appointmentRequests: Collection<AppointmentRequestModel>
  siteSettings: Collection<SiteSettingsModel>
  integrations: Collection<IntegrationModel>
  media: Collection<MediaModel>
  auditLogs: Collection<AuditLogModel>
  rateLimits: Collection<RateLimitModel>
}

export function collectionsFor(db: Db): Collections {
  return {
    users: db.collection<UserModel>(COLLECTIONS.users),
    professionals: db.collection<ProfessionalModel>(COLLECTIONS.professionals),
    homePage: db.collection<HomePageModel>(COLLECTIONS.homePage),
    homePageRevisions: db.collection<HomePageRevisionModel>('homePageRevisions'),
    publishedProfiles: db.collection<PublishedProfileModel>(COLLECTIONS.publishedProfiles),
    profileRevisions: db.collection<ProfileRevisionModel>(COLLECTIONS.profileRevisions),
    testimonials: db.collection<TestimonialModel>(COLLECTIONS.testimonials),
    externalReviews: db.collection<ExternalReviewModel>(COLLECTIONS.externalReviews),
    appointmentRequests: db.collection<AppointmentRequestModel>(COLLECTIONS.appointmentRequests),
    siteSettings: db.collection<SiteSettingsModel>(COLLECTIONS.siteSettings),
    integrations: db.collection<IntegrationModel>(COLLECTIONS.integrations),
    media: db.collection<MediaModel>(COLLECTIONS.media),
    auditLogs: db.collection<AuditLogModel>(COLLECTIONS.auditLogs),
    rateLimits: db.collection<RateLimitModel>(COLLECTIONS.rateLimits),
  }
}

export async function collections(): Promise<Collections> {
  return collectionsFor(await getDb())
}
