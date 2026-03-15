# TripAvail Commercial Release Checklist

## SQL Finance Tests

- Run `pnpm db:test:commercial-finance:remote`
- Run `pnpm db:test:payouts:remote`
- Run `pnpm db:test:payout-cycle`
- Run `pnpm db:run-remote -- --file supabase/tests/admin_finance_health_cash_reconciliation_test.sql`

## Minimum Automated Release Set

- Gold booking commission
- Diamond booking commission
- Deposit booking commission split
- Membership adjustment partial credit
- Refund safety state
- Payout cycle

## Frontend Booking Tests

- Run the operator, traveller, and admin steps in [docs/tripavail-commercial-frontend-qa-scripts.md](docs/tripavail-commercial-frontend-qa-scripts.md)
- Verify deposit messaging on checkout and confirmation
- Verify operator commercial cards and billing rows
- Verify admin commercial finance health and reconciliation sections

## Payout Cycle Tests

- Confirm at least one eligible payout becomes scheduled and then paid
- Confirm reversed paid payout moves to recovery
- Confirm future payout batch applies recovery deductions automatically

## Reconciliation Verification

- Run `pnpm db:finance:health`
- Confirm the command exits successfully
- Confirm reconciliation delta is zero or within tolerance
- Treat any non-zero failure as a release blocker until investigated

## Release Decision Rule

Release only if all of the following are true:

- SQL finance regressions pass
- payout-cycle checks pass
- frontend QA scripts pass
- finance health reconciliation passes in read-only mode
- no unexplained mismatch remains between operator UI, admin UI, and CLI totals