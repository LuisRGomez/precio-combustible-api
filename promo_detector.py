#!/usr/bin/env python3
"""
promo_detector.py — Tankear
Lee el inbox de promos, detecta ofertas de combustible y las publica en @tankear_ar.

Variables de entorno requeridas:
  PROMO_GMAIL_USER     abuelaeliabarbieri@gmail.com
  PROMO_GMAIL_PASS     app-password de 16 caracteres
  TELEGRAM_BOT_TOKEN   token del bot
  PROMO_CHANNEL        @tankear_ar (default)
  DB_PATH              ruta a tankear.db (para no repetir promos ya publicadas)
"""

import imaplib
import email
import os
import re
import json
import logging
import sqlite3
import asyncio
from datetime import datetime, date
from email.header import decode_header
from typing import Optional

import httpx

# ── Config ────────────────────────────────────────────────────────────────────
GMAIL_USER    = os.getenv("PROMO_GMAIL_USER", "abuelaeliabarbieri@gmail.com")
GMAIL_PASS    = os.getenv("PROMO_GMAIL_PASS", "")
BOT_TOKEN     = os.getenv("TELEGRAM_BOT_TOKEN", "")
CHANNEL       = os.getenv("PROMO_CHANNEL", "@tankear_ar")
DB_PATH       = os.getenv("DB_PATH", "/var/www/tankear/data/tankear.db")

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
log = logging.getLogger("promo_detector")

# ── Palabras clave para detectar promos de combustible ───────────────────────

# Al menos UNA de estas debe aparecer (son específicas de combustible)
KW_COMBUSTIBLE_ESTRICTO = [
    "combustible", "nafta", "gasoil", "gas oil", "gnc", "surtidor",
    "estación de servicio", "estacion de servicio", "carga de nafta",
    "litro de nafta", "litros de nafta", "litro de gasoil",
    "ypf servi", "shell servi", "axion energy", "axión energy",
    "puma energy", "gulf station",
]

# Marcas de estaciones de servicio (remitente o cuerpo)
KW_MARCAS_ESTACION = [
    "ypf", "shell", "axion", "axión", "puma energy", "gulf",
    "petrobras", "tankear",
]

# Dominios de remitentes confiables de energía/combustible
REMITENTES_CONFIABLES = [
    "ypf.com", "shell.com.ar", "axionenergy.com", "pumafuel.com",
    "gulf.com.ar", "tankear.com.ar",
]

KW_PROMO = [
    "descuento", "reintegro", "cashback", "beneficio", "promo", "promoción",
    "promocion", "oferta", "ahorrá", "ahorra", "%", "cuotas sin interés",
    "2x1", "bonificación", "bonificacion", "acumulá puntos", "acumula puntos",
]
KW_TARJETA = [
    "visa", "mastercard", "maestro", "american express", "amex",
    "naranja", "cabal", "bbva", "galicia", "santander", "hsbc",
    "macro", "supervielle", "nación", "nacion", "provincia", "ciudad",
    "itaú", "itau", "patagonia", "icbc", "uala", "mercado pago",
]

# Palabras que indican que NO es una promo de combustible
KW_DESCARTE = [
    "hamburguesa", "burger", "pizza", "sushi", "restaurant", "comida",
    "delivery", "pedidos ya", "rappi", "glovo", "uber eats",
    "ropa", "moda", "indumentaria", "calzado", "zapatillas",
    "vuelos", "hotel", "turismo", "viaje en avión",
    "supermercado", "hipermercado", "carrefour", "coto", "dia ",
]

# ── Helpers ───────────────────────────────────────────────────────────────────
def _decode_header_str(h: str) -> str:
    parts = decode_header(h or "")
    out = []
    for part, enc in parts:
        if isinstance(part, bytes):
            out.append(part.decode(enc or "utf-8", errors="replace"))
        else:
            out.append(part)
    return " ".join(out)


def _get_text(msg: email.message.Message) -> str:
    """Extrae el texto plano o HTML del mensaje."""
    text = ""
    if msg.is_multipart():
        for part in msg.walk():
            ct = part.get_content_type()
            if ct in ("text/plain", "text/html"):
                payload = part.get_payload(decode=True)
                if payload:
                    text += payload.decode(part.get_content_charset() or "utf-8", errors="replace")
    else:
        payload = msg.get_payload(decode=True)
        if payload:
            text = payload.decode(msg.get_content_charset() or "utf-8", errors="replace")
    # Strip HTML tags
    text = re.sub(r"<[^>]+>", " ", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text


def _es_promo_combustible(asunto: str, texto: str, remitente: str = "") -> bool:
    """
    Regla principal de detección:

    - Si el remitente es una estación de servicio conocida (YPF, Shell, Axion...):
      publicamos TODO lo que tenga alguna palabra de promo. No importa si es
      nafta, lavadero, tienda o café — el usuario tiene el club y le sirve.

    - Si el remitente es desconocido (mail reenviado manualmente, banco, etc.):
      exigimos una palabra estricta de combustible + promo, y descartamos
      categorías claramente ajenas.
    """
    contenido = (asunto + " " + texto[:2000]).lower()
    rem = remitente.lower()

    # ¿Viene de una estación/marca conocida?
    es_estacion = any(d in rem for d in REMITENTES_CONFIABLES) or \
                  any(kw in rem for kw in KW_MARCAS_ESTACION)

    tiene_promo = any(kw in contenido for kw in KW_PROMO)

    if es_estacion:
        # De YPF/Shell/Axion: publicamos si tiene cualquier promo
        if not tiene_promo:
            log.info("  → Remitente estación pero sin palabras de promo, skip")
            return False
        log.info(f"  → Remitente estación ({rem[:40]}): publicando")
        return True

    # Remitente desconocido: filtro más estricto
    if any(kw in contenido for kw in KW_DESCARTE):
        log.info("  → Descartado: categoría ajena (comida/ropa/etc)")
        return False

    tiene_combustible = any(kw in contenido for kw in KW_COMBUSTIBLE_ESTRICTO) or \
                        any(kw in asunto.lower() for kw in KW_MARCAS_ESTACION)

    if not tiene_combustible:
        log.info("  → Sin señal de combustible")
        return False

    if not tiene_promo:
        log.info("  → Sin palabras de promo")
        return False

    return True


def _extraer_info(asunto: str, texto: str, remitente: str) -> dict:
    """
    Extrae campos clave de la promo.
    Retorna dict con: descuento, marca, tarjeta, vigencia, resumen
    """
    contenido = (asunto + " " + texto[:3000]).lower()
    full = asunto + " " + texto[:3000]

    # Descuento %
    pct = re.findall(r'(\d+)\s*%', full)
    descuento = f"{pct[0]}%" if pct else None

    # Reintegro $ o tope
    tope = re.findall(r'tope[:\s]+\$?\s*([\d\.]+)', contenido)
    tope_str = f"(tope ${tope[0]})" if tope else ""

    # Marca de combustible
    marca = None
    for m in ["ypf", "shell", "axion", "axión", "puma", "gulf", "petrobras"]:
        if m in contenido:
            marca = m.upper().replace("IÓN", "ION")
            break

    # Tarjeta
    tarjeta = None
    for t in KW_TARJETA:
        if t in contenido:
            tarjeta = t.title()
            break

    # Vigencia
    fechas = re.findall(
        r'(\d{1,2}[\/\-]\d{1,2}(?:[\/\-]\d{2,4})?)',
        full
    )
    vigencia = " al ".join(fechas[:2]) if len(fechas) >= 2 else (fechas[0] if fechas else None)

    # Remitente limpio
    remitente_clean = re.sub(r'<.*?>', '', remitente).strip().strip('"')

    return {
        "descuento": descuento,
        "tope": tope_str,
        "marca": marca,
        "tarjeta": tarjeta,
        "vigencia": vigencia,
        "remitente": remitente_clean,
        "asunto": asunto,
    }


def _formatear_mensaje(info: dict, asunto: str) -> str:
    """Genera el texto del mensaje Telegram con MarkdownV2."""
    def esc(s):
        if not s:
            return ""
        return re.sub(r'([_\*\[\]\(\)~`>#+\-=|{}\.!\\])', r'\\\1', str(s))

    lineas = ["🔥 *Nueva promo de combustible*\n"]

    if info["marca"]:
        lineas.append(f"⛽ *{esc(info['marca'])}*")

    if info["descuento"]:
        desc_txt = f"💸 *{esc(info['descuento'])} de descuento*"
        if info["tope"]:
            desc_txt += f" {esc(info['tope'])}"
        lineas.append(desc_txt)

    if info["tarjeta"]:
        lineas.append(f"💳 Con tarjeta {esc(info['tarjeta'])}")

    if info["vigencia"]:
        lineas.append(f"📅 Vigencia: {esc(info['vigencia'])}")

    lineas.append(f"\n_{esc(info['remitente'])}_")
    lineas.append(f"\n[Ver estaciones en Tankear](https://tankear\\.com\\.ar)")

    return "\n".join(lineas)


# ── Base de datos: evitar duplicados ─────────────────────────────────────────
def _init_promo_table():
    con = sqlite3.connect(DB_PATH)
    con.execute("""
        CREATE TABLE IF NOT EXISTS telegram_promos (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            mail_id     TEXT UNIQUE,
            remitente   TEXT,
            asunto      TEXT,
            descuento   TEXT,
            marca       TEXT,
            tarjeta     TEXT,
            vigencia    TEXT,
            publicado   INTEGER DEFAULT 0,
            texto_msg   TEXT,
            created_at  TEXT DEFAULT (datetime('now'))
        )
    """)
    # Migración: agregar columnas si ya existía la tabla sin ellas
    for col in ["remitente TEXT", "descuento TEXT", "marca TEXT",
                "tarjeta TEXT", "vigencia TEXT", "texto_msg TEXT"]:
        try:
            con.execute(f"ALTER TABLE telegram_promos ADD COLUMN {col}")
        except Exception:
            pass
    con.commit()
    con.close()


def _ya_procesado(mail_id: str) -> bool:
    try:
        con = sqlite3.connect(DB_PATH)
        row = con.execute("SELECT id FROM telegram_promos WHERE mail_id=?", (mail_id,)).fetchone()
        con.close()
        return row is not None
    except Exception:
        return False


def _marcar_procesado(mail_id: str, asunto: str, publicado: bool,
                      info: dict = None, texto_msg: str = ""):
    try:
        con = sqlite3.connect(DB_PATH)
        con.execute(
            """INSERT OR IGNORE INTO telegram_promos
               (mail_id, remitente, asunto, descuento, marca, tarjeta, vigencia, publicado, texto_msg)
               VALUES (?,?,?,?,?,?,?,?,?)""",
            (
                mail_id,
                info.get("remitente", "") if info else "",
                asunto,
                info.get("descuento", "") if info else "",
                info.get("marca", "") if info else "",
                info.get("tarjeta", "") if info else "",
                info.get("vigencia", "") if info else "",
                int(publicado),
                texto_msg,
            )
        )
        con.commit()
        con.close()
    except Exception as e:
        log.warning(f"No se pudo guardar promo en DB: {e}")


# ── Telegram ──────────────────────────────────────────────────────────────────
async def _send_telegram(texto: str) -> bool:
    url = f"https://api.telegram.org/bot{BOT_TOKEN}/sendMessage"
    payload = {
        "chat_id": CHANNEL,
        "text": texto,
        "parse_mode": "MarkdownV2",
        "disable_web_page_preview": False,
    }
    async with httpx.AsyncClient(timeout=15) as client:
        r = await client.post(url, json=payload)
        if r.status_code == 200:
            log.info(f"✅ Publicado en {CHANNEL}")
            return True
        else:
            log.error(f"Telegram error {r.status_code}: {r.text[:200]}")
            return False


# ── Main ──────────────────────────────────────────────────────────────────────
async def main():
    _init_promo_table()

    if not GMAIL_PASS:
        log.error("PROMO_GMAIL_PASS no configurada")
        return
    if not BOT_TOKEN:
        log.error("TELEGRAM_BOT_TOKEN no configurado")
        return

    log.info(f"Conectando a Gmail ({GMAIL_USER})...")
    try:
        imap = imaplib.IMAP4_SSL("imap.gmail.com", 993)
        imap.login(GMAIL_USER, GMAIL_PASS)
        imap.select("INBOX")
    except Exception as e:
        log.error(f"Error conectando a Gmail: {e}")
        return

    # Leer todos los no-leídos
    status, msgs = imap.search(None, "UNSEEN")
    ids = msgs[0].split() if msgs[0] else []
    log.info(f"Mails no leídos: {len(ids)}")

    publicados = 0
    for mid in ids:
        try:
            status, data = imap.fetch(mid, "(RFC822)")
            msg = email.message_from_bytes(data[0][1])

            mail_id  = msg.get("Message-ID", mid.decode())
            asunto   = _decode_header_str(msg.get("Subject", ""))
            remitente = _decode_header_str(msg.get("From", ""))
            texto    = _get_text(msg)

            log.info(f"Procesando: {asunto[:60]}")

            if _ya_procesado(mail_id):
                log.info("  → Ya procesado, skip")
                continue

            info = _extraer_info(asunto, texto, remitente)

            if not _es_promo_combustible(asunto, texto, remitente):
                log.info("  → No es promo de combustible, skip")
                # Guardamos igual con publicado=0 para tener historial
                _marcar_procesado(mail_id, asunto, False, info)
                imap.store(mid, "+FLAGS", "\\Seen")
                continue

            log.info("  → ¡Es promo! Publicando...")
            mensaje = _formatear_mensaje(info, asunto)

            ok = await _send_telegram(mensaje)
            _marcar_procesado(mail_id, asunto, ok, info, mensaje)
            imap.store(mid, "+FLAGS", "\\Seen")

            if ok:
                publicados += 1
                await asyncio.sleep(2)  # rate limit Telegram

        except Exception as e:
            log.error(f"Error procesando mail {mid}: {e}")

    imap.logout()
    log.info(f"Finalizado. Publicadas: {publicados} promos.")


if __name__ == "__main__":
    asyncio.run(main())
