#!/usr/bin/env bash
#
# healthcheck.sh — External health monitoring
#
# Cron example (every 5 minutes):
#   */5 * * * * /opt/sacco/infra/scripts/healthcheck.sh
#

set -euo pipefail

ENDPOINT="${HEALTHCHECK_URL:-https://sacco.injibara.edu.et/api/v1/health}"
ALERT_EMAIL="${ALERT_EMAIL:-}"
LOG_FILE="${LOG_FILE:-/var/log/sacco-healthcheck.log}"

log() {
  echo "[$(date -u +"%Y-%m-%dT%H:%M:%SZ")] $*" | tee -a "$LOG_FILE"
}

# ─── Check health endpoint ─────────────────────────────────────
HTTP_CODE=$(curl -s -o /tmp/healthcheck.out -w "%{http_code}" --max-time 10 "$ENDPOINT" || echo "000")

if [ "$HTTP_CODE" != "200" ]; then
  log "❌ Health check FAILED — HTTP $HTTP_CODE"
  [ -n "$ALERT_EMAIL" ] && echo "SACCO health check failed: HTTP $HTTP_CODE" | \
    mail -s "[ALERT] SACCO health check" "$ALERT_EMAIL"
  exit 1
fi

BODY=$(cat /tmp/healthcheck.out)
if ! echo "$BODY" | grep -q '"db":"connected"'; then
  log "❌ Health check returned but DB not connected: $BODY"
  [ -n "$ALERT_EMAIL" ] && echo "SACCO DB not connected: $BODY" | \
    mail -s "[ALERT] SACCO DB not connected" "$ALERT_EMAIL"
  exit 1
fi

log "✅ Health check OK ($BODY)"