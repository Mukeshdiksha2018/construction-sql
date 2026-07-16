#!/usr/bin/env node
/**
 * Supabase (Postgres) → MS SQL upsert sync CLI.
 *
 * Usage:
 *   npm run db:sync:supabase
 *   npm run db:sync:supabase -- --dry-run
 *   npm run db:sync:supabase -- --rest
 *   npm run db:sync:supabase -- --phase=masters,projects
 *   npm run db:sync:supabase -- --corporation=<local-uuid-or-nimble-corp-id>
 *   npm run db:sync:supabase -- --strict
 */
import { createMssqlPool, createSourceClient } from './db.mjs'
import { assertEnv, loadEnvFile, parseCliArgs } from './env.mjs'
import { loadLookups, resolveCorporationFilter, summarizeMisses } from './lookups.mjs'
import { runPhase1Masters } from './phases/phase1-masters.mjs'
import { runPhase2Projects } from './phases/phase2-projects.mjs'
import { runPhase3Estimates } from './phases/phase3-estimates.mjs'
import { runPhase4PurchaseOrders } from './phases/phase4-pos.mjs'
import { runPhase5ChangeOrders } from './phases/phase5-cos.mjs'
import { runPhase6Inventory } from './phases/phase6-inventory.mjs'
import { runPhase7VendorInvoices } from './phases/phase7-invoices.mjs'
import { runPhase8Validate } from './phases/phase8-validate.mjs'
import { elapsed, log, warn } from './utils.mjs'

const PHASES = {
  masters: runPhase1Masters,
  projects: runPhase2Projects,
  estimates: runPhase3Estimates,
  pos: runPhase4PurchaseOrders,
  cos: runPhase5ChangeOrders,
  inventory: runPhase6Inventory,
  invoices: runPhase7VendorInvoices,
  validate: runPhase8Validate,
}

const DEFAULT_ORDER = ['masters', 'projects', 'estimates', 'pos', 'cos', 'inventory', 'invoices', 'validate']

async function main() {
  loadEnvFile()
  const opts = parseCliArgs()

  if (opts.help) {
    printHelp()
    return
  }

  const { pgUrl, rest, mssqlConfig } = assertEnv()
  log(`Connecting Supabase source (transport=${opts.transport})…`)
  const pg = await createSourceClient({
    pgUrl,
    supabaseUrl: rest.url,
    serviceRoleKey: rest.serviceRoleKey,
    transport: opts.transport,
  })
  log(`Source ready (${pg.kind})`)
  log(`Connecting MS SQL (${mssqlConfig.server}/${mssqlConfig.database})…`)
  const mssql = await createMssqlPool(mssqlConfig)

  try {
    log('Loading Nimble lookup maps from skipped Supabase tables…')
    const lookups = await loadLookups(pg, { strict: opts.strict })
    const corpFilter = resolveCorporationFilter(lookups, opts.corporation)
    if (corpFilter) {
      log(`Corporation filter localUuids=${corpFilter.localUuids.join(',')} nimble=${corpFilter.nimbleId}`)
    }
    if (opts.dryRun) log('DRY-RUN: no MS SQL writes will be committed for upsert/replace (counts still computed)')

    const selected = opts.phases?.length
      ? opts.phases
      : DEFAULT_ORDER

    /** @type {any} */
    const ctx = {
      pg,
      mssql,
      lookups,
      dryRun: opts.dryRun,
      strict: opts.strict,
      corpFilter,
    }

    const t0 = Date.now()
    for (const name of selected) {
      const fn = PHASES[name]
      if (!fn) {
        warn(`Unknown phase "${name}" — skip`)
        continue
      }
      const start = Date.now()
      await fn(ctx)
      log(`phase ${name} done in ${elapsed(Date.now() - start)}`)
    }

    const miss = summarizeMisses(lookups)
    log(`Finished in ${elapsed(Date.now() - t0)}. Remap miss kinds: ${JSON.stringify(miss)}`)
  }
  finally {
    await pg.end().catch(() => {})
    await mssql.close().catch(() => {})
  }
}

function printHelp() {
  console.log(`
Supabase → MS SQL on-demand upsert sync

Source (pick one path):
  Postgres:  NUXT_SUPABASE_DATABASE_URL
             (use Session pooler URI if direct db.* is IPv6-only)
  REST:      NUXT_SUPABASE_URL + NUXT_SUPABASE_SERVICE_ROLE_KEY
             (--rest or NUXT_SUPABASE_SYNC_TRANSPORT=rest)
             Use this when IPv4 DB / pooler is unavailable — HTTPS works.

Also required:
  NUXT_MSSQL_CONNECTION_STRING or NUXT_CONSTRUCTION_ACCOUNTING_CONNECTION_STRING

Flags:
  --dry-run                 Count/plan only (no writes)
  --strict                  Fail on Nimble remap misses
  --rest / --transport=rest Force PostgREST HTTPS (no Postgres socket)
  --phase=a,b,c             Subset: masters,projects,estimates,pos,cos,inventory,invoices,validate
  --corporation=<id>        Filter by properties.uuid or nimble_corporation_id

Examples:
  npm run db:sync:supabase -- --rest --dry-run
  npm run db:sync:supabase -- --phase=masters,projects
  npm run db:sync:supabase -- --corporation=C6B98A4ACF2546974D533674FDD8360D0000
`)
}

main().catch((err) => {
  console.error('[sync:fatal]', err)
  process.exit(1)
})
