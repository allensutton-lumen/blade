import { BrowserCacheLocation, LogLevel, type Configuration, type RedirectRequest } from '@azure/msal-browser';

export interface RuntimeFrontendConfig {
  tenantId: string;
  clientId: string;
  appName: string;
}

let runtimeClientId = '';

export function setRuntimeAuthConfig(clientId: string): void {
  runtimeClientId = clientId;
}

export async function fetchRuntimeConfig(): Promise<RuntimeFrontendConfig> {
  const response = await fetch('/api/config');
  if (!response.ok) {
    throw new Error(`Unable to load runtime config (${response.status})`);
  }
  const payload = (await response.json()) as { tenantId?: string; clientId?: string; appName?: string; msal_tenant_id?: string; msal_client_id?: string; app_name?: string };
  const tenantId = payload.tenantId ?? payload.msal_tenant_id ?? '';
  const clientId = payload.clientId ?? payload.msal_client_id ?? '';
  const appName = payload.appName ?? payload.app_name ?? 'BLADE';
  if (!tenantId || !clientId) throw new Error('Runtime config is missing tenantId or clientId');
  return { tenantId, clientId, appName };
}

export function createMsalConfig(clientId: string, tenantId: string): Configuration {
  return {
    auth: {
      clientId,
      authority: `https://login.microsoftonline.com/${tenantId}`,
      redirectUri: window.location.origin,
      postLogoutRedirectUri: window.location.origin,
    },
    cache: {
      cacheLocation: BrowserCacheLocation.LocalStorage,
    },
    system: {
      loggerOptions: {
        logLevel: LogLevel.Warning,
        piiLoggingEnabled: false,
      },
    },
  };
}

export function createLoginRequest(clientId: string): RedirectRequest {
  return { scopes: [`api://${clientId}/access_as_user`] };
}

export function getLoginRequest(): RedirectRequest {
  if (!runtimeClientId) throw new Error('MSAL runtime config has not been initialized');
  return createLoginRequest(runtimeClientId);
}
