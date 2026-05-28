<template>
  <div class="flex flex-col">
    <!-- Corporation + Project -->
    <div
      v-if="showCorporationProjectRow"
      class="p-4 sm:p-6 border-b border-default space-y-4 flex-shrink-0"
    >
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Corporation <span class="text-red-500">*</span>
          </label>
          <CorporationSelect
            v-model="formState.corporation_uuid"
            :disabled="scopeDisabled"
            class-name="w-full"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Project <span class="text-red-500">*</span>
          </label>
          <ProjectSelect
            v-model="formState.project_uuid"
            :corporation-uuid="formState.corporation_uuid"
            :disabled="scopeDisabled"
            use-options-api
            class-name="w-full"
          />
        </div>
      </div>
    </div>

    <!-- Name and Status -->
    <div class="p-4 sm:p-6 border-b border-default space-y-4 flex-shrink-0">
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Name <span class="text-red-500">*</span>
          </label>
          <UInput
            v-model="formState.name"
            placeholder="e.g., Shipping note, billing addendum"
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
    </div>

    <!-- Rich text -->
    <div class="flex flex-col flex-shrink-0">
      <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 px-4 sm:px-6 pt-4 pb-2">
        Content <span class="text-red-500">*</span>
      </label>
      <div class="px-4 sm:px-6 pb-4">
        <ClientOnly>
          <div class="w-full border border-default rounded-md flex flex-col bg-white dark:bg-gray-900">
            <div v-if="unref(editor)" class="border-b border-default p-2 flex flex-wrap gap-1 bg-gray-50 dark:bg-gray-800 flex-shrink-0">
              <USelect
                :model-value="getHeadingLevel()"
                :options="headingOptions"
                size="xs"
                variant="ghost"
                class="w-32"
                @update:model-value="(value: number | string) => setHeading(value)"
              >
                <template #option="{ option }">
                  <div class="flex items-center gap-2">
                    <UIcon :name="option.icon" class="w-4 h-4" />
                    <span>{{ option.label }}</span>
                  </div>
                </template>
              </USelect>
              <UButton
                icon="i-lucide-list"
                size="xs"
                variant="ghost"
                color="neutral"
                :ui="{ rounded: 'rounded-md' }"
                :class="{ 'bg-gray-200 dark:bg-gray-700': unref(editor)?.isActive('bulletList') }"
                @click="unref(editor)?.chain().focus().toggleBulletList().run()"
              />
              <UButton
                icon="i-lucide-list-ordered"
                size="xs"
                variant="ghost"
                color="neutral"
                :ui="{ rounded: 'rounded-md' }"
                :class="{ 'bg-gray-200 dark:bg-gray-700': unref(editor)?.isActive('orderedList') }"
                @click="unref(editor)?.chain().focus().toggleOrderedList().run()"
              />
              <div class="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />
              <UButton
                icon="i-lucide-bold"
                size="xs"
                variant="ghost"
                color="neutral"
                :ui="{ rounded: 'rounded-md' }"
                :class="{ 'bg-gray-200 dark:bg-gray-700': unref(editor)?.isActive('bold') }"
                @click="unref(editor)?.chain().focus().toggleBold().run()"
              />
              <UButton
                icon="i-lucide-italic"
                size="xs"
                variant="ghost"
                color="neutral"
                :ui="{ rounded: 'rounded-md' }"
                :class="{ 'bg-gray-200 dark:bg-gray-700': unref(editor)?.isActive('italic') }"
                @click="unref(editor)?.chain().focus().toggleItalic().run()"
              />
              <UButton
                icon="i-lucide-strikethrough"
                size="xs"
                variant="ghost"
                color="neutral"
                :ui="{ rounded: 'rounded-md' }"
                :class="{ 'bg-gray-200 dark:bg-gray-700': unref(editor)?.isActive('strike') }"
                @click="unref(editor)?.chain().focus().toggleStrike().run()"
              />
              <UButton
                icon="i-lucide-code"
                size="xs"
                variant="ghost"
                color="neutral"
                :ui="{ rounded: 'rounded-md' }"
                :class="{ 'bg-gray-200 dark:bg-gray-700': unref(editor)?.isActive('code') }"
                @click="unref(editor)?.chain().focus().toggleCode().run()"
              />
              <div class="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />
              <UButton
                icon="i-lucide-text-quote"
                size="xs"
                variant="ghost"
                color="neutral"
                :ui="{ rounded: 'rounded-md' }"
                :class="{ 'bg-gray-200 dark:bg-gray-700': unref(editor)?.isActive('blockquote') }"
                @click="unref(editor)?.chain().focus().toggleBlockquote().run()"
              />
              <UButton
                icon="i-lucide-square-code"
                size="xs"
                variant="ghost"
                color="neutral"
                :ui="{ rounded: 'rounded-md' }"
                :class="{ 'bg-gray-200 dark:bg-gray-700': unref(editor)?.isActive('codeBlock') }"
                @click="unref(editor)?.chain().focus().toggleCodeBlock().run()"
              />
            </div>
            <div class="p-4 sm:px-6">
              <TiptapEditorContent
                v-if="unref(editor)"
                :editor="unref(editor)"
                class="prose prose-sm dark:prose-invert max-w-none focus:outline-none"
              />
              <div v-else class="flex items-center justify-center py-12 text-gray-500">
                <div class="text-center">
                  <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
                  <p>Loading editor...</p>
                </div>
              </div>
            </div>
          </div>
          <template #fallback>
            <div class="flex items-center justify-center py-12 border border-default rounded-md">
              <div class="text-center">
                <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
                <p class="text-gray-600">Loading editor...</p>
              </div>
            </div>
          </template>
        </ClientOnly>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { watch, onBeforeUnmount, nextTick, unref } from 'vue'
import CorporationSelect from '~/components/Shared/CorporationSelect.vue'
import ProjectSelect from '~/components/Shared/ProjectSelect.vue'

export type SpecialInstructionFormState = {
  name: string
  content: string
  isActive: 'Active' | 'Inactive' | ''
  corporation_uuid: string
  project_uuid: string
}

const props = withDefaults(
  defineProps<{
    formState: SpecialInstructionFormState
    showCorporationProjectRow?: boolean
    scopeDisabled?: boolean
    /** When true, sync TipTap content from formState (e.g. modal opened). */
    editorSyncOpen?: boolean
  }>(),
  {
    showCorporationProjectRow: true,
    scopeDisabled: false,
    editorSyncOpen: false,
  },
)

const statusOptions = ['Active', 'Inactive']

/** Avoid formState.content watch calling setContent while the editor is the source of truth (prevents cursor/selection resets). */
let isSyncingContentFromEditor = false

const editor = useEditor({
  content: '',
  editable: true,
  extensions: [TiptapStarterKit],
  editorProps: {
    attributes: {
      class: 'prose prose-sm dark:prose-invert max-w-none focus:outline-none',
    },
  },
  onUpdate: ({ editor: ed }) => {
    isSyncingContentFromEditor = true
    props.formState.content = ed.getHTML()
    nextTick(() => {
      isSyncingContentFromEditor = false
    })
  },
})

const headingOptions = [
  { value: 'paragraph', label: 'Paragraph', icon: 'i-lucide-type' },
  { value: 1, label: 'Heading 1', icon: 'i-lucide-heading-1' },
  { value: 2, label: 'Heading 2', icon: 'i-lucide-heading-2' },
  { value: 3, label: 'Heading 3', icon: 'i-lucide-heading-3' },
  { value: 4, label: 'Heading 4', icon: 'i-lucide-heading-4' },
]

const getHeadingLevel = () => {
  const editorInstance = unref(editor)
  if (!editorInstance || typeof editorInstance.isActive !== 'function') {
    return 'paragraph'
  }
  try {
    if (editorInstance.isActive('heading', { level: 1 })) return 1
    if (editorInstance.isActive('heading', { level: 2 })) return 2
    if (editorInstance.isActive('heading', { level: 3 })) return 3
    if (editorInstance.isActive('heading', { level: 4 })) return 4
  } catch {
    return 'paragraph'
  }
  return 'paragraph'
}

const setHeading = (value: number | string) => {
  const editorInstance = unref(editor)
  if (!editorInstance || typeof editorInstance.chain !== 'function') return
  try {
    if (value === 'paragraph') {
      editorInstance.chain().focus().setParagraph().run()
    } else if (typeof value === 'number') {
      editorInstance.chain().focus().toggleHeading({ level: value as 1 | 2 | 3 | 4 }).run()
    }
  } catch (e) {
    console.warn('Error setting heading:', e)
  }
}

watch(
  () => props.formState.content,
  (newContent) => {
    if (isSyncingContentFromEditor) return
    const editorInstance = unref(editor)
    if (editorInstance && typeof editorInstance.getHTML === 'function') {
      const currentContent = editorInstance.getHTML()
      if (currentContent !== newContent) {
        editorInstance.commands.setContent(newContent || '')
      }
    }
  },
  { immediate: false },
)

watch(
  () => props.editorSyncOpen,
  (isOpen) => {
    if (!isOpen) return
    nextTick(() => {
      const editorInstance = unref(editor)
      if (editorInstance && props.formState.content) {
        editorInstance.commands.setContent(props.formState.content)
      } else if (editorInstance) {
        editorInstance.commands.setContent('')
      }
    })
  },
)

onBeforeUnmount(() => {
  const editorInstance = unref(editor)
  if (editorInstance && typeof editorInstance.destroy === 'function') {
    try {
      editorInstance.destroy()
    } catch {
      // ignore
    }
  }
})
</script>

