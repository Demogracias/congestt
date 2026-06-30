import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';

export function errorMiddleware(err: Error, req: Request, res: Response, next: NextFunction) {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      message: err.message,
      ...((err as any).fields ? { fields: (err as any).fields } : {}),
    });
    return;
  }
  console.error('[Error]', err.message);
  res.status(500).json({ message: 'Erro interno do servidor' });
}
