import { randomUUID } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';
import { withLogContext } from '../utils/logger';

type CorrelatedRequest = Request & { correlationId?: string };

export function correlationMiddleware(req: Request, res: Response, next: NextFunction): void {
  const typedReq = req as CorrelatedRequest;
  const incoming = req.headers['x-correlation-id'] ?? req.headers['x-request-id'];
  const value = Array.isArray(incoming) ? incoming[0] : incoming;
  const correlationId = typeof value === 'string' && /^[A-Za-z0-9._:-]{1,128}$/.test(value) ? value : randomUUID();
  typedReq.correlationId = correlationId;
  res.setHeader('X-Correlation-ID', correlationId);
  withLogContext({ correlationId }, () => next());
}
