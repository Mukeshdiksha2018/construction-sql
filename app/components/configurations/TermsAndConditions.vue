<template>
  <div class="space-y-6">
    <div class="flex justify-between items-center gap-4">
      <UInput
        v-model="searchFilter"
        placeholder="Search terms and conditions..."
        icon="i-heroicons-magnifying-glass"
        class="flex-1 max-w-md"
      />
      <UButton
        icon="i-heroicons-plus"
        color="primary"
        @click="openAddModal"
      >
        Add Terms and Conditions
      </UButton>
    </div>

    <div v-if="loading" class="flex justify-center items-center py-12">
      <div class="text-center">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
        <p class="text-gray-600">
          Loading terms and conditions...
        </p>
      </div>
    </div>

    <UAlert
      v-else-if="error"
      color="error"
      variant="soft"
      :title="error"
    />

    <div v-else-if="filteredTermsAndConditions.length === 0" class="text-center py-12">
      <UIcon name="i-heroicons-document-text" class="w-16 h-16 mx-auto mb-4 text-gray-400" />
      <p class="text-gray-600 font-medium mb-2">
        {{ searchFilter ? 'No terms and conditions found' : 'No terms and conditions yet' }}
      </p>
      <p class="text-sm text-gray-500 mb-4">
        {{ searchFilter ? 'Try adjusting your search' : 'Get started by adding your first terms and conditions' }}
      </p>
      <UButton
        v-if="!searchFilter"
        icon="i-heroicons-plus"
        color="primary"
        @click="openAddModal"
      >
        Add Terms and Conditions
      </UButton>
    </div>

    <UTable
      v-else
      :data="filteredTermsAndConditions"
      :columns="columns"
      class="w-full"
    />

    <UModal
      v-model:open="showModal"
      :title="isEditing ? 'Edit Terms and Conditions' : 'Add Terms and Conditions'"
      description="Configure terms and conditions details."
      :ui="{
        content: 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100vw-1rem)] max-w-5xl max-h-[calc(100dvh-1rem)] sm:max-h-[calc(100dvh-2rem)] rounded-lg shadow-lg ring ring-default overflow-hidden',
        body: 'p-4 sm:p-6 max-h-[calc(100dvh-12rem)] overflow-y-auto',
      }"
      @update:open="closeModal"
    >
      <template #body>
        <div class="space-y-4">
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Name <span class="text-red-500">*</span>
              </label>
              <UInput
                v-model="formState.name"
                placeholder="e.g., Standard Terms, Payment Terms"
                variant="subtle"
                size="sm"
                class="w-full"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Status <span class="text-red-500">*</span>
              </label>
              <USelect
                v-model="formState.isActive"
                :items="statusOptions"
                placeholder="Select status"
                variant="subtle"
                size="sm"
                class="w-full"
              />
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Content <span class="text-red-500">*</span>
            </label>
            <ClientOnly>
              <div class="w-full border border-default rounded-md flex flex-col bg-white dark:bg-gray-900">
                <div v-if="unref(editor)" class="border-b border-default p-2 flex flex-wrap gap-1 bg-gray-50 dark:bg-gray-800">
                  <USelect
                    :model-value="getHeadingLevel()"
                    :items="headingOptions"
                    size="xs"
                    variant="ghost"
                    class="w-32"
                    @update:model-value="(value: number | string) => setHeading(value)"
                  />
                  <UButton
                    icon="i-lucide-list"
                    size="xs"
                    variant="ghost"
                    color="neutral"
                    :class="{ 'bg-gray-200 dark:bg-gray-700': unref(editor)?.isActive('bulletList') }"
                    @click="unref(editor)?.chain().focus().toggleBulletList().run()"
                  />
                  <UButton
                    icon="i-lucide-list-ordered"
                    size="xs"
                    variant="ghost"
                    color="neutral"
                    :class="{ 'bg-gray-200 dark:bg-gray-700': unref(editor)?.isActive('orderedList') }"
                    @click="unref(editor)?.chain().focus().toggleOrderedList().run()"
                  />
                  <div class="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />
                  <UButton
                    icon="i-lucide-bold"
                    size="xs"
                    variant="ghost"
                    color="neutral"
                    :class="{ 'bg-gray-200 dark:bg-gray-700': unref(editor)?.isActive('bold') }"
                    @click="unref(editor)?.chain().focus().toggleBold().run()"
                  />
                  <UButton
                    icon="i-lucide-italic"
                    size="xs"
                    variant="ghost"
                    color="neutral"
                    :class="{ 'bg-gray-200 dark:bg-gray-700': unref(editor)?.isActive('italic') }"
                    @click="unref(editor)?.chain().focus().toggleItalic().run()"
                  />
                  <UButton
                    icon="i-lucide-strikethrough"
                    size="xs"
                    variant="ghost"
                    color="neutral"
                    :class="{ 'bg-gray-200 dark:bg-gray-700': unref(editor)?.isActive('strike') }"
                    @click="unref(editor)?.chain().focus().toggleStrike().run()"
                  />
                  <div class="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />
                  <UButton
                    icon="i-lucide-text-quote"
                    size="xs"
                    variant="ghost"
                    color="neutral"
                    :class="{ 'bg-gray-200 dark:bg-gray-700': unref(editor)?.isActive('blockquote') }"
                    @click="unref(editor)?.chain().focus().toggleBlockquote().run()"
                  />
                  <UButton
                    icon="i-lucide-square-code"
                    size="xs"
                    variant="ghost"
                    color="neutral"
                    :class="{ 'bg-gray-200 dark:bg-gray-700': unref(editor)?.isActive('codeBlock') }"
                    @click="unref(editor)?.chain().focus().toggleCodeBlock().run()"
                  />
                </div>
                <div class="p-4 min-h-56">
                  <TiptapEditorContent
                    v-if="unref(editor)"
                    :editor="unref(editor)"
                    class="prose prose-sm dark:prose-invert max-w-none focus:outline-none"
                  />
                  <div v-else class="flex items-center justify-center py-12 text-gray-500">
                    Loading editor...
                  </div>
                </div>
              </div>
              <template #fallback>
                <div class="flex items-center justify-center py-12 border border-default rounded-md">
                  <p class="text-gray-600">
                    Loading editor...
                  </p>
                </div>
              </template>
            </ClientOnly>
          </div>
        </div>
      </template>

      <template #footer>
        <div class="flex justify-end gap-2">
          <UButton color="neutral" variant="outline" @click="closeModal">
            Cancel
          </UButton>
          <UButton
            color="primary"
            :loading="submitting"
            :disabled="!formState.name.trim() || !formState.content.trim()"
            @click="handleSubmit"
          >
            {{ isEditing ? 'Update' : 'Save' }} Terms and Conditions
          </UButton>
        </div>
      </template>
    </UModal>

    <UModal v-model:open="showDeleteModal" title="Delete Terms and Conditions">
      <template #body>
        <p class="text-gray-700 dark:text-gray-300">
          Are you sure you want to delete <strong>{{ selectedTermsAndCondition?.name }}</strong>? This action cannot be undone.
        </p>
      </template>
      <template #footer>
        <div class="flex justify-end gap-2">
          <UButton color="neutral" variant="outline" @click="showDeleteModal = false">
            Cancel
          </UButton>
          <UButton
            color="error"
            :loading="deleting"
            @click="handleDelete"
          >
            Delete
          </UButton>
        </div>
      </template>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import { computed, h, onBeforeUnmount, onMounted, reactive, ref, resolveComponent, unref, watch } from 'vue'
import type { TableColumn } from '@nuxt/ui'
import { useTermsAndConditionsStore, type TermsAndCondition } from '~/stores/termsAndConditions'

const UButton = resolveComponent('UButton')
const UBadge = resolveComponent('UBadge')
const UTooltip = resolveComponent('UTooltip')

const termsAndConditionsStore = useTermsAndConditionsStore()
const toast = useToast()

const submitting = ref(false)
const deleting = ref(false)
const showModal = ref(false)
const showDeleteModal = ref(false)
const isEditing = ref(false)
const selectedTermsAndCondition = ref<TermsAndCondition | null>(null)
const searchFilter = ref('')

const statusOptions = ['Active', 'Inactive']

const formState = reactive({
  name: '',
  content: '',
  isActive: 'Active' as 'Active' | 'Inactive' | '',
})

const editor = useEditor({
  content: '',
  extensions: [TiptapStarterKit],
  editorProps: {
    attributes: {
      class: 'prose prose-sm dark:prose-invert max-w-none focus:outline-none',
    },
  },
  onUpdate: ({ editor }) => {
    formState.content = editor.getHTML()
  },
})

const headingOptions = [
  { label: 'Paragraph', value: 'paragraph' },
  { label: 'Heading 1', value: 1 },
  { label: 'Heading 2', value: 2 },
  { label: 'Heading 3', value: 3 },
  { label: 'Heading 4', value: 4 },
]

function getHeadingLevel(): number | string {
  const editorInstance = unref(editor)
  if (!editorInstance || typeof editorInstance.isActive !== 'function') return 'paragraph'
  if (editorInstance.isActive('heading', { level: 1 })) return 1
  if (editorInstance.isActive('heading', { level: 2 })) return 2
  if (editorInstance.isActive('heading', { level: 3 })) return 3
  if (editorInstance.isActive('heading', { level: 4 })) return 4
  return 'paragraph'
}

function setHeading(value: number | string) {
  const editorInstance = unref(editor)
  if (!editorInstance || typeof editorInstance.chain !== 'function') return
  if (value === 'paragraph') {
    editorInstance.chain().focus().setParagraph().run()
    return
  }
  if (typeof value === 'number') {
    editorInstance.chain().focus().toggleHeading({ level: value as 1 | 2 | 3 | 4 }).run()
  }
}

watch(showModal, (isOpen) => {
  if (!isOpen) return
  queueMicrotask(() => {
    const editorInstance = unref(editor)
    if (editorInstance) {
      editorInstance.commands.setContent(formState.content || '')
    }
  })
})

const columns: TableColumn<TermsAndCondition>[] = [
  {
    accessorKey: 'name',
    header: 'Name',
    enableSorting: false,
    cell: ({ row }) => h('span', { class: 'font-medium' }, row.original.name),
  },
  {
    accessorKey: 'content',
    header: 'Content Preview',
    enableSorting: false,
    cell: ({ row }) => {
      const preview = row.original.content
        ? `${row.original.content.replace(/<[^>]*>/g, '').substring(0, 100)}...`
        : 'No content'
      return h('span', { class: 'text-gray-600 dark:text-gray-400 text-sm' }, preview)
    },
  },
  {
    accessorKey: 'isActive',
    header: 'Status',
    enableSorting: false,
    cell: ({ row }) => h(UBadge, {
      color: row.original.isActive ? 'success' : 'neutral',
      variant: 'soft',
      size: 'sm',
    }, () => row.original.isActive ? 'Active' : 'Inactive'),
  },
  {
    accessorKey: 'actions',
    header: 'Actions',
    enableSorting: false,
    meta: { class: { th: 'text-right sticky right-0 z-10 w-24', td: 'text-right sticky right-0 w-24' } },
    cell: ({ row }) => h('div', { class: 'flex justify-end gap-1' }, [
      h(UTooltip, { text: 'Edit Terms and Conditions' }, () => [
        h(UButton, {
          icon: 'i-lucide-pencil',
          size: 'xs',
          color: 'secondary',
          variant: 'soft',
          onClick: () => openEditModal(row.original),
        }),
      ]),
      h(UTooltip, { text: 'Delete Terms and Conditions' }, () => [
        h(UButton, {
          icon: 'i-lucide-trash-2',
          size: 'xs',
          color: 'error',
          variant: 'soft',
          onClick: () => confirmDelete(row.original),
        }),
      ]),
    ]),
  },
]

const termsAndConditions = computed(() => termsAndConditionsStore.termsAndConditions)
const loading = computed(() => termsAndConditionsStore.loading)
const error = computed(() => termsAndConditionsStore.error)

const filteredTermsAndConditions = computed(() => {
  if (!searchFilter.value.trim()) return [...termsAndConditions.value]
  const search = searchFilter.value.toLowerCase().trim()
  return termsAndConditions.value.filter((tc) => {
    const fields = [
      tc.name || '',
      tc.content ? tc.content.replace(/<[^>]*>/g, '') : '',
      tc.isActive ? 'active' : 'inactive',
    ]
    return fields.some(field => field.toLowerCase().includes(search))
  })
})

function openAddModal() {
  isEditing.value = false
  selectedTermsAndCondition.value = null
  resetForm()
  showModal.value = true
}

function openEditModal(tc: TermsAndCondition) {
  isEditing.value = true
  selectedTermsAndCondition.value = tc
  formState.name = tc.name
  formState.content = tc.content || ''
  formState.isActive = tc.isActive ? 'Active' : 'Inactive'
  showModal.value = true
}

function closeModal() {
  showModal.value = false
  resetForm()
}

function resetForm() {
  formState.name = ''
  formState.content = ''
  formState.isActive = 'Active'
}

async function handleSubmit() {
  submitting.value = true
  try {
    const payload = {
      name: formState.name,
      content: formState.content,
      isActive: formState.isActive === 'Active',
    }

    if (isEditing.value && selectedTermsAndCondition.value) {
      await termsAndConditionsStore.updateTermsAndCondition(selectedTermsAndCondition.value.id.toString(), payload)
      toast.add({ title: 'Success', description: 'Terms and condition updated successfully', color: 'success' })
    }
    else {
      await termsAndConditionsStore.createTermsAndCondition(payload)
      toast.add({ title: 'Success', description: 'Terms and condition created successfully', color: 'success' })
    }

    closeModal()
  }
  catch (error: unknown) {
    const fetchError = error as { data?: { statusMessage?: string }, message?: string }
    toast.add({
      title: 'Error',
      description: fetchError?.data?.statusMessage || fetchError?.message || 'Failed to save terms and condition',
      color: 'error',
    })
  }
  finally {
    submitting.value = false
  }
}

function confirmDelete(tc: TermsAndCondition) {
  selectedTermsAndCondition.value = tc
  showDeleteModal.value = true
}

async function handleDelete() {
  if (!selectedTermsAndCondition.value) return
  deleting.value = true
  try {
    await termsAndConditionsStore.deleteTermsAndCondition(selectedTermsAndCondition.value.id.toString())
    showDeleteModal.value = false
    selectedTermsAndCondition.value = null
    toast.add({ title: 'Success', description: 'Terms and condition deleted successfully', color: 'success' })
  }
  catch (error: unknown) {
    const fetchError = error as { data?: { statusMessage?: string }, message?: string }
    toast.add({
      title: 'Error',
      description: fetchError?.data?.statusMessage || fetchError?.message || 'Failed to delete terms and condition',
      color: 'error',
    })
  }
  finally {
    deleting.value = false
  }
}

onMounted(async () => {
  await termsAndConditionsStore.fetchTermsAndConditions()
})

onBeforeUnmount(() => {
  const editorInstance = unref(editor)
  if (editorInstance && typeof editorInstance.destroy === 'function') {
    editorInstance.destroy()
  }
})
</script>
