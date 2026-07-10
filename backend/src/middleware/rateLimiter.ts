import type { NextFunction, Request, RequestHandler, Response } from 'express';
import rateLimit from 'express-rate-limit';

interface Bucket { tokens: number; lastRefill: number; }
const buckets = new Map<string, Bucket>();

function tokenBucket(maxTokens: number, windowMs: number): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    if (process.env.NODE_ENV === 'development') return next();
    const key = ((req.headers['x-forwarded-for'] as string) || req.ip || 'unknown').split(',')[0].trim();
    const now = Date.now();
    const bucket = buckets.get(key) ?? { tokens: maxTokens, lastRefill: now };
    const elapsed = now - bucket.lastRefill;
    if (elapsed >= windowMs) { bucket.tokens = maxTokens; bucket.lastRefill = now; }
    if (bucket.tokens <= 0) { res.status(429).json({ status: 'error', message: 'Rate limit exceeded' }); return; }
    bucket.tokens -= 1; buckets.set(key, bucket); next();
  };
}

function expressLimiter(max: number, windowMs: number): RequestHandler {
  return rateLimit({ windowMs, max, standardHeaders: true, legacyHeaders: false, message: { status: 'error', message: 'Too many requests' } });
}

export const standardLimiter: RequestHandler[] = [tokenBucket(60, 60_000), expressLimiter(120, 15 * 60_000)];
export const strictLimiter: RequestHandler[] = [tokenBucket(15, 60_000), expressLimiter(30, 15 * 60_000)];
