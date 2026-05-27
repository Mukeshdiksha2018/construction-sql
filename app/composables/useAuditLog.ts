import { ref, type Ref } from 'vue'

export interface AuditLogOptions {
  entityType: string
  corporationUuid: string | Ref<string>
  formatCurrency?: (amount: number | string | undefined) => string
}

export function useAuditLog(_options: AuditLogOptions) {
  const showAuditLogModal = ref(false)

  const generateAuditLogInfo = (formData: any) => {
    return { ...formData }
  }

  const showAuditLog = () => {
    showAuditLogModal.value = true
  }

  const onAuditLogsLoaded = (_logs: any[]) => {}
  const onAuditLogError = (_error: any) => {}
  const onExportAuditLogs = (_logs: any[]) => {}

  return {
    showAuditLogModal,
    generateAuditLogInfo,
    showAuditLog,
    onAuditLogsLoaded,
    onAuditLogError,
    onExportAuditLogs,
  }
}
