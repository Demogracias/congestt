import express from 'express';
import { AuthService } from './auth.service';
import { auditService } from '../audit/audit.service';

const router = express.Router();
const authService = new AuthService();

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await authService.login(email, password);
    auditService.registrar({ usuarioId: user.id, acao: 'login', recurso: 'auth', detalhes: `Login: ${email}` }).catch(() => {});
    res.json(user);
  } catch (error: any) {
    res.status(401).json({ message: error.message });
  }
});

router.post('/register', async (req, res) => {
  try {
    const { email, password, key } = req.body;
    const user = await authService.register(email, password, key);
    auditService.registrar({ usuarioId: user.id, acao: 'registrar', recurso: 'auth', detalhes: `Registro: ${email} com role ${user.role}` }).catch(() => {});
    res.status(201).json(user);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

router.get('/usuarios', async (req, res) => {
  try {
    const users = await authService.listarUsuarios();
    res.json(users);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
