import type { Request, Response } from 'express';

export function healthHandler(_req: Request, res: Response): void {
  res.json({ status: 'ok', service: process.env.SERVICE_NAME || 'blade-backend', timestamp: new Date().toISOString() });
}
