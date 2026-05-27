import { describe, expect, it } from 'vitest'
import {
  adoConnectionStringToPrismaUrl,
  wrapPrismaSqlServerValue,
} from '../../../server/utils/database-url'

describe('adoConnectionStringToPrismaUrl', () => {
  it('wraps passwords with special characters in curly braces for Prisma', () => {
    expect(wrapPrismaSqlServerValue('^!ml3Le#543*')).toBe('{^!ml3Le#543*}')
    expect(wrapPrismaSqlServerValue('Pass:Word;')).toBe('{Pass:Word;}')
  })

  it('converts ADO.NET connection string to Prisma sqlserver URL', () => {
    const url = adoConnectionStringToPrismaUrl(
      'Server=10.4.1.12;Database=supabase;User ID=sa;Password=pass#word;TrustServerCertificate=true;Encrypt=true',
    )
    expect(url).toContain('sqlserver://10.4.1.12:1433')
    expect(url).toContain('database=supabase')
    expect(url).toContain('user=sa')
    expect(url).toContain('password={pass#word}')
    expect(url).toContain('trustServerCertificate=true')
    expect(url).toContain('encrypt=true')
  })
})
