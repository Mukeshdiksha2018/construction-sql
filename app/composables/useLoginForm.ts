import { ref } from 'vue'
import type { NimbleSession } from '~/stores/auth'
import { useAuthStore } from '~/stores/auth'
import { getSafeRedirect } from '~/utils/safe-redirect'

export function useLoginForm() {
  const router = useRouter()
  const route = useRoute()
  const authStore = useAuthStore()

  const email = ref('')
  const password = ref('')
  const isLoading = ref(false)
  const errMessage = ref<string | null>(null)
  const showPassword = ref(false)

  function togglePasswordVisibility() {
    showPassword.value = !showPassword.value
  }

  async function submit() {
    isLoading.value = true
    errMessage.value = null

    try {
      const data = await $fetch<{ session: NimbleSession }>('/api/auth/login', {
        method: 'POST',
        body: {
          email: email.value,
          password: password.value,
        },
      })

      authStore.setSession(data.session)

      const redirectTo = getSafeRedirect(route.query.redirect)
      await router.push(redirectTo)
    }
    catch (error: unknown) {
      const fetchError = error as { data?: { statusMessage?: string }, message?: string }
      errMessage.value
        = fetchError?.data?.statusMessage
          || fetchError?.message
          || 'Login failed. Please try again.'
    }
    finally {
      isLoading.value = false
    }
  }

  return {
    email,
    password,
    isLoading,
    errMessage,
    showPassword,
    togglePasswordVisibility,
    submit,
  }
}
