import express, { type NextFunction, type Request, type Response } from 'express';
import path from 'node:path';
import fs from 'node:fs';
import cors from 'cors';
import helmet from 'helmet';
import { authenticate, type AuthenticatedRequest } from './middleware/auth';
import { authorize, checkAuthorization } from './middleware/authorize';
import { correlationMiddleware } from './middleware/correlation';
import { requestLogger } from './middleware/requestLogger';
import { standardLimiter, strictLimiter } from './middleware/rateLimiter';
import { body, handleValidationErrors } from './middleware/validation';
import { configHandler } from './handlers/config';
import { healthHandler } from './handlers/health';
import { logger } from './utils/logger';

const app = express();
const allowlist = (process.env.FRONTEND_URL || '').split(',').map((value) => value.trim()).filter(Boolean);

app.use(helmet());
app.use(cors({
  origin(origin, callback) {
    if (!origin) { callback(null, false); return; }
    callback(null, allowlist.includes(origin));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Correlation-ID'],
  exposedHeaders: ['X-Correlation-ID'],
}));
app.use(express.json({ limit: '1mb' }));
app.use(correlationMiddleware);
app.use(requestLogger);

app.get('/api/health', healthHandler);
app.get('/api/config', configHandler);

app.use('/api', authenticate);
app.get('/api/auth-status', standardLimiter, (req: AuthenticatedRequest, res: Response) => { res.json({ authenticated: true, user: req.user }); });
app.get('/api/authorization', standardLimiter, checkAuthorization);
app.get('/api/example', standardLimiter, authorize, (req: AuthenticatedRequest, res: Response) => { res.json({ status: 'success', message: 'BLADE placeholder route is working', user: req.user }); });
app.post('/api/example', strictLimiter, authorize, body('name').trim().notEmpty().withMessage('name is required').isLength({ max: 100 }).withMessage('name must be 100 characters or fewer'), handleValidationErrors, (req: AuthenticatedRequest, res: Response) => { res.status(201).json({ status: 'success', message: 'Validated placeholder payload received', submittedBy: req.user?.email ?? null, data: { name: String(req.body.name) } }); });

if (process.env.NODE_ENV === 'production') {
  const publicDir = path.join(__dirname, 'public');
  if (fs.existsSync(publicDir)) {
    app.use(express.static(publicDir));
    app.get('*', (_req: Request, res: Response) => { res.sendFile(path.join(publicDir, 'index.html')); });
  }
}

app.use((error: unknown, req: Request, res: Response, _next: NextFunction) => {
  const message = error instanceof Error ? error.message : 'Internal server error';
  const status = typeof error === 'object' && error !== null && 'status' in error ? Number((error as { status?: number }).status) : 500;
  logger.error('Unhandled request error', { correlationId: (req as AuthenticatedRequest).correlationId, error: message, path: req.path, method: req.method });
  res.status(Number.isFinite(status) ? status : 500).json({ status: 'error', message });
});

export default app;
