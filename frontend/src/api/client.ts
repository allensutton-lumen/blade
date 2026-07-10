const BASE = '/api';

type AccessTokenProvider = () => Promise<string | null>;
type UnauthorizedHandler = () => Promise<void> | void;

let getAccessToken: AccessTokenProvider | null = null;
let onUnauthorized: UnauthorizedHandler | null = null;

export function configureApiClient(config: { getAccessToken: AccessTokenProvider; onUnauthorized: UnauthorizedHandler }): void {
  getAccessToken = config.getAccessToken;
  onUnauthorized = config.onUnauthorized;
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set('Content-Type', 'application/json');
  const token = getAccessToken ? await getAccessToken() : null;
  if (token) headers.set('Authorization', `Bearer ${token}`);
  const response = await fetch(`${BASE}${path}`, { ...init, headers });
  if (response.status === 401) {
    await onUnauthorized?.();
    throw new Error('Unauthorized');
  }
  if (!response.ok) {
    const payload = (await response.json().catch(() => ({ message: response.statusText }))) as { message?: string; error?: string };
    throw new Error(payload.message ?? payload.error ?? `HTTP ${response.status}`);
  }
  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

export const get = <T,>(path: string) => request<T>(path, { method: 'GET' });
export const post = <T,>(path: string, body?: unknown) => request<T>(path, { method: 'POST', body: body === undefined ? undefined : JSON.stringify(body) });
export const put = <T,>(path: string, body?: unknown) => request<T>(path, { method: 'PUT', body: body === undefined ? undefined : JSON.stringify(body) });
export const del = <T,>(path: string) => request<T>(path, { method: 'DELETE' });
