import express from 'express';
import rateLimit from 'express-rate-limit';
import jwt from 'jsonwebtoken';
import { authService } from './auth.service';
import { auditService } from '../audit/audit.service';
import { getJwtSecret } from '../../middleware/authMiddleware';
import { asyncHandler } from '../../middleware/asyncHandler';

const router = express.Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { message: 'Muitas tentativas de login. Tente novamente em 15 minutos.' },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/login', loginLimiter, asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await authService.login(email, password);
  auditService.registrar({ usuarioId: user.id, acao: 'login', recurso: 'auth', detalhes: `Login: ${email}` }).catch(e => console.error('[Audit]', e));
  res.json(user);
}));

router.post('/register', asyncHandler(async (req, res) => {
  const { email, password, key } = req.body;
  const user = await authService.register(email, password, key);
  auditService.registrar({ usuarioId: user.id, acao: 'registrar', recurso: 'auth', detalhes: `Registro: ${email} com role ${user.role}` }).catch(e => console.error('[Audit]', e));
  res.status(201).json(user);
}));

router.get('/usuarios', asyncHandler(async (req, res) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Não autorizado' });
  }
  jwt.verify(header.slice(7), getJwtSecret());
  const users = await authService.listarUsuarios();
  res.json(users);
}));

export default router;
