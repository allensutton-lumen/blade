import type { NextFunction, Request, Response } from 'express';
import jwt, { type JwtHeader, type JwtPayload } from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';
import { logger } from '../utils/logger';
import { getAuthorizedGroupIds, getAzureConfig } from '../utils/secrets';

export interface AuthenticatedUser { id: string; email: string; name: string; groups: string[]; isAdmin: boolean; role?: 'user' | 'admin'; }
export type AuthenticatedRequest = Request & { user?: AuthenticatedUser; correlationId?: string };
let jwksClientInstance: ReturnType<typeof jwksClient> | null = null;

async function getJwksClient() {
  if (!jwksClientInstance) {
    const cfg = await getAzureConfig();
    if (!cfg.tenantId) throw new Error('Azure tenant ID is not configured');
    jwksClientInstance = jwksClient({ jwksUri: `https://login.microsoftonline.com/${cfg.tenantId}/discovery/v2.0/keys`, cache: true, rateLimit: true, jwksRequestsPerMinute: 10 });
  }
  return jwksClientInstance;
}

function getKey(header: JwtHeader, callback: jwt.SigningKeyCallback): void {
  void getJwksClient().then((client) => client.getSigningKey(header.kid!, (error, key) => error ? callback(error) : callback(null, key!.getPublicKey()))).catch((error) => callback(error as Error));
}

async function verifyToken(token: string): Promise<JwtPayload> {
  const cfg = await getAzureConfig();
  return new Promise((resolve, reject) => {
    jwt.verify(token, getKey, {
      audience: [cfg.clientId, `api://${cfg.clientId}`],
      issuer: [`https://login.microsoftonline.com/${cfg.tenantId}/v2.0`, `https://sts.windows.net/${cfg.tenantId}/`],
      algorithms: ['RS256'],
    }, (error, decoded) => error ? reject(error) : resolve(decoded as JwtPayload));
  });
}

export async function authenticate(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  const isLambda = process.env.IS_LAMBDA === 'true' || Boolean(process.env.AWS_LAMBDA_FUNCTION_NAME);
  if (process.env.NODE_ENV === 'development' && process.env.SKIP_AUTH === 'true' && !isLambda) {
    logger.warn('Authentication bypass enabled for local development only', { correlationId: req.correlationId });
    req.user = { id: 'dev-user', email: 'dev@lumen.com', name: 'Dev User', groups: [], isAdmin: true, role: 'admin' };
    next();
    return;
  }
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) { res.status(401).json({ status: 'error', message: 'Authentication required' }); return; }
    const token = authHeader.slice(7);
    const decoded = await verifyToken(token);
    const { adminsGroupId } = await getAuthorizedGroupIds();
    const groups = Array.isArray(decoded.groups) ? decoded.groups.filter((group): group is string => typeof group === 'string') : [];
    req.user = {
      id: String(decoded.oid || decoded.sub || ''),
      email: String(decoded.preferred_username || decoded.upn || decoded.email || ''),
      name: String(decoded.name || decoded.preferred_username || decoded.upn || 'Unknown User'),
      groups,
      isAdmin: Boolean(adminsGroupId && groups.includes(adminsGroupId)),
      role: adminsGroupId && groups.includes(adminsGroupId) ? 'admin' : 'user',
    };
    next();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error('Authentication failed', { correlationId: req.correlationId, error: message });
    res.status(401).json({ status: 'error', message: 'Invalid or expired token' });
  }
}
