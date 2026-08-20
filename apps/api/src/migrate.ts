import { resolve } from 'node:path'
import postgres from 'postgres'
import './env'

const url = process.env.DATABASE_URL
if (!url) {
  throw new Error('DATABASE_URL is required')
}

const neon = url.includes('neon.tech') || url.includes('sslmode=require')
const sql = postgres(url, { max: 1, ssl: neon ? 'require' : false })
const file = resolve(process.cwd(), 'drizzle/0000_init.sql')

await sql.file(file)
await sql.end()
console.log('Split schema applied')
