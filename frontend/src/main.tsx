import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { PublicClientApplication } from '@azure/msal-browser';
import App from './App';
import './index.css';
import { createMsalConfig, fetchRuntimeConfig, setRuntimeAuthConfig } from './auth/msalConfig';

async function bootstrap() {
  const runtimeConfig = await fetchRuntimeConfig();
  setRuntimeAuthConfig(runtimeConfig.clientId);
  const msalInstance = new PublicClientApplication(createMsalConfig(runtimeConfig.clientId, runtimeConfig.tenantId));
  await msalInstance.initialize();
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App msalInstance={msalInstance} appName={runtimeConfig.appName} />
    </StrictMode>,
  );
}

void bootstrap().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : 'Unknown startup failure';
  const root = document.getElementById('root');
  if (root) {
    root.innerHTML = `<div style="padding:2rem;color:#ef4444;font-family:Segoe UI, sans-serif;">Failed to start BLADE: ${message}</div>`;
  }
});
