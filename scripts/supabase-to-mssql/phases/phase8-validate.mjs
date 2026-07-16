import { pgQuery } from '../db.mjs'
import { summarizeMisses } from '../lookups.mjs'
import { countMssql } from '../upsert.mjs'
import { log, warn } from '../utils.mjs'

const COUNT_TABLES = [
  'freight',
  'approval_checks',
  'location',
  'po_instructions',
  'reasons',
  'project_types',
  'service_types',
  'terms_and_conditions',
  'cost_code_divisions',
  'cost_code_configurations',
  'item_types',
  'cost_code_preferred_items',
  'customers',
  'projects',
  'project_addresses',
  'project_location_breakdowns',
  'project_documents',
  'special_instructions',
  'estimates',
  'estimate_line_items',
  'estimate_material_items',
  'purchase_order_forms',
  'purchase_order_items_list',
  'change_orders',
  'change_order_items_list',
  'stock_receipt_notes',
  'receipt_note_items',
  'stock_return_notes',
  'return_note_items',
  'vendor_invoices',
  'po_financial_charges',
  'co_financial_charges',
  'vi_financial_charges',
  'estimate_attachments',
]

/**
 * @param {any} ctx
 */
export async function runPhase8Validate(ctx) {
  const { pg, mssql, lookups } = ctx
  log('=== Phase 8: validation report ===')

  console.log('\nTable counts (Postgres public.* vs MS SQL dbo.*):')
  console.log('─'.repeat(72))
  console.log(`${'table'.padEnd(40)} ${'pg'.padStart(10)} ${'mssql'.padStart(10)}`)
  console.log('─'.repeat(72))

  for (const table of COUNT_TABLES) {
    let pgCount = '?'
    let msCount = '?'
    try {
      const rows = await pgQuery(pg, `select count(*)::int as c from public.${table}`)
      pgCount = String(rows[0]?.c ?? 0)
    }
    catch {
      pgCount = 'n/a'
    }
    try {
      msCount = String(await countMssql(mssql, table))
    }
    catch {
      msCount = 'n/a'
    }
    const mark = pgCount !== 'n/a' && msCount !== 'n/a' && pgCount !== msCount ? ' *' : ''
    console.log(`${table.padEnd(40)} ${String(pgCount).padStart(10)} ${String(msCount).padStart(10)}${mark}`)
  }
  console.log('─'.repeat(72))
  console.log('* = count mismatch (expected when corp filter / remaps / skipped orphans)\n')

  const misses = summarizeMisses(lookups)
  if (Object.keys(misses).length) {
    warn(`Remap misses by kind: ${JSON.stringify(misses)} (total ${lookups.misses.length})`)
    const sample = lookups.misses.slice(0, 20)
    for (const m of sample) warn(`  miss ${m.kind}: ${m.value}`)
    if (lookups.misses.length > 20) warn(`  … ${lookups.misses.length - 20} more`)
  }
  else {
    log('No remap misses recorded')
  }

  // Orphan samples
  try {
    const orphans = await mssql.request().query(`
      SELECT TOP 5 i.uuid
      FROM dbo.purchase_order_items_list i
      LEFT JOIN dbo.purchase_order_forms p ON CAST(p.uuid AS NVARCHAR(100)) = CAST(i.purchase_order_uuid AS NVARCHAR(100))
      WHERE p.uuid IS NULL
    `)
    if (orphans.recordset.length) {
      warn(`Orphan PO items (sample): ${orphans.recordset.map((r) => r.uuid).join(', ')}`)
    }
    else {
      log('No orphan PO items detected (sample check)')
    }
  }
  catch (e) {
    warn(`Orphan check skipped: ${e.message}`)
  }

  log('Phase 8 complete. Spot-check one remapped PO in the app (charges from child tables).')
}
