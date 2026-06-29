import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import os from 'os';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

import authRouter from './modules/auth/auth.controller';
import { authMiddleware } from './middleware/authMiddleware';

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

function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name] || []) {
      if (iface.family === 'IPv4' && !iface.internal) return iface.address;
    }
  }
  return '127.0.0.1';
}

const PORT = process.env.PORT || 3001;
const HOST = '0.0.0.0';
app.listen(Number(PORT), HOST, () => {
  const ip = getLocalIP();
  console.log(`ConGestt rodando em:`);
  console.log(`  Local:   http://localhost:${PORT}`);
  console.log(`  Rede:    http://${ip}:${PORT}`);
  console.log(`  Login:   admin@congestt.com / 123`);
});
