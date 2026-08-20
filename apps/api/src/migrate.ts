import { readdirSync } from 'node:fs'
import { resolve } from 'node:path'
import postgres from 'postgres'
import './env'

const url = process.env.DATABASE_URL
if (!url) {
  throw new Error('DATABASE_URL is required')
}

const neon = url.includes('neon.tech') || url.includes('sslmode=require')
const sql = postgres(url, { max: 1, ssl: neon ? 'require' : false })
const dir = resolve(process.cwd(), 'drizzle')
const files = readdirSync(dir)
  .filter((name) => name.endsWith('.sql'))
  .sort()

for (const name of files) {
  await sql.file(resolve(dir, name))
}
await sql.end()
console.log('Split schema applied')
