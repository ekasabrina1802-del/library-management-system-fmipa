import { Bell, Settings, Search } from 'lucide-react';
import { useAuth } from './AuthContext';

export default function Header() {
  const { user } = useAuth();

  return (
    <header className="header">
      <div className="header-brand">
        <span className="lib-name">Perpustakaan FMIPA</span>
        <nav className="header-nav">
        </nav>
      </div>

      <div className="header-actions">

<div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
  <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--navy)' }}>
    {user?.name || 'User'}
  </span>

  <div className="avatar">
    {user?.avatar}
  </div>
</div>
</div>
    </header>
  );
}