import type { Request, Response } from 'express';
import { getAzureConfig } from '../utils/secrets';

export async function configHandler(_req: Request, res: Response): Promise<void> {
  try {
    const azure = await getAzureConfig();
    res.json({ tenantId: azure.tenantId, clientId: azure.clientId, appName: process.env.APP_NAME || 'BLADE', msal_tenant_id: azure.tenantId, msal_client_id: azure.clientId, app_name: process.env.APP_NAME || 'BLADE' });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ status: 'error', message: 'Failed to load runtime config', detail: message });
  }
}
