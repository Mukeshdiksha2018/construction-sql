import { computed } from 'vue'
import type { ComputedRef, Ref } from 'vue'
import { usePrivilegesStore } from '~/stores/privileges'
import { useAuthStore } from '~/stores/auth'

/**
 * Nimble approval type codes (from /v1/GetUserApprovalDetails → approvalType field)
 */
export const APPROVAL_TYPE_ENTRY = 1   // Can save drafts
export const APPROVAL_TYPE_VERIFY = 2  // Can verify (Draft → Ready)
export const APPROVAL_TYPE_APPROVE = 3 // Can approve (Draft/Ready → Approved)

/**
 * Estimate approval workflow composable.
 *
 * Button visibility by approvalType:
 *  - Entry  (1): "Save & New" / "Save & Close"     — Draft estimates only
 *  - Verify (2): "Verify & New" / "Verify & Close"  — Draft or Ready estimates
 *  - Approve (3): "Approve & New" / "Approve & Close" — Draft or Ready estimates
 *                  (highest authority, can skip the verify step)
 *
 * Edit-lock hierarchy:
 *  - Approved → locked for everyone
 *  - Ready    → entry (1) is locked; verify (2) and approve (3) can still edit
 *  - Draft    → all levels can edit
 *
 * Fail-open: when approval data is not yet loaded the user always sees Save
 * buttons and can always edit, so nobody is accidentally locked out.
 *
 * @param estimateStatus - reactive ref/computed with the estimate's current status
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
   *     (fallback — Nimble may return `isCurrentUser: false` for all entries)
   *
   * Falls back to ENTRY (1) when the user is not found in the approval chain,
   * no workflow is configured, or the corporation is unknown.
   */
  const currentUserApprovalType = computed((): number => {
    const corpId = String(corporationStore.selectedCorporationId || '').toLowerCase()
    if (!corpId) return APPROVAL_TYPE_ENTRY

    const approvals = privilegesStore.getApprovalsForCorporation(corpId)
    if (!approvals.length) return APPROVAL_TYPE_ENTRY

    const sessionUserId = String(authStore.session?.userID || '').toLowerCase()
    const me = approvals.find(a =>
      a.isCurrentUser
      || (sessionUserId && a.userId === sessionUserId),
    )

    return me?.approvalType ?? APPROVAL_TYPE_ENTRY
  })

  const status = computed(() => estimateStatus.value || 'Draft')

  /**
   * The label for the primary action ("Save", "Verify", or "Approve").
   * New estimates always use "Save" regardless of approval type.
   */
  const actionLabel = computed((): 'Save' | 'Verify' | 'Approve' => {
    if (isNewEstimate.value) return 'Save'

    switch (currentUserApprovalType.value) {
      case APPROVAL_TYPE_VERIFY: return 'Verify'
      case APPROVAL_TYPE_APPROVE: return 'Approve'
      default: return 'Save'
    }
  })

  /**
   * The status that will be written when the user submits.
   * Approve-level users always write 'Approved' (can skip the Verify step).
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
   * Fail-open: if approvals haven't loaded yet, always show buttons so the
   * user is never accidentally locked out while data is still in-flight.
   */
  const showActionButtons = computed((): boolean => {
    if (!privilegesStore.loaded) return true
    if (isNewEstimate.value) return true

    const type = currentUserApprovalType.value
    const s = status.value

    switch (type) {
      case APPROVAL_TYPE_ENTRY:
        return s === 'Draft'
      case APPROVAL_TYPE_VERIFY:
        return s === 'Draft' || s === 'Ready'
      case APPROVAL_TYPE_APPROVE:
        // Highest authority — can approve at any stage except already-Approved
        return s === 'Draft' || s === 'Ready'
      default:
        return s === 'Draft'
    }
  })

  /**
   * Whether the current user can make edits to this estimate.
   *
   * Fail-open: always allow editing while approval data is still loading.
   */
  const canEdit = computed((): boolean => {
    if (!privilegesStore.loaded) return true

    const s = status.value
    const type = currentUserApprovalType.value

    if (s === 'Approved') return false
    if (s === 'Ready') return type >= APPROVAL_TYPE_VERIFY
    return true
  })

  /** Human-readable explanation when the estimate is locked. */
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
