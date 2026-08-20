import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import '../env'
import * as schema from './schema'

const url = process.env.DATABASE_URL
if (!url) {
  throw new Error('DATABASE_URL is required')
}

const neon = url.includes('neon.tech') || url.includes('sslmode=require')
const queryClient = postgres(url, { max: 10, ssl: neon ? 'require' : false })

export const db = drizzle(queryClient, { schema })
