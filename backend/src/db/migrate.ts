// This script runs all SQL migration files in order
// Run it once to set up your database tables

import { readFileSync, readdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import pg from 'pg'

const { Client } = pg

// Get current directory (needed for ES modules)
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const run = async () => {
  // Connect directly to postgres (not through Fastify)
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  })

  await client.connect()
  console.log('✅ Connected to database')

  // Create a tracking table so we don't run migrations twice
  await client.query(`
    CREATE TABLE IF NOT EXISTS _migrations (
      id        SERIAL PRIMARY KEY,
      filename  TEXT NOT NULL UNIQUE,
      ran_at    TIMESTAMPTZ DEFAULT NOW()
    )
  `)

  // Find all .sql files in migrations folder, sorted by name
  const migrationsDir = join(__dirname, 'migrations')
  const files = readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort() // sorts alphabetically: 001, 002, 003...

  for (const file of files) {
    // Check if this migration already ran
    const { rows } = await client.query(
      'SELECT id FROM _migrations WHERE filename = $1',
      [file]
    )

    if (rows.length > 0) {
      console.log(`⏭️  Skipping ${file} (already ran)`)
      continue
    }

    // Read and run the SQL file
    const sql = readFileSync(join(migrationsDir, file), 'utf8')
    await client.query(sql)

    // Mark it as done
    await client.query(
      'INSERT INTO _migrations (filename) VALUES ($1)',
      [file]
    )

    console.log(`✅ Ran migration: ${file}`)
  }

  await client.end()
  console.log('🎉 All migrations complete!')
}

run().catch(err => {
  console.error('Migration failed:', err)
  process.exit(1)
})