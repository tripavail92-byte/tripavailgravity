import fs from 'node:fs'
import path from 'node:path'

import { createRemoteClient, loadRemoteDbEnv, resolveRemoteConnectionString } from './lib/remoteDb.mjs'

function parseArgs(args) {
  const flags = new Set(args.filter((arg) => arg.startsWith('--')))
  const positionals = args.filter((arg) => !arg.startsWith('--'))
  const fileIndex = args.indexOf('--file')
  const filePath = fileIndex >= 0 ? args[fileIndex + 1] : positionals[0] ?? null

  return {
    filePath,
    useTransaction: !flags.has('--no-transaction'),
    readonly: flags.has('--readonly'),
  }
}

function printHelp() {
  console.log('Run a SQL file directly against a remote Postgres database')
  console.log('')
  console.log('Usage:')
  console.log('  node scripts/run-remote-sql-file.mjs <path>')
  console.log('  node scripts/run-remote-sql-file.mjs <path> --readonly')
  console.log('  node scripts/run-remote-sql-file.mjs --file <path> --no-transaction')
  console.log('')
  console.log('Environment:')
  console.log('  Provide DATABASE_URL, or Project_ID plus Database_password in your env files')
}

async function main() {
  const args = process.argv.slice(2)
  if (args.includes('--help') || args.includes('-h')) {
    printHelp()
    return
  }

  const { filePath, useTransaction, readonly } = parseArgs(args)

  if (!filePath) {
    throw new Error('Missing SQL file path. Pass a positional path or --file <path>.')
  }

  if (readonly && !useTransaction) {
    throw new Error('--readonly requires transactions. Remove --no-transaction.')
  }

  const env = loadRemoteDbEnv()
  const connectionString = resolveRemoteConnectionString(env)
  if (!connectionString) {
    throw new Error(
      'Missing remote database connection string. Set DATABASE_URL or provide Project_ID plus Database_password in your env files.',
    )
  }

  const resolvedFilePath = path.resolve(process.cwd(), filePath)
  const sql = fs.readFileSync(resolvedFilePath, 'utf8')
  const client = createRemoteClient(connectionString)

  await client.connect()
  try {
    if (useTransaction) {
      await client.query('BEGIN')
      if (readonly) {
        await client.query('SET TRANSACTION READ ONLY')
      }
    }

    await client.query(sql)

    if (useTransaction) {
      if (readonly) {
        await client.query('ROLLBACK')
      } else {
        await client.query('COMMIT')
      }
    }

    console.log(`Completed SQL file: ${filePath}${readonly ? ' (readonly)' : ''}`)
  } catch (error) {
    if (useTransaction) {
      try {
        await client.query('ROLLBACK')
      } catch {
        // Ignore rollback failures and surface the original error.
      }
    }
    throw error
  } finally {
    await client.end()
  }
}

main().catch((error) => {
  console.error('[run-remote-sql-file] Failed:', error instanceof Error ? error.message : error)
  process.exitCode = 1
})