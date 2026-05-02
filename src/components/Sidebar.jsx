// Sidebar.jsx
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, BookOpen, Users, ArrowDownToLine, ArrowUpFromLine, FileText, LogOut } from 'lucide-react';
import { useAuth } from './AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout(); // hapus data
    navigate('/');
  };

  const adminNav = [
    { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/admin/buku', icon: BookOpen, label: 'Buku' },
    { to: '/admin/anggota', icon: Users, label: 'Anggota' },
    { to: '/admin/peminjaman', icon: ArrowDownToLine, label: 'Peminjaman' },
    { to: '/admin/pengembalian', icon: ArrowUpFromLine, label: 'Pengembalian' },
    { to: '/admin/denda', icon: FileText, label: 'Denda & Laporan' },
  ];

  const petugasNav = [
    { to: '/petugas/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/petugas/buku', icon: BookOpen, label: 'Buku' },
    { to: '/petugas/anggota', icon: Users, label: 'Anggota' },
    { to: '/petugas/peminjaman', icon: ArrowDownToLine, label: 'Peminjaman' },
    { to: '/petugas/pengembalian', icon: ArrowUpFromLine, label: 'Pengembalian' },
    { to: '/petugas/denda', icon: FileText, label: 'Denda & Laporan' },
  ];

  const userNav = [
    { to: '/user/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/user/buku', icon: BookOpen, label: 'Buku' }, 
    { to: '/user/anggota', icon: Users, label: 'Profil' },
    { to: '/user/peminjaman', icon: ArrowDownToLine, label: 'Peminjaman' },
    { to: '/user/pengembalian', icon: ArrowUpFromLine, label: 'Pengembalian' },
    { to: '/user/denda', icon: FileText, label: 'Denda'}
  ];

  let nav = petugasNav;
  if (user?.role === 'admin') nav = adminNav;
  if (user?.role === 'user' || user?.role === 'mahasiswa') nav = userNav;

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        {/* Perbaikan Badge agar dinamis sesuai role */}
        <div className="role-badge">{user?.role?.toUpperCase() || 'GUEST'}</div>
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
        <button className="nav-item logout-btn" onClick={handleLogout} style={{ color: 'rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', width: '100%', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500 }}>
          <LogOut size={16} />
          Keluar
        </button>
      </div>
    </aside>
  );
}
