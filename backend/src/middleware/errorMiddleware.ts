import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';
import logger from '../utils/logger';

export function errorMiddleware(err: Error, req: Request, res: Response, next: NextFunction) {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      message: err.message,
      ...((err as any).fields ? { fields: (err as any).fields } : {}),
    });
    return;
  }
  logger.error({ err: err.message }, 'Erro interno');
  res.status(500).json({ message: 'Erro interno do servidor' });
}
