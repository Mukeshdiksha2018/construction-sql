import { computed, ref, type Ref } from 'vue'
import { getPaginationRowModel } from '@tanstack/vue-table'

export function useTableStandard() {
  const pagination = ref({
    pageIndex: 0,
    pageSize: 10,
  })

  const paginationOptions = ref({
    getPaginationRowModel: getPaginationRowModel(),
  })

  const pageSizeOptions = [
    { label: '10 per page', value: 10 },
    { label: '25 per page', value: 25 },
    { label: '50 per page', value: 50 },
    { label: '100 per page', value: 100 },
  ]

  function updatePageSize(table: { tableApi?: { setPageSize: (size: number) => void } } | null) {
    if (table?.tableApi) {
      table.tableApi.setPageSize(pagination.value.pageSize)
    }
  }

  function shouldShowPagination(dataLength: Ref<number> | number) {
    const length = typeof dataLength === 'number' ? dataLength : dataLength.value
    return computed(() => length > 10)
  }

  function getPaginationProps(table: { tableApi?: {
    getState: () => { pagination: { pageIndex: number, pageSize: number } }
    getFilteredRowModel: () => { rows: unknown[] }
    setPageIndex: (index: number) => void
  } } | null) {
    return {
      'default-page': (table?.tableApi?.getState().pagination.pageIndex || 0) + 1,
      'items-per-page': table?.tableApi?.getState().pagination.pageSize,
      total: table?.tableApi?.getFilteredRowModel().rows.length,
      'onUpdate:page': (p: number) => table?.tableApi?.setPageIndex(p - 1),
    }
  }

  function getPageInfo(table: { tableApi?: {
    getState: () => { pagination: { pageIndex: number, pageSize: number } }
    getFilteredRowModel: () => { rows: unknown[] }
  } } | null, dataType: string = 'items') {
    return computed(() => {
      const pageIndex = table?.tableApi?.getState().pagination.pageIndex || 0
      const pageSize = table?.tableApi?.getState().pagination.pageSize || 10
      const total = table?.tableApi?.getFilteredRowModel().rows.length || 0
      const start = total ? pageIndex * pageSize + 1 : 0
      const end = Math.min((pageIndex + 1) * pageSize, total)
      return `Showing ${start} to ${end} of ${total} ${dataType}`
    })
  }

  return {
    pagination,
    paginationOptions,
    pageSizeOptions,
    updatePageSize,
    getPaginationProps,
    getPageInfo,
    shouldShowPagination,
  }
}
