<template>
  <div class="flex flex-col gap-2">
    <label class="text-xs font-medium text-gray-700 dark:text-gray-300">
      Message <span class="text-red-500">*</span>
    </label>
    <ClientOnly>
      <div class="flex w-full flex-col rounded-md border border-default bg-white dark:bg-gray-900">
        <div
          v-if="unref(editor)"
          class="flex flex-shrink-0 flex-wrap gap-1 border-b border-default bg-gray-50 p-2 dark:bg-gray-800"
        >
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
                <UIcon :name="option.icon" class="h-4 w-4" />
                <span>{{ option.label }}</span>
              </div>
            </template>
          </USelect>
          <UButton
            icon="i-lucide-list"
            size="xs"
            variant="ghost"
            color="neutral"
            class="rounded-md"
            :class="{ 'bg-gray-200 dark:bg-gray-700': unref(editor)?.isActive('bulletList') }"
            @click="unref(editor)?.chain().focus().toggleBulletList().run()"
          />
          <UButton
            icon="i-lucide-list-ordered"
            size="xs"
            variant="ghost"
            color="neutral"
            class="rounded-md"
            :class="{ 'bg-gray-200 dark:bg-gray-700': unref(editor)?.isActive('orderedList') }"
            @click="unref(editor)?.chain().focus().toggleOrderedList().run()"
          />
          <div class="mx-1 h-6 w-px bg-gray-300 dark:bg-gray-600" />
          <UButton
            icon="i-lucide-bold"
            size="xs"
            variant="ghost"
            color="neutral"
            class="rounded-md"
            :class="{ 'bg-gray-200 dark:bg-gray-700': unref(editor)?.isActive('bold') }"
            @click="unref(editor)?.chain().focus().toggleBold().run()"
          />
          <UButton
            icon="i-lucide-italic"
            size="xs"
            variant="ghost"
            color="neutral"
            class="rounded-md"
            :class="{ 'bg-gray-200 dark:bg-gray-700': unref(editor)?.isActive('italic') }"
            @click="unref(editor)?.chain().focus().toggleItalic().run()"
          />
          <UButton
            icon="i-lucide-strikethrough"
            size="xs"
            variant="ghost"
            color="neutral"
            class="rounded-md"
            :class="{ 'bg-gray-200 dark:bg-gray-700': unref(editor)?.isActive('strike') }"
            @click="unref(editor)?.chain().focus().toggleStrike().run()"
          />
          <UButton
            icon="i-lucide-code"
            size="xs"
            variant="ghost"
            color="neutral"
            class="rounded-md"
            :class="{ 'bg-gray-200 dark:bg-gray-700': unref(editor)?.isActive('code') }"
            @click="unref(editor)?.chain().focus().toggleCode().run()"
          />
          <div class="mx-1 h-6 w-px bg-gray-300 dark:bg-gray-600" />
          <UButton
            icon="i-lucide-text-quote"
            size="xs"
            variant="ghost"
            color="neutral"
            class="rounded-md"
            :class="{ 'bg-gray-200 dark:bg-gray-700': unref(editor)?.isActive('blockquote') }"
            @click="unref(editor)?.chain().focus().toggleBlockquote().run()"
          />
          <UButton
            icon="i-lucide-square-code"
            size="xs"
            variant="ghost"
            color="neutral"
            class="rounded-md"
            :class="{ 'bg-gray-200 dark:bg-gray-700': unref(editor)?.isActive('codeBlock') }"
            @click="unref(editor)?.chain().focus().toggleCodeBlock().run()"
          />
        </div>
        <div
          class="overflow-y-auto p-3 sm:p-4"
          :class="
            expanded
              ? 'max-h-[min(480px,65vh)] min-h-[220px]'
              : 'max-h-[min(280px,40vh)] min-h-[160px]'
          "
        >
          <TiptapEditorContent
            v-if="unref(editor)"
            :editor="unref(editor)"
            class="prose prose-sm max-w-none focus:outline-none dark:prose-invert"
          />
          <div v-else class="flex items-center justify-center py-8 text-gray-500">
            <div class="text-center">
              <div class="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
              <p class="text-sm">Loading editor…</p>
            </div>
          </div>
        </div>
      </div>
      <template #fallback>
        <div class="flex min-h-[160px] items-center justify-center rounded-md border border-default">
          <div class="text-center text-gray-600">
            <div class="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
            <p class="text-sm">Loading editor…</p>
          </div>
        </div>
      </template>
    </ClientOnly>
  </div>
</template>

<script setup lang="ts">
import { watch, onBeforeUnmount, unref } from 'vue'

const props = withDefaults(
  defineProps<{
    modelValue: string
    /** Taller scroll area for wide layouts (e.g. send-email modal). */
    expanded?: boolean
  }>(),
  { modelValue: '', expanded: false }
)

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const editor = useEditor({
  content: props.modelValue || '<p></p>',
  extensions: [TiptapStarterKit],
  editorProps: {
    attributes: {
      class: 'prose prose-sm dark:prose-invert max-w-none focus:outline-none min-h-[140px]',
    },
  },
  onUpdate: ({ editor: ed }) => {
    emit('update:modelValue', ed.getHTML())
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
  const ed = unref(editor)
  if (!ed || typeof ed.isActive !== 'function') return 'paragraph'
  try {
    if (ed.isActive('heading', { level: 1 })) return 1
    if (ed.isActive('heading', { level: 2 })) return 2
    if (ed.isActive('heading', { level: 3 })) return 3
    if (ed.isActive('heading', { level: 4 })) return 4
  } catch {
    return 'paragraph'
  }
  return 'paragraph'
}

const setHeading = (value: number | string) => {
  const ed = unref(editor)
  if (!ed || typeof ed.chain !== 'function') return
  try {
    if (value === 'paragraph') {
      ed.chain().focus().setParagraph().run()
    } else if (typeof value === 'number') {
      ed.chain().focus().toggleHeading({ level: value as 1 | 2 | 3 | 4 }).run()
    }
  } catch {
    /* noop */
  }
}

watch(
  () => props.modelValue,
  (newContent) => {
    const ed = unref(editor)
    if (!ed || typeof ed.getHTML !== 'function') return
    const current = ed.getHTML()
    if (current !== newContent) {
      ed.commands.setContent(newContent || '<p></p>')
    }
  }
)

onBeforeUnmount(() => {
  const ed = unref(editor)
  if (ed && typeof ed.destroy === 'function') {
    try {
      ed.destroy()
    } catch {
      /* noop */
    }
  }
})
</script>
