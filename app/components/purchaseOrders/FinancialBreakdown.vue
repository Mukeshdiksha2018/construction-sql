<template>
  <UCard
    variant="soft"
    class="w-full shadow-sm border border-default bg-white dark:bg-gray-900/40"
  >
    <div class="space-y-4">
      <div class="grid grid-cols-[1fr_auto_auto_auto] items-center gap-3 text-sm font-semibold text-default">
        <div>{{ itemTotalLabel }}</div>
        <div></div>
        <div></div>
        <PoDualCurrencyDisplay
          v-if="props.poCurrencyConversionEnabled"
          :amount="itemTotal"
          :from-currency="props.poCurrencyFrom"
          :to-currency="props.poCurrencyTo"
          :conversion-rate="props.poConversionRate"
        />
        <div v-else class="text-right font-mono">{{ formatCurrency(itemTotal) }}</div>
      </div>

      <!-- Advance Payment Deduction -->
      <div v-if="props.advancePaymentDeduction > 0" class="grid grid-cols-[1fr_auto_auto_auto] items-center gap-3 text-sm text-default">
        <div class="text-gray-600 dark:text-gray-400">
          <span class="font-medium">Less: Advance Payments</span>
          <span class="text-xs text-gray-500 dark:text-gray-500 ml-2">(Already paid)</span>
        </div>
        <div></div>
        <div></div>
        <div class="text-right font-mono text-red-600 dark:text-red-400">-{{ formatCurrency(props.advancePaymentDeduction) }}</div>
      </div>

      <!-- Holdback Deduction (item-only, calculated after advance deduction) -->
      <div v-if="holdbackAmount > 0" class="grid grid-cols-[1fr_auto_auto_auto] items-center gap-3 text-sm text-default border-t border-gray-200 dark:border-gray-700 pt-2">
        <div class="text-gray-600 dark:text-gray-400">
          <span class="font-medium">Less: Holdback</span>
          <span class="text-xs text-gray-500 dark:text-gray-500 ml-2">({{ resolvedHoldbackPercent }}% Retained)</span>
        </div>
        <div></div>
        <div></div>
        <div class="text-right font-mono text-red-600 dark:text-red-400">-{{ formatCurrency(holdbackAmount) }}</div>
      </div>

      <!-- Total Amount (after advance + holdback deductions, before charges and taxes) -->
      <div v-if="props.advancePaymentDeduction > 0 || holdbackAmount > 0" class="grid grid-cols-[1fr_auto_auto_auto] items-center gap-3 text-sm font-semibold text-default border-t border-gray-200 dark:border-gray-700 pt-2">
        <div>Total Amount</div>
        <div></div>
        <div></div>
        <div class="text-right font-mono text-primary-600">{{ formatCurrency(adjustedItemTotalAfterDeductions) }}</div>
      </div>

      <div v-if="!hideCharges" class="space-y-2">
        <div
          v-for="row in chargeRows"
          :key="row.key"
          class="grid grid-cols-[1fr_auto_auto_auto_auto] items-center gap-3 text-sm"
        >
          <div class="text-default">{{ row.label }}</div>
          <div class="flex items-center gap-1">
            <UInput
              :model-value="toInputStringWithScale(formData[`${row.key}_charges_percentage`], 4)"
              size="sm"
              type="number"
              min="0"
              step="any"
              inputmode="decimal"
              class="w-20 text-right font-mono"
              :disabled="readOnly"
              @wheel.prevent
              @keydown="preventNonNumericKeydownWithScale($event, 4)"
              @paste="preventNonNumericPasteWithScale($event, 4)"
              @update:model-value="(value) => handleChargePercentageChange(row.key, value)"
            />
            <span class="text-xs text-muted">%</span>
          </div>
          <div class="relative">
            <span
              class="absolute left-2 top-1/2 -translate-y-1/2 text-xs font-semibold text-default pointer-events-none z-10"
            >
              {{ currencySymbolText }}
            </span>
            <UInput
              :model-value="chargeAmountFieldModelValue(row.key)"
              size="sm"
              type="number"
              min="0"
              step="any"
              inputmode="decimal"
              class="w-24 text-right font-mono pl-6"
              :disabled="readOnly"
              @wheel.prevent
              @keydown="preventNonNumericKeydown"
              @paste="preventNonNumericPaste"
              @update:model-value="(value) => handleChargeAmountChange(row.key, value)"
            />
          </div>
          <div v-if="showAccountConfig" class="flex items-center justify-center">
            <UBadge
              color="neutral"
              variant="solid"
              size="sm"
              class="cursor-pointer inline-flex items-center gap-1"
              :class="{ 'opacity-50 cursor-not-allowed': !corporationUuidForCOA }"
              title="Configure COA"
              @click.stop="openConfigureCOAModal"
            >
              <UIcon name="i-heroicons-document-text" class="w-3.5 h-3.5 shrink-0" />
              A/C
            </UBadge>
          </div>
          <UCheckbox
            :model-value="Boolean(formData[`${row.key}_charges_taxable`])"
            label="Taxable"
            :disabled="readOnly"
            @update:model-value="(value) => handleChargeTaxableChange(row.key, value as boolean)"
          />
        </div>
      </div>

      <div v-if="!hideCharges" class="grid grid-cols-[1fr_auto_auto_auto_auto] items-center gap-3 text-sm font-semibold text-default">
        <div class="uppercase text-xs tracking-wide text-muted">Charges Total</div>
        <div></div>
        <PoDualCurrencyDisplay
          v-if="props.poCurrencyConversionEnabled"
          :amount="chargesTotal"
          :from-currency="props.poCurrencyFrom"
          :to-currency="props.poCurrencyTo"
          :conversion-rate="props.poConversionRate"
        />
        <div v-else class="text-right font-mono">{{ formatCurrency(chargesTotal) }}</div>
        <div></div>
        <div></div>
      </div>

      <div class="space-y-2">
        <div
          v-for="row in salesTaxRows"
          :key="row.key"
          class="grid grid-cols-[1fr_auto_auto_auto_auto] items-center gap-3 text-sm"
        >
          <div>
            <div
              class="w-full rounded-md border border-default bg-gray-50 px-3 py-1.5 text-sm font-medium text-default dark:bg-gray-900/40"
            >
              {{ row.label }}
            </div>
          </div>
          <div class="flex items-center gap-1">
            <UInput
              :model-value="toInputStringWithScale(formData[`${row.key}_percentage`], 4)"
              size="sm"
              type="number"
              min="0"
              step="any"
              inputmode="decimal"
              class="w-20 text-right font-mono"
              :disabled="readOnly"
              @wheel.prevent
              @keydown="preventNonNumericKeydownWithScale($event, 4)"
              @paste="preventNonNumericPasteWithScale($event, 4)"
              @update:model-value="(value) => handleSalesTaxPercentageChange(row.key, value)"
            />
            <span class="text-xs text-muted">%</span>
          </div>
          <div class="relative">
            <span
              class="absolute left-2 top-1/2 -translate-y-1/2 text-xs font-semibold text-default pointer-events-none z-10"
            >
              {{ currencySymbolText }}
            </span>
            <UInput
              :model-value="salesTaxAmountFieldModelValue(row.key)"
              size="sm"
              type="number"
              min="0"
              step="any"
              inputmode="decimal"
              class="w-24 text-right font-mono pl-6"
              :disabled="readOnly"
              @wheel.prevent
              @keydown="preventNonNumericKeydown"
              @paste="preventNonNumericPaste"
              @update:model-value="(value) => handleSalesTaxAmountChange(row.key, value)"
            />
          </div>
          <div v-if="showAccountConfig" class="flex items-center justify-center">
            <UBadge
              color="neutral"
              variant="solid"
              size="sm"
              class="cursor-pointer inline-flex items-center gap-1"
              :class="{ 'opacity-50 cursor-not-allowed': !corporationUuidForCOA }"
              title="Configure COA"
              @click.stop="openConfigureCOAModal"
            >
              <UIcon name="i-heroicons-document-text" class="w-3.5 h-3.5 shrink-0" />
              A/C
            </UBadge>
          </div>
          <div></div>
        </div>
      </div>

      <div class="grid grid-cols-[1fr_auto_auto_auto_auto] items-center gap-3 text-sm font-semibold text-default">
        <div class="uppercase text-xs tracking-wide text-muted">Tax Total</div>
        <div></div>
        <PoDualCurrencyDisplay
          v-if="props.poCurrencyConversionEnabled"
          :amount="taxTotal"
          :from-currency="props.poCurrencyFrom"
          :to-currency="props.poCurrencyTo"
          :conversion-rate="props.poConversionRate"
        />
        <div v-else class="text-right font-mono">{{ formatCurrency(taxTotal) }}</div>
        <div></div>
        <div></div>
      </div>

      <div class="grid grid-cols-[1fr_auto_auto_auto] items-center gap-3 text-sm font-semibold text-default bg-primary-50 dark:bg-primary-900/20 rounded-md p-2 -mx-1 border-t border-gray-200 dark:border-gray-700 pt-2 mt-2">
        <div>{{ totalLabel }}</div>
        <div></div>
        <div></div>
        <PoDualCurrencyDisplay
          v-if="!allowEditTotal && props.poCurrencyConversionEnabled"
          class="text-primary-600"
          :amount="finalTotal"
          :from-currency="props.poCurrencyFrom"
          :to-currency="props.poCurrencyTo"
          :conversion-rate="props.poConversionRate"
        />
        <div v-else-if="!allowEditTotal" class="text-right font-mono text-primary-600">{{ formatCurrency(finalTotal) }}</div>
        <div v-else class="flex justify-end">
          <div class="flex flex-col items-end gap-1">
            <div class="relative">
              <span class="absolute left-2 top-1/2 -translate-y-1/2 text-xs font-semibold text-default pointer-events-none z-10">
                {{ currencySymbolText }}
              </span>
              <UInput
                :model-value="toInputString(displayTotal)"
                size="sm"
                type="number"
                step="any"
                inputmode="decimal"
                :class="[
                  'w-32 text-right font-mono pl-6 dark:bg-gray-900',
                  totalInvoiceAmountError ? 'border-error-500 focus:border-error-500 focus:ring-error-500' : ''
                ]"
                :disabled="readOnly"
                @keydown="preventNonNumericKeydown"
                @paste="preventNonNumericPaste"
                @update:model-value="(value) => handleTotalAmountChange(value)"
              />
            </div>
            <PoDualCurrencyDisplay
              v-if="props.poCurrencyConversionEnabled"
              :amount="parseNumericInput(displayTotal)"
              :from-currency="props.poCurrencyFrom"
              :to-currency="props.poCurrencyTo"
              :conversion-rate="props.poConversionRate"
            />
            <p
              v-if="totalInvoiceAmountError"
              class="text-xs text-error-600 dark:text-error-400"
            >
              {{ totalInvoiceAmountError }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </UCard>

  <!-- Configure COA Modal -->
  <UModal
    v-model:open="configureCOAModalOpen"
    :ui="{
      content:
        'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100vw-1rem)] max-w-[min(96rem,calc(100vw-1rem))] max-h-[calc(100dvh-1rem)] sm:max-h-[calc(100dvh-2rem)] rounded-lg shadow-lg ring ring-default overflow-hidden',
      body: 'flex-1 p-4 sm:p-6 max-h-[calc(100dvh-12rem)] overflow-y-auto',
    }"
  >
    <template #header>
      <div class="flex items-center justify-between w-full gap-4">
        <UButton
          icon="i-heroicons-x-mark"
          size="xs"
          variant="solid"
          color="neutral"
          square
          @click="closeConfigureCOAModal"
        />
        <h3 class="text-base font-semibold text-default flex-1 text-center">
          Configure COA
        </h3>
        <div class="flex items-center gap-2">
          <UButton
            size="xs"
            color="neutral"
            variant="soft"
            label="Reset"
            data-testid="coa-reset"
            @click="resetConfigureCOA"
          />
          <UButton
            size="xs"
            color="primary"
            variant="solid"
            label="Apply"
            data-testid="coa-apply"
            @click="applyConfigureCOA"
          />
        </div>
      </div>
    </template>
    <template #body>
      <div class="space-y-6">
        <!-- Notice when COA is read-only (e.g. Against Advance Payment: change GL in Advance Payment Distribution) -->
        <div
          v-if="coaSelectionReadOnly"
          class="rounded-lg border border-primary/30 bg-primary/5 dark:bg-primary/10 px-4 py-3 text-sm text-default"
        >
          <p class="font-medium">
            GL accounts are set in the <strong>Advance Payment Distribution</strong> table.
          </p>
          <p class="text-muted mt-1">
            To change chart of accounts, use the Advance Payment Distribution section.
          </p>
        </div>
        <!-- Total amount breakdown (user can change account per row) -->
        <div v-if="coaModalItemBreakdown.length > 0">
          <h4 class="text-sm font-semibold text-default mb-2">Total amount breakdown</h4>
          <p v-if="coaSelectionReadOnly" class="text-xs text-muted mb-2">
            Amounts by preferred chart of account from <strong class="font-medium text-default">Advance Payment Distribution</strong>.
            <strong class="font-medium text-default">Total</strong> is the advance allocation for that GL. Edit GL assignments in the distribution table above.
          </p>
          <p v-else-if="simplifyCoaModalColumns" class="text-xs text-muted mb-2">
            Release amounts by preferred chart of account from the <strong class="font-medium text-default">holdback breakdown</strong>.
            <strong class="font-medium text-default">Total</strong> is the release amount for that GL. Edit GL assignments in the holdback breakdown table.
          </p>
          <div class="rounded-md border border-default overflow-x-auto">
            <table
              class="w-full text-sm"
              :class="coaModalHideAdvanceTaxHoldbackColumns ? 'min-w-[28rem]' : 'min-w-[72rem]'"
            >
              <thead>
                <tr class="bg-gray-100 dark:bg-gray-800">
                  <th class="text-left py-2 px-3 font-medium text-default">Chart of Account</th>
                  <th class="text-right py-2 px-3 font-medium text-default whitespace-nowrap">Entered amount</th>
                  <th
                    v-if="!coaModalHideAdvanceTaxHoldbackColumns"
                    class="text-right py-2 px-3 font-medium text-default w-[11rem] whitespace-nowrap"
                  >
                    Advance (cost)
                  </th>
                  <th
                    v-if="!coaModalHideAdvanceTaxHoldbackColumns"
                    class="text-left py-2 px-3 font-medium text-default w-[11rem] whitespace-nowrap"
                  >
                    Equally adjusted tax advances
                  </th>
                  <th
                    v-if="!coaModalHideAdvanceTaxHoldbackColumns"
                    class="text-right py-2 px-3 font-medium text-default w-[22%]"
                  >
                    Holdback applied
                  </th>
                  <th class="text-right py-2 px-3 font-medium text-default whitespace-nowrap">Total</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-default">
                <tr v-for="(row, idx) in coaModalItemBreakdown" :key="idx" class="bg-white dark:bg-gray-900/40">
                  <td class="py-2 px-3 align-top">
                    <ChartOfAccountsSelect
                      :model-value="row.accountUuid"
                      :corporation-uuid="corporationUuidForCOA"
                      :exclude-bank-accounts="true"
                      placeholder="-Select-"
                      size="sm"
                      class="w-full min-w-[200px]"
                      :disabled="readOnly || coaSelectionReadOnly"
                      @update:model-value="(v) => setItemBreakdownAccount(idx, v ?? null)"
                    />
                  </td>
                  <td class="py-2 px-3 text-right font-mono text-default align-top whitespace-nowrap">
                    {{
                      idx < coaModalItemEnteredAmounts.length
                        ? formatCurrency(coaModalItemEnteredAmounts[idx] ?? 0)
                        : '—'
                    }}
                  </td>
                  <td
                    v-if="!coaModalHideAdvanceTaxHoldbackColumns"
                    class="py-2 px-3 text-right font-mono text-default align-top whitespace-nowrap"
                  >
                    <template
                      v-if="idx < coaModalItemAdvanceAmounts.length && coaModalItemAdvanceAmounts[idx] > 0"
                    >
                      −{{ formatCurrency(coaModalItemAdvanceAmounts[idx] ?? 0) }}
                    </template>
                    <span v-else class="text-muted">—</span>
                  </td>
                  <td
                    v-if="!coaModalHideAdvanceTaxHoldbackColumns"
                    class="py-2 px-3 text-right font-mono text-default align-top whitespace-nowrap"
                  >
                    <template
                      v-if="
                        idx < coaModalItemAdvanceTaxShareAmounts.length &&
                        (coaModalItemAdvanceTaxShareAmounts[idx] ?? 0) > 0
                      "
                    >
                      −{{ formatCurrency(coaModalItemAdvanceTaxShareAmounts[idx] ?? 0) }}
                    </template>
                    <span v-else class="text-muted">—</span>
                  </td>
                  <td
                    v-if="!coaModalHideAdvanceTaxHoldbackColumns"
                    class="py-2 px-3 text-right font-mono text-default align-top whitespace-nowrap"
                  >
                    <template
                      v-if="
                        idx < coaModalItemHoldbackAmounts.length &&
                        (coaModalItemHoldbackAmounts[idx] ?? 0) > 0 &&
                        resolvedHoldbackPercent > 0
                      "
                    >
                      −{{ formatCurrency(coaModalItemHoldbackAmounts[idx] ?? 0) }}
                    </template>
                    <span v-else class="text-muted">—</span>
                  </td>
                  <td class="py-2 px-3 text-right font-mono text-default align-top whitespace-nowrap">
                    <div>
                      {{
                        formatCurrency(
                          idx < coaModalItemDisplayTotals.length ? coaModalItemDisplayTotals[idx]! : row.total
                        )
                      }}
                    </div>
                    <div
                      v-if="
                        !coaModalHideAdvanceTaxHoldbackColumns &&
                        idx < coaModalItemEnteredAmounts.length &&
                        coaModalItemAdvanceAmounts[idx] !== undefined
                      "
                      class="text-[11px] text-muted font-normal mt-0.5"
                    >
                      {{ formatCurrency(coaModalItemEnteredAmounts[idx] ?? 0) }} −
                      {{ formatCurrency(coaModalItemAdvanceAmounts[idx]) }} −
                      {{ formatCurrency(coaModalItemAdvanceTaxShareAmounts[idx] ?? 0) }} −
                      {{ formatCurrency(coaModalItemHoldbackAmounts[idx] ?? 0) }}
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
            <p
              v-if="
                resolvedHoldbackPercent > 0 &&
                coaModalItemBreakdown.length > 0 &&
                !coaModalHideAdvanceTaxHoldbackColumns
              "
              class="text-[11px] text-muted mt-2 px-1"
              data-testid="coa-holdback-allocation-note"
            >
              Holdback: the same total as <strong class="font-medium text-default">Less: Holdback</strong> in the summary is split across item lines only (after advances). Charge and tax lines are not reduced by holdback.
            </p>
          </div>
        </div>
        <!-- Charges (hidden when hideCharges, e.g. Against Advance Payment) -->
        <div v-if="!hideCharges">
          <h4 class="text-sm font-semibold text-default mb-2">Charges</h4>
          <div class="rounded-md border border-default overflow-hidden">
            <table class="w-full text-sm min-w-[640px]">
              <thead>
                <tr class="bg-gray-100 dark:bg-gray-800">
                  <th class="text-left py-2 px-3 font-medium text-default">Charges</th>
                  <th class="text-left py-2 px-3 font-medium text-default">COA</th>
                  <th class="text-right py-2 px-3 font-medium text-default">Total</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-default">
                <tr v-for="(row, cIdx) in chargeRows" :key="row.key" class="bg-white dark:bg-gray-900/40">
                  <td class="py-2 px-3 text-default">{{ row.label }}</td>
                  <td class="py-2 px-3">
                    <ChartOfAccountsSelect
                      :model-value="coaModalState[`${row.key}_charges_account_uuid`]"
                      :corporation-uuid="corporationUuidForCOA"
                      :exclude-bank-accounts="true"
                      placeholder="-Select-"
                      size="sm"
                      class="w-full min-w-[200px]"
                      :disabled="readOnly || coaSelectionReadOnly"
                      @update:model-value="(v) => (coaModalState[`${row.key}_charges_account_uuid`] = v ?? '')"
                    />
                  </td>
                  <td class="py-2 px-3 text-right font-mono text-default">
                    {{ formatCurrency(coaModalChargeNetTotals[cIdx] ?? chargeStates.find((s) => s.key === row.key)?.amount ?? 0) }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        <!-- Tax -->
        <div>
          <h4 class="text-sm font-semibold text-default mb-2">Tax</h4>
          <div class="rounded-md border border-default overflow-hidden">
            <table class="w-full text-sm min-w-[640px]">
              <thead>
                <tr class="bg-gray-100 dark:bg-gray-800">
                  <th class="text-left py-2 px-3 font-medium text-default">Taxes</th>
                  <th class="text-left py-2 px-3 font-medium text-default">COA</th>
                  <th class="text-right py-2 px-3 font-medium text-default">Total</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-default">
                <tr v-for="(row, tIdx) in salesTaxRows" :key="row.key" class="bg-white dark:bg-gray-900/40">
                  <td class="py-2 px-3 text-default">{{ row.label }}</td>
                  <td class="py-2 px-3">
                    <ChartOfAccountsSelect
                      :model-value="coaModalState[`${row.key}_account_uuid`]"
                      :corporation-uuid="corporationUuidForCOA"
                      :exclude-bank-accounts="true"
                      placeholder="-Select-"
                      size="sm"
                      class="w-full min-w-[200px]"
                      :disabled="readOnly"
                      @update:model-value="(v) => (coaModalState[`${row.key}_account_uuid`] = v ?? '')"
                    />
                  </td>
                  <td class="py-2 px-3 text-right font-mono text-default">
                    {{ formatCurrency(coaModalTaxNetTotals[tIdx] ?? salesTaxStates.find((s) => s.key === row.key)?.amount ?? 0) }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { computed, watch, ref, onMounted, reactive } from 'vue'
import { useCurrencyFormat } from '~/composables/useCurrencyFormat'
import { useChartOfAccountsStore } from '~/stores/chartOfAccounts'
import ChartOfAccountsSelect from '~/components/shared/ChartOfAccountsSelect.vue'
import { allocateGlobalHoldbackProportionally } from '~/utils/allocateGlobalHoldbackProportionally'
import { pipelineCoaModalItemAfterAdvances } from '~/utils/pipelineCoaModalItemAfterAdvances'
import PoDualCurrencyDisplay from '~/components/purchaseOrders/PoDualCurrencyDisplay.vue'
import type { PoCurrencyCode } from '~/utils/poCurrencyConversion'

interface Props {
  itemTotal: number
  formData: Record<string, any>
  readOnly: boolean
  itemTotalLabel?: string
  totalLabel?: string
  totalFieldName?: string // Field name for the final total (e.g., 'total_po_amount' or 'grn_total_with_charges_taxes')
  hideCharges?: boolean // Hide charges section (show only sales tax)
  showTotalAmount?: boolean // Show "Total Amount" label above "Total Invoice Amount"
  totalAmountLabel?: string // Label for the "Total Amount" row
  allowEditTotal?: boolean // Allow editing the total invoice amount field
  totalInvoiceAmountError?: string | null // Error message for total invoice amount field
  advancePaymentDeduction?: number // Amount to deduct for advance payments already made
  holdbackPercentage?: number // Percentage for holdback calculation (applied to item table totals only)
  corporationUuid?: string | null // Optional; falls back to formData.corporation_uuid for Chart of Accounts
  /** Item total broken down by preferred chart of account (from PO/CO items by cost code). Makes up the item total. */
  itemBreakdownByAccount?: { accountUuid: string; total: number }[]
  /**
   * When true (e.g. Against Advance Payment): item/charge GL in Configure COA is read-only (change GL in Advance Payment Distribution).
   * Contributes to compact Configure COA columns (hides advance tax / holdback detail columns).
   */
  coaSelectionReadOnly?: boolean
  /**
   * When true (e.g. Against Holdback Amount): same compact Configure COA columns as advance payment, without locking GL or the Advance Payment notice.
   */
  simplifyCoaModalColumns?: boolean
  /** Show the A/C (Chart of Accounts) configuration button next to charges and taxes. Only relevant in invoice context. */
  showAccountConfig?: boolean
  /** Per-row advance dollars mapped to each GL (same order as itemBreakdownByAccount); when set with positive values, overrides equal split of advancePaymentDeduction. */
  advanceAmountsByRow?: number[]
  /**
   * Sales Tax 1 + 2 amounts from Advance Payment Breakdown (__tax_sales_tax_*). Summed and allocated in
   * Configure COA across item COA rows only (equal water-fill after cost advance), not on tax rows.
   */
  advanceTaxCreditsByLine?: Partial<Record<'sales_tax_1' | 'sales_tax_2', number>>
  poCurrencyConversionEnabled?: boolean
  poCurrencyFrom?: PoCurrencyCode
  poCurrencyTo?: PoCurrencyCode
  poConversionRate?: number
}

const props = withDefaults(defineProps<Props>(), {
  itemTotalLabel: 'Item Total',
  totalLabel: 'Total Amount',
  totalFieldName: 'total_po_amount',
  hideCharges: false,
  showTotalAmount: false,
  totalAmountLabel: 'Total Amount',
  allowEditTotal: false,
  totalInvoiceAmountError: null,
  advancePaymentDeduction: 0,
  holdbackPercentage: 0,
  corporationUuid: null,
  itemBreakdownByAccount: () => [],
  coaSelectionReadOnly: false,
  simplifyCoaModalColumns: false,
  showAccountConfig: false,
  advanceAmountsByRow: () => [],
  advanceTaxCreditsByLine: () => ({}),
  poCurrencyConversionEnabled: false,
  poCurrencyFrom: 'CAD',
  poCurrencyTo: 'USD',
  poConversionRate: 1,
})

const { formatCurrency, currencySymbol } = useCurrencyFormat()
const currencySymbolText = computed(() => currencySymbol.value || '')

const corporationUuidForCOA = computed(() =>
  props.corporationUuid ?? props.formData?.corporation_uuid ?? undefined
)

/** Configure COA: hide Advance (cost), Equally adjusted tax advances, Holdback applied (Against Advance Payment and Against Holdback Amount). */
const coaModalHideAdvanceTaxHoldbackColumns = computed(
  () => props.coaSelectionReadOnly || props.simplifyCoaModalColumns
)

const chartOfAccountsStore = useChartOfAccountsStore()
const itemBreakdownRows = computed(() => {
  const breakdown = props.itemBreakdownByAccount
  if (!breakdown?.length) return []
  const options = chartOfAccountsStore.accountOptions || []
  const byUuid = new Map(options.map((o: any) => [o.value, o.label]))
  return breakdown.map(({ accountUuid, total }) => ({
    accountUuid,
    accountLabel: byUuid.get(accountUuid) ?? accountUuid ?? '—',
    total,
  }))
})

const configureCOAModalOpen = ref(false)

const coaModalState = reactive<Record<string, string>>({
  freight_charges_account_uuid: '',
  packing_charges_account_uuid: '',
  custom_duties_charges_account_uuid: '',
  other_charges_account_uuid: '',
  sales_tax_1_account_uuid: '',
  sales_tax_2_account_uuid: '',
})

/** Editable copy of item breakdown in the modal (user can change account per row) */
const coaModalItemBreakdown = ref<{ accountUuid: string; total: number }[]>([])
let coaModalItemBreakdownInitial: { accountUuid: string; total: number }[] = []

/** Gross per GL from itemBreakdownByAccount (user-entered / line-derived), before advance and holdback — shown in Configure COA table. */
const coaModalItemEnteredAmounts = computed(() => {
  if (!configureCOAModalOpen.value) return [] as number[]
  return (props.itemBreakdownByAccount ?? []).map((r) =>
    roundCurrencyValue(parseNumericInput(r.total))
  )
})

/** Per-row formatted holdback share (item-line portion of retention), aligned with item breakdown rows */
const coaModalHoldbackLabels = ref<string[]>([])
let coaModalHoldbackLabelsInitial: string[] = []

/** Per-row numeric advance (entered − balance after advance split), holdback (afterAdvance − net), and display total = entered − advance − holdback */
const coaModalItemAdvanceAmounts = ref<number[]>([])
/** Per-row share of total advance tax (Sales Tax 1+2 from Advance Payment Breakdown), equal water-fill after cost advance */
const coaModalItemAdvanceTaxShareAmounts = ref<number[]>([])
const coaModalItemHoldbackAmounts = ref<number[]>([])
const coaModalItemDisplayTotals = ref<number[]>([])
let coaModalItemAdvanceAmountsInitial: number[] = []
let coaModalItemAdvanceTaxShareAmountsInitial: number[] = []
let coaModalItemHoldbackAmountsInitial: number[] = []
let coaModalItemDisplayTotalsInitial: number[] = []

/** Configure COA modal: charges — net total per charge row (aligned with chargeRows order) */
const coaModalChargeNetTotals = ref<number[]>([])
let coaModalChargeNetTotalsInitial: number[] = []

/** Configure COA modal: taxes — net total per tax row (aligned with salesTaxRows order) */
const coaModalTaxNetTotals = ref<number[]>([])
let coaModalTaxNetTotalsInitial: number[] = []

let coaModalInitialValues: Record<string, string> = {}

const emit = defineEmits<{
  (e: 'update', payload: Record<string, any>): void
}>()

const parseNumericInput = (value: any): number => {
  if (value === null || value === undefined || value === '') return 0
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0
  }
  const normalized = String(value).replace(/,/g, '').trim()
  if (!normalized) return 0
  const numeric = Number(normalized)
  return Number.isFinite(numeric) ? numeric : 0
}

/** Holdback % for summary + Configure COA (prop or formData.holdback; coerces string / trailing %). */
const resolvedHoldbackPercent = computed(() => {
  const h = (props.holdbackPercentage ?? props.formData?.holdback) as unknown
  if (h === null || h === undefined || h === '') return 0
  if (typeof h === 'number') return Number.isFinite(h) ? Math.max(0, h) : 0
  const s = String(h).replace(/,/g, '').replace(/%/g, '').trim()
  if (!s) return 0
  const n = Number(s)
  return Number.isFinite(n) ? Math.max(0, n) : 0
})

const toInputString = (value: any): string => {
  return toInputStringWithScale(value, 2)
}

const toInputStringWithScale = (value: any, maxDecimals = 2): string => {
  if (value === null || value === undefined) return ''
  if (typeof value === 'number') return String(value)
  const cleaned = String(value).replace(/,/g, '').trim()
  if (cleaned === '') return ''
  // Preserve in-progress decimals like "12." so number inputs don't jump while typing
  if (/^-?\d+\.$/.test(cleaned)) return cleaned
  const decimalPattern = new RegExp(`^-?\\d*\\.?\\d{0,${maxDecimals}}$`)
  if (decimalPattern.test(cleaned)) return cleaned
  const numeric = Number(cleaned)
  return Number.isFinite(numeric) ? String(numeric) : ''
}

const preventNonNumericKeydown = (event: KeyboardEvent) => {
  if (event.ctrlKey || event.metaKey || event.altKey) return
  const allowedKeys = new Set([
    'Backspace',
    'Delete',
    'Tab',
    'Enter',
    'Escape',
    'ArrowLeft',
    'ArrowRight',
    'ArrowUp',
    'ArrowDown',
    'Home',
    'End',
  ])
  if (allowedKeys.has(event.key)) return

  const isDigit = /^[0-9]$/.test(event.key)
  const isDot = event.key === '.'
  if (!isDigit && !isDot) {
    event.preventDefault()
    return
  }

  if (isDot) {
    const input = event.target as HTMLInputElement | null
    if (input?.value?.includes('.')) {
      event.preventDefault()
    }
    return
  }

  const input = event.target as HTMLInputElement | null
  if (!input) return
  const value = input.value || ''
  const dotIndex = value.indexOf('.')
  if (dotIndex >= 0) {
    const selectionStart = input.selectionStart ?? value.length
    const selectionEnd = input.selectionEnd ?? value.length
    const isReplacingSelection = selectionEnd > selectionStart
    const decimalPartLength = value.slice(dotIndex + 1).length
    const caretInDecimalPart = selectionStart > dotIndex
    if (decimalPartLength >= 2 && caretInDecimalPart && !isReplacingSelection) {
      event.preventDefault()
    }
  }
}

const preventNonNumericPaste = (event: ClipboardEvent) => {
  preventNonNumericPasteWithScale(event, 2)
}

const preventNonNumericKeydownWithScale = (event: KeyboardEvent, maxDecimals = 2) => {
  if (event.ctrlKey || event.metaKey || event.altKey) return
  const allowedKeys = new Set([
    'Backspace',
    'Delete',
    'Tab',
    'Enter',
    'Escape',
    'ArrowLeft',
    'ArrowRight',
    'ArrowUp',
    'ArrowDown',
    'Home',
    'End',
  ])
  if (allowedKeys.has(event.key)) return

  const isDigit = /^[0-9]$/.test(event.key)
  const isDot = event.key === '.'
  if (!isDigit && !isDot) {
    event.preventDefault()
    return
  }

  if (isDot) {
    const input = event.target as HTMLInputElement | null
    if (input?.value?.includes('.')) {
      event.preventDefault()
    }
    return
  }

  const input = event.target as HTMLInputElement | null
  if (!input) return
  const value = input.value || ''
  const dotIndex = value.indexOf('.')
  if (dotIndex >= 0) {
    const selectionStart = input.selectionStart ?? value.length
    const selectionEnd = input.selectionEnd ?? value.length
    const isReplacingSelection = selectionEnd > selectionStart
    const decimalPartLength = value.slice(dotIndex + 1).length
    const caretInDecimalPart = selectionStart > dotIndex
    if (decimalPartLength >= maxDecimals && caretInDecimalPart && !isReplacingSelection) {
      event.preventDefault()
    }
  }
}

const preventNonNumericPasteWithScale = (event: ClipboardEvent, maxDecimals = 2) => {
  const text = event.clipboardData?.getData('text') ?? ''
  const decimalPattern = new RegExp(`^\\d*\\.?\\d{0,${maxDecimals}}$`)
  if (!decimalPattern.test(text.trim())) {
    event.preventDefault()
  }
}

const roundCurrencyValue = (value: number): number => {
  if (!Number.isFinite(value)) return 0
  return Math.round((value + Number.EPSILON) * 100) / 100
}

const roundTo = (value: number, decimals = 4): number => {
  if (!Number.isFinite(value)) return 0
  const factor = Math.pow(10, decimals)
  return Math.round((value + Number.EPSILON) * factor) / factor
}

const clampToNonNegative = (value: number): number => Math.max(0, value)

const chargeRows = [
  { key: 'freight', label: 'Freight Charges' },
  { key: 'packing', label: 'Packing Charges' },
  { key: 'custom_duties', label: 'Custom & Duties' },
  { key: 'other', label: 'Other Charges' },
] as const

const salesTaxRows = [
  { key: 'sales_tax_1', label: 'Sales Tax 1' },
  { key: 'sales_tax_2', label: 'Sales Tax 2' },
] as const

type ChargeRowKey = (typeof chargeRows)[number]['key']
type SalesTaxRowKey = (typeof salesTaxRows)[number]['key']

/** Sum of advance tax credits (Sales Tax 1 + 2) from Advance Payment Breakdown — allocated in COA modal across item lines only */
const totalAdvanceTaxCreditsSum = computed(() =>
  roundCurrencyValue(
    (Number(props.advanceTaxCreditsByLine?.sales_tax_1) || 0) +
      (Number(props.advanceTaxCreditsByLine?.sales_tax_2) || 0)
  )
)

interface ChargeComputationState {
  key: ChargeRowKey
  percentage: number
  amount: number
  taxable: boolean
}

interface SalesTaxComputationState {
  key: SalesTaxRowKey
  percentage: number
  amount: number
}

const resolveFieldValue = (key: string): any => {
  return props.formData[key]
}

/**
 * True when the amount field should drive math (user typing / saved non-zero $).
 * PO/CO → GRN flows often leave `*_amount` at numeric `0` or `"0"` while only `%` is copied;
 * those must NOT be treated as dollar-led, or we zero % to match $0 and wipe taxes when items load.
 */
const hasExplicitCurrencyAmountInput = (raw: unknown): boolean => {
  if (raw === null || raw === undefined) return false
  const trimmed = String(raw).replace(/,/g, '').trim()
  if (trimmed === '' || trimmed === '.') return false
  // In-progress decimals like "12." — still amount-led for stable typing
  if (/^-?\d+\.$/.test(trimmed)) return true
  const n = parseNumericInput(raw)
  if (!Number.isFinite(n) || n === 0) return false
  return true
}

// Advance payment deduction should be applied BEFORE holdback.
// Charges and taxes are calculated on Total Amount (after holdback deduction).
const adjustedItemTotal = computed(() => {
  const advanceDeduction = roundCurrencyValue(props.advancePaymentDeduction || 0)
  // Subtract only advance payment deduction here.
  return roundCurrencyValue(Math.max(0, props.itemTotal - advanceDeduction))
})

const buildChargeStates = (): ChargeComputationState[] => {
  // Use post-holdback total amount as the base for charge calculations.
  const itemTotalValue = chargeAndTaxBase.value

  return chargeRows.map((row) => {
    const percentageKey = `${row.key}_charges_percentage`
    const amountKey = `${row.key}_charges_amount`
    const taxableKey = `${row.key}_charges_taxable`

    const rawAmt = resolveFieldValue(amountKey)
    const rawPct = resolveFieldValue(percentageKey)
    const amtParsed = clampToNonNegative(roundCurrencyValue(parseNumericInput(rawAmt)))
    const pctRounded = clampToNonNegative(roundTo(parseNumericInput(rawPct), 4))
    const derivedFromPct = roundCurrencyValue(itemTotalValue * (pctRounded / 100))
    const taxable = Boolean(resolveFieldValue(taxableKey))

    // When the user enters a dollar amount, the rounded % → $ round-trip must not overwrite the typed amount.
    // Read-only contexts (e.g. GRN/return breakdown): always derive $ from saved % — qty changes must not
    // reinterpret emitted amounts as "user-led" and drift % away from PO/CO.
    if (!props.readOnly && itemTotalValue > 0 && hasExplicitCurrencyAmountInput(rawAmt)) {
      const useAmt = amtParsed
      if (!(pctRounded > 0) || Math.abs(useAmt - derivedFromPct) > 0.02) {
        const derivedPct =
          itemTotalValue > 0 ? clampToNonNegative(roundTo((useAmt / itemTotalValue) * 100, 6)) : 0
        return {
          key: row.key,
          percentage: derivedPct,
          amount: useAmt,
          taxable,
        }
      }
    }

    return {
      key: row.key,
      percentage: pctRounded,
      amount: derivedFromPct,
      taxable,
    }
  })
}

const buildSalesTaxStates = (taxableBase: number): SalesTaxComputationState[] => {
  return salesTaxRows.map((row) => {
    const percentageKey = `${row.key}_percentage`
    const amountKey = `${row.key}_amount`

    const rawAmt = resolveFieldValue(amountKey)
    const rawPct = resolveFieldValue(percentageKey)
    const amtParsed = clampToNonNegative(roundCurrencyValue(parseNumericInput(rawAmt)))
    const pctRounded = clampToNonNegative(roundTo(parseNumericInput(rawPct), 4))
    const derivedFromPct = roundCurrencyValue(taxableBase * (pctRounded / 100))

    if (!props.readOnly && taxableBase > 0 && hasExplicitCurrencyAmountInput(rawAmt)) {
      const useAmt = amtParsed
      if (!(pctRounded > 0) || Math.abs(useAmt - derivedFromPct) > 0.02) {
        const derivedPct =
          taxableBase > 0 ? clampToNonNegative(roundTo((useAmt / taxableBase) * 100, 6)) : 0
        return {
          key: row.key,
          percentage: derivedPct,
          amount: useAmt,
        }
      }
    }

    return {
      key: row.key,
      percentage: pctRounded,
      amount: derivedFromPct,
    }
  })
}

const chargeStates = computed(() => buildChargeStates())
const chargesTotal = computed(() => {
  const states = chargeStates.value
  return roundCurrencyValue(states.reduce((sum, state) => sum + state.amount, 0))
})

const taxableChargesTotal = computed(() => {
  const states = chargeStates.value
  return roundCurrencyValue(states.reduce((sum, state) => (state.taxable ? sum + state.amount : sum), 0))
})

const taxableBase = computed(() => {
  if (props.hideCharges) {
    // When charges are hidden, taxable base is just the post-holdback total amount.
    return chargeAndTaxBase.value
  }
  // Taxable base is post-holdback total amount + taxable charges.
  return roundCurrencyValue(chargeAndTaxBase.value + taxableChargesTotal.value)
})

const salesTaxStates = computed(() => buildSalesTaxStates(taxableBase.value))

/** Amount column: prefer formData while typing so computed %-derived $ does not replace partial input. */
const chargeAmountFieldModelValue = (key: ChargeRowKey): string => {
  const raw = resolveFieldValue(`${key}_charges_amount`)
  if (!props.readOnly && hasExplicitCurrencyAmountInput(raw)) return toInputString(raw)
  return toInputString(chargeStates.value.find((s) => s.key === key)?.amount ?? '')
}

const salesTaxAmountFieldModelValue = (key: SalesTaxRowKey): string => {
  const raw = resolveFieldValue(`${key}_amount`)
  if (!props.readOnly && hasExplicitCurrencyAmountInput(raw)) return toInputString(raw)
  return toInputString(salesTaxStates.value.find((s) => s.key === key)?.amount ?? '')
}

const taxTotal = computed(() => {
  const states = salesTaxStates.value
  return roundCurrencyValue(states.reduce((sum, state) => sum + state.amount, 0))
})

// Calculate invoice total from post-holdback amount plus charges and taxes.
const totalBeforeHoldback = computed(() => {
  if (props.hideCharges) {
    return roundCurrencyValue(chargeAndTaxBase.value + taxTotal.value)
  } else {
    return roundCurrencyValue(chargeAndTaxBase.value + chargesTotal.value + taxTotal.value)
  }
})

// Calculate holdback amount as percentage of item totals after advance deduction (no charges/taxes).
const holdbackAmount = computed(() => {
  const holdbackPercentage = resolvedHoldbackPercent.value
  const holdbackBase = roundCurrencyValue(adjustedItemTotal.value)
  if (holdbackPercentage <= 0 || holdbackBase <= 0) {
    return 0
  }
  return roundCurrencyValue((holdbackBase * holdbackPercentage) / 100)
})

const adjustedItemTotalAfterDeductions = computed(() =>
  roundCurrencyValue(Math.max(0, adjustedItemTotal.value - holdbackAmount.value))
)

const chargeAndTaxBase = computed(() => roundCurrencyValue(adjustedItemTotalAfterDeductions.value))

/** Rebuild Configure COA item / charge / tax nets using the same single holdback $ as the invoice summary (proportional split). */
function rebuildConfigureCoaModalAmounts() {
  const grossRows = (props.itemBreakdownByAccount ?? []).map((r) => ({
    accountUuid: r.accountUuid || '',
    total: r.total,
  }))
  const { afterCostAdvance, afterTaxShare } = pipelineCoaModalItemAfterAdvances(
    grossRows,
    props.advancePaymentDeduction ?? 0,
    props.advanceAmountsByRow,
    totalAdvanceTaxCreditsSum.value,
    roundCurrencyValue
  )

  const itemGross = afterTaxShare.map((r) => roundCurrencyValue(Number(r.total) || 0))
  const chargeGross: number[] = []
  if (!props.hideCharges) {
    for (const row of chargeRows) {
      chargeGross.push(
        roundCurrencyValue(chargeStates.value.find((s) => s.key === row.key)?.amount ?? 0)
      )
    }
  }
  const taxGross = salesTaxRows.map((row) =>
    roundCurrencyValue(salesTaxStates.value.find((s) => s.key === row.key)?.amount ?? 0)
  )

  const H = roundCurrencyValue(holdbackAmount.value)
  const { holdAmounts: itemHoldAmounts, netAmounts: itemNetAmounts } = allocateGlobalHoldbackProportionally(
    itemGross,
    H,
    roundCurrencyValue
  )

  const nI = itemGross.length
  let k = 0
  const itemHolds = itemHoldAmounts.slice(k, k + nI)
  const itemNets = itemNetAmounts.slice(k, k + nI)
  k += nI
  const nC = chargeGross.length
  const chargeNets = chargeGross
  k += nC
  const nT = taxGross.length
  const taxNets = taxGross

  const cur = coaModalItemBreakdown.value
  coaModalItemBreakdown.value = itemNets.map((net, i) => ({
    accountUuid: cur[i]?.accountUuid ?? afterTaxShare[i]?.accountUuid ?? '',
    total: net,
  }))

  syncCoaModalItemDerivedAmounts(grossRows, afterCostAdvance, afterTaxShare, itemHolds, itemNets)

  coaModalChargeNetTotals.value = chargeNets

  coaModalTaxNetTotals.value = taxNets
}

function syncCoaModalChargeAndTaxHoldback() {
  if (!configureCOAModalOpen.value) return
  rebuildConfigureCoaModalAmounts()
}

/** Cost advance, tax share, allocated holdback $, and net per row (holdback matches global invoice holdback). */
function syncCoaModalItemDerivedAmounts(
  gross: { accountUuid: string; total: number }[],
  afterCostAdvance: { accountUuid: string; total: number }[],
  afterTaxShare: { accountUuid: string; total: number }[],
  itemHoldbacks: number[],
  itemNetsAfterHoldback: number[]
) {
  const n = gross.length
  const advAmt: number[] = []
  const taxShareAmt: number[] = []
  const hbAmt: number[] = []
  const displayTot: number[] = []
  const hbLabels: string[] = []
  const hbPct = resolvedHoldbackPercent.value

  for (let i = 0; i < n; i++) {
    const entered = roundCurrencyValue(parseNumericInput(gross[i]?.total))
    const afterCost = roundCurrencyValue(afterCostAdvance[i]?.total ?? 0)
    const afterTax = roundCurrencyValue(afterTaxShare[i]?.total ?? 0)
    const net = roundCurrencyValue(itemNetsAfterHoldback[i] ?? 0)
    const advD = roundCurrencyValue(Math.max(0, entered - afterCost))
    const taxD = roundCurrencyValue(Math.max(0, afterCost - afterTax))
    const hbD = roundCurrencyValue(Math.max(0, itemHoldbacks[i] ?? 0))
    advAmt.push(advD)
    taxShareAmt.push(taxD)
    hbAmt.push(hbD)
    displayTot.push(net)
    if (hbPct <= 0 || hbD <= 0) {
      hbLabels.push('')
      continue
    }

    hbLabels.push(`−${formatCurrency(hbD)}`)
  }

  coaModalItemAdvanceAmounts.value = advAmt
  coaModalItemAdvanceTaxShareAmounts.value = taxShareAmt
  coaModalItemHoldbackAmounts.value = hbAmt
  coaModalItemDisplayTotals.value = displayTot
  coaModalHoldbackLabels.value = hbLabels
}

const openConfigureCOAModal = () => {
  if (!corporationUuidForCOA.value) return
  chartOfAccountsStore.fetchAccounts(corporationUuidForCOA.value)
  coaModalInitialValues = {
    freight_charges_account_uuid: props.formData.freight_charges_account_uuid ?? '',
    packing_charges_account_uuid: props.formData.packing_charges_account_uuid ?? '',
    custom_duties_charges_account_uuid: props.formData.custom_duties_charges_account_uuid ?? '',
    other_charges_account_uuid: props.formData.other_charges_account_uuid ?? '',
    sales_tax_1_account_uuid: props.formData.sales_tax_1_account_uuid ?? '',
    sales_tax_2_account_uuid: props.formData.sales_tax_2_account_uuid ?? '',
  }
  Object.assign(coaModalState, coaModalInitialValues)
  configureCOAModalOpen.value = true
  rebuildConfigureCoaModalAmounts()
  coaModalItemBreakdownInitial = JSON.parse(JSON.stringify(coaModalItemBreakdown.value))
  coaModalItemAdvanceAmountsInitial = JSON.parse(JSON.stringify(coaModalItemAdvanceAmounts.value))
  coaModalItemAdvanceTaxShareAmountsInitial = JSON.parse(JSON.stringify(coaModalItemAdvanceTaxShareAmounts.value))
  coaModalItemHoldbackAmountsInitial = JSON.parse(JSON.stringify(coaModalItemHoldbackAmounts.value))
  coaModalItemDisplayTotalsInitial = JSON.parse(JSON.stringify(coaModalItemDisplayTotals.value))
  coaModalHoldbackLabelsInitial = JSON.parse(JSON.stringify(coaModalHoldbackLabels.value))
  coaModalChargeNetTotalsInitial = JSON.parse(JSON.stringify(coaModalChargeNetTotals.value))
  coaModalTaxNetTotalsInitial = JSON.parse(JSON.stringify(coaModalTaxNetTotals.value))
}

const closeConfigureCOAModal = () => {
  configureCOAModalOpen.value = false
}

/** Keep Configure COA item rows in sync when inputs change while the modal is open.
 * Avoid a single deep watch on an object that includes chargeStates/salesTaxStates: those computeds
 * return new array instances each read, which can thrash deep traversal and break parent modals (Vue patch / emitsOptions). */
function syncCoaModalItemRowsFromProps() {
  if (!configureCOAModalOpen.value) return
  rebuildConfigureCoaModalAmounts()
}

watch(
  () => props.advancePaymentDeduction ?? 0,
  () => syncCoaModalItemRowsFromProps()
)
watch(resolvedHoldbackPercent, () => syncCoaModalItemRowsFromProps())
watch(
  () => props.itemBreakdownByAccount,
  () => syncCoaModalItemRowsFromProps(),
  { deep: true }
)
watch(
  () => props.advanceAmountsByRow,
  () => syncCoaModalItemRowsFromProps(),
  { deep: true }
)
watch(
  () => props.advanceTaxCreditsByLine,
  () => syncCoaModalItemRowsFromProps(),
  { deep: true }
)
watch(
  [chargeStates, salesTaxStates, holdbackAmount, totalBeforeHoldback],
  () => {
    if (!configureCOAModalOpen.value) return
    rebuildConfigureCoaModalAmounts()
  },
  { deep: true }
)

const setItemBreakdownAccount = (index: number, accountUuid: string | null) => {
  const row = coaModalItemBreakdown.value[index]
  if (row) row.accountUuid = accountUuid ?? ''
}

const applyConfigureCOA = () => {
  emit('update', {
    freight_charges_account_uuid: coaModalState.freight_charges_account_uuid || '',
    packing_charges_account_uuid: coaModalState.packing_charges_account_uuid || '',
    custom_duties_charges_account_uuid: coaModalState.custom_duties_charges_account_uuid || '',
    other_charges_account_uuid: coaModalState.other_charges_account_uuid || '',
    sales_tax_1_account_uuid: coaModalState.sales_tax_1_account_uuid || '',
    sales_tax_2_account_uuid: coaModalState.sales_tax_2_account_uuid || '',
    item_breakdown_by_account: coaModalItemBreakdown.value.map((r) => ({ accountUuid: r.accountUuid, total: r.total })),
  })
  configureCOAModalOpen.value = false
}

const resetConfigureCOA = () => {
  Object.assign(coaModalState, coaModalInitialValues)
  coaModalItemBreakdown.value = coaModalItemBreakdownInitial.map((r) => ({ accountUuid: r.accountUuid, total: r.total }))
  coaModalItemAdvanceAmounts.value = JSON.parse(JSON.stringify(coaModalItemAdvanceAmountsInitial))
  coaModalItemAdvanceTaxShareAmounts.value = JSON.parse(JSON.stringify(coaModalItemAdvanceTaxShareAmountsInitial))
  coaModalItemHoldbackAmounts.value = JSON.parse(JSON.stringify(coaModalItemHoldbackAmountsInitial))
  coaModalItemDisplayTotals.value = JSON.parse(JSON.stringify(coaModalItemDisplayTotalsInitial))
  coaModalHoldbackLabels.value = JSON.parse(JSON.stringify(coaModalHoldbackLabelsInitial))
  coaModalChargeNetTotals.value = JSON.parse(JSON.stringify(coaModalChargeNetTotalsInitial))
  coaModalTaxNetTotals.value = JSON.parse(JSON.stringify(coaModalTaxNetTotalsInitial))
}

const finalTotal = computed(() => {
  // Holdback has already been deducted in chargeAndTaxBase.
  return roundCurrencyValue(Math.max(0, totalBeforeHoldback.value))
})

// Helper to parse financial_breakdown if it's a string
const getFinancialBreakdown = (): any => {
  const fb = props.formData.financial_breakdown
  if (!fb) return null
  
  // If it's already an object, return it
  if (typeof fb === 'object' && fb !== null) {
    return fb
  }
  
  // If it's a string, try to parse it
  if (typeof fb === 'string') {
    try {
      return JSON.parse(fb)
    } catch (e) {
      console.warn('[FinancialBreakdown] Failed to parse financial_breakdown string:', e)
      return null
    }
  }
  
  return null
}

// Display total: use manually edited value if allowEditTotal is true and value exists in formData, otherwise use calculated finalTotal
const displayTotal = computed(() => {
  if (props.allowEditTotal) {
    // For editable totals (Against PO), check financial_breakdown.totals.total_invoice_amount first
    // This is the partial payment amount saved in the DB
    const financialBreakdown = getFinancialBreakdown()
    let manualValue = null
    
    if (financialBreakdown?.totals) {
      // Priority order for Against PO invoices:
      // 1. total_invoice_amount (the partial payment amount)
      // 2. amount (fallback)
      // 3. totals[totalFieldName] (fallback)
      manualValue = financialBreakdown.totals.total_invoice_amount ?? 
                   financialBreakdown.totals.amount ?? 
                   financialBreakdown.totals[props.totalFieldName]
    }
    
    // Fallback to direct formData field
    if (manualValue === null || manualValue === undefined || manualValue === '') {
      manualValue = props.formData[props.totalFieldName]
    }
    
    // Return the value if it exists, otherwise return empty (0) to show empty field
    // This allows users to enter partial payment amounts
    if (manualValue !== null && manualValue !== undefined && manualValue !== '') {
      return parseNumericInput(manualValue)
    }
    // Return 0 (empty) instead of calculated total for Against PO invoices
    // This allows users to enter partial payment amounts
    return 0
  }
  // For non-editable totals (Direct Invoice, Advance Payment), use calculated total
  return finalTotal.value
})

const isRecalculating = ref(false)

const recalculateAndEmit = () => {
  if (isRecalculating.value) return
  isRecalculating.value = true

  try {
    const states = chargeStates.value
    const taxStates = salesTaxStates.value

    // Use computed holdbackAmount (calculated from percentage)
    const calculatedHoldbackAmount = holdbackAmount.value

    // If allowEditTotal is true, preserve manually edited total, otherwise use calculated total
    // For Against PO/CO invoices, use total_invoice_amount (partial payment amount) from DB
    let totalValue = finalTotal.value
    if (props.allowEditTotal) {
      const financialBreakdown = getFinancialBreakdown()
      let manualValue = null
      
      if (financialBreakdown?.totals) {
        // For Against PO/CO, prioritize total_invoice_amount (partial payment amount)
        manualValue = financialBreakdown.totals.total_invoice_amount ?? 
                     financialBreakdown.totals.amount ?? 
                     financialBreakdown.totals[props.totalFieldName]
      }
      
      // Fallback to direct formData field
      if (manualValue === null || manualValue === undefined || manualValue === '') {
        manualValue = props.formData[props.totalFieldName]
      }
      
      // If there's a manual value, use it; otherwise use calculated total
      // Special case: If manualValue is 0 but there's an item total, recalculate
      // This handles the case where we clear the amount to force recalculation
      const manualValueNum = parseNumericInput(manualValue)
      if (manualValue !== null && manualValue !== undefined && manualValue !== '' && 
          !(manualValueNum === 0 && props.itemTotal > 0)) {
        // Use manual value
        totalValue = manualValueNum
      } else {
        // No manual value OR manual value is 0 with items - use calculated total
        // This ensures the total invoice amount updates automatically for both PO and CO invoices
        totalValue = finalTotal.value
      }
    }

    const updates: Record<string, any> = {
      item_total: roundCurrencyValue(props.itemTotal),
      charges_total: props.hideCharges ? 0 : chargesTotal.value,
      tax_total: taxTotal.value,
      [props.totalFieldName]: roundCurrencyValue(totalValue),
    }

    // Update charge amounts, percentages, and taxable flags (calculated from percentages) - only if charges are not hidden
    if (!props.hideCharges) {
    states.forEach((state) => {
      updates[`${state.key}_charges_amount`] = state.amount
      // Only update percentage and taxable if they have values (don't overwrite with undefined)
      // This preserves existing values when recalculating
      if (state.percentage !== undefined && state.percentage !== null) {
        updates[`${state.key}_charges_percentage`] = state.percentage
      }
      if (state.taxable !== undefined && state.taxable !== null) {
        updates[`${state.key}_charges_taxable`] = state.taxable
      }
    })
    }

    // Update sales tax amounts and percentages (keeps %-from-$ in sync when recalculating)
    taxStates.forEach((state) => {
      updates[`${state.key}_amount`] = state.amount
      if (state.percentage !== undefined && state.percentage !== null) {
        updates[`${state.key}_percentage`] = state.percentage
      }
    })

    // Include financial_breakdown for saving
    const chargesBreakdown = props.hideCharges 
      ? {
          freight: { percentage: null, amount: null, taxable: false },
          packing: { percentage: null, amount: null, taxable: false },
          custom_duties: { percentage: null, amount: null, taxable: false },
          other: { percentage: null, amount: null, taxable: false },
        }
      : states.reduce(
      (acc, state) => {
        acc[state.key] = {
          percentage: state.percentage,
          amount: state.amount,
          taxable: state.taxable,
        }
        return acc
      },
      {} as Record<string, { percentage: number | null; amount: number | null; taxable: boolean }>
    )

    const salesTaxesBreakdown = taxStates.reduce(
      (acc, state) => {
        acc[state.key] = {
          percentage: state.percentage,
          amount: state.amount,
        }
        return acc
      },
      {} as Record<string, { percentage: number | null; amount: number | null }>
    )

    updates.financial_breakdown = {
      charges: chargesBreakdown,
      sales_taxes: salesTaxesBreakdown,
      totals: {
        item_total: roundCurrencyValue(props.itemTotal), // Original item total (before deductions) for record keeping
        charges_total: props.hideCharges ? 0 : chargesTotal.value,
        tax_total: taxTotal.value,
        holdback_amount: roundCurrencyValue(calculatedHoldbackAmount),
        // Always set amount and total_invoice_amount to the final total (after deductions, charges, taxes)
        // This ensures the amount field in the database matches what's displayed in FinancialBreakdown
        amount: roundCurrencyValue(totalValue),
        total_invoice_amount: roundCurrencyValue(totalValue),
        // Also set the totalFieldName for backward compatibility
        [props.totalFieldName]: roundCurrencyValue(totalValue),
      },
    }

    emit('update', updates)
  } finally {
    // Release after the current stack so a follow-up sync watch (e.g. itemTotal) is not dropped;
    // setTimeout(0) runs too late for flushPromises / tight parent updates.
    queueMicrotask(() => {
      isRecalculating.value = false
    })
  }
}

const handleChargePercentageChange = (key: ChargeRowKey, value: string | number) => {
  if (props.readOnly) return
  
  const percentage = clampToNonNegative(roundTo(parseNumericInput(value), 4))
  // Use post-holdback total amount for charge amount calculation.
  const amount = roundCurrencyValue(chargeAndTaxBase.value * (percentage / 100))
  
  const updates: Record<string, any> = {
    [`${key}_charges_percentage`]: percentage,
    [`${key}_charges_amount`]: amount,
  }
  
  emit('update', updates)
  // Recalculate after a short delay to ensure form data is updated
  setTimeout(() => recalculateAndEmit(), 0)
}

const handleChargeAmountChange = (key: ChargeRowKey, value: string | number) => {
  if (props.readOnly) return
  
  const amount = clampToNonNegative(roundCurrencyValue(parseNumericInput(value)))
  // Extra precision avoids round-trip drift vs base × % (see buildChargeStates).
  const percentage =
    chargeAndTaxBase.value > 0 ? roundTo((amount / chargeAndTaxBase.value) * 100, 6) : 0
  
  const updates: Record<string, any> = {
    [`${key}_charges_amount`]: amount,
    [`${key}_charges_percentage`]: percentage,
  }
  
  emit('update', updates)
  setTimeout(() => recalculateAndEmit(), 0)
}

const handleChargeTaxableChange = (key: ChargeRowKey, value: boolean) => {
  if (props.readOnly) return
  
  const updates: Record<string, any> = {
    [`${key}_charges_taxable`]: value,
  }
  
  emit('update', updates)
  setTimeout(() => recalculateAndEmit(), 0)
}

const handleSalesTaxPercentageChange = (key: SalesTaxRowKey, value: string | number) => {
  if (props.readOnly) return

  const percentage = clampToNonNegative(roundTo(parseNumericInput(value), 4))
  // Match handleChargePercentageChange: emit $ in the same update. Otherwise a stale
  // `sales_tax_*_amount` in formData stays "explicit" and buildSalesTaxStates amount-led
  // logic overwrites the % the user just typed.
  const amount = roundCurrencyValue(taxableBase.value * (percentage / 100))

  const updates: Record<string, any> = {
    [`${key}_percentage`]: percentage,
    [`${key}_amount`]: amount,
  }

  emit('update', updates)
  setTimeout(() => recalculateAndEmit(), 0)
}

const handleSalesTaxAmountChange = (key: SalesTaxRowKey, value: string | number) => {
  if (props.readOnly) return
  
  const amount = clampToNonNegative(roundCurrencyValue(parseNumericInput(value)))
  const percentage = taxableBase.value > 0 ? roundTo((amount / taxableBase.value) * 100, 6) : 0
  
  const updates: Record<string, any> = {
    [`${key}_amount`]: amount,
    [`${key}_percentage`]: percentage,
  }
  
  emit('update', updates)
  setTimeout(() => recalculateAndEmit(), 0)
}


const handleTotalAmountChange = (value: string | number) => {
  if (props.readOnly || !props.allowEditTotal) return
  
  const amount = roundCurrencyValue(parseNumericInput(value))
  
  const updates: Record<string, any> = {
    [props.totalFieldName]: amount,
  }
  
  // Also update the amount field if totalFieldName is 'amount'
  if (props.totalFieldName === 'amount') {
    updates.amount = amount
  }
  
  // For Against PO invoices, also update financial_breakdown.totals.total_invoice_amount
  // This is the partial payment amount that should be saved to the DB
  const financialBreakdown = getFinancialBreakdown()
  if (financialBreakdown) {
    if (!updates.financial_breakdown) {
      updates.financial_breakdown = JSON.parse(JSON.stringify(financialBreakdown))
    }
    if (!updates.financial_breakdown.totals) {
      updates.financial_breakdown.totals = {}
    }
    // Save the partial payment amount to total_invoice_amount
    updates.financial_breakdown.totals.total_invoice_amount = amount
    // Also update amount for consistency
    updates.financial_breakdown.totals.amount = amount
  } else {
    // If no financial_breakdown exists, create it
    updates.financial_breakdown = {
      totals: {
        total_invoice_amount: amount,
        amount: amount,
      }
    }
  }
  
  emit('update', updates)
}

// Watch itemTotal to recalculate when it changes
watch(
  () => props.itemTotal,
  (newTotal, oldTotal) => {
    // Only recalculate if the value actually changed
    if (newTotal !== oldTotal) {
      // Recalculate amounts based on percentages when itemTotal changes
      recalculateAndEmit()
    }
  },
  { immediate: true }
)

// Watch formData changes to recalculate (for when percentages change externally)
watch(
  () => [
    ...chargeRows.map((row) => resolveFieldValue(`${row.key}_charges_percentage`)),
    ...chargeRows.map((row) => resolveFieldValue(`${row.key}_charges_taxable`)),
    ...salesTaxRows.map((row) => resolveFieldValue(`${row.key}_percentage`)),
    resolvedHoldbackPercent.value, // Watch holdback percentage changes
  ],
  () => {
    recalculateAndEmit()
  },
  { deep: false }
)

onMounted(() => {
  recalculateAndEmit()
})
</script>

