import type { NextFunction, Response } from 'express';
import type { AuthenticatedRequest } from './auth';
import { logger } from '../utils/logger';
import { getAuthorizedGroupIds } from '../utils/secrets';

export async function checkUserRole(userGroups: string[]) {
  const { usersGroupId, adminsGroupId } = await getAuthorizedGroupIds();
  const hasConfiguredGroups = Boolean(usersGroupId || adminsGroupId);
  const isAdmin = Boolean(adminsGroupId && userGroups.includes(adminsGroupId));
  const isUser = Boolean(usersGroupId && userGroups.includes(usersGroupId));
  const role: 'admin' | 'user' = isAdmin ? 'admin' : 'user';
  return { usersGroupId, adminsGroupId, isAdmin, isUser, isAuthorized: hasConfiguredGroups ? isAdmin || isUser : true, role, hasConfiguredGroups };
}

export async function authorize(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  if (!req.user) { res.status(401).json({ status: 'error', message: 'Authentication required' }); return; }
  const roleCheck = await checkUserRole(req.user.groups || []);
  if (!roleCheck.isAuthorized) { logger.warn('Authorization failed', { correlationId: req.correlationId, email: req.user.email }); res.status(403).json({ status: 'error', message: 'Access denied' }); return; }
  req.user.role = roleCheck.role; req.user.isAdmin = roleCheck.isAdmin; next();
}

export async function authorizeAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  if (!req.user) { res.status(401).json({ status: 'error', message: 'Authentication required' }); return; }
  const roleCheck = await checkUserRole(req.user.groups || []);
  if (!roleCheck.isAdmin && roleCheck.hasConfiguredGroups) { res.status(403).json({ status: 'error', message: 'Admin access required' }); return; }
  req.user.role = 'admin'; req.user.isAdmin = true; next();
}

export async function checkAuthorization(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (!req.user) { res.status(401).json({ status: 'error', message: 'Authentication required' }); return; }
  const roleCheck = await checkUserRole(req.user.groups || []);
  res.json({ status: 'success', authorized: roleCheck.isAuthorized, role: req.user.isAdmin ? 'admin' : roleCheck.role, isAdmin: req.user.isAdmin, user: { id: req.user.id, email: req.user.email, name: req.user.name }, authorization: { usersGroupId: roleCheck.usersGroupId ?? null, adminsGroupId: roleCheck.adminsGroupId ?? null, userGroups: req.user.groups, hasConfiguredGroups: roleCheck.hasConfiguredGroups } });
}
