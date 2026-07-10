import { useEffect } from 'react';
import { MsalProvider } from '@azure/msal-react';
import type { IPublicClientApplication } from '@azure/msal-browser';
import { AppHeader } from './components/AppHeader/AppHeader';
import { LoginPage } from './components/LoginPage/LoginPage';
import { configureApiClient } from './api/client';
import { useAuth } from './auth/useAuth';
import './App.css';

interface AppProps {
  msalInstance: IPublicClientApplication;
  appName: string;
}

function AppContent({ appName }: { appName: string }) {
  const { isAuthenticated, isLoading, login, logout, user, getAccessToken } = useAuth();

  useEffect(() => {
    configureApiClient({ getAccessToken, onUnauthorized: login });
  }, [getAccessToken, login]);

  if (isLoading) return <div className="app-loading">Checking Lumen sign-in…</div>;
  if (!isAuthenticated) return <LoginPage appName={appName} onLogin={login} />;

  return (
    <div className="app-shell">
      <AppHeader appName={appName} userName={user?.name ?? user?.email ?? 'Lumen User'} onLogout={logout} />
      <main className="app-main">
        <section className="app-hero">
          <h1>{appName}</h1>
          <p>BLADE provides the production-ready framework for Lumen AI-developed applications.</p>
          <p className="app-note">TODO: Add your app routes/content here.</p>
        </section>
      </main>
    </div>
  );
}

export default function App({ msalInstance, appName }: AppProps) {
  return <MsalProvider instance={msalInstance}><AppContent appName={appName} /></MsalProvider>;
}
