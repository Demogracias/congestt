import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'congestt-dev-secret-key-2026';

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
    req.usuario = { id: decoded.id, email: decoded.email, role: decoded.role, level: decoded.level };
    next();
  } catch {
    return res.status(401).json({ message: 'Token inválido ou expirado' });
  }
}

export function generateToken(user: { id: string; email: string; role: string; level: number }): string {
  return jwt.sign({ id: user.id, email: user.email, role: user.role, level: user.level }, JWT_SECRET, { expiresIn: '24h' });
}
