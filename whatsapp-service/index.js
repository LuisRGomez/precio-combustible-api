const express  = require('express');
const qrcode   = require('qrcode-terminal');
const pino     = require('pino');
const path     = require('path');
const fs       = require('fs');

const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
} = require('@whiskeysockets/baileys');

const app    = express();
app.use(express.json());

const SESSION_PATH = '/var/www/tankear/whatsapp-session';
const logger = pino({ level: 'silent' }); // silenciar logs internos de Baileys

let sock    = null;
let isReady = false;

// ── Conexión ────────────────────────────────────────────────────────────────
async function connectToWhatsApp() {
  if (!fs.existsSync(SESSION_PATH)) fs.mkdirSync(SESSION_PATH, { recursive: true });

  const { state, saveCreds } = await useMultiFileAuthState(SESSION_PATH);
  const { version }          = await fetchLatestBaileysVersion();

  console.log(`[WA] Baileys v${version.join('.')} — iniciando...`);

  sock = makeWASocket({
    version,
    auth:   state,
    logger,
    printQRInTerminal: false,   // lo manejamos nosotros
    browser: ['Tankear', 'Chrome', '1.0'],
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', ({ connection, lastDisconnect, qr }) => {
    if (qr) {
      console.log('\n[WA] ══════════════════════════════════════════════');
      console.log('[WA]  Escaneá este QR con tu celular de WhatsApp:');
      console.log('[WA] ══════════════════════════════════════════════\n');
      qrcode.generate(qr, { small: true });
      console.log('\n[WA] Esperando escaneo...\n');
    }

    if (connection === 'open') {
      isReady = true;
      console.log('[WA] ¡Conectado y listo para enviar mensajes!');
    }

    if (connection === 'close') {
      isReady = false;
      const code   = lastDisconnect?.error?.output?.statusCode;
      const logout = code === DisconnectReason.loggedOut;
      console.log(`[WA] Conexión cerrada (código ${code}). ${logout ? 'Sesión expirada.' : 'Reconectando...'}`);
      if (!logout) setTimeout(connectToWhatsApp, 5000);
    }
  });
}

connectToWhatsApp().catch(console.error);

// ── Formatear número argentino para WhatsApp ────────────────────────────────
function formatArgentina(number) {
  let d = number.replace(/\D/g, '');
  if (d.startsWith('0'))  d = d.slice(1);                        // quitar 0 inicial
  if (d.startsWith('54')) {
    if (!d.startsWith('549')) d = '549' + d.slice(2);            // asegurar 549
    return d + '@s.whatsapp.net';
  }
  return '549' + d + '@s.whatsapp.net';
}

// ── API ─────────────────────────────────────────────────────────────────────
app.get('/status', (_req, res) => {
  res.json({ ready: isReady });
});

app.post('/send', async (req, res) => {
  const { number, message } = req.body;
  if (!number || !message)
    return res.status(400).json({ error: 'number y message son requeridos' });

  if (!isReady)
    return res.status(503).json({ error: 'WhatsApp no está conectado. Escaneá el QR primero.' });

  try {
    const jid = formatArgentina(number);
    await sock.sendMessage(jid, { text: message });
    console.log(`[WA] Enviado → ${jid}`);
    res.json({ ok: true });
  } catch (err) {
    console.error('[WA] Error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── Arranque ─────────────────────────────────────────────────────────────────
app.listen(3001, '127.0.0.1', () => {
  console.log('[WA] Servicio escuchando en 127.0.0.1:3001');
});
