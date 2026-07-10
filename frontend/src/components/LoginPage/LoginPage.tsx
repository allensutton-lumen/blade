import './LoginPage.css';

interface LoginPageProps {
  appName: string;
  onLogin: () => Promise<void> | void;
}

export function LoginPage({ appName, onLogin }: LoginPageProps) {
  return (
    <main className="login-page">
      <section className="login-page__card">
        <div className="login-page__badge">BLADE</div>
        <h1>{appName}</h1>
        <p>Sign in with your Lumen Entra ID account to access the application template and protected APIs.</p>
        <button type="button" className="chi-button -primary -lg" onClick={() => void onLogin()}>Continue with Lumen SSO</button>
      </section>
    </main>
  );
}
