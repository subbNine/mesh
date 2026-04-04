import * as http from 'node:http';
import * as WebSocket from 'ws';
import * as jwt from 'jsonwebtoken';
import * as Y from 'yjs';
import axios from 'axios';
// y-websocket ships a CJS util — require() avoids ESM interop issues
// eslint-disable-next-line @typescript-eslint/no-require-imports
const yUtils = require('y-websocket/bin/utils');

const WS_PORT = process.env.WS_PORT || 1234;
const JWT_SECRET = process.env.JWT_SECRET || 'secret';
const API_PORT = process.env.PORT || 3000;
const API_URL = `http://localhost:${API_PORT}`;

// ─── Internal service JWT ─────────────────────────────────────────────────────
// The WS server mints its own short-lived token to authenticate internal
// calls to the NestJS canvas endpoints (GET/POST /canvas/:taskId).
function mintServiceToken(): string {
  return jwt.sign(
    { sub: 'ws-server', role: 'service' },
    JWT_SECRET,
    { expiresIn: '1h' },
  );
}

let serviceToken = mintServiceToken();
// Refresh every 50 min so it never expires during a long dev session
setInterval(() => { serviceToken = mintServiceToken(); }, 50 * 60 * 1000);

function apiHeaders() {
  return { Authorization: `Bearer ${serviceToken}` };
}

// ─── Yjs persistence (load from / save to NestJS canvas API) ─────────────────
yUtils.setPersistence({
  bindState: async (docName: string, ydoc: Y.Doc) => {
    try {
      const response = await axios.get(`${API_URL}/canvas/${docName}`, {
        responseType: 'arraybuffer',
        headers: apiHeaders(),
      });
      if (response.data && response.data.byteLength > 0) {
        Y.applyUpdate(ydoc, new Uint8Array(response.data));
        console.log(`[WS] Loaded "${docName}" (${response.data.byteLength} bytes)`);
      }
    } catch (err: any) {
      if (err.response?.status === 404) {
        console.log(`[WS] No existing doc for "${docName}" — starting fresh`);
      } else {
        console.error(`[WS] bindState error for "${docName}":`, err.message);
      }
    }
  },

  writeState: async (docName: string, ydoc: Y.Doc) => {
    try {
      const update = Y.encodeStateAsUpdate(ydoc);
      await axios.post(`${API_URL}/canvas/${docName}`, Buffer.from(update), {
        headers: {
          'Content-Type': 'application/octet-stream',
          ...apiHeaders(),
        },
      });
      console.log(`[WS] Saved "${docName}"`);
    } catch (err: any) {
      console.error(`[WS] writeState error for "${docName}":`, err.message);
    }
  },
});

// ─── HTTP server (health check endpoint) ─────────────────────────────────────
const server = http.createServer((_req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Yjs WebSocket Sync Server\n');
});

// ─── WebSocket server ─────────────────────────────────────────────────────────
const wss = new WebSocket.Server({ noServer: true });

wss.on('connection', (
  conn: WebSocket.WebSocket,
  req: http.IncomingMessage,
  { docName }: { docName: string },
) => {
  yUtils.setupWSConnection(conn, req, { docName, gc: true });
  console.log(`[WS] Connected to room "${docName}" (peers: ${wss.clients.size})`);
});

// ─── HTTP → WebSocket upgrade with JWT auth ───────────────────────────────────
server.on('upgrade', (request: http.IncomingMessage, socket: any, head: Buffer) => {
  try {
    const url = new URL(request.url ?? '', `http://${request.headers.host}`);

    // y-websocket client appends /{roomname} to the base URL
    // e.g. ws://localhost:1234/{taskId}?token=...
    // pathname = "/{taskId}" — strip the leading slash
    const docName = url.pathname.replace(/^\/+/, '').split('/')[0];

    if (!docName) {
      console.warn('[WS] Upgrade rejected: no room name in path');
      socket.write('HTTP/1.1 400 Bad Request\r\n\r\n');
      socket.destroy();
      return;
    }

    // JWT is passed as ?token= by the frontend WebsocketProvider params
    const token = url.searchParams.get('token');
    if (!token) {
      console.warn(`[WS] Upgrade rejected for "${docName}": no token`);
      socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
      socket.destroy();
      return;
    }

    let decoded: any;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch {
      console.warn(`[WS] Upgrade rejected for "${docName}": invalid token`);
      socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
      socket.destroy();
      return;
    }

    wss.handleUpgrade(request, socket, head, (ws) => {
      (ws as any).userId = decoded?.sub ?? decoded?.id;
      wss.emit('connection', ws, request, { docName });
    });
  } catch (err) {
    console.error('[WS] Upgrade error:', err);
    socket.destroy();
  }
});

// ─── Start ────────────────────────────────────────────────────────────────────
server.listen(WS_PORT, () => {
  console.log(`[WS] Sync server listening on port ${WS_PORT}`);
});
