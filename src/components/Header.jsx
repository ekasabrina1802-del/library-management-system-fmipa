import { useAuth } from './AuthContext';
import { useApp } from './AppContext';

const API_URL = import.meta.env.VITE_API_URL;

export default function Header() {
  const { user } = useAuth();
  const { members = [] } = useApp();

  const currentMember = members.find(
    m =>
      String(m.id) === String(user?.anggotaId || user?.memberId) ||
      String(m.nim) === String(user?.nim) ||
      m.email === user?.email
  );

  const profilePhoto = currentMember?.photo_url || user?.photo_url;

  const initials = user?.name
    ? user.name
        .split(' ')
        .map(w => w[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'U';

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
            {profilePhoto ? (
              <img
                src={`${API_URL}${profilePhoto}`}
                alt={user?.name || 'User'}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  borderRadius: '50%'
                }}
              />
            ) : (
              initials
            )}
          </div>
        </div>
      </div>
    </header>
  );
}