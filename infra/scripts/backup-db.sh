#!/usr/bin/env bash
#
# backup-db.sh — Encrypted Postgres backup with rotation
#
# Usage:
#   ./backup-db.sh              # backup using default env
#   ./backup-db.sh --keep 60    # keep 60 days (default: 30)
#
# Cron example (daily at 2 AM):
#   0 2 * * * /opt/sacco/infra/scripts/backup-db.sh >> /var/log/sacco-backup.log 2>&1
#

set -euo pipefail

# ─── Config ────────────────────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
INFRA_DIR="$(dirname "$SCRIPT_DIR")"
BACKUP_DIR="${BACKUP_DIR:-$INFRA_DIR/postgres/backups}"
KEEP_DAYS="${KEEP_DAYS:-30}"

# Load env — `set -a` exports all vars
ENV_FILE="${ENV_FILE:-$INFRA_DIR/.env.prod}"
if [ ! -f "$ENV_FILE" ]; then
  echo "❌ Missing env file: $ENV_FILE"
  exit 1
fi
set -a
# shellcheck disable=SC1090
source "$ENV_FILE"
set +a

# Sanity checks
if [ -z "${POSTGRES_USER:-}" ] || [ -z "${POSTGRES_PASSWORD:-}" ]; then
  echo "❌ POSTGRES_USER or POSTGRES_PASSWORD not set in $ENV_FILE"
  exit 1
fi
if [ -z "${BACKUP_ENCRYPTION_PASSWORD:-}" ]; then
  echo "❌ BACKUP_ENCRYPTION_PASSWORD not set in $ENV_FILE"
  exit 1
fi

# Parse args
while [[ $# -gt 0 ]]; do
  case "$1" in
    --keep) KEEP_DAYS="$2"; shift 2 ;;
    *) echo "Unknown option: $1"; exit 1 ;;
  esac
done

# ─── Setup ─────────────────────────────────────────────────────
mkdir -p "$BACKUP_DIR"
TIMESTAMP=$(date -u +"%Y%m%dT%H%M%SZ")
BACKUP_FILE="$BACKUP_DIR/sacco_${TIMESTAMP}.sql.gz.enc"
PLAIN_DUMP="$BACKUP_DIR/sacco_${TIMESTAMP}.sql"

# ─── Dump ──────────────────────────────────────────────────────
echo "📦 Backing up database: $POSTGRES_DB"
docker exec -e PGPASSWORD="$POSTGRES_PASSWORD" sacco-prod-postgres pg_dump \
  -U "$POSTGRES_USER" \
  -d "$POSTGRES_DB" \
  --no-owner \
  --no-acl \
  --clean \
  --if-exists \
  > "$PLAIN_DUMP"

DUMP_SIZE=$(du -h "$PLAIN_DUMP" | cut -f1)
echo "   Raw dump: $DUMP_SIZE"

# ─── Compress + Encrypt ────────────────────────────────────────
echo "🔐 Encrypting with openssl"
gzip -c "$PLAIN_DUMP" | openssl enc -aes-256-cbc -salt -pbkdf2 \
  -pass pass:"$BACKUP_ENCRYPTION_PASSWORD" \
  -out "$BACKUP_FILE"

rm "$PLAIN_DUMP"

BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
echo "✅ Backup created: $BACKUP_FILE ($BACKUP_SIZE)"

# ─── Retention ─────────────────────────────────────────────────
echo "🧹 Removing backups older than $KEEP_DAYS days"
find "$BACKUP_DIR" -name "sacco_*.sql.gz.enc" -mtime "+$KEEP_DAYS" -delete

REMAINING=$(find "$BACKUP_DIR" -name "sacco_*.sql.gz.enc" | wc -l)
echo "   $REMAINING backups retained"

# ─── Optional: Remote copy ─────────────────────────────────────
# Uncomment to rsync to a remote backup server
#
# if [ -n "${REMOTE_BACKUP_HOST:-}" ]; then
#   echo "☁️  Syncing to $REMOTE_BACKUP_HOST"
#   rsync -avz --delete "$BACKUP_DIR/" "$REMOTE_BACKUP_HOST:/backups/sacco/"
# fi

echo ""
echo "🎉 Backup complete at $(date -u +"%Y-%m-%d %H:%M:%S UTC")"