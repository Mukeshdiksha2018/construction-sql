<template>
  <div class="min-h-screen p-8 bg-default">
    <UCard class="max-w-lg mx-auto">
      <h1 class="text-2xl font-semibold text-default mb-2">
        Dashboard
      </h1>
      <p class="text-muted mb-4">
        Signed in as {{ authStore.session?.email }}
      </p>
      <UButton color="neutral" variant="outline" @click="handleLogout">
        Log out
      </UButton>
    </UCard>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: 'auth',
})

const authStore = useAuthStore()
const router = useRouter()

function handleLogout() {
  authStore.clear()
  router.push('/')
}
</script>
