#!/bin/sh
set -e

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DB="$ROOT/web/data/lavanderia.db"
OUT_DIR="$ROOT/backups"
KEEP_DAYS="${BACKUP_KEEP_DAYS:-14}"
STAMP=$(date +%Y%m%d_%H%M%S)
OUT="$OUT_DIR/lavanderia_${STAMP}.db"

mkdir -p "$OUT_DIR"

if [ ! -f "$DB" ]; then
  echo "[backup] No existe $DB"
  exit 1
fi

echo "[backup] Copiando $DB → $OUT"
cp "$DB" "$OUT"
# WAL companion files si existen
[ -f "${DB}-wal" ] && cp "${DB}-wal" "${OUT}-wal" || true
[ -f "${DB}-shm" ] && cp "${DB}-shm" "${OUT}-shm" || true

find "$OUT_DIR" -name 'lavanderia_*.db' -mtime +"${KEEP_DAYS}" -delete 2>/dev/null || true
echo "[backup] OK $(du -h "$OUT" | awk '{print $1}') · retención ${KEEP_DAYS} días"
