#!/usr/bin/env bash
#
# restore-db.sh — Restore database from an encrypted backup
#
# Usage:
#   ./restore-db.sh                          # list available backups
#   ./restore-db.sh <backup-file>            # restore from a specific file
#   ./restore-db.sh --latest                 # restore from the newest backup
#

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
INFRA_DIR="$(dirname "$SCRIPT_DIR")"
BACKUP_DIR="${BACKUP_DIR:-$INFRA_DIR/postgres/backups}"

ENV_FILE="${ENV_FILE:-$INFRA_DIR/.env.prod}"
if [ ! -f "$ENV_FILE" ]; then
  echo "❌ Missing env file: $ENV_FILE"
  exit 1
fi
set -a
# shellcheck disable=SC1090
source "$ENV_FILE"
set +a

if [ -z "${POSTGRES_USER:-}" ] || [ -z "${POSTGRES_PASSWORD:-}" ]; then
  echo "❌ POSTGRES_USER or POSTGRES_PASSWORD not set in $ENV_FILE"
  exit 1
fi
if [ -z "${BACKUP_ENCRYPTION_PASSWORD:-}" ]; then
  echo "❌ BACKUP_ENCRYPTION_PASSWORD not set in $ENV_FILE"
  exit 1
fi

# ─── Arg parsing ───────────────────────────────────────────────
if [ $# -eq 0 ]; then
  echo "Available backups:"
  ls -lht "$BACKUP_DIR"/sacco_*.sql.gz.enc 2>/dev/null | head -20 || echo "  (none)"
  echo ""
  echo "Usage: $0 <backup-file> | --latest"
  exit 0
fi

if [ "$1" = "--latest" ]; then
  BACKUP_FILE=$(ls -t "$BACKUP_DIR"/sacco_*.sql.gz.enc 2>/dev/null | head -1 || true)
  if [ -z "$BACKUP_FILE" ]; then
    echo "❌ No backups found in $BACKUP_DIR"
    exit 1
  fi
  echo "Using latest: $BACKUP_FILE"
else
  BACKUP_FILE="$1"
fi

if [ ! -f "$BACKUP_FILE" ]; then
  echo "❌ Backup file not found: $BACKUP_FILE"
  exit 1
fi

# ─── Confirm ───────────────────────────────────────────────────
echo "⚠️  This will DESTROY the current database '${POSTGRES_DB}' and replace"
echo "   it with: $BACKUP_FILE"
echo ""
read -r -p "Type 'RESTORE' to confirm: " CONFIRM
if [ "$CONFIRM" != "RESTORE" ]; then
  echo "Aborted."
  exit 1
fi

# ─── Decrypt + Decompress ──────────────────────────────────────
TMP_SQL=$(mktemp --suffix=.sql)
trap 'rm -f "$TMP_SQL"' EXIT

echo "🔓 Decrypting..."
openssl enc -d -aes-256-cbc -pbkdf2 \
  -pass pass:"$BACKUP_ENCRYPTION_PASSWORD" \
  -in "$BACKUP_FILE" | gunzip > "$TMP_SQL"

echo "   Decrypted: $(du -h "$TMP_SQL" | cut -f1)"

# ─── Stop backend (avoid connections) ──────────────────────────
echo "🛑 Stopping backend container..."
docker stop sacco-prod-backend 2>/dev/null || true

# ─── Restore ───────────────────────────────────────────────────
echo "📥 Restoring database..."
docker exec -i -e PGPASSWORD="$POSTGRES_PASSWORD" sacco-prod-postgres psql \
  -U "$POSTGRES_USER" \
  -d "$POSTGRES_DB" \
  < "$TMP_SQL" > /dev/null

echo "✅ Restore complete"

# ─── Restart backend ───────────────────────────────────────────
echo "🚀 Starting backend container..."
docker start sacco-prod-backend

# ─── Verify ────────────────────────────────────────────────────
sleep 3
echo ""
echo "🔍 Verification:"
echo "   Tables:"
docker exec -e PGPASSWORD="$POSTGRES_PASSWORD" sacco-prod-postgres psql \
  -U "$POSTGRES_USER" -d "$POSTGRES_DB" \
  -c "SELECT COUNT(*) AS tables FROM information_schema.tables WHERE table_schema='public';"

echo "   Ledger balance:"
docker exec -e PGPASSWORD="$POSTGRES_PASSWORD" sacco-prod-postgres psql \
  -U "$POSTGRES_USER" -d "$POSTGRES_DB" \
  -c "SELECT SUM(debit) AS dr, SUM(credit) AS cr FROM ledger_entries;"

echo ""
echo "🎉 Restore completed at $(date -u +"%Y-%m-%d %H:%M:%S UTC")"