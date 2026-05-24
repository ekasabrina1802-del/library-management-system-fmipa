import { useAuth } from './AuthContext';
import { useApp } from './AppContext';
import ApiImage from './ApiImage';
import { Menu } from 'lucide-react';

export default function Header({ showSidebar, onMenuClick }) {
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
        {showSidebar && (
          <button
            className="hamburger-btn"
            onClick={onMenuClick}
            aria-label="Toggle menu"
          >
            <Menu size={20} />
          </button>
        )}
        <span className="lib-name">Perpustakaan FMIPA</span>
        <nav className="header-nav"></nav>
      </div>

      <div className="header-actions">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="header-username">
            {user?.name || 'User'}
          </span>

          <div className="avatar" style={{ overflow: 'hidden', padding: 0 }}>
            {profilePhoto ? (
              <ApiImage
                src={profilePhoto}
                alt={user?.name || 'User'}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  borderRadius: '50%'
                }}
                fallback={initials}
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
