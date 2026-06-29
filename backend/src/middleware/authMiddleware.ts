import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

const DATA_DIR = path.resolve(__dirname, '../../../data');
const SECRET_FILE = path.join(DATA_DIR, '.jwt_secret');
const ENV_SECRET = process.env.JWT_SECRET;

function loadOrCreateSecret(): string {
  if (ENV_SECRET) return ENV_SECRET;
  try {
    if (fs.existsSync(SECRET_FILE)) {
      return fs.readFileSync(SECRET_FILE, 'utf-8').trim();
    }
  } catch (e) {
    console.error('[Auth] Erro ao ler JWT secret file:', e);
  }
  const generated = crypto.randomBytes(32).toString('hex');
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(SECRET_FILE, generated, 'utf-8');
  } catch (e) {
    console.error('[Auth] Erro ao salvar JWT secret file:', e);
  }
  return generated;
}

const JWT_SECRET = loadOrCreateSecret();

export function getJwtSecret(): string {
  return JWT_SECRET;
}

export interface AuthRequest extends Request {
  usuario?: { id: string; email: string; role: string; level: number };
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Token não fornecido' });
  }

  const token = header.slice(7);
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    if (!decoded.id || !decoded.email || !decoded.role || typeof decoded.level !== 'number') {
      return res.status(401).json({ message: 'Token inválido: payload malformado' });
    }
    req.usuario = { id: decoded.id, email: decoded.email, role: decoded.role, level: decoded.level };
    next();
  } catch (e) {
    console.error('[AuthMiddleware] JWT verify error:', e);
    return res.status(401).json({ message: 'Token inválido ou expirado' });
  }
}

export function generateToken(user: { id: string; email: string; role: string; level: number }): string {
  return jwt.sign({ id: user.id, email: user.email, role: user.role, level: user.level }, JWT_SECRET, { expiresIn: '24h' });
}
