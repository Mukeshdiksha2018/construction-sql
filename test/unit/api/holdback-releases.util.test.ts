import { beforeEach, describe, expect, it, vi } from 'vitest'

describe('listHoldbackReleases util', () => {
  const mockFindManyHb = vi.fn()
  const mockFindManyVi = vi.fn()

  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
    vi.doMock('../../../server/utils/prisma', () => ({
      getPrisma: () => ({
        holdbackCostCode: { findMany: mockFindManyHb },
        vendorInvoice: { findMany: mockFindManyVi },
      }),
    }))
  })

  it('filters to active invoices and release_amount > 0', async () => {
    mockFindManyHb.mockResolvedValue([
      {
        id: 1n,
        uuid: 'r1',
        vendor_invoice_uuid: 'active-inv',
        release_amount: 50,
        total_amount: 100,
        retainage_amount: 50,
        metadata: '{}',
      },
      {
        id: 2n,
        uuid: 'r2',
        vendor_invoice_uuid: 'inactive-inv',
        release_amount: 25,
        total_amount: 25,
        retainage_amount: 0,
        metadata: null,
      },
    ])
    mockFindManyVi.mockResolvedValue([{ uuid: 'active-inv' }])

    const { listHoldbackReleases } = await import(
      '../../../server/utils/holdbackReleases'
    )
    const rows = await listHoldbackReleases({ vendor_invoice_uuid: 'active-inv' })

    expect(mockFindManyHb).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          is_active: true,
          release_amount: { gt: 0 },
          vendor_invoice_uuid: 'active-inv',
        }),
      }),
    )
    expect(rows).toHaveLength(1)
    expect(rows[0]).toMatchObject({
      uuid: 'r1',
      release_amount: 50,
      vendor_invoice_uuid: 'active-inv',
    })
  })

  it('excludes current invoice when exclude_current_invoice is set', async () => {
    mockFindManyHb.mockResolvedValue([])
    mockFindManyVi.mockResolvedValue([])

    const { listHoldbackReleases } = await import(
      '../../../server/utils/holdbackReleases'
    )
    await listHoldbackReleases({
      purchase_order_uuid: 'po-1',
      vendor_invoice_uuid: 'inv-edit',
      exclude_current_invoice: true,
    })

    expect(mockFindManyHb).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          purchase_order_uuid: 'po-1',
          vendor_invoice_uuid: { not: 'inv-edit' },
        }),
      }),
    )
  })
})
