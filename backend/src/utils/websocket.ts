import { Server as HttpServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import logger from './logger';

let wss: WebSocketServer | null = null;

export function initWebSocket(server: HttpServer) {
  wss = new WebSocketServer({ server, path: '/ws' });
  const ws = wss;
  ws.on('connection', (socket) => {
    logger.info({ clients: ws.clients.size }, 'WebSocket cliente conectado');
    socket.on('close', () => {
      logger.info({ clients: ws.clients.size }, 'WebSocket cliente desconectado');
    });
    socket.on('error', (err) => {
      logger.warn({ err: err.message }, 'WebSocket erro');
    });
  });
  logger.info('WebSocket server inicializado em /ws');
}

export function broadcast(event: string, data: any) {
  if (!wss) return;
  const msg = JSON.stringify({ event, data, timestamp: new Date().toISOString() });
  let count = 0;
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(msg);
      count++;
    }
  });
  if (count > 0) logger.debug({ event, clients: count }, 'WebSocket broadcast');
}

export function getWssStats() {
  return { connected: wss?.clients?.size || 0 };
}
