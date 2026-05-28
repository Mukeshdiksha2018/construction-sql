<template>
  <UModal
    v-model:open="isOpen"
    fullscreen
    scrollable
    :ui="sendEmailModalUi"
  >
    <template #header>
      <div class="flex items-center justify-between w-full gap-4">
        <div class="min-w-0 flex-1">
          <h3
            data-testid="send-modal-title"
            class="text-lg font-semibold text-gray-900 dark:text-white"
          >
            {{ modalTitle }}
          </h3>
          <p class="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
            {{ modalDescription }}
          </p>
        </div>
        <div class="flex shrink-0 items-center gap-2">
          <UButton
            color="neutral"
            variant="solid"
            size="sm"
            icon="i-lucide-send"
            :disabled="!canConfirmSend"
            :loading="sending"
            @click="confirmSend"
          >
            Confirm send
          </UButton>
          <UTooltip text="Close" color="neutral">
            <UButton
              color="neutral"
              variant="solid"
              icon="i-heroicons-x-mark"
              size="sm"
              :disabled="sending"
              aria-label="Close"
              @click="isOpen = false"
            />
          </UTooltip>
        </div>
      </div>
    </template>

    <template #body>
      <div
        class="grid gap-6 md:grid-cols-[minmax(0,20rem)_minmax(0,1fr)] lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] xl:grid-cols-[minmax(0,26rem)_minmax(0,1fr)] md:items-stretch"
        :style="bodyGridStyle"
      >
        <div class="flex min-w-0 flex-col gap-4">
          <div class="flex flex-col gap-1.5">
            <label class="text-xs font-medium text-gray-700 dark:text-gray-300">To <span class="text-red-500">*</span></label>
            <UInput
              v-model="toEmail"
              type="email"
              autocomplete="email"
              :placeholder="documentKind === 'purchase_order' ? 'vendor@example.com' : 'recipient@example.com'"
              size="sm"
              class="w-full"
            />
          </div>
          <div class="flex flex-col gap-1.5">
            <label class="text-xs font-medium text-gray-700 dark:text-gray-300">CC (optional)</label>
            <UTextarea
              v-model="ccEmails"
              placeholder="Separate multiple addresses with commas"
              :rows="3"
              size="sm"
              class="w-full"
            />
          </div>
          <div class="flex min-h-0 flex-col gap-1">
            <label class="text-[11px] font-medium text-gray-600 dark:text-gray-400">
              {{ attachmentSectionLabel }}
            </label>
            <div
              class="flex min-h-0 flex-1 flex-wrap content-start gap-2 overflow-y-auto py-1"
              role="list"
              aria-label="Email attachments"
            >
              <!-- Gmail-style chip: generated PO/CO preview PDF -->
              <div
                role="listitem"
                class="inline-flex max-w-[min(100%,14rem)] items-center gap-1.5 rounded-md border border-gray-200/90 bg-white px-1.5 py-1 shadow-sm dark:border-gray-600 dark:bg-gray-900"
                :title="attachmentFileName"
              >
                <span
                  class="flex h-5 w-5 shrink-0 items-center justify-center rounded-sm bg-red-600 text-[8px] font-semibold leading-none tracking-tight text-white"
                  aria-hidden="true"
                >
                  PDF
                </span>
                <div class="min-w-0 flex-1 py-px leading-tight">
                  <p class="truncate text-[11px] font-normal text-gray-900 dark:text-gray-100">
                    {{ attachmentFileName }}
                  </p>
                  <p class="truncate text-[10px] text-gray-500 dark:text-gray-400">
                    <template v-if="previewHadError">
                      Unavailable
                    </template>
                    <template v-else-if="!previewReady">
                      Preparing…
                    </template>
                    <template v-else>
                      Print preview
                    </template>
                  </p>
                </div>
                <UIcon
                  v-if="!previewReady && !previewHadError && documentUuid"
                  name="i-heroicons-arrow-path"
                  class="mr-0.5 h-3.5 w-3.5 shrink-0 animate-spin text-gray-400"
                  aria-label="Preparing PDF"
                />
              </div>

              <!-- Gmail-style chip: supporting bucket PDFs -->
              <div
                v-for="file in storageAttachmentRows"
                :key="file.key"
                role="listitem"
                class="group inline-flex max-w-[min(100%,14rem)] items-center gap-1.5 rounded-md border border-gray-200/90 bg-white py-1 pl-1.5 pr-1 shadow-sm dark:border-gray-600 dark:bg-gray-900"
                :title="`${file.name} (${file.sizeLabel})`"
              >
                <span
                  class="flex h-5 w-5 shrink-0 items-center justify-center rounded-sm bg-red-600 text-[8px] font-semibold leading-none tracking-tight text-white"
                  aria-hidden="true"
                >
                  PDF
                </span>
                <div class="min-w-0 flex-1 py-px leading-tight">
                  <p class="truncate text-[11px] font-normal text-gray-900 dark:text-gray-100">
                    {{ file.name }}
                  </p>
                  <p class="truncate text-[10px] text-gray-500 dark:text-gray-400">
                    {{ file.sizeLabel }}
                  </p>
                </div>
                <button
                  type="button"
                  class="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-800 dark:hover:bg-gray-800 dark:hover:text-gray-200"
                  aria-label="Remove attachment from email"
                  @click="excludeStorageAttachment(file.key)"
                >
                  <UIcon name="i-heroicons-x-mark" class="h-3 w-3" />
                </button>
              </div>
            </div>
            <p
              v-if="availableStorageAttachments.length"
              class="text-[10px] leading-snug text-gray-500 dark:text-gray-400"
            >
              Tap × to exclude a file from this email only.
            </p>
          </div>
        </div>
        <div class="flex min-h-0 min-w-0 flex-col border-t border-default pt-4 md:border-l md:border-t-0 md:pl-6 md:pt-0">
          <PurchaseOrderEmailBodyEditor
            v-if="isOpen"
            v-model="bodyHtml"
            expanded
          />
        </div>
      </div>
    </template>
  </UModal>

  <Teleport to="body">
    <div
      v-if="documentUuid && isOpen"
      aria-hidden="true"
      class="pointer-events-none fixed top-0 left-[-12000px] z-[-1] box-border w-[min(64rem,calc(100vw-2rem))] bg-white text-gray-900 antialiased"
    >
      <div
        :ref="setPreviewRootEl"
        data-testid="send-preview-pdf-root"
        class="mx-auto max-w-5xl px-4 py-6"
      >
        <PurchaseOrderPreview
          v-if="documentKind === 'purchase_order'"
          :key="`po-${documentUuid}`"
          :purchase-order-uuid="documentUuid"
          @preview-ready="onPreviewReady"
          @preview-error="onPreviewError"
        />
        <ChangeOrderPreview
          v-else
          :key="`co-${documentUuid}`"
          :change-order-uuid="documentUuid"
          @preview-ready="onPreviewReady"
          @preview-error="onPreviewError"
        />
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch, type ComponentPublicInstance } from 'vue'
import PurchaseOrderPreview from '~/components/purchaseOrders/PurchaseOrderPreview.vue'
import ChangeOrderPreview from '~/components/changeOrders/ChangeOrderPreview.vue'
import PurchaseOrderEmailBodyEditor from '~/components/purchaseOrders/PurchaseOrderEmailBodyEditor.vue'
import { buildPurchaseOrderPreviewPdfBlob } from '~/composables/usePurchaseOrderEmailPdf'

export type SendEmailStorageAttachment = {
  uuid?: string
  document_name?: string
  file_size?: number
  file_path?: string
}

const props = defineProps<{
  documentKind: 'purchase_order' | 'change_order'
  /** When null or modal closed, off-screen preview is not mounted. */
  documentUuid: string | null
  defaultToEmail?: string
  documentNumber?: string | null
  /** PO bucket files (display only; server loads from DB on send). */
  storageAttachments?: SendEmailStorageAttachment[]
}>()

const isOpen = defineModel<boolean>('open', { default: false })

const sendEmailModalUi = {
  content: 'w-full max-w-full',
  body: 'p-4 sm:p-6 flex-1 overflow-hidden flex flex-col min-h-0',
}

const bodyGridStyle = { minHeight: 'calc(100dvh - 10rem)' }

const emit = defineEmits<{
  sent: []
}>()

const toEmail = ref('')
const ccEmails = ref('')
const bodyHtml = ref('')
const previewReady = ref(false)
const previewHadError = ref(false)
const sending = ref(false)
const previewRoot = ref<HTMLElement | null>(null)
const lastAutoFilledToEmail = ref('')
/** Keys (uuid or fallback) excluded from this send only — does not delete from PO. */
const excludedStorageKeys = ref<Set<string>>(new Set())

function isValidRecipientEmail(value: string): boolean {
  const s = String(value || '').trim()
  if (!s) return false
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)
}

const canConfirmSend = computed(
  () =>
    previewReady.value &&
    !previewHadError.value &&
    !sending.value &&
    isValidRecipientEmail(toEmail.value),
)

function setPreviewRootEl(el: Element | ComponentPublicInstance | null) {
  if (!el) {
    previewRoot.value = null
    return
  }
  previewRoot.value = el instanceof HTMLElement ? el : null
}

const modalTitle = computed(() =>
  props.documentKind === 'purchase_order'
    ? 'Send purchase order by email'
    : 'Send change order by email'
)

function formatAttachmentBytes(bytes: number | undefined): string {
  const n = Number(bytes)
  if (!Number.isFinite(n) || n <= 0) return 'size unknown'
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  return `${(n / (1024 * 1024)).toFixed(1)} MB`
}

function attachmentRowKey(a: SendEmailStorageAttachment, idx: number): string {
  return a.uuid || `storage-${idx}-${a.file_path || idx}`
}

const documentEntityLabel = computed(() =>
  props.documentKind === 'purchase_order' ? 'purchase order' : 'change order',
)

const availableStorageAttachments = computed(() => {
  const list = Array.isArray(props.storageAttachments) ? props.storageAttachments : []
  return list.filter(
    (a) => a && typeof a.file_path === 'string' && a.file_path.trim() !== '',
  )
})

const storageAttachmentRows = computed(() => {
  const excluded = excludedStorageKeys.value
  return availableStorageAttachments.value
    .map((a, idx) => ({
      key: attachmentRowKey(a, idx),
      uuid: a.uuid,
      name: String(a.document_name || `document-${idx + 1}.pdf`),
      sizeLabel: formatAttachmentBytes(a.file_size),
    }))
    .filter((row) => !excluded.has(row.key))
})

const excludedAttachmentUuids = computed(() => {
  const uuids: string[] = []
  availableStorageAttachments.value.forEach((a, idx) => {
    const key = attachmentRowKey(a, idx)
    if (excludedStorageKeys.value.has(key) && a.uuid) {
      uuids.push(a.uuid)
    }
  })
  return uuids
})

const attachmentSectionLabel = computed(() =>
  storageAttachmentRows.value.length ? 'Attachments' : 'Attachment',
)

const modalDescription = computed(() => {
  const label = documentEntityLabel.value
  if (storageAttachmentRows.value.length) {
    return `Add recipients and message. The ${label} PDF and selected supporting documents are attached.`
  }
  return props.documentKind === 'purchase_order'
    ? 'Add recipients and message. The PDF uses the same layout as Print / purchase order preview.'
    : 'Add recipients and message. The PDF uses the same layout as Print / change order preview.'
})

const attachmentFileName = computed(() => {
  const prefix =
    props.documentKind === 'purchase_order' ? 'purchase-order' : 'change-order'
  const num = props.documentNumber
  const fallbackId = props.documentUuid || (props.documentKind === 'purchase_order' ? 'po' : 'co')
  const safe = num
    ? String(num).replace(/[^\w.-]+/g, '_')
    : String(fallbackId).replace(/-/g, '').slice(0, 13)
  return `${prefix}-${safe}.pdf`
})

const sendEndpoint = computed(() =>
  props.documentKind === 'purchase_order'
    ? '/api/purchase-orders/send-email'
    : '/api/change-orders/send-email'
)

const uuidFieldName = computed(() =>
  props.documentKind === 'purchase_order' ? 'poUuid' : 'coUuid'
)

function escapeHtmlPlain(text: string): string {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function supportingDocsBodyParagraph(count: number): string {
  if (count <= 0) return ''
  const label = documentEntityLabel.value
  return `<p>Additional supporting PDF${count === 1 ? '' : 's'} from this ${label} ${count === 1 ? 'is' : 'are'} also attached.</p>`
}

const SUPPORTING_DOCS_BODY_RE =
  /<p>Additional supporting PDFs? from this (?:purchase order|change order) (?:is|are) also attached\.<\/p>/i

function applySupportingDocsToBody(html: string, count: number): string {
  const stripped = String(html).replace(SUPPORTING_DOCS_BODY_RE, '')
  const extra = supportingDocsBodyParagraph(count)
  if (!extra) return stripped
  const thankIdx = stripped.indexOf('<p>Thank you,</p>')
  if (thankIdx >= 0) {
    return `${stripped.slice(0, thankIdx)}${extra}${stripped.slice(thankIdx)}`
  }
  return `${stripped}${extra}`
}

function defaultBodyHtml(): string {
  const num = String(props.documentNumber || '').trim()
  const refPo = num
    ? `<p>Please find purchase order <strong>${escapeHtmlPlain(num)}</strong> attached as a PDF.</p>`
    : `<p>Please find the purchase order attached as a PDF.</p>`
  const refCo = num
    ? `<p>Please find change order <strong>${escapeHtmlPlain(num)}</strong> attached as a PDF.</p>`
    : `<p>Please find the change order attached as a PDF.</p>`

  if (props.documentKind === 'purchase_order') {
    const base = `<p>Hello,</p>${refPo}<p>Thank you,</p>`
    return applySupportingDocsToBody(base, storageAttachmentRows.value.length)
  }
  const base = `<p>Hello,</p>${refCo}<p>Thank you,</p>`
  return applySupportingDocsToBody(base, storageAttachmentRows.value.length)
}

function bodyHasVisibleText(html: string): boolean {
  const plain = String(html)
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/\u00a0/g, ' ')
    .trim()
  return plain.length > 0
}

function excludeStorageAttachment(key: string) {
  excludedStorageKeys.value = new Set([...excludedStorageKeys.value, key])
  bodyHtml.value = applySupportingDocsToBody(
    bodyHtml.value,
    storageAttachmentRows.value.length,
  )
}

watch(
  isOpen,
  (open) => {
    if (open) {
      const initial = (props.defaultToEmail || '').trim()
      toEmail.value = initial
      lastAutoFilledToEmail.value = initial
      ccEmails.value = ''
      excludedStorageKeys.value = new Set()
      bodyHtml.value = defaultBodyHtml()
      previewReady.value = false
      previewHadError.value = false
      sending.value = false
    }
  },
  { immediate: true },
)

watch(
  () => props.defaultToEmail,
  (newVal) => {
    if (!isOpen.value) return

    const cleaned = (newVal || '').trim()
    if (!cleaned) return

    if (toEmail.value === '' || toEmail.value === lastAutoFilledToEmail.value) {
      toEmail.value = cleaned
      lastAutoFilledToEmail.value = cleaned
    }
  },
)

function onPreviewReady() {
  previewReady.value = true
  previewHadError.value = false
}

function onPreviewError() {
  previewReady.value = false
  previewHadError.value = true
}

const confirmSend = async () => {
  const root = previewRoot.value
  const uuid = props.documentUuid
  const to = toEmail.value.trim()
  const toast = useToast()

  if (!root || !uuid || !to) {
    toast.add({
      title: 'Missing information',
      description: to ? 'The PDF attachment is not ready yet.' : 'Enter a recipient email address.',
      color: 'error',
    })
    return
  }

  if (!isValidRecipientEmail(to)) {
    toast.add({
      title: 'Invalid email',
      description: 'Enter a valid recipient email address.',
      color: 'error',
    })
    return
  }

  if (!bodyHasVisibleText(bodyHtml.value)) {
    toast.add({
      title: 'Message required',
      description: 'Enter an email message before sending.',
      color: 'error',
    })
    return
  }

  sending.value = true
  try {
    const blob = await buildPurchaseOrderPreviewPdfBlob(root)
    const formData = new FormData()
    formData.append('to', to)
    formData.append('cc', ccEmails.value.trim())
    formData.append(uuidFieldName.value, uuid)
    formData.append('bodyHtml', bodyHtml.value)
    formData.append('pdf', blob, attachmentFileName.value)
    if (excludedAttachmentUuids.value.length) {
      formData.append(
        'excludeAttachmentUuids',
        excludedAttachmentUuids.value.join(','),
      )
    }

    await $fetch(sendEndpoint.value, {
      method: 'POST',
      body: formData,
    })

    const sentStorageCount = storageAttachmentRows.value.length
    const label = documentEntityLabel.value
    toast.add({
      title: 'Email sent',
      description: sentStorageCount
        ? `Sent the ${label} PDF and ${sentStorageCount} supporting file${sentStorageCount === 1 ? '' : 's'}.`
        : `The ${label} PDF was sent successfully.`,
      color: 'success',
    })
    emit('sent')
    isOpen.value = false
  } catch (e: unknown) {
    const err = e as { data?: { message?: string }; message?: string }
    const description =
      err?.data?.message || err?.message || 'Could not send email.'
    toast.add({
      title: 'Send failed',
      description,
      color: 'error',
    })
  } finally {
    sending.value = false
  }
}

</script>
