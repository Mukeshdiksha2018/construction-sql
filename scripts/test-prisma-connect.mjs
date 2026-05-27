import { PrismaClient } from '@prisma/client'
import { adoConnectionStringToPrismaUrl } from './ado-to-prisma-url.mjs'

const url = adoConnectionStringToPrismaUrl(process.env.NUXT_MSSQL_CONNECTION_STRING)
console.log('url redacted:', url.replace(/password=[^;]+/, 'password=***'))

const prisma = new PrismaClient({ datasources: { db: { url } } })
try {
  await prisma.$queryRaw`SELECT 1 AS ok`
  console.log('prisma connect: OK')
}
catch (e) {
  console.error('prisma connect: FAIL', e.message)
  process.exit(1)
}
finally {
  await prisma.$disconnect()
}
