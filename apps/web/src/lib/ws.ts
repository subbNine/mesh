import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';

export function connectToCanvas(taskId: string, token: string) {
  const ydoc = new Y.Doc();

  // Base URL only — y-websocket will append "/{taskId}" automatically.
  // Pass the JWT as a query param so the server can authenticate the upgrade.
  let wsBaseUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:3000/canvas';

  // Automatically upgrade to secure websocket (wss) if the site is loaded over HTTPS to prevent Mixed Content errors
  if (typeof globalThis.window !== 'undefined' && globalThis.window.location.protocol === 'https:' && wsBaseUrl.startsWith('ws://')) {
    wsBaseUrl = wsBaseUrl.replace('ws://', 'wss://');
  }

  const provider = new WebsocketProvider(wsBaseUrl, `${taskId}?token=${token}`, ydoc);

  return { ydoc, provider, awareness: provider.awareness };
}

export function disconnectFromCanvas(provider: WebsocketProvider) {
  try {
    provider.awareness?.setLocalState(null);
    provider.disconnect();
  } finally {
    provider.destroy();
  }
}
