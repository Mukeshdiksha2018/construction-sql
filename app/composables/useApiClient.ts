export const useApiClient = () => {
  const config = useRuntimeConfig()
  const baseUrl = (config.public.BASE_URL as string) || ''

  const getApiUrl = (path: string): string => {
    const cleanPath = path.startsWith('/') ? path.slice(1) : path
    const cleanBaseUrl = baseUrl.replace(/\/$/, '')
    return cleanBaseUrl ? `${cleanBaseUrl}/${cleanPath}` : `/${cleanPath}`
  }

  const apiFetch = <T = any>(
    path: string,
    options?: Parameters<typeof $fetch>[1],
  ): Promise<T> => {
    const fullUrl = getApiUrl(path)
    return $fetch<T>(fullUrl, options)
  }

  return { getApiUrl, apiFetch, baseUrl }
}
