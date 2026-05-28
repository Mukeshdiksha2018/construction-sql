import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, vi } from 'vitest'
import {
  computed,
  isReactive,
  isRef,
  markRaw,
  nextTick,
  onMounted,
  onUnmounted,
  reactive,
  readonly,
  ref,
  toRef,
  toRefs,
  watch,
  watchEffect,
} from 'vue'

// Provide Vue reactivity APIs as globals so stores that rely on Nuxt auto-imports work in tests
vi.stubGlobal('ref', ref)
vi.stubGlobal('computed', computed)
vi.stubGlobal('watch', watch)
vi.stubGlobal('watchEffect', watchEffect)
vi.stubGlobal('reactive', reactive)
vi.stubGlobal('readonly', readonly)
vi.stubGlobal('toRef', toRef)
vi.stubGlobal('toRefs', toRefs)
vi.stubGlobal('isRef', isRef)
vi.stubGlobal('isReactive', isReactive)
vi.stubGlobal('markRaw', markRaw)
vi.stubGlobal('nextTick', nextTick)
vi.stubGlobal('onMounted', onMounted)
vi.stubGlobal('onUnmounted', onUnmounted)

beforeEach(() => {
  setActivePinia(createPinia())
})
