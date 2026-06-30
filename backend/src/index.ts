import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import os from 'os';
import { exec } from 'child_process';

dotenv.config();

import logger from './utils/logger';
import { getMetrics, httpRequestCounter, httpErrorCounter, activeRequests } from './utils/metrics';
import { getDatabase } from './database/Database';

const startTime = Date.now();

// Validate required env vars
const PORT = parseInt(process.env.PORT || '3001', 10);
if (isNaN(PORT) || PORT < 1 || PORT > 65535) {
  logger.fatal({ port: process.env.PORT }, 'PORT inválida');
  process.exit(1);
}
const HOST = process.env.HOST || '0.0.0.0';

import { runSeed } from './database/Seed';
runSeed();

// Auto-backup on startup (async, non-blocking)
const backupScript = path.resolve(__dirname, '../backup.js');
try {
  exec(`node "${backupScript}"`, { shell: true as any, timeout: 30000 }, (err: any) => {
    if (err) logger.warn({ err: err.message.slice(0, 80) }, 'Backup ignorado');
  });
} catch { /* silently ignore backup errors */ }

const app = express();
app.use(cors({
  origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',').map(s => s.trim()) : '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());

// Request metrics + logging middleware
app.use((req, res, next) => {
  activeRequests.inc();
  const start = Date.now();
  res.on('finish', () => {
    activeRequests.dec();
    const labels = { method: req.method, path: req.route?.path || req.path, status: res.statusCode.toString() };
    httpRequestCounter.inc(labels);
    if (res.statusCode >= 400) httpErrorCounter.inc(labels);
    logger.info({ method: req.method, path: req.path, status: res.statusCode, duration: Date.now() - start }, 'request');
  });
  next();
});

// Observability routes (BEFORE auth middleware, no token needed)
app.get('/api/health', (req, res) => {
  let dbOk = false;
  try {
    getDatabase().prepare('SELECT 1').get();
    dbOk = true;
  } catch { /* db down */ }
  res.json({
    status: dbOk ? 'ok' : 'degraded',
    uptime: Math.floor((Date.now() - startTime) / 1000),
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    db: dbOk ? 'connected' : 'disconnected',
  });
});

app.get('/api/metrics', async (req, res) => {
  res.set('Content-Type', 'text/plain');
  res.send(await getMetrics());
});

import authRouter from './modules/auth/auth.controller';
import { authMiddleware } from './middleware/authMiddleware';
import { errorMiddleware } from './middleware/errorMiddleware';

// Auth routes são montadas PRIMEIRO (não passam pelo middleware)
app.use('/api/auth', authRouter);

// Middleware JWT protege TODAS as rotas abaixo
app.use('/api', authMiddleware);

import empresasRouter from './modules/empresas/empresas.controller';
import equipesRouter from './modules/equipes/equipes.controller';
import plannerRouter from './modules/planner/planner.controller';
import contabilRouter from './modules/contabil/contabil.controller';
import dashboardRouter from './modules/dashboard/dashboard.controller';
import relatoriosRouter from './modules/relatorios/relatorios.controller';
import auditRouter from './modules/audit/audit.controller';
import lgpdRouter from './modules/lgpd/lgpd.controller';

app.use('/api/empresas', empresasRouter);
app.use('/api/equipes', equipesRouter);
app.use('/api/planner', plannerRouter);
app.use('/api/contabil', contabilRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/relatorios', relatoriosRouter);
app.use('/api/audit', auditRouter);
app.use('/api/lgpd', lgpdRouter);

// Serve frontend static files in production
const frontendDist = path.resolve(__dirname, '../../frontend/dist');
app.use(express.static(frontendDist));

// SPA fallback - any non-API route serves the frontend
app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ message: 'API route not found' });
  }
  res.sendFile(path.join(frontendDist, 'index.html'));
});

// Error middleware (must be after all routes)
app.use(errorMiddleware);

function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name] || []) {
      if (iface.family === 'IPv4' && !iface.internal) return iface.address;
    }
  }
  return '127.0.0.1';
}

const server = app.listen(PORT, HOST, () => {
  const ip = getLocalIP();
  logger.info({ port: PORT, host: HOST, ip }, 'ConGestt iniciado');
  console.log(`\n  ConGestt rodando em:`);
  console.log(`  Local:   http://localhost:${PORT}`);
  console.log(`  Rede:    http://${ip}:${PORT}`);
  console.log(`  Login:   admin@congestt.com / 123`);
  console.log(`  Health:  http://localhost:${PORT}/api/health`);
  console.log(`  Metrics: http://localhost:${PORT}/api/metrics\n`);
});
server.on('error', (err: any) => {
  if (err.code === 'EADDRINUSE') {
    logger.fatal({ port: PORT }, 'Porta já está em uso');
    console.error(`[FATAL] Porta ${PORT} já está em uso. Feche o processo ou mude a variável PORT.`);
  } else {
    logger.fatal({ err: err.message }, 'Erro ao iniciar servidor');
    console.error('[FATAL] Erro ao iniciar servidor:', err.message);
  }
  process.exit(1);
});

process.on('uncaughtException', (err) => {
  logger.fatal({ err: err.message, stack: err.stack }, 'Exceção não tratada');
  console.error('[FATAL] Exceção não tratada:', err.message);
  console.error(err.stack);
  process.exit(1);
});
process.on('unhandledRejection', (reason) => {
  logger.fatal({ reason }, 'Promise rejeitada não tratada');
  console.error('[FATAL] Promise rejeitada não tratada:', reason);
  process.exit(1);
});
