export function useDarkMode() {
  const colorMode = useColorMode()

  const isDark = computed(() => colorMode.value === 'dark')

  function toggleDarkMode() {
    colorMode.preference = isDark.value ? 'light' : 'dark'
  }

  function initializeTheme() {
    if (import.meta.client && !colorMode.preference) {
      colorMode.preference = 'light'
    }
  }

  function watchSystemTheme() {
    if (!import.meta.client) return

    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => {
      if (colorMode.preference === 'system') {
        colorMode.preference = media.matches ? 'dark' : 'light'
      }
    }
    media.addEventListener('change', onChange)
    onChange()
  }

  return {
    isDark,
    toggleDarkMode,
    initializeTheme,
    watchSystemTheme,
  }
}
