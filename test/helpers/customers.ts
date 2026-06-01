export function makeCustomerRow(overrides: Record<string, unknown> = {}) {
  const now = new Date('2026-05-30T12:00:00.000Z')
  return {
    id: 1n,
    uuid: 'CUST-UUID-1',
    created_at: now,
    updated_at: now,
    corporation_uuid: 'CORP-UUID-1',
    project_uuid: null as string | null,
    customer_address: '123 Main St',
    customer_city: 'Austin',
    customer_state: 'TX',
    customer_country: 'US',
    customer_zip: '78701',
    customer_phone: '555-0100',
    customer_email: 'jane@example.com',
    company_name: 'Acme Co',
    salutation: 'Ms.',
    first_name: 'Jane',
    middle_name: '',
    last_name: 'Doe',
    profile_image_url: '',
    is_active: true,
    nimble_customer_id: null as string | null,
    created_by: 'user-1',
    updated_by: 'user-1',
    ...overrides,
  }
}

export function makeCustomerApi(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    uuid: 'cust-uuid-1',
    created_at: '2026-05-30T12:00:00.000Z',
    updated_at: '2026-05-30T12:00:00.000Z',
    corporation_uuid: 'corp-uuid-1',
    project_uuid: null,
    customer_address: '123 Main St',
    customer_city: 'Austin',
    customer_state: 'TX',
    customer_country: 'US',
    customer_zip: '78701',
    customer_phone: '555-0100',
    customer_email: 'jane@example.com',
    company_name: 'Acme Co',
    salutation: 'Ms.',
    first_name: 'Jane',
    middle_name: '',
    last_name: 'Doe',
    profile_image_url: '',
    is_active: true,
    nimble_customer_id: null,
    created_by: 'user-1',
    updated_by: 'user-1',
    ...overrides,
  }
}

export function makeCustomerOption(overrides: Record<string, unknown> = {}) {
  return {
    uuid: 'cust-uuid-1',
    corporation_uuid: 'corp-uuid-1',
    project_uuid: null,
    salutation: 'Ms.',
    first_name: 'Jane',
    middle_name: '',
    last_name: 'Doe',
    company_name: 'Acme Co',
    customer_email: 'jane@example.com',
    profile_image_url: '',
    ...overrides,
  }
}
