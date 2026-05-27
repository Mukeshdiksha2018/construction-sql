import { describe, expect, it } from 'vitest'
import {
  mapPOInstructionRow,
  parsePOInstructionBody,
  parsePOInstructionUpdateBody,
} from '../../../server/utils/po-instructions'

describe('po-instructions utilities', () => {
  it('maps MSSQL row to API po-instruction shape', () => {
    const poInstruction = mapPOInstructionRow({
      id: 10n,
      uuid: 'A1B2C3D4-E5F6-7890-ABCD-EF1234567890',
      corporation_uuid: 'corp-1',
      po_instruction_name: 'Invoice Required',
      instruction: 'Attach invoice before submitting.',
      status: 'ACTIVE',
      created_at: new Date('2026-01-01T00:00:00.000Z'),
      updated_at: new Date('2026-01-02T00:00:00.000Z'),
      created_by: 'user-1',
      updated_by: 'user-2',
    })

    expect(poInstruction.uuid).toBe('a1b2c3d4-e5f6-7890-abcd-ef1234567890')
    expect(poInstruction.status).toBe('ACTIVE')
    expect(poInstruction.po_instruction_name).toBe('Invoice Required')
  })

  it('normalizes unknown status to ACTIVE', () => {
    const poInstruction = mapPOInstructionRow({
      id: 11n,
      uuid: 'A1B2C3D4-E5F6-7890-ABCD-EF1234567891',
      corporation_uuid: 'corp-1',
      po_instruction_name: 'Test',
      instruction: 'Test',
      status: 'OTHER',
      created_at: new Date('2026-01-01T00:00:00.000Z'),
      updated_at: new Date('2026-01-02T00:00:00.000Z'),
      created_by: null,
      updated_by: null,
    })

    expect(poInstruction.status).toBe('ACTIVE')
  })

  it('validates create body', () => {
    expect(parsePOInstructionBody({
      corporation_uuid: 'corp-1',
      po_instruction_name: 'Instruction A',
      instruction: 'Do this first',
      status: 'INACTIVE',
    })).toEqual({
      corporation_uuid: 'corp-1',
      po_instruction_name: 'Instruction A',
      instruction: 'Do this first',
      status: 'INACTIVE',
    })
  })

  it('rejects create body without corporation uuid', () => {
    expect(() => parsePOInstructionBody({
      corporation_uuid: '  ',
      po_instruction_name: 'Instruction A',
      instruction: 'Do this first',
    })).toThrowError(/Corporation UUID is required/)
  })

  it('rejects create body with invalid status', () => {
    expect(() => parsePOInstructionBody({
      corporation_uuid: 'corp-1',
      po_instruction_name: 'Instruction A',
      instruction: 'Do this first',
      status: 'PENDING',
    })).toThrowError(/Status must be either ACTIVE or INACTIVE/)
  })

  it('validates update body requires valid status', () => {
    expect(() => parsePOInstructionUpdateBody({
      po_instruction_name: 'Instruction A',
      instruction: 'Do this first',
      status: 'PENDING',
    })).toThrowError(/Status must be either ACTIVE or INACTIVE/)

    expect(parsePOInstructionUpdateBody({
      po_instruction_name: 'Instruction A',
      instruction: 'Do this first',
      status: 'ACTIVE',
    })).toEqual({
      po_instruction_name: 'Instruction A',
      instruction: 'Do this first',
      status: 'ACTIVE',
    })
  })
})
