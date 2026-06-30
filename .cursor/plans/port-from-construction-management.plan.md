---
name: Port from construction-management
overview: "Master tracker for porting June 2026 construction-management changes into construction-sql (MSSQL)."
status: in_progress
todos:
  - id: cursor-setup
    content: ".cursor/ README, plans, rules"
    status: completed
  - id: schema-june
    content: "Prisma migrations: currency, approval, gl_account_uuid, estimates"
    status: in_progress
  - id: currency-port
    content: "Currency conversion stack"
    status: in_progress
  - id: payables-port
    content: "Advance/holdback/exceeded-qty fixes"
    status: pending
  - id: reports-port
    content: "materialBalanceToBeInvoiced, budget, AP summary"
    status: pending
  - id: print-pages
    content: "CO and vendor-invoice print routes"
    status: pending
  - id: tests-qa
    content: "Unit tests and npm test"
    status: pending
isProject: true
---

# Port construction-management → construction-sql

Reference: `../construction-management` (Supabase). Target: this repo (Prisma + MSSQL).

**Skipped:** EntityUsage sync, webhooks, Supabase auth.

See attached implementation plan in Cursor for full file lists and verification checklist.
