#!/bin/bash
# notify_scraper.sh — Lanza scraper_do.py y notifica por Telegram.
# Usado por cron (09:00 UTC) y por /scraper en el bot.

set -euo pipefail

VENV="/var/www/tankear/venv/bin/python3"
SCRAPER="/var/www/tankear/api/scraper_do.py"
DB_PATH="${DB_PATH:-/var/www/tankear/data/tankear.db}"
BOT_TOKEN="${TELEGRAM_BOT_TOKEN:-8673787872:AAGuQs_0-geYNII9dcwWaEu5eZ7I0J6FNW8}"
CHANNEL="@tankear_ar"
API="https://api.telegram.org/bot${BOT_TOKEN}/sendMessage"

send_tg() {
    local msg="$1"
    curl -s -X POST "$API" \
        -H "Content-Type: application/json" \
        -d "{\"chat_id\":\"${CHANNEL}\",\"text\":\"${msg}\",\"parse_mode\":\"Markdown\"}" \
        > /dev/null 2>&1 || true
}

INICIO=$(date '+%Y-%m-%d %H:%M:%S')
send_tg "🔄 *Scraper iniciado* — ${INICIO}"

# Ejecutar scraper
TMPOUT=$(mktemp)
if DB_PATH="$DB_PATH" "$VENV" "$SCRAPER" > "$TMPOUT" 2>&1; then
    ESTADO="OK"
else
    ESTADO="FALLÓ"
fi

# Extraer estadísticas del output
REGISTROS=$(grep -oP 'guardadas?:?\s*\K[0-9]+' "$TMPOUT" | tail -1 || echo "?")
ESTACIONES=$(grep -oP 'estaciones?:?\s*\K[0-9]+' "$TMPOUT" | tail -1 || echo "?")
FIN=$(date '+%Y-%m-%d %H:%M:%S')

if [ "$ESTADO" = "OK" ]; then
    send_tg "✅ *Scraper completado* — ${FIN}
📦 Registros guardados: ${REGISTROS}
🏪 Estaciones: ${ESTACIONES}"
else
    ERROR=$(tail -5 "$TMPOUT" | tr '\n' ' ' | cut -c1-200)
    send_tg "❌ *Scraper FALLÓ* — ${FIN}
\`${ERROR}\`"
fi

rm -f "$TMPOUT"
