import { computed } from 'vue'
import type { ComputedRef, Ref } from 'vue'
import { usePrivilegesStore } from '~/stores/privileges'
import { useAuthStore } from '~/stores/auth'

/**
 * Nimble approval type codes (from /v1/GetUserApprovalDetails → approvalType field)
 */
export const APPROVAL_TYPE_ENTRY = 1   // Can save drafts
export const APPROVAL_TYPE_VERIFY = 2  // Can verify (Draft → Ready)
export const APPROVAL_TYPE_APPROVE = 3 // Can approve (Ready → Approved)

/**
 * Estimate approval workflow composable.
 *
 * Rules:
 *  - Entry  (type 1): "Save & New" / "Save & Close"    — available on Draft estimates
 *  - Verify (type 2): "Verify & New" / "Verify & Close" — available on Draft estimates only
 *  - Approve (type 3): "Approve & New" / "Approve & Close" — available on Ready estimates only
 *
 * Edit-lock rules (hierarchy: entry < verify < approve):
 *  - Once Approved  → nobody can edit (fully locked)
 *  - Once Ready     → entry-level users are locked out; verify/approve can still edit
 *  - Draft          → all levels can edit
 *
 * Fail-open defaults: when approval data is not yet loaded, or the corporation
 * has no approval workflow configured, the user is treated as entry level so
 * they always see Save buttons and can always edit Draft estimates.
 *
 * @param estimateStatus - reactive ref/computed with the estimate's current status string
 * @param isNewEstimate  - reactive ref/computed, true when creating (not editing)
 */
export function useEstimateApproval(
  estimateStatus: Ref<string> | ComputedRef<string>,
  isNewEstimate: Ref<boolean> | ComputedRef<boolean>,
) {
  const privilegesStore = usePrivilegesStore()
  const corporationStore = useCorporationStore()
  const authStore = useAuthStore()

  /**
   * Get the current user's approval type (1=Entry, 2=Verify, 3=Approve) for the
   * selected corporation.
   *
   * Matching strategy (in priority order):
   *  1. `isCurrentUser === true` in the Nimble response (when the API sets it)
   *  2. `userId` matches the logged-in user's `userID` from the auth session
   *     (needed because Nimble may return `isCurrentUser: false` for all entries)
   *
   * Falls back to ENTRY (1) when the user is not found in the approval chain,
   * no workflow is configured, or the corporation is unknown.
   */
  const currentUserApprovalType = computed((): number => {
    const corpId = String(corporationStore.selectedCorporationId || '').toLowerCase()
    const loaded = privilegesStore.loaded

    console.log('[EstimateApproval] corpId:', corpId, '| loaded:', loaded)
    console.log('[EstimateApproval] session.userID:', authStore.session?.userID)
    console.log('[EstimateApproval] all approvals:', JSON.stringify(privilegesStore.approvals))

    if (!corpId) {
      console.log('[EstimateApproval] No corpId → ENTRY (1)')
      return APPROVAL_TYPE_ENTRY
    }

    const approvals = privilegesStore.getApprovalsForCorporation(corpId)
    console.log('[EstimateApproval] approvals for corp:', JSON.stringify(approvals))

    if (!approvals.length) {
      console.log('[EstimateApproval] No approvals for corp → ENTRY (1)')
      return APPROVAL_TYPE_ENTRY
    }

    const sessionUserId = String(authStore.session?.userID || '').toLowerCase()
    const me = approvals.find(a =>
      a.isCurrentUser
      || (sessionUserId && a.userId === sessionUserId),
    )

    const result = me?.approvalType ?? APPROVAL_TYPE_ENTRY
    console.log('[EstimateApproval] matched:', me ? JSON.stringify(me) : 'none', '→ approvalType:', result)
    return result
  })

  const status = computed(() => estimateStatus.value || 'Draft')

  /**
   * The label for the primary action ("Save", "Verify", or "Approve").
   * For new estimates the user is always in "Save" mode regardless of type,
   * since there is nothing to verify/approve yet.
   */
  const actionLabel = computed((): 'Save' | 'Verify' | 'Approve' => {
    // New estimates always start with Save regardless of approvalType
    if (isNewEstimate.value) return 'Save'

    switch (currentUserApprovalType.value) {
      case APPROVAL_TYPE_VERIFY: return 'Verify'
      case APPROVAL_TYPE_APPROVE: return 'Approve'
      default: return 'Save'
    }
  })

  /**
   * The status that will be written to the estimate when the user submits.
   * Approve-level users always write 'Approved' (they can skip the Verify step).
   */
  const targetStatus = computed((): 'Draft' | 'Ready' | 'Approved' => {
    switch (actionLabel.value) {
      case 'Verify': return 'Ready'
      case 'Approve': return 'Approved'
      default: return 'Draft'
    }
  })

  /**
   * Whether the action buttons should be shown at all.
   *
   * - New estimate: always show (everyone can create drafts)
   * - Entry  (type 1): show when status is Draft
   * - Verify (type 2): show when status is Draft (not yet verified)
   * - Approve (type 3): show when status is Ready (verified, awaiting approval)
   */
  const showActionButtons = computed((): boolean => {
    const isNew = isNewEstimate.value
    const type = currentUserApprovalType.value
    const s = status.value
    const loaded = privilegesStore.loaded

    console.log('[EstimateApproval] showActionButtons → isNew:', isNew, '| type:', type, '| status:', s, '| loaded:', loaded)

    // Fail-open: if approvals haven't loaded yet, always show Save buttons so
    // the user is never accidentally locked out while data is in-flight.
    if (!loaded) {
      console.log('[EstimateApproval] approvals not loaded yet → showing Save buttons (fail-open)')
      return true
    }

    if (isNew) return true

    let result = false
    switch (type) {
      case APPROVAL_TYPE_ENTRY:
        // Entry users can only save/act on Draft estimates
        result = s === 'Draft'
        break
      case APPROVAL_TYPE_VERIFY:
        // Verify users can act on Draft (to verify) or re-save Ready estimates
        result = s === 'Draft' || s === 'Ready'
        break
      case APPROVAL_TYPE_APPROVE:
        // Approve users are the highest authority — they can approve at any stage
        // (Draft or Ready). They cannot re-approve an already-Approved estimate.
        result = s === 'Draft' || s === 'Ready'
        break
      default:
        result = s === 'Draft'
    }

    console.log('[EstimateApproval] showActionButtons →', result)
    return result
  })

  /**
   * Whether the current user can make edits to this estimate.
   *
   * Fail-open: if approvals haven't loaded yet, always allow editing so the
   * user is never locked out while data is in-flight.
   *
   * - Approved  → locked for everyone
   * - Ready     → entry level (type 1) is locked; verify (2) and approve (3) can edit
   * - Draft     → anyone can edit
   */
  const canEdit = computed((): boolean => {
    // Fail-open while approval data is still loading
    if (!privilegesStore.loaded) return true

    const s = status.value
    const type = currentUserApprovalType.value

    if (s === 'Approved') return false
    if (s === 'Ready') return type >= APPROVAL_TYPE_VERIFY
    return true
  })

  /**
   * A human-readable explanation of why the estimate is locked (if it is).
   * Used for tooltips / warnings in the UI.
   */
  const lockReason = computed((): string | null => {
    if (!canEdit.value) {
      if (status.value === 'Approved') return 'This estimate has been approved and cannot be modified.'
      if (status.value === 'Ready') return 'This estimate has been verified. Only verification or approval level users can make changes.'
    }
    return null
  })

  return {
    currentUserApprovalType,
    actionLabel,
    targetStatus,
    showActionButtons,
    canEdit,
    lockReason,
    APPROVAL_TYPE_ENTRY,
    APPROVAL_TYPE_VERIFY,
    APPROVAL_TYPE_APPROVE,
  }
}
