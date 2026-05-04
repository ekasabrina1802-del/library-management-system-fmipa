import { Bell, Settings, Search } from 'lucide-react';
import { useAuth } from './AuthContext';

const API_URL = import.meta.env.VITE_API_URL;

export default function Header() {
  const { user } = useAuth();

  return (
    <header className="header">
      <div className="header-brand">
        <span className="lib-name">Perpustakaan FMIPA</span>
        <nav className="header-nav"></nav>
      </div>

      <div className="header-actions">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--navy)' }}>
            {user?.name || 'User'}
          </span>

          <div className="avatar" style={{ overflow: 'hidden', padding: 0 }}>
            {user?.photo_url ? (
              <img
                src={`${API_URL}${user.photo_url}`}
                alt="avatar"
                style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
              />
            ) : (
              user?.avatar
            )}
          </div>
        </div>
      </div>
    </header>
  );
}