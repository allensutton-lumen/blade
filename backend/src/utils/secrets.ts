import { GetSecretValueCommand, SecretsManagerClient } from '@aws-sdk/client-secrets-manager';
import { logger } from './logger';

export interface AzureConfig {
  tenantId: string;
  clientId: string;
  clientSecret?: string;
  authorizedUsersGroupId?: string;
  authorizedAdminsGroupId?: string;
}

const secretsCache = new Map<string, Record<string, string>>();
let smClient: SecretsManagerClient | null = null;
let azureConfigCache: AzureConfig | null = null;

function getSecretsClient(): SecretsManagerClient {
  if (!smClient) smClient = new SecretsManagerClient({ region: process.env.AWS_REGION || process.env.AWS_REGION_NAME || 'us-east-2' });
  return smClient;
}

async function loadSecret(secretPath: string): Promise<Record<string, string>> {
  if (secretsCache.has(secretPath)) return secretsCache.get(secretPath)!;
  try {
    const response = await getSecretsClient().send(new GetSecretValueCommand({ SecretId: secretPath }));
    const parsed = JSON.parse(response.SecretString || '{}') as Record<string, string>;
    secretsCache.set(secretPath, parsed);
    logger.info('Loaded secret from AWS Secrets Manager', { secretPath });
    return parsed;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.warn('Unable to load secret from AWS Secrets Manager', { secretPath, error: message });
    return {};
  }
}

async function getConfigValue(envKeys: string[], secretPathEnvKey?: string, secretKeys: string[] = []): Promise<string> {
  for (const envKey of envKeys) {
    const value = process.env[envKey];
    if (value) return value;
  }
  if (!secretPathEnvKey || secretKeys.length === 0) return '';
  const secretPath = process.env[secretPathEnvKey];
  if (!secretPath) return '';
  const secret = await loadSecret(secretPath);
  for (const secretKey of secretKeys) {
    const value = secret[secretKey];
    if (value) return value;
  }
  return '';
}

export async function getAzureConfig(): Promise<AzureConfig> {
  if (azureConfigCache) return azureConfigCache;
  azureConfigCache = {
    tenantId: await getConfigValue(['LUMEN_AZURE_TENANT_ID', 'AZURE_TENANT_ID'], 'SECRET_PATH_AZURE', ['tenantId', 'tenant_id']),
    clientId: await getConfigValue(['BLADE_AZURE_CLIENT_ID', 'AZURE_CLIENT_ID', 'MSAL_CLIENT_ID'], 'SECRET_PATH_AZURE', ['clientId', 'client_id']),
    clientSecret: await getConfigValue(['BLADE_AZURE_CLIENT_SECRET', 'AZURE_CLIENT_SECRET'], 'SECRET_PATH_AZURE', ['clientSecret', 'client_secret']),
    authorizedUsersGroupId: await getConfigValue(['AUTHORIZED_USERS_GROUP_ID'], 'SECRET_PATH_AZURE', ['authorizedUsersGroupId', 'authorized_users_group_id']),
    authorizedAdminsGroupId: await getConfigValue(['AUTHORIZED_ADMINS_GROUP_ID'], 'SECRET_PATH_AZURE', ['authorizedAdminsGroupId', 'authorized_admins_group_id']),
  };
  return azureConfigCache;
}

export async function initializeSecrets(): Promise<void> { await getAzureConfig(); }
export async function getAuthorizedGroupIds(): Promise<{ usersGroupId?: string; adminsGroupId?: string }> {
  const azureConfig = await getAzureConfig();
  return { usersGroupId: azureConfig.authorizedUsersGroupId || undefined, adminsGroupId: azureConfig.authorizedAdminsGroupId || undefined };
}
export function clearSecretsCache(): void { azureConfigCache = null; secretsCache.clear(); }
