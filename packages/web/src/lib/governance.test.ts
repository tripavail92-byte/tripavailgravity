/**
 * Governance Matrix Tests
 * Tests for can_partner_operate() logic, suspension cascade behaviour,
 * support-role blocking, and RLS enforcement scenarios.
 *
 * These are unit tests for the helper logic that mirrors the DB functions.
 * The DB-level enforcement is tested via supabase/tests/*.sql (pgTAP).
 * These tests verify the equivalent TS-side assumptions used in the UI.
 */

import { describe, expect, it } from 'vitest'

// ─── Types (mirrors DB schema) ────────────────────────────────────────────────

type VerificationStatus = 'pending' | 'under_review' | 'approved' | 'rejected' | 'info_requested'
type AccountStatus = 'active' | 'suspended' | 'deleted'
type AdminRole = 'super_admin' | 'moderator' | 'support'

interface PartnerState {
  verificationStatus: VerificationStatus
  accountStatus: AccountStatus
}

// ─── Mirrors public.can_partner_operate() ─────────────────────────────────────

function canPartnerOperate(state: PartnerState): boolean {
  return state.verificationStatus === 'approved' && state.accountStatus === 'active'
}

// ─── Mirrors the support-role guard in admin RPCs ─────────────────────────────

function canAdminActOnVerification(role: AdminRole): boolean {
  return role !== 'support'
}

function canAdminChangeAccountStatus(role: AdminRole): boolean {
  return role !== 'support'
}

// ─── Mirrors the cascade logic in admin_set_hotel_manager_status ──────────────

type ListingStatus = 'live' | 'suspended' | 'draft' | 'archived'

function getListingStatusAfterAccountChange(
  currentListingStatus: ListingStatus,
  newAccountStatus: AccountStatus,
): ListingStatus {
  // Suspension cascades: live → suspended
  if (newAccountStatus === 'suspended' || newAccountStatus === 'deleted') {
    if (currentListingStatus === 'live') return 'suspended'
    return currentListingStatus // draft/archived/already-suspended unchanged
  }
  // Reinstatement: NO auto-restore (conservative policy)
  return currentListingStatus
}

// ─────────────────────────────────────────────────────────────────────────────
// SCENARIO A: Suspend Approved Partner
// ─────────────────────────────────────────────────────────────────────────────

describe('Scenario A — Suspend Approved Partner', () => {
  it('approved + active partner CAN operate', () => {
    const partner: PartnerState = { verificationStatus: 'approved', accountStatus: 'active' }
    expect(canPartnerOperate(partner)).toBe(true)
  })

  it('can_partner_operate returns FALSE immediately after suspension', () => {
    const suspended: PartnerState = { verificationStatus: 'approved', accountStatus: 'suspended' }
    expect(canPartnerOperate(suspended)).toBe(false)
  })

  it('live listings cascade to suspended when account is suspended', () => {
    expect(getListingStatusAfterAccountChange('live', 'suspended')).toBe('suspended')
  })

  it('live listings cascade to suspended when account is soft-deleted', () => {
    expect(getListingStatusAfterAccountChange('live', 'deleted')).toBe('suspended')
  })

  it('draft listings are NOT touched by suspension (not public anyway)', () => {
    expect(getListingStatusAfterAccountChange('draft', 'suspended')).toBe('draft')
  })

  it('already-suspended listings stay suspended during account suspend', () => {
    expect(getListingStatusAfterAccountChange('suspended', 'suspended')).toBe('suspended')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// SCENARIO B: Reinstate Suspended Partner
// ─────────────────────────────────────────────────────────────────────────────

describe('Scenario B — Reinstate Suspended Partner', () => {
  it('reinstated approved partner CAN operate', () => {
    const reinstated: PartnerState = { verificationStatus: 'approved', accountStatus: 'active' }
    expect(canPartnerOperate(reinstated)).toBe(true)
  })

  it('listings do NOT auto-reactivate upon reinstatement (conservative policy)', () => {
    // A suspended listing that was hidden during account suspension
    // must stay suspended after reinstatement — partner re-publishes manually
    expect(getListingStatusAfterAccountChange('suspended', 'active')).toBe('suspended')
  })

  it('draft listings stay draft after reinstatement', () => {
    expect(getListingStatusAfterAccountChange('draft', 'active')).toBe('draft')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// SCENARIO C: Support Role Restrictions
// ─────────────────────────────────────────────────────────────────────────────

describe('Scenario C — Support Role Cannot Act', () => {
  it('support cannot approve/reject partner verification', () => {
    expect(canAdminActOnVerification('support')).toBe(false)
  })

  it('support cannot change partner account status', () => {
    expect(canAdminChangeAccountStatus('support')).toBe(false)
  })

  it('moderator CAN approve/reject verification', () => {
    expect(canAdminActOnVerification('moderator')).toBe(true)
  })

  it('super_admin CAN approve/reject verification', () => {
    expect(canAdminActOnVerification('super_admin')).toBe(true)
  })

  it('moderator CAN change account status', () => {
    expect(canAdminChangeAccountStatus('moderator')).toBe(true)
  })

  it('super_admin CAN change account status', () => {
    expect(canAdminChangeAccountStatus('super_admin')).toBe(true)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// GOVERNANCE MATRIX: full 4-state grid
// ─────────────────────────────────────────────────────────────────────────────

describe('Governance Matrix — full 2-axis grid', () => {
  const matrix: Array<[VerificationStatus, AccountStatus, boolean, string]> = [
    ['approved', 'active', true, 'approved + active = OPERATIVE'],
    ['approved', 'suspended', false, 'approved + suspended = BLOCKED'],
    ['approved', 'deleted', false, 'approved + deleted = BLOCKED'],
    ['pending', 'active', false, 'pending + active = NOT YET VERIFIED'],
    ['under_review', 'active', false, 'under_review + active = NOT YET VERIFIED'],
    ['rejected', 'active', false, 'rejected + active = NOT VERIFIED'],
    ['info_requested', 'active', false, 'info_requested + active = NOT VERIFIED'],
    ['pending', 'suspended', false, 'pending + suspended = DOUBLY BLOCKED'],
  ]

  matrix.forEach(([verif, account, expected, label]) => {
    it(label, () => {
      expect(canPartnerOperate({ verificationStatus: verif, accountStatus: account })).toBe(
        expected,
      )
    })
  })
})
