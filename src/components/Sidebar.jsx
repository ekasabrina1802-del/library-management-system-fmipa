import { NavLink } from 'react-router-dom';
import { LayoutDashboard, BookOpen, Users, ArrowDownToLine, ArrowUpFromLine, FileText, LogOut } from 'lucide-react';
import { useAuth } from './AuthContext';

export default function Sidebar() {
  const { user, logout } = useAuth();

  const adminNav = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/buku', icon: BookOpen, label: 'Buku' },
    { to: '/anggota', icon: Users, label: 'Anggota' },
    { to: '/peminjaman', icon: ArrowDownToLine, label: 'Peminjaman' },
    { to: '/pengembalian', icon: ArrowUpFromLine, label: 'Pengembalian' },
    { to: '/denda', icon: FileText, label: 'Denda & Laporan' },
  ];

  const petugasNav = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/buku', icon: BookOpen, label: 'Buku' },
    { to: '/anggota', icon: Users, label: 'Anggota' },
    { to: '/peminjaman', icon: ArrowDownToLine, label: 'Peminjaman' },
    { to: '/pengembalian', icon: ArrowUpFromLine, label: 'Pengembalian' },
    { to: '/denda', icon: FileText, label: 'Denda & Laporan' },
  ];

  const nav = user?.role === 'admin' ? adminNav : petugasNav;

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="role-badge">{user?.role === 'admin' ? 'ADMIN' : 'PETUGAS'}</div>
        <div className="app-name">Perpustakaan<br />Fakultas FMIPA</div>
      </div>

      <nav className="sidebar-nav">
        {nav.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to} className={({ isActive }) => isActive ? 'active' : ''}>
            <Icon size={16} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <button className="nav-item" onClick={logout} style={{ color: 'rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', width: '100%', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500 }}>
          <LogOut size={16} />
          Keluar
        </button>
      </div>
    </aside>
  );
}