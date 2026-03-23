import { spawn } from 'node:child_process'
import path from 'node:path'

function parseArgs(argv) {
  return {
    autoSettle: argv.includes('--auto-settle'),
    billingDryRun: argv.includes('--billing-dry-run'),
    asOfDate: argv.includes('--as-of-date') ? argv[argv.indexOf('--as-of-date') + 1] ?? null : null,
    help: argv.includes('--help') || argv.includes('-h'),
  }
}

function printHelp() {
  console.log('TripAvail commercial ops worker')
  console.log('')
  console.log('Usage:')
  console.log('  node scripts/run-commercial-ops-worker.mjs')
  console.log('  node scripts/run-commercial-ops-worker.mjs --auto-settle')
  console.log('  node scripts/run-commercial-ops-worker.mjs --billing-dry-run')
  console.log('')
  console.log('Sequence:')
  console.log('  1. Close due billing cycles')
  console.log('  2. Refresh payout eligibility and create the next payout batch')
  console.log('  3. Optionally auto-settle the batch')
}

function runNodeScript(scriptPath, args = []) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [scriptPath, ...args], {
      cwd: process.cwd(),
      stdio: 'inherit',
    })

    child.on('exit', (code) => {
      if (code === 0) {
        resolve()
        return
      }
      reject(new Error(`${path.basename(scriptPath)} exited with code ${code ?? 1}`))
    })
    child.on('error', reject)
  })
}

async function main() {
  const options = parseArgs(process.argv.slice(2))
  if (options.help) {
    printHelp()
    return
  }

  const billingScript = path.join(process.cwd(), 'scripts', 'run-operator-billing-worker.mjs')
  const payoutScript = path.join(process.cwd(), 'scripts', 'run-operator-payout-worker.mjs')

  const billingArgs = []
  if (options.billingDryRun) billingArgs.push('--dry-run')
  if (options.asOfDate) billingArgs.push('--as-of-date', options.asOfDate)

  await runNodeScript(billingScript, billingArgs)

  if (!options.billingDryRun) {
    const payoutArgs = options.autoSettle ? ['--auto-settle'] : []
    await runNodeScript(payoutScript, payoutArgs)
  }
}

main().catch((error) => {
  console.error('[commercial-ops-worker] Failed:', error instanceof Error ? error.message : error)
  process.exitCode = 1
})