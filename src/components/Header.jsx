import { Bell, Settings, Search } from 'lucide-react';
import { useAuth } from './AuthContext';

export default function Header() {
  const { user } = useAuth();

  return (
    <header className="header">
      <div className="header-brand">
        <span className="lib-name">Perpustakaan FMIPA</span>
        <nav className="header-nav">
          <a href="#">Katalog</a>
          <a href="#">E-Resources</a>
        </nav>
      </div>
      <div className="header-search">
        <Search size={14} />
        <span>Cari Koleksi…</span>
      </div>
      <div className="header-actions">
        <button className="header-icon-btn notif-btn">
          <Bell size={16} />
          <span className="notif-dot" />
        </button>
        <button className="header-icon-btn">
          <Settings size={16} />
        </button>
        <div className="avatar" title={user?.name}>{user?.avatar}</div>
      </div>
    </header>
  );
}