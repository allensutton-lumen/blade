import { beforeEach, describe, expect, it, vi } from 'vitest';
import { configureApiClient, del, get, post, put } from '../api/client';

describe('api client', () => {
  const accessToken = vi.fn<() => Promise<string | null>>();
  const redirectToLogin = vi.fn();

  beforeEach(() => {
    accessToken.mockReset();
    redirectToLogin.mockReset();
    vi.stubGlobal('fetch', vi.fn());
    configureApiClient({ getAccessToken: accessToken, onUnauthorized: redirectToLogin });
  });

  it('adds the Authorization header for GET requests', async () => {
    accessToken.mockResolvedValue('test-token');
    vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify({ ok: true }), { status: 200 }));
    await get<{ ok: boolean }>('/health');
    const [, requestInit] = vi.mocked(fetch).mock.calls[0];
    const headers = requestInit?.headers as Headers;
    expect(headers.get('Authorization')).toBe('Bearer test-token');
  });

  it('serializes JSON bodies for POST and PUT', async () => {
    accessToken.mockResolvedValue(null);
    vi.mocked(fetch)
      .mockResolvedValueOnce(new Response(JSON.stringify({ created: true }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ created: true }), { status: 200 }));
    await post<{ created: boolean }>('/items', { name: 'blade' });
    await put<{ created: boolean }>('/items/1', { name: 'blade-updated' });
    expect(vi.mocked(fetch).mock.calls[0][1]?.body).toBe(JSON.stringify({ name: 'blade' }));
    expect(vi.mocked(fetch).mock.calls[1][1]?.body).toBe(JSON.stringify({ name: 'blade-updated' }));
  });

  it('supports DELETE requests', async () => {
    accessToken.mockResolvedValue(null);
    vi.mocked(fetch).mockResolvedValue(new Response(null, { status: 204 }));
    await del<void>('/items/1');
    expect(vi.mocked(fetch).mock.calls[0][1]?.method).toBe('DELETE');
  });

  it('redirects to login on 401 responses', async () => {
    accessToken.mockResolvedValue('expired-token');
    vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify({ message: 'nope' }), { status: 401 }));
    await expect(get('/protected')).rejects.toThrow('Unauthorized');
    expect(redirectToLogin).toHaveBeenCalledTimes(1);
  });
});
