import type { ObjectId } from 'mongodb'
import type {
  AppointmentRequestDocument,
  AuditLogDocument,
  IntegrationId,
  MediaDocument,
  HomePageInput,
  ProfessionalDocument,
  PublicHomePage,
  PublicProfile,
  Role,
  SiteSettings,
  TestimonialDocument,
} from '@repo/domain'

/** Mongo shapes: domain documents with `_id` instead of `id`. */
type WithObjectId<T extends { id: string }> = Omit<T, 'id'> & { _id: ObjectId }

export type ProfessionalModel = WithObjectId<ProfessionalDocument>

export interface PublishedProfileModel {
  _id: ObjectId
  professionalId: ObjectId
  slug: string
  revision: number
  displayOrder: number
  publishedAt: Date
  profile: PublicProfile
  hiddenReviewIds: string[]
}

export interface ProfileRevisionModel {
  _id: ObjectId
  professionalId: ObjectId
  revision: number
  publishedAt: Date
  publishedBy: string
  profile: PublicProfile
}

export type TestimonialModel = Omit<WithObjectId<TestimonialDocument>, 'professionalId'> & {
  professionalId: ObjectId | null
}

export type AppointmentRequestModel = Omit<WithObjectId<AppointmentRequestDocument>, 'professionalId'> & {
  professionalId: ObjectId
  ipHash: string | null
}

export interface UserModel {
  _id: ObjectId
  name: string
  email: string
  passwordHash: string
  role: Role
  active: boolean
  createdAt: Date
  updatedAt: Date
  lastLoginAt: Date | null
  failedLogins: number
  lockedUntil: Date | null
}

export interface SiteSettingsModel extends SiteSettings {
  _id: 'site'
  updatedAt: Date
  updatedBy?: string
}

/** Encrypted token blob (AES-256-GCM). */
export interface EncryptedValue {
  v: 1
  iv: string
  tag: string
  data: string
}

export interface IntegrationModel {
  _id: IntegrationId
  enabled: boolean
  accountLabel: string | null
  /** GBP: encrypted OAuth refresh token. Never stored in plain text. */
  refreshToken: EncryptedValue | null
  scopes: string[]
  lastTestedAt: Date | null
  lastTestOk: boolean | null
  lastSyncAt: Date | null
  lastSyncStatus: 'ok' | 'error' | 'reauth_required' | null
  lastError: string | null
  connectedBy: string | null
  connectedAt: Date | null
  updatedAt: Date
  /** OAuth `state` nonce (hashed) for CSRF protection during connect. */
  pendingState: { hash: string; expiresAt: Date; userId: string } | null
}

/**
 * Reviews synced from Google Business Profile for locations the organisation
 * owns and manages. (Places API content is NEVER stored – see docs.)
 */
export interface ExternalReviewModel {
  _id: ObjectId
  provider: 'google_business_profile'
  reviewId: string
  locationName: string
  authorName: string
  authorPhotoUrl: string | null
  rating: number | null
  comment: string
  createTime: Date
  updateTime: Date
  syncedAt: Date
}

export type MediaModel = WithObjectId<MediaDocument>

export type AuditLogModel = WithObjectId<AuditLogDocument>

export interface RateLimitModel {
  _id: string
  count: number
  expiresAt: Date
}

/** Single document (`_id: 'home'`): editable draft + immutable published copy. */
export interface HomePageModel {
  _id: 'home'
  draft: HomePageInput
  revision: number
  published: PublicHomePage | null
  publishedRevision: number | null
  updatedAt: Date
  publishedAt: Date | null
  updatedBy?: string
}

export interface HomePageRevisionModel {
  _id: ObjectId
  revision: number
  publishedAt: Date
  publishedBy: string
  page: PublicHomePage
}
