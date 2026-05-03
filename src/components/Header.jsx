import { useAuth } from './AuthContext';

const API_URL = import.meta.env.VITE_API_URL;

export default function Header() {
  const { user } = useAuth();

  return (
    <header className="header">
      <div className="header-brand">
        <span className="lib-name">Perpustakaan FMIPA</span>
      </div>

      <div className="header-actions">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--navy)' }}>
            {user?.name || 'User'}
          </span>

          <div style={{
            width: 36, height: 36, borderRadius: '50%',
            overflow: 'hidden', flexShrink: 0,
            background: 'var(--maroon)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            {user?.photo ? (
              <img
                src={`${API_URL}${user.photo}`}
                alt={user.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                onError={e => { e.currentTarget.style.display = 'none'; }}
              />
            ) : (
              <span style={{ color: 'white', fontSize: 13, fontWeight: 700 }}>
                {user?.name?.split(' ').map(w => w[0]).slice(0, 2).join('') || 'U'}
              </span>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}