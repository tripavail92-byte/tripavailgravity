#!/usr/bin/env bash
# TripAvail DNS repair helper — run this YOURSELF; Claude never sees the token.
#
#   export HOSTINGER_API_TOKEN=...   (paste your token in YOUR terminal only)
#   bash scripts/hostinger-dns.sh snapshots      # list zone snapshots (find one BEFORE the tampering)
#   bash scripts/hostinger-dns.sh show <id>      # inspect a snapshot's records first
#   bash scripts/hostinger-dns.sh restore <id>   # restore that snapshot (the actual fix)
#   bash scripts/hostinger-dns.sh zone           # show the CURRENT live zone
#   bash scripts/hostinger-dns.sh fix            # fallback: directly set @ A + www CNAME to Railway
#
# The right snapshot shows: @ A 69.46.46.29 (or a CNAME to ix0dlrcu.up.railway.app),
# www CNAME ewpp7e83.up.railway.app — and NO 145.79.* / 2a02:4780:* records.
set -euo pipefail

if [ -z "${HOSTINGER_API_TOKEN:-}" ]; then
  echo "ERROR: set HOSTINGER_API_TOKEN in your shell first:  export HOSTINGER_API_TOKEN=..." >&2
  exit 1
fi

DOMAIN="tripavail.com"
BASE="https://developers.hostinger.com/api/dns/v1"
AUTH=(-H "Authorization: Bearer ${HOSTINGER_API_TOKEN}" -H "Content-Type: application/json")

case "${1:-}" in
  snapshots)
    curl -sS "${AUTH[@]}" "${BASE}/snapshots/${DOMAIN}"
    echo
    ;;
  show)
    [ -n "${2:-}" ] || { echo "usage: $0 show <snapshotId>" >&2; exit 1; }
    curl -sS "${AUTH[@]}" "${BASE}/snapshots/${DOMAIN}/$2"
    echo
    ;;
  restore)
    [ -n "${2:-}" ] || { echo "usage: $0 restore <snapshotId>" >&2; exit 1; }
    curl -sS -X POST "${AUTH[@]}" "${BASE}/snapshots/${DOMAIN}/$2/restore"
    echo
    ;;
  zone)
    curl -sS "${AUTH[@]}" "${BASE}/zones/${DOMAIN}"
    echo
    ;;
  fix)
    # Direct overwrite of just these names: apex A -> Railway, www CNAME -> Railway.
    # (AAAA leftovers on @ may need deleting in hPanel if this doesn't clear them.)
    curl -sS -X PUT "${AUTH[@]}" "${BASE}/zones/${DOMAIN}" -d '{
      "overwrite": true,
      "zone": [
        {"name": "@",   "type": "A",     "ttl": 300, "records": [{"content": "69.46.46.29"}]},
        {"name": "www", "type": "CNAME", "ttl": 300, "records": [{"content": "ewpp7e83.up.railway.app"}]}
      ]
    }'
    echo
    ;;
  *)
    grep -E '^#( |$)' "$0" | sed 's/^# \{0,1\}//'
    exit 1
    ;;
esac
