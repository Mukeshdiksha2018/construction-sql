import { computed } from 'vue'
import type { ComputedRef, Ref } from 'vue'
import { usePrivilegesStore } from '~/stores/privileges'

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

  /**
   * The current user's approval type for the selected corporation.
   * Falls back to ENTRY (1) when:
   *  - Corporation not selected
   *  - No approval workflow configured for the corporation
   *  - Current user not found in the approval chain
   */
  const currentUserApprovalType = computed((): number => {
    const corpId = String(corporationStore.selectedCorporationId || '').toLowerCase()
    if (!corpId) return APPROVAL_TYPE_ENTRY

    const approvals = privilegesStore.getApprovalsForCorporation(corpId)
    if (!approvals.length) return APPROVAL_TYPE_ENTRY  // no workflow = entry level

    const me = approvals.find(a => a.isCurrentUser)
    return me?.approvalType ?? APPROVAL_TYPE_ENTRY
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
    if (isNewEstimate.value) return true

    const type = currentUserApprovalType.value
    const s = status.value

    switch (type) {
      case APPROVAL_TYPE_ENTRY:
        return s === 'Draft'
      case APPROVAL_TYPE_VERIFY:
        // Verify user can also re-save a Ready estimate they already verified
        return s === 'Draft' || s === 'Ready'
      case APPROVAL_TYPE_APPROVE:
        return s === 'Ready'
      default:
        return s === 'Draft'
    }
  })

  /**
   * Whether the current user can make edits to this estimate.
   *
   * - Approved  → locked for everyone
   * - Ready     → entry level (type 1) is locked; verify (2) and approve (3) can edit
   * - Draft     → anyone can edit
   */
  const canEdit = computed((): boolean => {
    const s = status.value
    const type = currentUserApprovalType.value

    if (s === 'Approved') return false
    if (s === 'Ready') return type >= APPROVAL_TYPE_VERIFY
    return true  // Draft — all levels can edit
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
