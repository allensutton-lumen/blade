import './AppHeader.css';

interface AppHeaderProps {
  appName: string;
  userName: string;
  onLogout: () => Promise<void> | void;
}

export function AppHeader({ appName, userName, onLogout }: AppHeaderProps) {
  return (
    <header className="app-header">
      <div className="app-header__brand">
        <span className="app-header__logo" aria-hidden="true">
          <i className="chi-icon icon-circle-check-outline" />
        </span>
        <div>
          <div className="app-header__eyebrow">Lumen AI Engineering</div>
          <strong>{appName}</strong>
        </div>
      </div>
      <div className="app-header__actions">
        <span className="app-header__user">{userName}</span>
        <button type="button" className="chi-button -outline" onClick={() => void onLogout()}>Logout</button>
      </div>
    </header>
  );
}
