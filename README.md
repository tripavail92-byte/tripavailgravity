# TripAvail

## Storefront QA Workflow

The GitHub Actions workflow at [.github/workflows/storefront-qa.yml](.github/workflows/storefront-qa.yml) runs both `npm run qa:storefront:flows` and `npm run db:test:operator-quality:remote` against your real Supabase project.

### Why the workflow needs Supabase values

GitHub runners start with an empty environment. The smoke and regression steps sign into Supabase with seeded QA accounts and call the live storefront RPCs, so the runner needs:

- `VITE_SUPABASE_URL`: your Supabase project URL
- `VITE_SUPABASE_ANON_KEY`: the client-side anon key used by the app and QA script
- Either `DATABASE_URL`, or both `Project_ID` and `Database_password`, so the remote SQL regression can connect to Postgres

These are not admin credentials. The anon key is the same client key your web app uses, and the script still authenticates as the seeded QA users before it can read protected analytics or mutate admin overrides.

### How to wire them in GitHub Actions

Preferred setup:

1. Open GitHub repository `Settings`.
2. Go to `Secrets and variables` → `Actions`.
3. Add repository variables or secrets named `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
4. Add either `DATABASE_URL`, or the pair `Project_ID` and `Database_password`.
5. Run the `Storefront QA` workflow manually, or let it run on matching pull requests.

Notes:

- The workflow accepts either repository `Variables` or `Secrets`.
- `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are usually fine as repository variables.
- `DATABASE_URL` or `Database_password` should be stored as secrets.
- The old [.github/workflows/storefront-qa-example.yml](.github/workflows/storefront-qa-example.yml) file is now only a reference example.