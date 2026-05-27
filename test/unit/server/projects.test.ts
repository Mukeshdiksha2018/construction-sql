import { describe, expect, it } from 'vitest'
import { toProjectApiModel } from '../../../server/utils/projects'

const baseRow = {
  id: 1,
  uuid: 'aaaa-bbbb',
  corporation_uuid: 'corp-1',
  project_name: 'Test Project',
  project_id: 'PRO-100001',
  project_type_uuid: 'pt-uuid',
  service_type_uuid: 'st-uuid',
  project_description: 'A description',
  estimated_amount: '102900.00',
  area_sq_ft: '500.00',
  no_of_rooms: 10,
  contingency_percentage: '10.00',
  customer_name: 'John Doe',
  customer_uuid: 'cust-uuid',
  project_status: 'Pending',
  project_start_date: new Date('2026-05-06T18:30:00.000Z'),
  project_estimated_completion_date: new Date('2027-05-30T18:30:00.000Z'),
  only_total: 0,
  enable_labor: 1,
  enable_material: 1,
  attachments: '[]',
  enable_location_wise: 1,
  location_basis_area: 1,
  location_basis_no_of_rooms: 0,
  is_active: 1,
}

describe('toProjectApiModel', () => {
  it('maps all core fields correctly', () => {
    const model = toProjectApiModel(baseRow)

    expect(model.id).toBe(1)
    expect(model.uuid).toBe('aaaa-bbbb')
    expect(model.corporation_uuid).toBe('corp-1')
    expect(model.project_name).toBe('Test Project')
    expect(model.project_id).toBe('PRO-100001')
    expect(model.project_type_uuid).toBe('pt-uuid')
    expect(model.service_type_uuid).toBe('st-uuid')
    expect(model.project_description).toBe('A description')
  })

  it('converts numeric strings to numbers', () => {
    const model = toProjectApiModel(baseRow)

    expect(model.estimated_amount).toBe(102900)
    expect(model.area_sq_ft).toBe(500)
    expect(model.no_of_rooms).toBe(10)
    expect(model.contingency_percentage).toBe(10)
  })

  it('converts bit values to booleans', () => {
    const model = toProjectApiModel(baseRow)

    expect(model.only_total).toBe(false)
    expect(model.enable_labor).toBe(true)
    expect(model.enable_material).toBe(true)
    expect(model.enable_location_wise).toBe(true)
    expect(model.location_basis_area).toBe(true)
    expect(model.location_basis_no_of_rooms).toBe(false)
    expect(model.is_active).toBe(true)
  })

  it('parses ISO dates from Date objects', () => {
    const model = toProjectApiModel(baseRow)

    expect(model.project_start_date).toBe('2026-05-06T18:30:00.000Z')
    expect(model.project_estimated_completion_date).toBe('2027-05-30T18:30:00.000Z')
  })

  it('parses ISO dates from date strings', () => {
    const model = toProjectApiModel({
      ...baseRow,
      project_start_date: '2026-05-06T18:30:00.000Z',
    })
    expect(model.project_start_date).toBe('2026-05-06T18:30:00.000Z')
  })

  it('returns null for null dates', () => {
    const model = toProjectApiModel({
      ...baseRow,
      project_start_date: null,
      project_estimated_completion_date: null,
    })
    expect(model.project_start_date).toBeNull()
    expect(model.project_estimated_completion_date).toBeNull()
  })

  it('returns null for null nullable fields', () => {
    const model = toProjectApiModel({
      ...baseRow,
      project_type_uuid: null,
      service_type_uuid: null,
      customer_uuid: null,
      customer_name: null,
      project_description: null,
      area_sq_ft: null,
      no_of_rooms: null,
      contingency_percentage: null,
    })

    expect(model.project_type_uuid).toBeNull()
    expect(model.service_type_uuid).toBeNull()
    expect(model.customer_uuid).toBeNull()
    expect(model.customer_name).toBeNull()
    expect(model.project_description).toBeNull()
    expect(model.area_sq_ft).toBeNull()
    expect(model.no_of_rooms).toBeNull()
    expect(model.contingency_percentage).toBeNull()
  })

  it('parses JSON attachments string to array', () => {
    const doc = { uuid: 'doc-1', file_url: 'https://example.com/file.pdf', document_name: 'test.pdf' }
    const model = toProjectApiModel({ ...baseRow, attachments: JSON.stringify([doc]) })
    expect(Array.isArray(model.attachments)).toBe(true)
    expect(model.attachments).toHaveLength(1)
  })

  it('defaults attachments to empty array on invalid JSON', () => {
    const model = toProjectApiModel({ ...baseRow, attachments: 'not-json' })
    expect(model.attachments).toEqual([])
  })

  it('defaults project_status to Pending when missing', () => {
    const model = toProjectApiModel({ ...baseRow, project_status: null })
    expect(model.project_status).toBe('Pending')
  })

  it('defaults id to 0 when missing', () => {
    const model = toProjectApiModel({ ...baseRow, id: undefined })
    expect(model.id).toBe(0)
  })
})
