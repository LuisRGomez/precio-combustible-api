#!/usr/bin/env python3
"""
do_mcp_server.py — MCP Server para DigitalOcean
Permite a Claude/Cowork gestionar el servidor Tankear en DigitalOcean.

Instalación:
  pip install mcp requests

Uso en Cowork — agregar al claude_desktop_config.json:
  {
    "mcpServers": {
      "digitalocean": {
        "command": "python3",
        "args": ["/path/to/do_mcp_server.py"],
        "env": {
          "DO_TOKEN": "dop_v1_...",
          "DO_DROPLET_ID": "562299253"
        }
      }
    }
  }
"""

import os
import sys
import json
import requests
from datetime import datetime, timezone
from typing import Any

try:
    from mcp.server import Server
    from mcp.server.stdio import stdio_server
    from mcp import types
except ImportError:
    print("ERROR: Instalá el paquete mcp: pip install mcp", file=sys.stderr)
    sys.exit(1)

# ── Config ────────────────────────────────────────────────────────────────────
DO_TOKEN     = os.environ.get("DO_TOKEN", "")
DROPLET_ID   = os.environ.get("DO_DROPLET_ID", "562299253")
DO_API       = "https://api.digitalocean.com/v2"

server = Server("digitalocean-tankear")


# ── Cliente DO ────────────────────────────────────────────────────────────────
def do_get(path: str) -> dict:
    r = requests.get(f"{DO_API}{path}",
                     headers={"Authorization": f"Bearer {DO_TOKEN}"},
                     timeout=15)
    r.raise_for_status()
    return r.json()


def do_post(path: str, data: dict = None) -> dict:
    r = requests.post(f"{DO_API}{path}",
                      headers={"Authorization": f"Bearer {DO_TOKEN}",
                               "Content-Type": "application/json"},
                      json=data or {},
                      timeout=15)
    r.raise_for_status()
    return r.json() if r.text else {}


# ── Helpers ───────────────────────────────────────────────────────────────────
def fmt_bytes(mb: int) -> str:
    if mb >= 1024:
        return f"{mb/1024:.1f} GB"
    return f"{mb} MB"


def uptime_str(created_at: str) -> str:
    try:
        created = datetime.fromisoformat(created_at.replace("Z", "+00:00"))
        delta = datetime.now(timezone.utc) - created
        days = delta.days
        hours = delta.seconds // 3600
        return f"{days}d {hours}h"
    except Exception:
        return "desconocido"


# ── Tools ─────────────────────────────────────────────────────────────────────
@server.list_tools()
async def list_tools() -> list[types.Tool]:
    return [
        types.Tool(
            name="get_server_status",
            description="Estado del servidor Tankear en DigitalOcean: IP, estado, uptime, specs",
            inputSchema={"type": "object", "properties": {}, "required": []},
        ),
        types.Tool(
            name="get_droplet_metrics",
            description="Métricas de uso del servidor: CPU, memoria, disco, red",
            inputSchema={"type": "object", "properties": {}, "required": []},
        ),
        types.Tool(
            name="list_droplet_actions",
            description="Últimas acciones realizadas sobre el droplet (reboots, snapshots, etc.)",
            inputSchema={
                "type": "object",
                "properties": {
                    "limit": {
                        "type": "integer",
                        "description": "Cantidad de acciones a mostrar (default: 10)",
                        "default": 10
                    }
                },
                "required": []
            },
        ),
        types.Tool(
            name="reboot_droplet",
            description="Reinicia el servidor Tankear. Usar solo si el servidor no responde.",
            inputSchema={
                "type": "object",
                "properties": {
                    "confirm": {
                        "type": "boolean",
                        "description": "Debe ser true para confirmar el reboot"
                    }
                },
                "required": ["confirm"]
            },
        ),
        types.Tool(
            name="power_cycle_droplet",
            description="Apaga y enciende el servidor (power cycle). Más agresivo que reboot.",
            inputSchema={
                "type": "object",
                "properties": {
                    "confirm": {
                        "type": "boolean",
                        "description": "Debe ser true para confirmar"
                    }
                },
                "required": ["confirm"]
            },
        ),
        types.Tool(
            name="get_account_info",
            description="Info de la cuenta de DigitalOcean: email, estado, límites, balance",
            inputSchema={"type": "object", "properties": {}, "required": []},
        ),
        types.Tool(
            name="get_billing",
            description="Facturación actual del mes en DigitalOcean",
            inputSchema={"type": "object", "properties": {}, "required": []},
        ),
        types.Tool(
            name="list_snapshots",
            description="Lista los snapshots/backups del droplet",
            inputSchema={"type": "object", "properties": {}, "required": []},
        ),
        types.Tool(
            name="create_snapshot",
            description="Crea un snapshot (backup) del droplet",
            inputSchema={
                "type": "object",
                "properties": {
                    "name": {
                        "type": "string",
                        "description": "Nombre del snapshot (ej: 'tankear-backup-manual')"
                    }
                },
                "required": ["name"]
            },
        ),
        types.Tool(
            name="get_firewall",
            description="Reglas del firewall del servidor Tankear",
            inputSchema={"type": "object", "properties": {}, "required": []},
        ),
    ]


@server.call_tool()
async def call_tool(name: str, arguments: dict) -> list[types.TextContent]:
    try:
        result = await _dispatch(name, arguments)
    except requests.HTTPError as e:
        result = f"❌ Error DO API: {e.response.status_code} — {e.response.text[:200]}"
    except Exception as e:
        result = f"❌ Error: {e}"

    return [types.TextContent(type="text", text=str(result))]


async def _dispatch(name: str, args: dict) -> str:
    # ── get_server_status ──────────────────────────────────────────────────
    if name == "get_server_status":
        d = do_get(f"/droplets/{DROPLET_ID}")["droplet"]
        ipv4 = next((n["ip_address"] for n in d["networks"]["v4"]
                     if n["type"] == "public"), "N/A")
        size = d["size"]
        return (
            f"🖥️ **Servidor Tankear**\n\n"
            f"Estado:   {'✅ activo' if d['status'] == 'active' else '⚠️ ' + d['status']}\n"
            f"IP:       {ipv4}\n"
            f"Región:   {d['region']['name']} ({d['region']['slug']})\n"
            f"vCPUs:    {size['vcpus']}\n"
            f"RAM:      {fmt_bytes(size['memory'])}\n"
            f"Disco:    {size['disk']} GB SSD\n"
            f"Precio:   ${size['price_monthly']}/mes\n"
            f"Creado:   {d['created_at'][:10]}\n"
            f"Uptime:   {uptime_str(d['created_at'])}\n"
            f"Kernel:   {d.get('image', {}).get('distribution', '')} {d.get('image', {}).get('name', '')}"
        )

    # ── get_droplet_metrics ────────────────────────────────────────────────
    elif name == "get_droplet_metrics":
        import time
        end   = int(time.time())
        start = end - 3600  # última hora

        results = {}
        for metric in ["cpu", "memory_utilization_percent", "disk_utilization_percent",
                       "public_outbound_bandwidth", "public_inbound_bandwidth"]:
            try:
                r = do_get(f"/monitoring/metrics/droplet/{metric}"
                           f"?host_id={DROPLET_ID}&start={start}&end={end}")
                data = r.get("data", {}).get("result", [])
                if data:
                    vals = [float(v[1]) for v in data[0].get("values", []) if v[1] != "NaN"]
                    results[metric] = round(sum(vals[-5:]) / min(len(vals[-5:]), 5), 2) if vals else None
                else:
                    results[metric] = None
            except Exception:
                results[metric] = None

        def fmt_metric(v, unit=""):
            return f"{v}{unit}" if v is not None else "N/D (agente no instalado)"

        return (
            f"📊 **Métricas Tankear** (último promedio)\n\n"
            f"CPU:      {fmt_metric(results.get('cpu'), '%')}\n"
            f"Memoria:  {fmt_metric(results.get('memory_utilization_percent'), '%')}\n"
            f"Disco:    {fmt_metric(results.get('disk_utilization_percent'), '%')}\n"
            f"Red ↑:    {fmt_metric(results.get('public_outbound_bandwidth'), ' KB/s')}\n"
            f"Red ↓:    {fmt_metric(results.get('public_inbound_bandwidth'), ' KB/s')}\n\n"
            f"💡 Para métricas detalladas instalá el agente:\n"
            f"   curl -sSL https://repos.insights.digitalocean.com/install.sh | sudo bash"
        )

    # ── list_droplet_actions ───────────────────────────────────────────────
    elif name == "list_droplet_actions":
        limit = args.get("limit", 10)
        data  = do_get(f"/droplets/{DROPLET_ID}/actions")
        actions = data.get("actions", [])[:limit]
        if not actions:
            return "Sin acciones registradas."
        lines = ["📋 **Últimas acciones del servidor:**\n"]
        for a in actions:
            status = "✅" if a["status"] == "completed" else "⏳" if a["status"] == "in-progress" else "❌"
            fecha  = a["started_at"][:16].replace("T", " ") if a.get("started_at") else "?"
            lines.append(f"{status} {a['type']:20} {fecha}")
        return "\n".join(lines)

    # ── reboot_droplet ────────────────────────────────────────────────────
    elif name == "reboot_droplet":
        if not args.get("confirm"):
            return "⚠️ Confirmación requerida. Pasá confirm=true para reiniciar."
        do_post(f"/droplets/{DROPLET_ID}/actions", {"type": "reboot"})
        return "🔄 Reboot enviado al servidor. Tardará ~30 segundos en volver."

    # ── power_cycle_droplet ───────────────────────────────────────────────
    elif name == "power_cycle_droplet":
        if not args.get("confirm"):
            return "⚠️ Confirmación requerida. Pasá confirm=true para power cycle."
        do_post(f"/droplets/{DROPLET_ID}/actions", {"type": "power_cycle"})
        return "⚡ Power cycle enviado. El servidor tardará ~1 minuto en volver."

    # ── get_account_info ──────────────────────────────────────────────────
    elif name == "get_account_info":
        a = do_get("/account")["account"]
        return (
            f"👤 **Cuenta DigitalOcean**\n\n"
            f"Email:         {a['email']}\n"
            f"Estado:        {'✅ ' + a['status']}\n"
            f"Droplet limit: {a['droplet_limit']}\n"
            f"Floating IPs:  {a['floating_ip_limit']}\n"
            f"Verificado:    {'Sí' if a['email_verified'] else 'No'}\n"
            f"UUID:          {a['uuid']}"
        )

    # ── get_billing ───────────────────────────────────────────────────────
    elif name == "get_billing":
        b = do_get("/customers/my/balance")
        return (
            f"💳 **Facturación DigitalOcean**\n\n"
            f"Saldo a favor:    ${b.get('account_balance', '0')}\n"
            f"Uso del mes:      ${b.get('month_to_date_usage', '0')}\n"
            f"Último pago:      ${b.get('generated_at', 'N/A')}\n"
        )

    # ── list_snapshots ────────────────────────────────────────────────────
    elif name == "list_snapshots":
        data = do_get(f"/droplets/{DROPLET_ID}/snapshots")
        snaps = data.get("snapshots", [])
        if not snaps:
            return "Sin snapshots. Podés crear uno con create_snapshot."
        lines = ["📸 **Snapshots del servidor:**\n"]
        for s in snaps:
            size = f"{s.get('size_gigabytes', '?')} GB"
            lines.append(f"  • {s['name']} — {size} — {s['created_at'][:10]}")
        return "\n".join(lines)

    # ── create_snapshot ───────────────────────────────────────────────────
    elif name == "create_snapshot":
        name_snap = args.get("name", f"tankear-{datetime.now().strftime('%Y%m%d-%H%M')}")
        do_post(f"/droplets/{DROPLET_ID}/actions",
                {"type": "snapshot", "name": name_snap})
        return f"📸 Snapshot '{name_snap}' iniciado. Tardará unos minutos."

    # ── get_firewall ──────────────────────────────────────────────────────
    elif name == "get_firewall":
        data = do_get("/firewalls")
        firewalls = [f for f in data.get("firewalls", [])
                     if any(str(DROPLET_ID) in str(did)
                            for did in f.get("droplet_ids", []))]
        if not firewalls:
            return "Sin firewall asignado al droplet."
        fw = firewalls[0]
        lines = [f"🔥 **Firewall: {fw['name']}**\n", "Reglas de entrada:"]
        for r in fw.get("inbound_rules", []):
            ports = r.get("ports", "all")
            src   = r.get("sources", {})
            addrs = src.get("addresses", src.get("tags", ["cualquier IP"]))
            lines.append(f"  ✅ {r['protocol'].upper():4} {ports:6} ← {', '.join(str(a) for a in addrs[:3])}")
        return "\n".join(lines)

    return f"Tool desconocida: {name}"


# ── Main ──────────────────────────────────────────────────────────────────────
async def main():
    if not DO_TOKEN:
        print("ERROR: DO_TOKEN no configurado", file=sys.stderr)
        sys.exit(1)
    async with stdio_server() as (read_stream, write_stream):
        await server.run(read_stream, write_stream,
                         server.create_initialization_options())


if __name__ == "__main__":
    import asyncio
    asyncio.run(main())
