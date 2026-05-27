import { ref, onUnmounted } from 'vue'

export interface FilePreviewOptions {
  allowedTypes?: string[]
  maxSize?: number
}

export function useFilePreview(options: FilePreviewOptions = {}) {
  const {
    allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'],
    maxSize = 10 * 1024 * 1024,
  } = options

  const uploadedFile = ref<File | null>(null)
  const blobUrls = ref<string[]>([])
  const fileUploadError = ref<string | null>(null)

  const isPdfFile = (type: string) => type?.includes('pdf')
  const isImageFile = (type: string) => type?.includes('image')

  const getFileIcon = (type: string) => {
    if (type?.includes('pdf')) return 'i-heroicons-document-text'
    if (type?.includes('image')) return 'i-heroicons-photo'
    return 'i-heroicons-document'
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const validateFile = (file: File | null): string | null => {
    if (!file) return null
    if (!allowedTypes.includes(file.type)) {
      return `Invalid file type. Only ${allowedTypes.map(t => t.split('/')[1].toUpperCase()).join(', ')} files are allowed.`
    }
    if (file.size > maxSize) {
      return `File size too large. Maximum size is ${formatFileSize(maxSize)}.`
    }
    return null
  }

  const getFilePreviewUrl = (file: any): string => {
    let url = file?.file_url || file?.url || ''
    if (!url) return ''

    if (url.startsWith('data:')) {
      try {
        const base64Data = url.split(',')[1]
        if (!base64Data) return ''
        const byteCharacters = atob(base64Data)
        const byteNumbers = new Array(byteCharacters.length)
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i)
        }
        const byteArray = new Uint8Array(byteNumbers)
        const blob = new Blob([byteArray], { type: file.file_type || file.type || 'application/pdf' })
        url = URL.createObjectURL(blob)
        blobUrls.value.push(url)
      } catch {
        return ''
      }
    }

    return url
  }

  const downloadFile = (file: any) => {
    if (file?.file_url || file?.url) {
      const link = document.createElement('a')
      link.href = file.file_url || file.url
      link.download = file.file_name || file.name
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  const handleFileUpload = (file: File | null) => {
    fileUploadError.value = null
    if (!file) {
      uploadedFile.value = null
      return
    }
    const validationError = validateFile(file)
    if (validationError) {
      fileUploadError.value = validationError
      uploadedFile.value = null
      return
    }
    fileUploadError.value = null
    uploadedFile.value = file
  }

  const onIframeLoad = (_event: any) => {}
  const onIframeError = (_event: any) => {}

  onUnmounted(() => {
    blobUrls.value.forEach(url => URL.revokeObjectURL(url))
    blobUrls.value = []
  })

  return {
    uploadedFile,
    fileUploadError,
    isPdfFile,
    isImageFile,
    getFileIcon,
    formatFileSize,
    validateFile,
    getFilePreviewUrl,
    downloadFile,
    handleFileUpload,
    onIframeLoad,
    onIframeError,
  }
}
