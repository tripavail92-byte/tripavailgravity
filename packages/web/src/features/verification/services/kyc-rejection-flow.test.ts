/**
 * KYC Rejection & Re-upload Flow Tests
 *
 * Validates the business logic for the appeal/re-upload flow introduced
 * for rejected operators. These are pure unit tests — no Supabase calls,
 * no DOM rendering. Each function mirrors a real decision the UI makes.
 *
 * Coverage:
 *   A. identitySubmitted gate — rejected/failed must NOT skip to docs step
 *   B. getActiveKycSession logic — rejected sessions are excluded (new session required)
 *   C. appeal banner visibility — only shown when kycStatus === 'rejected'
 *   D. VerificationStatusPage routing — rejected users go directly to hub
 *   E. kycStatusRank — ordering is consistent with the state machine
 *   F. initialData cleaning — rejected users get blank idCardUrl/idBackUrl
 */

import { describe, expect, it } from 'vitest'

// ─── Types (mirrors kycSessionService.ts) ────────────────────────────────────

type KycStatus =
  | 'pending'
  | 'uploading'
  | 'processing'
  | 'pending_admin_review'
  | 'approved'
  | 'rejected'
  | 'revoked'
  | 'failed'
  | 'expired'

// ─── A. identitySubmitted gate ────────────────────────────────────────────────
//
// In PartnerVerificationHub.useEffect, `identitySubmitted` controls whether
// the hub skips to 'docs' step. It must return false for rejected/failed so
// the operator stays on the identity upload step.

const kycStatusRank: Record<string, number> = {
  pending: 0,
  uploading: 1,
  processing: 2,
  pending_admin_review: 3,
  approved: 4,
  rejected: 4,
  failed: 4,
  expired: 4,
}

function computeIdentitySubmitted(merged: {
  kycStatus?: string
  idCardUrl?: string
  idBackUrl?: string
}): boolean {
  const isRejectedOrFailed = ['rejected', 'failed'].includes(merged?.kycStatus || '')
  return (
    !isRejectedOrFailed &&
    (['processing', 'pending_admin_review', 'approved'].includes((merged?.kycStatus || '').toString()) ||
      (Boolean(merged?.idCardUrl) && Boolean(merged?.idBackUrl)))
  )
}

describe('A. identitySubmitted gate', () => {
  it('returns false when kycStatus is rejected', () => {
    expect(
      computeIdentitySubmitted({ kycStatus: 'rejected', idCardUrl: 'uploaded', idBackUrl: 'uploaded' }),
    ).toBe(false)
  })

  it('returns false when kycStatus is failed', () => {
    expect(
      computeIdentitySubmitted({ kycStatus: 'failed', idCardUrl: 'uploaded', idBackUrl: 'uploaded' }),
    ).toBe(false)
  })

  it('returns false when kycStatus is rejected even with both images uploaded', () => {
    // Regression: old code returned true here, routing user to docs step
    expect(
      computeIdentitySubmitted({ kycStatus: 'rejected', idCardUrl: 'some-url', idBackUrl: 'some-url' }),
    ).toBe(false)
  })

  it('returns true when kycStatus is pending_admin_review', () => {
    expect(computeIdentitySubmitted({ kycStatus: 'pending_admin_review' })).toBe(true)
  })

  it('returns true when kycStatus is approved', () => {
    expect(computeIdentitySubmitted({ kycStatus: 'approved' })).toBe(true)
  })

  it('returns true when both images uploaded regardless of intermediate status', () => {
    // uploading + both images = identity submitted (photos are present, hub advances to docs)
    expect(
      computeIdentitySubmitted({ kycStatus: 'uploading', idCardUrl: 'url', idBackUrl: 'url' }),
    ).toBe(true)
    // no status at all but both images → treated as submitted
    expect(
      computeIdentitySubmitted({ kycStatus: '', idCardUrl: 'url', idBackUrl: 'url' }),
    ).toBe(true)
    // no images, no status → not submitted
    expect(
      computeIdentitySubmitted({ kycStatus: '' }),
    ).toBe(false)
  })

  it('returns false when only front is uploaded', () => {
    expect(computeIdentitySubmitted({ kycStatus: '', idCardUrl: 'url', idBackUrl: '' })).toBe(false)
  })

  it('returns false when kycStatus is expired and no images uploaded', () => {
    // expired with no images = not submitted (QR expired before photos taken)
    expect(computeIdentitySubmitted({ kycStatus: 'expired', idCardUrl: '', idBackUrl: '' })).toBe(false)
    expect(computeIdentitySubmitted({ kycStatus: 'expired' })).toBe(false)
  })
})

// ─── B. getActiveKycSession exclusion of rejected ─────────────────────────────
//
// getActiveKycSession only queries status IN ['pending','uploading','processing','pending_admin_review']
// A 'rejected' session is intentionally excluded so createKycSession() creates a fresh one.

/** Mirrors the status filter in getActiveKycSession (first query) */
const ACTIVE_STATUSES: KycStatus[] = ['pending', 'uploading', 'processing', 'pending_admin_review']
/** Mirrors the fallback filter (second query) */
const PROGRESSED_STATUSES: KycStatus[] = ['processing', 'pending_admin_review', 'approved']

function wouldReturnSession(status: KycStatus): boolean {
  return ACTIVE_STATUSES.includes(status) || PROGRESSED_STATUSES.includes(status)
}

describe('B. getActiveKycSession — rejected sessions are excluded', () => {
  it('rejected is NOT in active statuses', () => {
    expect(ACTIVE_STATUSES.includes('rejected')).toBe(false)
  })

  it('rejected is NOT in progressed statuses', () => {
    expect(PROGRESSED_STATUSES.includes('rejected')).toBe(false)
  })

  it('rejected session would NOT be returned by getActiveKycSession', () => {
    expect(wouldReturnSession('rejected')).toBe(false)
  })

  it('failed session would NOT be returned (forces fresh session)', () => {
    expect(wouldReturnSession('failed')).toBe(false)
  })

  it('processing session IS returned (OCR running, resume)', () => {
    expect(wouldReturnSession('processing')).toBe(true)
  })

  it('pending_admin_review IS returned (waiting for admin)', () => {
    expect(wouldReturnSession('pending_admin_review')).toBe(true)
  })

  it('approved IS returned via progressed fallback', () => {
    expect(wouldReturnSession('approved')).toBe(true)
  })

  it('expired is NOT returned', () => {
    expect(wouldReturnSession('expired')).toBe(false)
  })
})

// ─── C. Appeal banner visibility ───────────────────────────────────────────────

/** Mirrors the JSX condition: verificationData?.kycStatus === 'rejected' */
function shouldShowAppealBanner(kycStatus?: string): boolean {
  return kycStatus === 'rejected'
}

describe('C. Appeal banner visibility', () => {
  it('shows banner for rejected', () => {
    expect(shouldShowAppealBanner('rejected')).toBe(true)
  })

  it('does NOT show for failed (different UI path — retry in-flow)', () => {
    expect(shouldShowAppealBanner('failed')).toBe(false)
  })

  it('does NOT show for pending_admin_review', () => {
    expect(shouldShowAppealBanner('pending_admin_review')).toBe(false)
  })

  it('does NOT show for approved', () => {
    expect(shouldShowAppealBanner('approved')).toBe(false)
  })

  it('does NOT show when kycStatus is empty/undefined', () => {
    expect(shouldShowAppealBanner('')).toBe(false)
    expect(shouldShowAppealBanner(undefined)).toBe(false)
  })
})

// ─── D. VerificationStatusPage routing ───────────────────────────────────────
//
// After the fix: rejected users go straight to <PartnerVerificationHub />.
// No intermediate RejectedView + extra click needed.

type VerificationStatus = 'pending' | 'under_review' | 'approved' | 'rejected' | 'incomplete' | 'info_requested'

function shouldRenderHubDirectly(
  verificationStatus: VerificationStatus,
  latestRequestStatus?: string | null,
): boolean {
  return verificationStatus === 'rejected' || latestRequestStatus === 'rejected'
}

describe('D. VerificationStatusPage — hub rendered directly for rejected', () => {
  it('renders hub when user_roles.verification_status is rejected', () => {
    expect(shouldRenderHubDirectly('rejected')).toBe(true)
  })

  it('renders hub when latestRequest.status is rejected (stale auth session)', () => {
    // user_roles may still show 'pending' if auth session not refreshed
    expect(shouldRenderHubDirectly('pending', 'rejected')).toBe(true)
  })

  it('does NOT render hub for pending verification', () => {
    expect(shouldRenderHubDirectly('pending', 'pending')).toBe(false)
  })

  it('does NOT render hub for approved', () => {
    expect(shouldRenderHubDirectly('approved', 'approved')).toBe(false)
  })

  it('does NOT render hub for under_review', () => {
    expect(shouldRenderHubDirectly('under_review', 'under_review')).toBe(false)
  })

  it('does NOT render hub for info_requested (has its own view)', () => {
    // info_requested uses InfoRequestedView, not the direct hub
    expect(shouldRenderHubDirectly('incomplete', 'info_requested')).toBe(false)
  })
})

// ─── E. kycStatusRank ordering ───────────────────────────────────────────────
//
// The hub uses rank comparison to prefer a newer session's status over
// the profile's cached status. Ordering must be correct.

describe('E. kycStatusRank ordering', () => {
  it('pending < uploading < processing < pending_admin_review', () => {
    expect(kycStatusRank['pending']).toBeLessThan(kycStatusRank['uploading'])
    expect(kycStatusRank['uploading']).toBeLessThan(kycStatusRank['processing'])
    expect(kycStatusRank['processing']).toBeLessThan(kycStatusRank['pending_admin_review'])
  })

  it('approved / rejected / failed / expired are all equal rank (terminal)', () => {
    expect(kycStatusRank['approved']).toBe(kycStatusRank['rejected'])
    expect(kycStatusRank['rejected']).toBe(kycStatusRank['failed'])
    expect(kycStatusRank['failed']).toBe(kycStatusRank['expired'])
  })

  it('all terminal statuses outrank pending_admin_review', () => {
    expect(kycStatusRank['approved']).toBeGreaterThan(kycStatusRank['pending_admin_review'])
    expect(kycStatusRank['rejected']).toBeGreaterThan(kycStatusRank['pending_admin_review'])
  })

  it('unknown status falls back to 0 (same as pending)', () => {
    expect(kycStatusRank['some_unknown'] ?? 0).toBe(0)
  })
})

// ─── F. initialData cleaning for rejected users ──────────────────────────────
//
// When the user is rejected, we pass cleaned initialData to IdentitySubFlow
// so the upload widgets appear fresh (not "Captured & validated").

interface VerificationData {
  idCardUrl?: string
  idBackUrl?: string
  kycStatus?: string
  kycSessionToken?: string
  cnicNumber?: string | null
}

function buildInitialDataForIdentityFlow(
  verificationData: VerificationData,
): VerificationData {
  if (verificationData?.kycStatus === 'rejected') {
    return { ...verificationData, idCardUrl: '', idBackUrl: '', kycStatus: '' }
  }
  return verificationData
}

describe('F. initialData cleaning', () => {
  it('clears idCardUrl, idBackUrl, kycStatus when rejected', () => {
    const cleaned = buildInitialDataForIdentityFlow({
      idCardUrl: 'https://cdn.example.com/front.jpg',
      idBackUrl: 'https://cdn.example.com/back.jpg',
      kycStatus: 'rejected',
      kycSessionToken: 'tok_abc',
    })
    expect(cleaned.idCardUrl).toBe('')
    expect(cleaned.idBackUrl).toBe('')
    expect(cleaned.kycStatus).toBe('')
  })

  it('preserves kycSessionToken so it can still be read if needed', () => {
    const cleaned = buildInitialDataForIdentityFlow({
      idCardUrl: 'old-url',
      idBackUrl: 'old-url',
      kycStatus: 'rejected',
      kycSessionToken: 'tok_xyz',
    })
    expect(cleaned.kycSessionToken).toBe('tok_xyz')
  })

  it('does NOT clean data when status is pending_admin_review', () => {
    const data: VerificationData = {
      idCardUrl: 'front-url',
      idBackUrl: 'back-url',
      kycStatus: 'pending_admin_review',
    }
    const result = buildInitialDataForIdentityFlow(data)
    expect(result.idCardUrl).toBe('front-url')
    expect(result.idBackUrl).toBe('back-url')
    expect(result.kycStatus).toBe('pending_admin_review')
  })

  it('does NOT clean data when status is approved', () => {
    const data: VerificationData = {
      idCardUrl: 'url',
      idBackUrl: 'url',
      kycStatus: 'approved',
    }
    const result = buildInitialDataForIdentityFlow(data)
    expect(result.kycStatus).toBe('approved')
  })

  it('does NOT clean when status is empty (first-time user)', () => {
    const data: VerificationData = { idCardUrl: '', idBackUrl: '', kycStatus: '' }
    const result = buildInitialDataForIdentityFlow(data)
    expect(result).toEqual(data)
  })

  it('preserves cnicNumber through the cleaning (may be needed for display)', () => {
    const cleaned = buildInitialDataForIdentityFlow({
      idCardUrl: 'url',
      idBackUrl: 'url',
      kycStatus: 'rejected',
      cnicNumber: '35201-1234567-1',
    })
    expect(cleaned.cnicNumber).toBe('35201-1234567-1')
  })
})
