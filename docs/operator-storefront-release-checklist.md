# Operator Storefront Release Checklist

Updated: 2026-03-28

## Release Gates

- [x] Public storefront profile resolves for `northern-summit-expeditions`
- [x] Public RLS policies allow anonymous storefront reads
- [x] Storefront tours map live `tours` schema into storefront cards
- [x] Verification review workflow is live in admin partner review
- [x] Award overrides support admin grant and clear actions
- [x] Premium operator seed uses stable QA identity
- [x] Dedicated operator analytics page is routed and visible to real operator auth
- [x] Analytics export buttons emit summary and event CSV files
- [x] Engagement rate is bounded to `0%` to `100%` as a visitor-based metric
- [x] Automated QA script covers operator analytics access and admin override write/clear flow

## Final QA Pass

- [x] Real operator login verified with `premium.operator.qa@tripavail.test`
- [x] Real admin login verified with `admin.browser.qa@tripavail.test`
- [x] Admin storefront verification dialog opens for Northern Summit Expeditions
- [x] Temporary QA override can be granted and cleared without leaving residue
- [x] Public storefront browser pass re-confirmed after the bounded engagement change
- [x] Public storefront about chips render cleanly for seeded premium values

## Before Release

- Run `npm run qa:storefront:flows`
- For GitHub Actions, use `.github/workflows/storefront-qa-example.yml` and provide `VITE_SUPABASE_URL` plus `VITE_SUPABASE_ANON_KEY` as repository variables or secrets
- Apply `supabase/migrations/20260328000006_operator_storefront_engagement_rate.sql` remotely
- Confirm the operator analytics page shows the updated visitor-based engagement definition
- Confirm the operator reputation page mirrors `engaged_visitors` and the bounded `engagement_rate`
- Confirm the admin storefront review dialog mirrors `engaged_visitors` and the bounded `engagement_rate`
- Confirm the public storefront for `northern-summit-expeditions` still renders hero, trust, gallery, fleet, guides, policies, awards, reviews, and tours
- Re-seed the premium showcase if any QA override was added during testing

## Notes

- Engagement now measures the share of unique storefront visitors who generated at least one CTA click or tour click in the selected window.
- This definition remains bounded because engaged visitors are a subset of unique visitors.
- `npm run qa:storefront:flows` is CI-safe: it prints `STORE_FRONT_QA_STATUS=PASS` or `STORE_FRONT_QA_STATUS=FAIL`, emits a JSON summary of completed checks, and exits non-zero on failure.