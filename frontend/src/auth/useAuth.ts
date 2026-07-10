import { InteractionStatus } from '@azure/msal-browser';
import { useMsal } from '@azure/msal-react';
import { getLoginRequest } from './msalConfig';

export function useAuth() {
  const { instance, accounts, inProgress } = useMsal();
  const account = accounts[0] ?? null;
  const isLoading = inProgress !== InteractionStatus.None;

  async function login(): Promise<void> {
    if (inProgress !== InteractionStatus.None) return;
    await instance.loginRedirect(getLoginRequest());
  }

  async function logout(): Promise<void> {
    await instance.logoutRedirect({ account: account ?? undefined });
  }

  async function getAccessToken(): Promise<string | null> {
    if (!account) return null;
    try {
      const token = await instance.acquireTokenSilent({ ...getLoginRequest(), account });
      return token.accessToken;
    } catch {
      await login();
      return null;
    }
  }

  return {
    isAuthenticated: Boolean(account),
    isLoading,
    user: account ? { name: account.name ?? account.username, email: account.username } : null,
    login,
    logout,
    getAccessToken,
  };
}
