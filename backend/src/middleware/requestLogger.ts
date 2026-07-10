import type { NextFunction, Request, Response } from 'express';
import { logger } from '../utils/logger';

type CorrelatedRequest = Request & { correlationId?: string };

export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const typedReq = req as CorrelatedRequest;
  const start = Date.now();
  res.on('finish', () => {
    logger.info('HTTP request', { correlationId: typedReq.correlationId, method: req.method, path: req.path, status: res.statusCode, durationMs: Date.now() - start });
  });
  next();
}
