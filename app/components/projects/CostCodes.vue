<template>
  <div class="p-2">
    <!-- Tabs and Controls Row -->
    <div class="flex items-center justify-between mb-4">
      <UTabs
        :items="tabs"
        :model-value="activeTab"
        size="sm"
        color="neutral"
        :content="false"
        @update:model-value="handleTabChange"
      />

      <div v-if="corporationStore.selectedCorporationId" class="flex items-center space-x-2">
        <div class="max-w-sm">
          <UInput
            v-model="globalFilter"
            :placeholder="searchPlaceholder"
            icon="i-heroicons-magnifying-glass"
            variant="subtle"
            size="xs"
            class="w-full"
          />
        </div>
        <div class="flex gap-2">
          <USelect
            v-model="importOption"
            :items="importOptions"
            size="xs"
            color="secondary"
            variant="soft"
            class="w-32"
            @change="handleImportOptionChange"
          />
          <UButton
            icon="material-symbols:delete-sweep"
            size="xs"
            color="error"
            variant="soft"
            :disabled="!hasData"
            @click="handleDeleteAll"
          >
            {{ deleteAllLabel }}
          </UButton>
          <UButton
            icon="material-symbols:add-rounded"
            size="xs"
            color="primary"
            variant="solid"
            @click="handleAddNew"
          >
            {{ addButtonLabel }}
          </UButton>
        </div>
      </div>

      <div v-else class="text-gray-500 text-sm">
        No corporation selected.
      </div>
    </div>

    <!-- Tab Content -->
    <div class="w-full">
      <ProjectsCostCodesDivision
        v-if="activeTab === 'cost-codes-division'"
        ref="costCodesDivisionTabRef"
        v-model:global-filter="globalFilter"
        :show-header="false"
      />
      <ProjectsCostCodesConfiguration
        v-if="activeTab === 'cost-codes-configuration'"
        ref="costCodesConfigurationTabRef"
        v-model:global-filter="globalFilter"
        :show-header="false"
      />
    </div>

    <!-- Import CSV Modal -->
    <UModal
      v-model:open="showImportModal"
      title="Import Cost Codes from CSV"
      description="Upload a single CSV file to bulk import divisions, cost codes, and sub-cost codes all at once."
      fullscreen
      @update:open="onImportModalClose"
    >
      <template #body>
        <div class="flex flex-col space-y-4">
          <!-- File Upload Section -->
          <div v-if="!csvData.length" class="space-y-4">
            <div class="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <div class="text-gray-400 mb-4">
                <svg class="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <p class="text-gray-600 mb-2">Upload your CSV file</p>
              <p class="text-gray-400 text-sm mb-4">
                Rows with <strong>Division Number + Division Name + Division Order</strong> create divisions.<br>
                Rows with <strong>Cost Code Number + Cost Code Name</strong> create cost codes.<br>
                Leave Parent Cost Code Number empty for top-level codes.
              </p>
              <input ref="fileInput" type="file" accept=".csv" class="hidden" @change="handleFileUpload">
              <UButton icon="material-symbols:upload-file" color="primary" variant="soft" @click="triggerFileInput">
                Choose CSV File
              </UButton>
            </div>

            <div class="bg-gray-50 p-4 rounded-lg">
              <div class="flex items-center justify-between mb-2">
                <h4 class="font-medium text-gray-700">Expected CSV Format:</h4>
                <UButton icon="material-symbols:download" size="xs" color="secondary" variant="soft" @click="downloadSampleCSV">
                  Download Sample CSV
                </UButton>
              </div>
              <div class="text-sm text-gray-600 font-mono bg-white p-2 rounded border overflow-x-auto">
                <pre>{{ sampleCsvContent }}</pre>
              </div>
            </div>
          </div>

          <!-- CSV Preview Section -->
          <div v-else class="space-y-4">
            <div class="flex items-center justify-between">
              <h4 class="font-medium text-gray-700">
                Preview ({{ csvData.length }} items)
              </h4>
              <div v-if="!validationErrors.length" class="bg-green-50 border border-green-200 rounded-lg px-4 py-2 inline-flex items-center gap-2">
                <svg class="h-4 w-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                <span class="text-sm font-medium text-green-800">All {{ csvData.length }} items are valid and ready to import!</span>
              </div>
              <UButton icon="material-symbols:refresh" size="xs" color="secondary" variant="soft" @click="resetImport">
                Upload Different File
              </UButton>
            </div>

            <UTable sticky :data="csvData" :columns="previewColumns" class="h-[calc(100vh-250px)]" />

            <div v-if="validationErrors.length" class="bg-red-50 border border-red-200 rounded-lg p-4">
              <h5 class="font-medium text-red-800 mb-2">Validation Errors ({{ validationErrors.length }}):</h5>
              <ul class="text-sm text-red-700 space-y-1">
                <li v-for="err in validationErrors" :key="err" class="flex items-start gap-2">
                  <span class="text-red-500 mt-0.5">•</span>
                  <span>{{ err }}</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </template>
      <template #footer>
        <div class="flex justify-end gap-2">
          <UButton color="error" variant="soft" @click="closeImportModal">
            Cancel
          </UButton>
          <UButton
            v-if="csvData.length && !validationErrors.length"
            color="primary"
            :loading="importing"
            @click="confirmImport"
          >
            {{ importing ? 'Importing...' : `Import ${csvData.length} items` }}
          </UButton>
        </div>
      </template>
    </UModal>

    <!-- Delete All Confirmation Modal -->
    <UModal
      v-model:open="showDeleteAllModal"
      :title="deleteAllModalTitle"
      :description="deleteAllModalDescription"
    >
      <template #body>
        <div class="flex flex-col space-y-4">
          <div class="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
            <svg class="h-8 w-8 text-red-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <div>
              <h3 class="text-lg font-medium text-red-800">{{ deleteAllModalTitle }}</h3>
              <p class="text-sm text-red-700" v-html="deleteAllModalDescription" />
            </div>
          </div>
          <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p class="text-sm text-yellow-700">
              This is a destructive action that will remove all {{ dataTypeLabel }} data. Make sure you have a backup if needed.
            </p>
          </div>
        </div>
      </template>
      <template #footer>
        <div class="flex justify-end gap-2">
          <UButton color="secondary" variant="soft" @click="showDeleteAllModal = false">
            Cancel
          </UButton>
          <UButton color="error" :loading="deletingAll" @click="confirmDeleteAll">
            {{ deletingAll ? 'Deleting All...' : `Delete All ${dataCount} ${dataTypeLabel}` }}
          </UButton>
        </div>
      </template>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useCorporationStore } from '~/stores/corporations'
import { useCostCodeDivisionsStore } from '~/stores/costCodeDivisions'
import { useCostCodeConfigurationsStore } from '~/stores/costCodeConfigurations'

const route = useRoute()
const router = useRouter()
const corporationStore = useCorporationStore()
const divisionsStore = useCostCodeDivisionsStore()
const configurationsStore = useCostCodeConfigurationsStore()
const toast = useToast()

const globalFilter = ref('')
const costCodesDivisionTabRef = ref<any>(null)
const costCodesConfigurationTabRef = ref<any>(null)

const tabs = [
  { key: 'cost-codes-division', label: 'Cost Codes Division', icon: 'i-heroicons-building-office', value: 'cost-codes-division' },
  { key: 'cost-codes-configuration', label: 'Cost Codes Configuration', icon: 'i-heroicons-cog-6-tooth', value: 'cost-codes-configuration' },
]

const activeTab = computed(() => {
  const subTab = route.query.subTab
  if (subTab && typeof subTab === 'string') {
    const validTab = tabs.find(t => t.value === subTab)
    return validTab ? subTab : 'cost-codes-division'
  }
  return 'cost-codes-division'
})

const searchPlaceholder = computed(() =>
  activeTab.value === 'cost-codes-division' ? 'Search divisions...' : 'Search configurations...',
)
const addButtonLabel = computed(() =>
  activeTab.value === 'cost-codes-division' ? 'Add Division' : 'Add Configuration',
)
const deleteAllLabel = computed(() =>
  activeTab.value === 'cost-codes-division' ? 'Delete All Divisions' : 'Delete All Configurations',
)
const dataTypeLabel = computed(() =>
  activeTab.value === 'cost-codes-division' ? 'divisions' : 'configurations',
)
const deleteAllModalTitle = computed(() =>
  activeTab.value === 'cost-codes-division' ? 'Confirm Delete All Divisions' : 'Confirm Delete All Configurations',
)
const deleteAllModalDescription = computed(() => {
  const count = activeTab.value === 'cost-codes-division'
    ? divisionsStore.divisions.length
    : configurationsStore.configurations.length
  return `This will permanently delete <strong>ALL ${count} ${dataTypeLabel.value}</strong> for this corporation. This action cannot be undone.`
})
const hasData = computed(() =>
  activeTab.value === 'cost-codes-division'
    ? divisionsStore.divisions.length > 0
    : configurationsStore.configurations.length > 0,
)
const dataCount = computed(() =>
  activeTab.value === 'cost-codes-division'
    ? divisionsStore.divisions.length
    : configurationsStore.configurations.length,
)

// ---- Tab handling ----
const handleTabChange = (tab: string | number) => {
  const tabValue = String(tab)
  if (tabs.find(t => t.value === tabValue)) {
    router.push({ query: { ...route.query, subTab: tabValue } })
  }
}

// ---- Add / Delete All ----
const handleAddNew = () => {
  if (activeTab.value === 'cost-codes-division' && costCodesDivisionTabRef.value) {
    costCodesDivisionTabRef.value.openAddModal()
  }
  else if (activeTab.value === 'cost-codes-configuration') {
    router.push({ path: '/cost-codes/form/new', query: { ...route.query } })
  }
}

const showDeleteAllModal = ref(false)
const deletingAll = ref(false)

const handleDeleteAll = () => { showDeleteAllModal.value = true }

async function confirmDeleteAll() {
  if (!corporationStore.selectedCorporationId) return

  deletingAll.value = true
  try {
    if (activeTab.value === 'cost-codes-division') {
      await divisionsStore.deleteAllDivisions(corporationStore.selectedCorporationId)
    }
    else {
      await configurationsStore.deleteAllConfigurations(corporationStore.selectedCorporationId)
    }
    toast.add({ title: `All ${dataTypeLabel.value} deleted successfully!`, icon: 'i-heroicons-check-circle' })
    showDeleteAllModal.value = false
  }
  catch (error) {
    toast.add({
      title: `Failed to delete all ${dataTypeLabel.value}`,
      description: error instanceof Error ? error.message : 'An error occurred',
      icon: 'i-heroicons-exclamation-triangle',
    })
  }
  finally {
    deletingAll.value = false
  }
}

// ---- CSV Import ----
const importOption = ref('import-csv')
const importOptions = [{ label: 'Import CSV', value: 'import-csv', icon: 'material-symbols:upload-file' }]
const showImportModal = ref(false)
const csvData = ref<any[]>([])
const validationErrors = ref<string[]>([])
const importing = ref(false)
const fileInput = ref<HTMLInputElement>()

const sampleCsvContent = `Division Number,Division Name,Division Order,Division Description,Division Active,Cost Code Number,Cost Code Name,Parent Cost Code Number,Cost Code Order,Cost Code Description,Cost Code Active
01,General Requirements,1,General project requirements,true,,,,,,
01,,,,,01010,Mobilization,,1,Mobilization and site setup,true
01,,,,,01020,Project Management,,2,Project management,true
02,Existing Conditions,2,Existing site conditions,true,,,,,,
02,,,,,02010,Demolition,,1,Demolition work,true
02,,,,,02011,Interior Demolition,02010,1,Interior demolition,true`

const previewColumns = computed(() => [
  { accessorKey: 'type', header: 'Type' },
  { accessorKey: 'division_number', header: 'Division Number' },
  { accessorKey: 'division_name', header: 'Division Name' },
  { accessorKey: 'cost_code_number', header: 'Cost Code Number' },
  { accessorKey: 'cost_code_name', header: 'Cost Code Name' },
  { accessorKey: 'parent_cost_code_number', header: 'Parent Code' },
  { accessorKey: 'order', header: 'Order' },
  { accessorKey: 'is_active', header: 'Active' },
])

function handleImportOptionChange() {
  if (importOption.value === 'import-csv') {
    showImportModal.value = true
  }
  importOption.value = 'import-csv'
}

function triggerFileInput() {
  fileInput.value?.click()
}

function onImportModalClose(open: boolean) {
  if (!open) resetImport()
}

function closeImportModal() {
  showImportModal.value = false
  resetImport()
}

function resetImport() {
  csvData.value = []
  validationErrors.value = []
  if (fileInput.value) fileInput.value.value = ''
}

function downloadSampleCSV() {
  const blob = new Blob([sampleCsvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = 'sample_cost_codes.csv'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

function validateAndTransformCSV(data: any[]) {
  const errors: string[] = []
  const divisions: any[] = []
  const configurations: any[] = []

  data.forEach((row, index) => {
    const rowNumber = index + 2
    const divisionNumber = (row['Division Number'] || row['division_number'] || '').toString().trim()
    const divisionName = (row['Division Name'] || row['division_name'] || '').toString().trim()
    const divisionOrder = (row['Division Order'] || row['division_order'] || '').toString().trim()
    const costCodeNumber = (row['Cost Code Number'] || row['cost_code_number'] || '').toString().trim()
    const costCodeName = (row['Cost Code Name'] || row['cost_code_name'] || '').toString().trim()

    const isDivisionRow = divisionNumber && divisionName && divisionOrder

    if (isDivisionRow) {
      const orderNum = parseInt(divisionOrder)
      if (Number.isNaN(orderNum) || orderNum < 1 || orderNum > 100) {
        errors.push(`Row ${rowNumber}: Division Order "${divisionOrder}" must be 1-100`)
        return
      }
      if (divisions.find(d => d.division_number === divisionNumber)) {
        errors.push(`Row ${rowNumber}: Duplicate division number "${divisionNumber}"`)
        return
      }
      const activeStatus = (row['Division Active'] || row['division_active'] || 'true').toString().toLowerCase()
      divisions.push({
        division_number: divisionNumber,
        division_name: divisionName,
        division_order: orderNum,
        description: (row['Division Description'] || row['division_description'] || '').toString().trim() || null,
        is_active: activeStatus === 'true',
      })
    }
    else if (costCodeNumber) {
      if (!costCodeName) {
        errors.push(`Row ${rowNumber}: Missing Cost Code Name for code "${costCodeNumber}"`)
        return
      }
      if (configurations.find(c => c.cost_code_number === costCodeNumber)) {
        errors.push(`Row ${rowNumber}: Duplicate cost code number "${costCodeNumber}"`)
        return
      }
      const orderRaw = (row['Cost Code Order'] || row['cost_code_order'] || row['Order'] || '').toString().trim()
      const orderNum = orderRaw ? parseInt(orderRaw) : null
      if (orderRaw && (Number.isNaN(orderNum!) || orderNum! < 1 || orderNum! > 200)) {
        errors.push(`Row ${rowNumber}: Cost Code Order "${orderRaw}" must be 1-200`)
        return
      }
      const activeStatus = (row['Cost Code Active'] || row['cost_code_active'] || 'true').toString().toLowerCase()
      configurations.push({
        cost_code_number: costCodeNumber,
        cost_code_name: costCodeName,
        division_number: divisionNumber || '',
        parent_cost_code_number: (row['Parent Cost Code Number'] || row['parent_cost_code_number'] || '').toString().trim(),
        order: orderNum,
        description: (row['Cost Code Description'] || row['cost_code_description'] || '').toString().trim() || null,
        is_active: activeStatus === 'true',
      })
    }
    else {
      errors.push(`Row ${rowNumber}: Must have either (Division Number + Division Name + Division Order) or (Cost Code Number + Cost Code Name)`)
    }
  })

  const displayData = [
    ...divisions.map(d => ({ ...d, type: 'Division' })),
    ...configurations.map(c => ({ ...c, type: 'Cost Code', order: c.order || '' })),
  ]

  return { data: displayData, divisions, configurations, errors }
}

function handleFileUpload(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  if (!file.name.toLowerCase().endsWith('.csv')) {
    toast.add({ title: 'Invalid File Type', description: 'Please select a .csv file', icon: 'i-heroicons-exclamation-triangle' })
    return
  }

  const reader = new FileReader()
  reader.onload = (e) => {
    const text = e.target?.result as string
    import('papaparse').then(({ default: Papa }) => {
      Papa.parse(text, {
        header: true,
        skipEmptyLines: true,
        complete: (results: any) => {
          if (results.errors.length) {
            toast.add({ title: 'CSV Parsing Error', description: 'Please check the file format.', icon: 'i-heroicons-exclamation-triangle' })
            return
          }
          const validated = validateAndTransformCSV(results.data)
          csvData.value = validated.data
          validationErrors.value = validated.errors
          if (!validated.errors.length) {
            toast.add({ title: 'CSV Parsed Successfully', description: `${validated.divisions.length} divisions and ${validated.configurations.length} cost codes ready to import`, icon: 'i-heroicons-check-circle' })
          }
        },
      })
    })
  }
  reader.readAsText(file)
}

async function confirmImport() {
  if (!corporationStore.selectedCorporationId || !csvData.value.length) return

  importing.value = true
  try {
    const rawData = csvData.value.map((item: any) => {
      if (item.type === 'Division') {
        return { 'Division Number': item.division_number, 'Division Name': item.division_name, 'Division Order': item.division_order, 'Division Description': item.description, 'Division Active': item.is_active }
      }
      return { 'Cost Code Number': item.cost_code_number, 'Cost Code Name': item.cost_code_name, 'Division Number': item.division_number, 'Parent Cost Code Number': item.parent_cost_code_number, 'Cost Code Order': item.order, 'Cost Code Description': item.description, 'Cost Code Active': item.is_active }
    })
    const validated = validateAndTransformCSV(rawData)
    if (validated.errors.length) {
      validationErrors.value = validated.errors
      toast.add({ title: 'Validation Errors', description: 'Please fix errors before importing.', color: 'error', icon: 'i-heroicons-exclamation-triangle' })
      return
    }

    const result = await $fetch<any>('/api/cost-codes/bulk', {
      method: 'POST',
      body: { corporation_uuid: corporationStore.selectedCorporationId, divisions: validated.divisions, configurations: validated.configurations },
    })

    await Promise.all([
      divisionsStore.fetchDivisions(corporationStore.selectedCorporationId, true),
      configurationsStore.fetchConfigurations(corporationStore.selectedCorporationId, true),
    ])

    toast.add({ title: 'Import Successful', description: result.message || 'Import completed', icon: 'i-heroicons-check-circle' })
    showImportModal.value = false
    resetImport()
  }
  catch (error) {
    toast.add({ title: 'Import Failed', description: error instanceof Error ? error.message : 'Error importing cost codes', icon: 'i-heroicons-exclamation-triangle' })
  }
  finally {
    importing.value = false
  }
}

onMounted(() => {
  if (!route.query.subTab) {
    router.push({ query: { ...route.query, subTab: 'cost-codes-division' } })
  }
})
</script>
