import type { TableColumn } from '@nuxt/ui'

/** Column ids for the Create PO qty group (must stay adjacent in the table). */
export const CREATE_PO_QTY_COLUMN_IDS = ['budget_qty', 'po_qty', 'pending_qty'] as const

export function getCreatePoQtyColumnIndex(columns: TableColumn<any>[]): number {
  return columns.findIndex((col) => {
    const id = (col as { id?: string }).id || (col as { accessorKey?: string }).accessorKey
    return id === CREATE_PO_QTY_COLUMN_IDS[0]
  })
}

export function createPoQtyColumnsAreGrouped(columns: TableColumn<any>[]): boolean {
  const start = getCreatePoQtyColumnIndex(columns)
  if (start < 0) return false
  for (let i = 0; i < CREATE_PO_QTY_COLUMN_IDS.length; i++) {
    const col = columns[start + i] as { id?: string; accessorKey?: string } | undefined
    const id = col?.id || col?.accessorKey
    if (id !== CREATE_PO_QTY_COLUMN_IDS[i]) return false
  }
  return true
}
