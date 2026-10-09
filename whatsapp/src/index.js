import makeWASocket, {
  DisconnectReason,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
  useMultiFileAuthState,
} from "@whiskeysockets/baileys";
import fs from "fs";
import path from "path";
import { createServer } from "http";
import pino from "pino";
import qrcode from "qrcode-terminal";

const logger = pino({ level: process.env.LOG_LEVEL || "info" });

const WEB_URL = process.env.WEB_URL || "http://web:3000";
const INTERNAL_KEY = process.env.INTERNAL_API_KEY;
const SESSION_NAME = process.env.WA_SESSION_NAME || "tenant-demo-lavanderia";
const AUTH_DIR = process.env.WA_AUTH_DIR || path.join(process.cwd(), "auth", SESSION_NAME);
const POLL_MS = Number(process.env.WA_POLL_MS || 5000);

if (!INTERNAL_KEY) {
  logger.error("INTERNAL_API_KEY es obligatorio");
  process.exit(1);
}

fs.mkdirSync(AUTH_DIR, { recursive: true });

let sock = null;
let starting = false;
let connected = false;

async function api(pathname, options = {}) {
  const res = await fetch(`${WEB_URL}${pathname}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "x-internal-key": INTERNAL_KEY,
      ...(options.headers || {}),
    },
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(json.error || `HTTP ${res.status}`);
  }
  return json;
}

async function reportStatus(isConnected, phoneNumber = null) {
  connected = isConnected;
  try {
    await api("/api/internal/whatsapp/status", {
      method: "POST",
      body: JSON.stringify({
        sessionName: SESSION_NAME,
        connected: isConnected,
        phoneNumber,
      }),
    });
  } catch (err) {
    logger.warn({ err: err.message }, "No se pudo reportar estado WA");
  }
}

async function startSocket() {
  if (starting) return;
  starting = true;

  try {
    const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);
    const { version } = await fetchLatestBaileysVersion();

    sock = makeWASocket({
      version,
      auth: {
        creds: state.creds,
        keys: makeCacheableSignalKeyStore(state.keys, logger),
      },
      logger,
      printQRInTerminal: false,
      syncFullHistory: false,
      markOnlineOnConnect: false,
    });

    sock.ev.on("creds.update", saveCreds);

    sock.ev.on("connection.update", async (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        logger.info("Escanea el QR de WhatsApp:");
        qrcode.generate(qr, { small: true });
        await reportStatus(false);
      }

      if (connection === "open") {
        const phone = sock.user?.id?.split(":")[0] || null;
        logger.info({ phone }, "WhatsApp conectado");
        await reportStatus(true, phone);
      }

      if (connection === "close") {
        await reportStatus(false);
        const statusCode = lastDisconnect?.error?.output?.statusCode;
        const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
        logger.warn({ statusCode, shouldReconnect }, "Conexión WA cerrada");
        sock = null;
        if (shouldReconnect) {
          setTimeout(() => startSocket(), 3000);
        } else {
          logger.error("Sesión cerrada. Elimina auth/ y vuelve a escanear QR.");
        }
      }
    });
  } catch (err) {
    logger.error({ err }, "Error iniciando Baileys");
    setTimeout(() => startSocket(), 5000);
  } finally {
    starting = false;
  }
}

async function sendWithOptionalPdf(msg) {
  const jid = `${msg.phone}@s.whatsapp.net`;
  await sock.sendMessage(jid, { text: msg.body });

  if (!msg.mediaUrl) return;

  try {
    const url = msg.mediaUrl.includes("key=")
      ? msg.mediaUrl
      : msg.mediaUrl.includes("?")
        ? `${msg.mediaUrl}&key=${INTERNAL_KEY}`
        : `${msg.mediaUrl}?key=${INTERNAL_KEY}`;

    const res = await fetch(url);
    if (!res.ok) throw new Error(`PDF HTTP ${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());
    await sock.sendMessage(jid, {
      document: buf,
      mimetype: "application/pdf",
      fileName: `comprobante-${msg.packageId || "lav"}.pdf`,
    });
  } catch (err) {
    logger.warn({ err: err.message }, "PDF no enviado, texto sí");
  }
}

async function processQueue() {
  if (!sock || !connected) return;

  let claimed = [];
  try {
    const json = await api("/api/internal/messages/claim?limit=5", {
      method: "POST",
    });
    claimed = json.data || [];
  } catch (err) {
    logger.warn({ err: err.message }, "No se pudo reclamar cola");
    return;
  }

  for (const msg of claimed) {
    if (msg.sessionName && msg.sessionName !== SESSION_NAME) {
      await api(`/api/internal/messages/${msg.id}/result`, {
        method: "POST",
        body: JSON.stringify({
          ok: false,
          error: `Sesión incorrecta (${msg.sessionName})`,
        }),
      });
      continue;
    }

    try {
      await sendWithOptionalPdf(msg);
      await api(`/api/internal/messages/${msg.id}/result`, {
        method: "POST",
        body: JSON.stringify({ ok: true }),
      });
      logger.info({ id: msg.id, phone: msg.phone }, "Mensaje enviado");
    } catch (err) {
      logger.error({ id: msg.id, err: err.message }, "Fallo envío");
      await api(`/api/internal/messages/${msg.id}/result`, {
        method: "POST",
        body: JSON.stringify({ ok: false, error: err.message }),
      });
    }
  }
}

async function main() {
  logger.info({ SESSION_NAME, WEB_URL }, "Iniciando worker WhatsApp");
  await startSocket();
  setInterval(processQueue, POLL_MS);

  const port = Number(process.env.PORT || 3100);
  createServer((req, res) => {
    if (req.url === "/health") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          status: connected ? "ok" : "starting",
          session: SESSION_NAME,
          connected,
        })
      );
      return;
    }
    res.writeHead(404);
    res.end();
  }).listen(port, () => logger.info(`Health WA en :${port}`));
}

main().catch((err) => {
  logger.error(err);
  process.exit(1);
});
