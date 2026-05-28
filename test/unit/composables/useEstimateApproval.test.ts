import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ref, computed } from 'vue'

vi.stubGlobal('computed', computed)

// ── Mocks ──────────────────────────────────────────────────────────────────

const mockApprovals = ref<any[]>([])
const mockPrivilegesLoaded = ref(false)
const mockSelectedCorpId = ref('')
const mockSessionUserId = ref('')

vi.mock('../../../app/stores/privileges', () => ({
  usePrivilegesStore: () => ({
    get loaded() { return mockPrivilegesLoaded.value },
    get approvals() { return mockApprovals.value },
    getApprovalsForCorporation: (corpId: string) => {
      const norm = String(corpId || '').toLowerCase()
      return mockApprovals.value.filter((a: any) => a.corporationId === norm)
    },
  }),
}))

vi.stubGlobal('useCorporationStore', () => ({
  get selectedCorporationId() { return mockSelectedCorpId.value },
}))

vi.mock('../../../app/stores/auth', () => ({
  useAuthStore: () => ({
    get session() {
      return mockSessionUserId.value ? { userID: mockSessionUserId.value } : null
    },
  }),
}))

const CORP_ID = 'f6d03336024e34824725d3ee74fc4e420000'

function makeApproval(approvalType: number, userId = 'user-abc', corporationId = CORP_ID) {
  return { corporationId, userId, name: 'Test', userName: 'test@test.com', approvalOrder: 1, approvalType, isCurrentUser: false }
}

async function getComposable(status: string, isNew = false) {
  vi.resetModules()
  const { useEstimateApproval } = await import('../../../app/composables/useEstimateApproval')
  return useEstimateApproval(ref(status), ref(isNew))
}

describe('useEstimateApproval', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockApprovals.value = []
    mockPrivilegesLoaded.value = false
    mockSelectedCorpId.value = CORP_ID
    mockSessionUserId.value = 'user-abc'
  })

  // ── Fail-open: approvals not loaded yet ───────────────────────────────────

  describe('fail-open when approvals not loaded', () => {
    beforeEach(() => { mockPrivilegesLoaded.value = false })

    it('showActionButtons returns true regardless of status', async () => {
      // Even though no approvals loaded and status is Ready (which blocks entry users)
      const c = await getComposable('Ready')
      expect(c.showActionButtons.value).toBe(true)
    })

    it('canEdit returns true for Ready estimate', async () => {
      const c = await getComposable('Ready')
      expect(c.canEdit.value).toBe(true)
    })

    it('canEdit returns true for Approved estimate', async () => {
      const c = await getComposable('Approved')
      expect(c.canEdit.value).toBe(true)
    })

    it('actionLabel defaults to Save while loading', async () => {
      const c = await getComposable('Draft')
      expect(c.actionLabel.value).toBe('Save')
    })
  })

  // ── New estimate — always show Save ───────────────────────────────────────

  describe('new estimate', () => {
    beforeEach(() => {
      mockPrivilegesLoaded.value = true
      mockApprovals.value = [makeApproval(3)]  // even approve user
    })

    it('always shows buttons for a new estimate', async () => {
      const c = await getComposable('', true)
      expect(c.showActionButtons.value).toBe(true)
    })

    it('actionLabel is always Save for new estimate regardless of approvalType', async () => {
      const c = await getComposable('', true)
      expect(c.actionLabel.value).toBe('Save')
      expect(c.targetStatus.value).toBe('Draft')
    })
  })

  // ── currentUserApprovalType matching ──────────────────────────────────────

  describe('currentUserApprovalType', () => {
    beforeEach(() => { mockPrivilegesLoaded.value = true })

    it('returns ENTRY (1) when no approvals for corporation', async () => {
      mockApprovals.value = []
      const c = await getComposable('Draft')
      expect(c.currentUserApprovalType.value).toBe(1)
    })

    it('returns ENTRY (1) when no corpId selected', async () => {
      mockSelectedCorpId.value = ''
      const c = await getComposable('Draft')
      expect(c.currentUserApprovalType.value).toBe(1)
    })

    it('matches by userId from auth session (Nimble isCurrentUser=false fallback)', async () => {
      mockSessionUserId.value = 'user-abc'
      mockApprovals.value = [makeApproval(2, 'user-abc')]
      const c = await getComposable('Draft')
      expect(c.currentUserApprovalType.value).toBe(2)
    })

    it('matches by isCurrentUser flag when userId differs', async () => {
      mockSessionUserId.value = 'different-id'
      mockApprovals.value = [{
        ...makeApproval(3, 'some-other-id'),
        isCurrentUser: true,
      }]
      const c = await getComposable('Draft')
      expect(c.currentUserApprovalType.value).toBe(3)
    })

    it('userId comparison is case-insensitive', async () => {
      mockSessionUserId.value = 'USER-ABC-123'  // uppercase from auth session
      mockApprovals.value = [makeApproval(2, 'user-abc-123')]  // lowercase in approvals
      const c = await getComposable('Draft')
      expect(c.currentUserApprovalType.value).toBe(2)
    })

    it('falls back to ENTRY when session userId does not match any approval', async () => {
      mockSessionUserId.value = 'unknown-user'
      mockApprovals.value = [makeApproval(3, 'someone-else')]
      const c = await getComposable('Draft')
      expect(c.currentUserApprovalType.value).toBe(1)
    })
  })

  // ── Entry user (type 1) ───────────────────────────────────────────────────

  describe('Entry user (approvalType 1)', () => {
    beforeEach(() => {
      mockPrivilegesLoaded.value = true
      mockApprovals.value = [makeApproval(1)]
    })

    it('shows Save buttons on Draft estimate', async () => {
      const c = await getComposable('Draft')
      expect(c.showActionButtons.value).toBe(true)
      expect(c.actionLabel.value).toBe('Save')
      expect(c.targetStatus.value).toBe('Draft')
    })

    it('hides buttons on Ready estimate', async () => {
      const c = await getComposable('Ready')
      expect(c.showActionButtons.value).toBe(false)
    })

    it('hides buttons on Approved estimate', async () => {
      const c = await getComposable('Approved')
      expect(c.showActionButtons.value).toBe(false)
    })

    it('can edit Draft estimate', async () => {
      expect((await getComposable('Draft')).canEdit.value).toBe(true)
    })

    it('cannot edit Ready estimate', async () => {
      expect((await getComposable('Ready')).canEdit.value).toBe(false)
    })

    it('cannot edit Approved estimate', async () => {
      expect((await getComposable('Approved')).canEdit.value).toBe(false)
    })
  })

  // ── Verify user (type 2) ──────────────────────────────────────────────────

  describe('Verify user (approvalType 2)', () => {
    beforeEach(() => {
      mockPrivilegesLoaded.value = true
      mockApprovals.value = [makeApproval(2)]
    })

    it('shows Verify buttons on Draft estimate', async () => {
      const c = await getComposable('Draft')
      expect(c.showActionButtons.value).toBe(true)
      expect(c.actionLabel.value).toBe('Verify')
      expect(c.targetStatus.value).toBe('Ready')
    })

    it('shows Verify buttons on Ready estimate (re-save)', async () => {
      const c = await getComposable('Ready')
      expect(c.showActionButtons.value).toBe(true)
      expect(c.actionLabel.value).toBe('Verify')
    })

    it('hides buttons on Approved estimate', async () => {
      const c = await getComposable('Approved')
      expect(c.showActionButtons.value).toBe(false)
    })

    it('can edit Draft estimate', async () => {
      expect((await getComposable('Draft')).canEdit.value).toBe(true)
    })

    it('can edit Ready estimate', async () => {
      expect((await getComposable('Ready')).canEdit.value).toBe(true)
    })

    it('cannot edit Approved estimate', async () => {
      expect((await getComposable('Approved')).canEdit.value).toBe(false)
    })
  })

  // ── Approve user (type 3) ─────────────────────────────────────────────────

  describe('Approve user (approvalType 3)', () => {
    beforeEach(() => {
      mockPrivilegesLoaded.value = true
      mockApprovals.value = [makeApproval(3)]
    })

    it('shows Approve buttons on Draft estimate (root-cause fix: was returning false)', async () => {
      const c = await getComposable('Draft')
      expect(c.showActionButtons.value).toBe(true)
      expect(c.actionLabel.value).toBe('Approve')
      expect(c.targetStatus.value).toBe('Approved')
    })

    it('shows Approve buttons on Ready estimate', async () => {
      const c = await getComposable('Ready')
      expect(c.showActionButtons.value).toBe(true)
      expect(c.actionLabel.value).toBe('Approve')
      expect(c.targetStatus.value).toBe('Approved')
    })

    it('hides buttons on already-Approved estimate', async () => {
      const c = await getComposable('Approved')
      expect(c.showActionButtons.value).toBe(false)
    })

    it('can edit Draft estimate', async () => {
      expect((await getComposable('Draft')).canEdit.value).toBe(true)
    })

    it('can edit Ready estimate', async () => {
      expect((await getComposable('Ready')).canEdit.value).toBe(true)
    })

    it('cannot edit Approved estimate', async () => {
      expect((await getComposable('Approved')).canEdit.value).toBe(false)
    })

    it('approving a Draft estimate goes straight to Approved (skips Verify step)', async () => {
      const c = await getComposable('Draft')
      expect(c.targetStatus.value).toBe('Approved')
    })
  })

  // ── lockReason ────────────────────────────────────────────────────────────

  describe('lockReason', () => {
    beforeEach(() => {
      mockPrivilegesLoaded.value = true
      mockApprovals.value = [makeApproval(1)]  // Entry user
    })

    it('returns null for editable estimate', async () => {
      expect((await getComposable('Draft')).lockReason.value).toBeNull()
    })

    it('returns approved message for Approved estimate', async () => {
      const reason = (await getComposable('Approved')).lockReason.value
      expect(reason).toContain('approved')
    })

    it('returns verified message when entry user sees Ready estimate', async () => {
      const reason = (await getComposable('Ready')).lockReason.value
      expect(reason).toContain('verified')
    })

    it('returns null for Approve user on Ready estimate (they can edit)', async () => {
      mockApprovals.value = [makeApproval(3)]
      const reason = (await getComposable('Ready')).lockReason.value
      expect(reason).toBeNull()
    })
  })

  // ── No approval workflow configured ──────────────────────────────────────

  describe('no approval workflow configured', () => {
    beforeEach(() => {
      mockPrivilegesLoaded.value = true
      mockApprovals.value = []  // empty — no workflow set up
    })

    it('defaults to Entry behavior — shows Save buttons on Draft', async () => {
      const c = await getComposable('Draft')
      expect(c.showActionButtons.value).toBe(true)
      expect(c.actionLabel.value).toBe('Save')
    })

    it('blocks entry-level on Ready (consistent with Entry fallback)', async () => {
      const c = await getComposable('Ready')
      expect(c.showActionButtons.value).toBe(false)
    })
  })
})
