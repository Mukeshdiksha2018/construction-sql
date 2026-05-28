<template>
  <UModal
    v-model:open="showModal"
    :ui="{
      content: 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100vw-1rem)] max-w-5xl max-h-[calc(100dvh-1rem)] sm:max-h-[calc(100dvh-2rem)] rounded-lg shadow-lg ring ring-default overflow-hidden',
      body: 'p-4 sm:p-6 max-h-[calc(100dvh-12rem)] overflow-y-auto'
    }"
    @update:open="closeModal"
  >
    <template #header>
      <div class="flex items-center justify-between w-full gap-4">
        <div class="flex items-center gap-4 flex-shrink-0">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
            {{ editingVendor ? 'Edit Vendor' : 'Add New Vendor' }}
          </h3>
          <span class="text-sm text-gray-500 dark:text-gray-400">
            Configure vendor details for your organization.
          </span>
        </div>

        <div class="flex items-center gap-2 flex-shrink-0">
          <UButton color="neutral" variant="soft" @click="closeModal">
            Cancel
          </UButton>
          <UButton color="primary" @click="submitVendor" :loading="submitting">
            {{ editingVendor ? "Update" : "Add" }}
          </UButton>
        </div>
      </div>
    </template>
    <template #body>
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <!-- Left Column (Corporation/Vendor Information) -->
        <div class="space-y-3">
          <div>
            <label
              for="corporation"
              class="block text-xs font-medium text-gray-700 mb-1"
            >
              Corporation
            </label>
            <UInput
              :model-value="getCorporationName"
              disabled
              size="sm"
              class="w-full"
              icon="i-heroicons-building-office-2-solid"
            />
            <p class="text-xs text-gray-500">Auto-selected from current context</p>
          </div>
          
          <!-- Vendor Name - Required Field -->
          <div>
            <label class="block text-xs font-medium text-gray-700 mb-1">
              Vendor Name <span class="text-red-500">*</span>
            </label>
            <UInput
              v-model="form.vendor_name"
              variant="subtle"
              placeholder="Vendor Name"
              size="sm"
              class="w-full"
            />
          </div>

          <!-- Federal ID and SSN in a row -->
          <div class="grid grid-cols-2 gap-2">
            <div>
              <label class="block text-xs font-medium text-gray-700 mb-1">Federal ID <span class="text-red-500">*</span></label>
              <UInput
                v-model="form.vendor_federal_id"
                variant="subtle"
                placeholder="--- --- ---"
                @keydown="(event) => {
                  if (!/[0-9]/.test(event.key) && !['Backspace', 'Delete', 'Tab', 'Enter', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)) {
                    event.preventDefault();
                  }
                }"
                size="sm"
                class="w-full"
              />
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-700 mb-1">SSN</label>
              <UInput
                v-model="form.vendor_ssn"
                variant="subtle"
                placeholder="--- -- ---"
                @keydown="(event) => {
                  if (!/[0-9]/.test(event.key) && !['Backspace', 'Delete', 'Tab', 'Enter', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)) {
                    event.preventDefault();
                  }
                }"
                size="sm"
                class="w-full"
              />
            </div>
          </div>

          <!-- Company Name -->
          <div>
            <label class="block text-xs font-medium text-gray-700 mb-1">Company Name <span class="text-red-500">*</span></label>
            <UInput
              v-model="form.company_name"
              variant="subtle"
              placeholder="Company Name"
              size="sm"
              class="w-full"
            />
          </div>

          <!-- Check Printed As and DBA in a row -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <label class="block text-xs font-medium text-gray-700 mb-1">Check Printed As</label>
              <UInput
                v-model="form.check_printed_as"
                variant="subtle"
                placeholder="Check printed as"
                size="sm"
                class="w-full"
              />
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-700 mb-1">Doing Business As</label>
              <UInput
                v-model="form.doing_business_as"
                variant="subtle"
                placeholder="DBA"
                size="sm"
                class="w-full"
              />
            </div>
          </div>

          <!-- 1099 Checkbox -->
          <div class="flex items-center space-x-2">
            <UCheckbox
              id="is-1099"
              v-model="form.is_1099"
              color="primary"
              size="sm"
            />
            <label for="is-1099" class="text-xs font-medium text-gray-700">Is 1099</label>
          </div>
        </div>

        <!-- Right Column (Personal/Financial Information) -->
        <div class="space-y-3">
          <!-- Name Fields -->
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div>
              <label class="block text-xs font-medium text-gray-700 mb-1">Salutation</label>
              <USelect
                v-model="form.salutation"
                :items="salutationOptions"
                placeholder="Mr."
                variant="subtle"
                size="sm"
                class="w-full"
              />
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-700 mb-1">First Name</label>
              <UInput
                v-model="form.first_name"
                variant="subtle"
                placeholder="First Name"
                size="sm"
                class="w-full"
              />
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-700 mb-1">Last Name</label>
              <UInput
                v-model="form.last_name"
                variant="subtle"
                placeholder="Last Name"
                size="sm"
                class="w-full"
              />
            </div>
          </div>

          <!-- Middle Name -->
          <div>
            <label class="block text-xs font-medium text-gray-700 mb-1">Middle Name</label>
            <UInput
              v-model="form.middle_name"
              variant="subtle"
              placeholder="Middle Name"
              size="sm"
              class="w-full"
            />
          </div>

          <!-- Opening Balance Section -->
          <div>
            <label class="block text-xs font-medium text-gray-700 mb-1">Opening Balance</label>
            <div class="flex items-center gap-2">
              <div class="relative flex-1">
                <UInput
                  v-model="formattedOpeningBalance"
                  type="number"
                  step="1"
                  variant="subtle"
                  placeholder="0.00"
                  size="sm"
                  class="w-full pl-6"
                  @keypress="(e: KeyboardEvent) => { if (e.key && !/[0-9.]/.test(e.key) && e.key !== 'Backspace' && e.key !== 'Delete' && e.key !== 'ArrowLeft' && e.key !== 'ArrowRight' && e.key !== 'Tab' && e.key !== 'Enter') e.preventDefault(); }"
                />
                <span class="absolute left-2 top-1/2 transform -translate-y-1/2 text-xs text-gray-500 font-medium pointer-events-none">
                  {{ currencySymbol }}
                </span>
              </div>
              <span class="text-xs text-gray-500 whitespace-nowrap">As of</span>
              <UInput
                v-model="form.opening_balance_date"
                type="date"
                variant="subtle"
                size="sm"
                class="w-28"
              />
            </div>
          </div>

          <!-- Address Section -->
          <div class="pt-3 border-t border-gray-200">
            <h4 class="text-xs font-medium text-gray-700 mb-2">Address Information</h4>
            <div class="space-y-3">
              <div
                v-for="addressType in addressTypes"
                :key="addressType.key"
                class="rounded-md border border-gray-200 p-2"
              >
                <h5 class="text-xs font-semibold text-gray-700 mb-2">{{ addressType.label }}</h5>
                <div class="mb-2">
                  <label class="block text-xs font-medium text-gray-700 mb-1">Street Address</label>
                  <UInput
                    :model-value="getAddressField(addressType.key, 'address')"
                    variant="subtle"
                    placeholder="Street Address"
                    size="sm"
                    class="w-full"
                    @update:model-value="(value) => updateAddress(addressType.key, 'address', String(value || ''))"
                  />
                </div>
                <div class="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-2">
                  <div>
                    <label class="block text-xs font-medium text-gray-700 mb-1">City</label>
                    <UInput
                    :model-value="getAddressField(addressType.key, 'city')"
                      variant="subtle"
                      placeholder="City"
                      size="sm"
                      class="w-full"
                      @update:model-value="(value) => updateAddress(addressType.key, 'city', String(value || ''))"
                    />
                  </div>
                  <div>
                    <label class="block text-xs font-medium text-gray-700 mb-1">State</label>
                    <UInput
                      :model-value="getAddressField(addressType.key, 'stateName')"
                      variant="subtle"
                      placeholder="State"
                      size="sm"
                      class="w-full"
                      @update:model-value="(value) => updateAddress(addressType.key, 'stateName', String(value || ''))"
                    />
                  </div>
                  <div>
                    <label class="block text-xs font-medium text-gray-700 mb-1">ZIP / Postal Code</label>
                    <UInput
                      :model-value="getAddressField(addressType.key, 'zipCode')"
                      variant="subtle"
                      placeholder="ZIP / Postal Code"
                      @keydown="(event) => {
                        if (!/[0-9a-zA-Z\\s-]/.test(event.key) && !['Backspace', 'Delete', 'Tab', 'Enter', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)) {
                          event.preventDefault();
                        }
                      }"
                      size="sm"
                      class="w-full"
                      @update:model-value="(value) => updateAddress(addressType.key, 'zipCode', String(value || ''))"
                    />
                  </div>
                </div>
                <div>
                  <label class="block text-xs font-medium text-gray-700 mb-1">Country</label>
                  <UInput
                    :model-value="getAddressField(addressType.key, 'countryName')"
                    variant="subtle"
                    placeholder="Country"
                    size="sm"
                    class="w-full"
                    @update:model-value="(value) => updateAddress(addressType.key, 'countryName', String(value || ''))"
                  />
                </div>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                  <div>
                    <label class="block text-xs font-medium text-gray-700 mb-1">Address Name</label>
                    <UInput
                      :model-value="getAddressField(addressType.key, 'addressName')"
                      variant="subtle"
                      placeholder="Address Name"
                      size="sm"
                      class="w-full"
                      @update:model-value="(value) => updateAddress(addressType.key, 'addressName', String(value || ''))"
                    />
                  </div>
                  <div>
                    <label class="block text-xs font-medium text-gray-700 mb-1">Email ID</label>
                    <UInput
                      :model-value="getAddressField(addressType.key, 'emailID')"
                      variant="subtle"
                      placeholder="Email"
                      size="sm"
                      class="w-full"
                      @update:model-value="(value) => updateAddress(addressType.key, 'emailID', String(value || ''))"
                    />
                  </div>
                </div>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                  <div>
                    <label class="block text-xs font-medium text-gray-700 mb-1">State ID</label>
                    <UInput
                      :model-value="getAddressField(addressType.key, 'stateID')"
                      type="number"
                      variant="subtle"
                      placeholder="State ID"
                      size="sm"
                      class="w-full"
                      @update:model-value="(value) => updateAddress(addressType.key, 'stateID', String(value || ''))"
                    />
                  </div>
                  <div>
                    <label class="block text-xs font-medium text-gray-700 mb-1">Country ID</label>
                    <UInput
                      :model-value="getAddressField(addressType.key, 'countryID')"
                      type="number"
                      variant="subtle"
                      placeholder="Country ID"
                      size="sm"
                      class="w-full"
                      @update:model-value="(value) => updateAddress(addressType.key, 'countryID', String(value || ''))"
                    />
                  </div>
                </div>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                  <div>
                    <label class="block text-xs font-medium text-gray-700 mb-1">Mobile No</label>
                    <UInput
                      :model-value="getAddressField(addressType.key, 'mobileNum')"
                      variant="subtle"
                      placeholder="Mobile No"
                      size="sm"
                      class="w-full"
                      @update:model-value="(value) => updateAddress(addressType.key, 'mobileNum', String(value || ''))"
                    />
                  </div>
                  <div>
                    <label class="block text-xs font-medium text-gray-700 mb-1">Alternative No</label>
                    <UInput
                      :model-value="getAddressField(addressType.key, 'alternativeNum')"
                      variant="subtle"
                      placeholder="Alternative No"
                      size="sm"
                      class="w-full"
                      @update:model-value="(value) => updateAddress(addressType.key, 'alternativeNum', String(value || ''))"
                    />
                  </div>
                </div>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                  <div>
                    <label class="block text-xs font-medium text-gray-700 mb-1">Work No</label>
                    <UInput
                      :model-value="getAddressField(addressType.key, 'workNum')"
                      variant="subtle"
                      placeholder="Work No"
                      size="sm"
                      class="w-full"
                      @update:model-value="(value) => updateAddress(addressType.key, 'workNum', String(value || ''))"
                    />
                  </div>
                  <div>
                    <label class="block text-xs font-medium text-gray-700 mb-1">Fax No</label>
                    <UInput
                      :model-value="getAddressField(addressType.key, 'faxNum')"
                      variant="subtle"
                      placeholder="Fax No"
                      size="sm"
                      class="w-full"
                      @update:model-value="(value) => updateAddress(addressType.key, 'faxNum', String(value || ''))"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Contact Information -->
          <div class="pt-3 border-t border-gray-200">
            <h4 class="text-xs font-medium text-gray-700 mb-2">Contact Information</h4>
            
            <!-- Phone and Email in a row -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label class="block text-xs font-medium text-gray-700 mb-1">Phone</label>
                <UInput
                  v-model="form.vendor_phone"
                  type="text"
                  variant="subtle"
                  placeholder="Phone"
                  size="sm"
                  class="w-full"
                />
              </div>
              <div>
                <label class="block text-xs font-medium text-gray-700 mb-1">Email</label>
                <UInput
                  v-model="form.vendor_email"
                  type="email"
                  variant="subtle"
                  placeholder="Email"
                  size="sm"
                  class="w-full"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { useVendorStore } from "~/stores/vendors";
import { useCorporationStore } from "~/stores/corporations";
import { useCurrencyFormat } from "~/composables/useCurrencyFormat";
import {
  createEmptyVendorAddress,
  getVendorAddressByType,
  resolveVendorAddresses,
  type VendorAddress,
  type VendorAddressType,
} from "~/utils/vendorAddresses";

interface VendorFormProps {
  modelValue: boolean;
  vendor?: any;
}

interface VendorFormEmits {
  (e: 'update:modelValue', value: boolean): void;
  (e: 'vendor-saved', vendor?: any): void;
}

const props = withDefaults(defineProps<VendorFormProps>(), {
  vendor: null
});

const emit = defineEmits<VendorFormEmits>();

const vendorStore = useVendorStore();
const corpStore = useCorporationStore();
const toast = useToast();
const { currencySymbol, formatCurrency } = useCurrencyFormat();

const submitting = ref(false);

// Computed properties
const showModal = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value)
});

const editingVendor = computed(() => props.vendor !== null);

const getCorporationName = computed(() => {
  return corpStore.selectedCorporation?.corporation_name || "Unnamed Corporation";
});

// Computed property for formatted opening balance display
const formattedOpeningBalance = computed({
  get: () => {
    if (!form.value.opening_balance || form.value.opening_balance === 0) return '';
    return form.value.opening_balance.toString();
  },
  set: (value: string) => {
    const numericValue = parseFloat(value) || 0;
    form.value.opening_balance = numericValue;
  }
});

// Form data
const form = ref({
  corporation_uuid: "",
  vendor_name: "",
  vendor_type: "",
  vendor_address: "",
  vendor_city: "",
  vendor_state: "",
  vendor_country: "",
  vendor_zip: "",
  vendor_phone: "",
  vendor_email: "",
  is_1099: false,
  vendor_federal_id: "",
  vendor_ssn: "",
  company_name: "",
  check_printed_as: "",
  doing_business_as: "",
  salutation: "Mr.",
  first_name: "",
  middle_name: "",
  last_name: "",
  opening_balance: 0.00,
  opening_balance_date: new Date().toISOString().split('T')[0],
  vendor_addresses: [
    createEmptyVendorAddress("default"),
    createEmptyVendorAddress("source"),
    createEmptyVendorAddress("manufacturing"),
  ] as VendorAddress[],
});

const addressTypes: Array<{ key: VendorAddressType; label: string }> = [
  { key: "default", label: "Default Address" },
  { key: "source", label: "Source Address" },
  { key: "manufacturing", label: "Manufacturing Address" },
];

function updateAddress(type: VendorAddressType, key: keyof Omit<VendorAddress, "addressType">, value: string) {
  const addresses = [...(form.value.vendor_addresses || [])];
  const index = addresses.findIndex((a) => a.addressType === type);
  const base = index >= 0 ? addresses[index] : createEmptyVendorAddress(type);
  const parsedValue =
    key === "stateID" || key === "countryID"
      ? (value.trim() === "" ? null : Number(value))
      : (value.trim() === "" ? null : value);
  const next = { ...base, [key]: parsedValue };
  if (index >= 0) {
    addresses[index] = next;
  } else {
    addresses.push(next);
  }
  form.value.vendor_addresses = resolveVendorAddresses(addresses);
}

function getAddressField(type: VendorAddressType, key: keyof Omit<VendorAddress, "addressType">): string {
  const address = getVendorAddressByType(form.value.vendor_addresses || [], type);
  const value = address[key];
  return value == null ? "" : String(value);
}

function hydrateVendorAddresses(vendor: any): VendorAddress[] {
  return resolveVendorAddresses(vendor?.vendor_addresses, {
    vendor_address: vendor?.vendor_address,
    vendor_city: vendor?.vendor_city,
    vendor_state: vendor?.vendor_state,
    vendor_country: vendor?.vendor_country,
    vendor_zip: vendor?.vendor_zip,
  });
}

// Salutation options
const salutationOptions = [
  { label: 'Mr.', value: 'Mr.' },
  { label: 'Mrs.', value: 'Mrs.' },
  { label: 'Ms.', value: 'Ms.' },
  { label: 'Dr.', value: 'Dr.' },
  { label: 'Prof.', value: 'Prof.' },
  { label: 'Rev.', value: 'Rev.' },
  { label: 'Sir', value: 'Sir' },
  { label: 'Madam', value: 'Madam' }
];

// Methods
function resetForm() {
  form.value = {
    corporation_uuid: corpStore.selectedCorporation?.uuid || "",
    vendor_name: "",
    vendor_type: "",
    vendor_address: "",
    vendor_city: "",
    vendor_state: "",
    vendor_country: "",
    vendor_zip: "",
    vendor_phone: "",
    vendor_email: "",
    is_1099: false,
    vendor_federal_id: "",
    vendor_ssn: "",
    company_name: "",
    check_printed_as: "",
    doing_business_as: "",
    salutation: "Mr.",
    first_name: "",
    middle_name: "",
    last_name: "",
    opening_balance: 0.00,
    opening_balance_date: new Date().toISOString().split('T')[0],
    vendor_addresses: [
      createEmptyVendorAddress("default"),
      createEmptyVendorAddress("source"),
      createEmptyVendorAddress("manufacturing"),
    ],
  };
}

function closeModal() {
  showModal.value = false;
  resetForm();
}

// Watch for modelValue changes
watch(() => props.modelValue, (isOpen) => {
  if (isOpen) {
    if (props.vendor) {
      // Edit mode - populate form with vendor data
      form.value = {
        corporation_uuid: corpStore.selectedCorporation?.uuid || "",
        vendor_name: props.vendor.vendor_name || "",
        vendor_type: props.vendor.vendor_type || "",
        vendor_address: props.vendor.vendor_address || "",
        vendor_city: props.vendor.vendor_city || "",
        vendor_state: props.vendor.vendor_state || "",
        vendor_country: props.vendor.vendor_country || "",
        vendor_zip: props.vendor.vendor_zip || "",
        vendor_phone: props.vendor.vendor_phone || "",
        vendor_email: props.vendor.vendor_email || "",
        is_1099: props.vendor.is_1099 || false,
        vendor_federal_id: props.vendor.vendor_federal_id || "",
        vendor_ssn: props.vendor.vendor_ssn || "",
        company_name: props.vendor.company_name || "",
        check_printed_as: props.vendor.check_printed_as || "",
        doing_business_as: props.vendor.doing_business_as || "",
        salutation: props.vendor.salutation || "Mr.",
        first_name: props.vendor.first_name || "",
        middle_name: props.vendor.middle_name || "",
        last_name: props.vendor.last_name || "",
        opening_balance: props.vendor.opening_balance || 0.00,
        opening_balance_date: props.vendor.opening_balance_date || new Date().toISOString().split('T')[0],
        vendor_addresses: hydrateVendorAddresses(props.vendor),
      };
    } else {
      // Add mode - reset form
      resetForm();
    }
  }
});

async function submitVendor() {
  let savedVendor: any = undefined
  // Validate required fields - only vendor name, federal id, and company name are mandatory
  const requiredFields = [
    { field: 'vendor_name', label: 'Vendor Name' },
    { field: 'vendor_federal_id', label: 'Federal ID' },
    { field: 'company_name', label: 'Company Name' }
  ];

  for (const { field, label } of requiredFields) {
    if (!form.value[field] || form.value[field].toString().trim() === '') {
      toast.add({
        title: 'Validation Error',
        description: `Please fill in the ${label}`,
        icon: 'i-heroicons-exclamation-triangle',
      });
      return;
    }
  }

  // Validate email format only if email is provided
  if (form.value.vendor_email && form.value.vendor_email.trim() !== '') {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.value.vendor_email.trim())) {
      toast.add({
        title: 'Validation Error',
        description: 'Please enter a valid email address',
        icon: 'i-heroicons-exclamation-triangle',
      });
      return;
    }
  }

  // Ensure corporation is set from the store
  if (!corpStore.selectedCorporation?.uuid) {
    toast.add({
      title: 'Error',
      description: 'No corporation selected. Please select a corporation first.',
      icon: 'i-heroicons-exclamation-triangle',
    });
    return;
  }

  // Set corporation_uuid from the store
  form.value.corporation_uuid = corpStore.selectedCorporation.uuid;

  submitting.value = true;

  try {
    const payload = {
      corporation_uuid: form.value.corporation_uuid,
      vendor_name: form.value.vendor_name,
      vendor_type: form.value.vendor_type,
      vendor_address: "",
      vendor_city: "",
      vendor_state: "",
      vendor_country: "",
      vendor_zip: "",
      vendor_phone: form.value.vendor_phone,
      vendor_email: form.value.vendor_email,
      is_1099: form.value.is_1099,
      vendor_federal_id: form.value.vendor_federal_id,
      vendor_ssn: form.value.vendor_ssn,
      company_name: form.value.company_name,
      check_printed_as: form.value.check_printed_as,
      doing_business_as: form.value.doing_business_as,
      salutation: form.value.salutation,
      first_name: form.value.first_name,
      middle_name: form.value.middle_name,
      last_name: form.value.last_name,
      opening_balance: form.value.opening_balance,
      opening_balance_date: form.value.opening_balance_date,
      vendor_addresses: resolveVendorAddresses(form.value.vendor_addresses, {
        vendor_address: form.value.vendor_address,
        vendor_city: form.value.vendor_city,
        vendor_state: form.value.vendor_state,
        vendor_country: form.value.vendor_country,
        vendor_zip: form.value.vendor_zip,
      }),
    };
    const defaultAddress = getVendorAddressByType(payload.vendor_addresses, "default");
    payload.vendor_address = defaultAddress.address || "";
    payload.vendor_city = defaultAddress.city || "";
    payload.vendor_state = defaultAddress.stateName || "";
    payload.vendor_country = defaultAddress.countryName || "";
    payload.vendor_zip = defaultAddress.zipCode || "";

    if (editingVendor.value) {
      // Update existing vendor
      const result = await vendorStore.updateVendor(
        payload.corporation_uuid,
        props.vendor,
        {
          vendor_name: payload.vendor_name,
          vendor_type: payload.vendor_type,
          vendor_address: payload.vendor_address,
          vendor_city: payload.vendor_city,
          vendor_state: payload.vendor_state,
          vendor_country: payload.vendor_country,
          vendor_zip: payload.vendor_zip,
          vendor_email: payload.vendor_email,
          is_1099: payload.is_1099,
          vendor_federal_id: payload.vendor_federal_id,
          vendor_ssn: payload.vendor_ssn,
          company_name: payload.company_name,
          check_printed_as: payload.check_printed_as,
          doing_business_as: payload.doing_business_as,
          salutation: payload.salutation,
          first_name: payload.first_name,
          middle_name: payload.middle_name,
          last_name: payload.last_name,
          opening_balance: payload.opening_balance,
          opening_balance_date: payload.opening_balance_date,
          vendor_addresses: payload.vendor_addresses,
          ...(payload.vendor_phone !== null
            ? { vendor_phone: payload.vendor_phone }
            : {}),
        }
      );

      // Show success toast for update
      toast.add({
        title: 'Vendor updated successfully!',
        icon: 'i-heroicons-check-circle',
      });

      savedVendor = result?.data ?? result
    } else {
      // Add new vendor
      const result = await vendorStore.addVendor(
        payload.corporation_uuid,
        {
          vendor_name: payload.vendor_name,
          vendor_type: payload.vendor_type,
          vendor_address: payload.vendor_address,
          vendor_city: payload.vendor_city,
          vendor_state: payload.vendor_state,
          vendor_country: payload.vendor_country,
          vendor_zip: payload.vendor_zip,
          vendor_phone: payload.vendor_phone,
          vendor_email: payload.vendor_email,
          is_1099: payload.is_1099,
          vendor_federal_id: payload.vendor_federal_id,
          vendor_ssn: payload.vendor_ssn,
          company_name: payload.company_name,
          check_printed_as: payload.check_printed_as,
          doing_business_as: payload.doing_business_as,
          salutation: payload.salutation,
          first_name: payload.first_name,
          middle_name: payload.middle_name,
          last_name: payload.last_name,
          opening_balance: payload.opening_balance,
          opening_balance_date: payload.opening_balance_date,
          vendor_addresses: payload.vendor_addresses,
        }
      );

      // Show success toast for add
      toast.add({
        title: 'Vendor added successfully!',
        icon: 'i-heroicons-check-circle',
      });

      savedVendor = result?.data ?? result
    }

    // Close modal and emit event
    closeModal();
    emit('vendor-saved', savedVendor);
  } catch (error) {
    // Show error toast
    const action = editingVendor.value ? 'updating' : 'adding';
    toast.add({
      title: `Failed to ${action} vendor`,
      description: error instanceof Error ? error.message : `An error occurred while ${action}`,
      icon: 'i-heroicons-exclamation-triangle',
    });
  } finally {
    submitting.value = false;
  }
}
</script>
