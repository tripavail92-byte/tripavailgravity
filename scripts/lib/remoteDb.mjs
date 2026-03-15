import fs from 'node:fs'
import path from 'node:path'

import pg from 'pg'

const { Client } = pg

function readEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {}

  const values = {}
  for (const line of fs.readFileSync(filePath, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue

    const separatorIndex = trimmed.indexOf('=')
    if (separatorIndex === -1) continue

    const key = trimmed.slice(0, separatorIndex).trim()
    let value = trimmed.slice(separatorIndex + 1).trim()
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1)
    }
    values[key] = value
  }

  return values
}

export function loadRemoteDbEnv() {
  const root = process.cwd()
  return {
    ...readEnvFile(path.join(root, '.env')),
    ...readEnvFile(path.join(root, '.env.local')),
    ...readEnvFile(path.join(root, '.env.development')),
    ...readEnvFile(path.join(root, 'supabase-secrets.env')),
    ...process.env,
  }
}

function buildSupabaseDirectDatabaseUrl(env) {
  const projectId =
    env.Project_ID ||
    env.PROJECT_ID ||
    env.SUPABASE_PROJECT_ID ||
    env.NEXT_PUBLIC_SUPABASE_PROJECT_ID ||
    null

  const databasePassword =
    env.Database_password ||
    env.DATABASE_PASSWORD ||
    env.SUPABASE_DB_PASSWORD ||
    null

  if (!projectId || !databasePassword) return null

  return `postgresql://postgres:${encodeURIComponent(databasePassword)}@db.${projectId}.supabase.co:5432/postgres`
}

export function resolveRemoteConnectionString(env = loadRemoteDbEnv()) {
  return (
    env.DATABASE_URL ||
    env.SUPABASE_DB_URL ||
    env.REMOTE_DATABASE_URL ||
    env.SUPABASE_REMOTE_DATABASE_URL ||
    buildSupabaseDirectDatabaseUrl(env) ||
    null
  )
}

export function createRemoteClient(connectionString) {
  return new Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  })
}