import { describe, expect, it } from 'vitest'
import {
  mapApprovalCheckRow,
  parseApprovalCheckBody,
  parseApprovalCheckUpdateBody,
} from '../../../server/utils/approval-checks'

describe('approval-check utilities', () => {
  it('maps MSSQL row to API approval-check shape', () => {
    const approvalCheck = mapApprovalCheckRow({
      id: 1n,
      uuid: 'A1B2C3D4-E5F6-7890-ABCD-EF1234567890',
      approval_check: 'Manager Review',
      description: 'Threshold check',
      active: true,
      created_at: new Date('2026-01-01T00:00:00.000Z'),
      updated_at: new Date('2026-01-02T00:00:00.000Z'),
      created_by: 'user-1',
      updated_by: 'user-1',
    })

    expect(approvalCheck.uuid).toBe('a1b2c3d4-e5f6-7890-abcd-ef1234567890')
    expect(approvalCheck.approval_check).toBe('Manager Review')
    expect(approvalCheck.active).toBe(true)
  })

  it('validates create body', () => {
    expect(parseApprovalCheckBody({ approval_check: 'CFO', description: 'Required', active: true })).toEqual({
      approval_check: 'CFO',
      description: 'Required',
      active: true,
    })
  })

  it('rejects create body without approval_check', () => {
    expect(() => parseApprovalCheckBody({ approval_check: '  ' })).toThrowError(/Approval Check is required/)
  })

  it('validates update body requires boolean active', () => {
    expect(() => parseApprovalCheckUpdateBody({ approval_check: 'Ops', active: 'yes' })).toThrowError(/boolean/)
    expect(parseApprovalCheckUpdateBody({ approval_check: 'Ops', active: false })).toEqual({
      approval_check: 'Ops',
      description: null,
      active: false,
    })
  })
})
