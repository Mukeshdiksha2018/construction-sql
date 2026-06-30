---
name: Nimble EntityUsage Sync
overview: "Skipped for construction-sql MSSQL deployment — was implemented in construction-management via PostgreSQL pgmq + DB triggers."
status: skipped
todos: []
isProject: true
---

# Nimble EntityUsage dependency sync

**Status: skipped** for this MSSQL deployment (per project scope).

Implemented in construction-management at:
- `database/migrations/202606211200_nimble_master_data_sync_queue.sql`
- `server/utils/nimbleMasterDataSync/`
- `server/api/nimble/entity-usage-sync/process-queue.post.ts`

Do not port pgmq, webhook sync logs, or EntityUsage queue to construction-sql.
