// 1. SEMUA IMPORT DI ATAS
import { useState, useEffect } from 'react';
import {
  LayoutDashboard, Book, History, RotateCcw,
  LogOut, BookOpen, Clock, AlertCircle,
  Users, DollarSign, Info
} from 'lucide-react';
import { useApp } from '../components/AppContext';
import { useAuth } from '../components/AuthContext';
import BukuPage from "./Bukupage";
import UserAnggotaPage from "./UserAnggotaPage";
import UserPeminjamanPage from "./UserPeminjamanPage";
import UserPengembalianPage from "./UserPengembalianPage";
import UserDendaPage from "./UserDendaPage";

// 2. KOMPONEN PENDUKUNG (Non-Export)
function LiveClock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return (
    <div style={{ textAlign: 'right' }}>
      <div style={{ fontSize: 22, fontWeight: 700, color: '#0D1B2A', fontVariantNumeric: 'tabular-nums' }}>
        {now.toLocaleTimeString('id-ID')}
      </div>
      <div style={{ fontSize: 12, color: '#666' }}>
        {now.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
      </div>
    </div>
  );
}

// 3. EXPORT UTAMA (Hanya ada satu export default di sini)
export default function UserDashboardPage() {
  const { loans, getDendaTotal } = useApp();
  const { user, logout } = useAuth();
  const [activeMenu, setActiveMenu] = useState('Dashboard');

  // --- LOGIKA ATURAN PEMINJAMAN BERDASARKAN ROLE ---
  const isDosen = user?.role === 'dosen';
  const rules = isDosen 
    ? { max: 10, durasi: '1 Bulan', perpanjang: 'N/A' } 
    : { max: 3, durasi: '1 Minggu', perpanjang: '2 Kali' };

  // Filter data berdasarkan ID user yang login
  const myLoans = loans.filter(l => l.user_id === user?.id);
  const activeLoans = myLoans.filter(l => l.status === 'dipinjam');
  const overdueLoans = myLoans.filter(l => l.status === 'terlambat');
  const dendaSaya = getDendaTotal(user?.id);

  const sidebarStyle = {
    width: '260px', backgroundColor: '#0D1B2A', color: 'white',
    height: '100vh', display: 'flex', flexDirection: 'column', position: 'fixed', left: 0, top: 0
  };

  const menuButtonStyle = (menuName) => ({
    display: 'flex', alignItems: 'center', gap: '12px', width: '100%',
    padding: '12px 20px', border: 'none', cursor: 'pointer', textAlign: 'left', fontSize: '14px',
    backgroundColor: activeMenu === menuName ? '#7B1C1C' : 'transparent',
    color: 'white', borderLeft: activeMenu === menuName ? '4px solid #fff' : '4px solid transparent',
    transition: '0.2s'
  });

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#F8F9FA' }}>

      {/* --- SIDEBAR --- */}
      <div style={sidebarStyle}>
        <div style={{ padding: '24px 20px' }}>
          <div style={{ fontSize: '10px', color: '#888', fontWeight: 'bold', letterSpacing: '1px' }}>PERPUSTAKAAN DIGITAL</div>
          <div style={{ fontSize: '18px', fontWeight: 'bold', marginTop: '4px' }}>Fakultas FMIPA</div>
        </div>

        <div style={{ flex: 1, marginTop: '10px' }}>
          <button style={menuButtonStyle('Dashboard')} onClick={() => setActiveMenu('Dashboard')}>
            <LayoutDashboard size={18} /> Dashboard
          </button>
          <button style={menuButtonStyle('Buku')} onClick={() => setActiveMenu('Buku')}>
            <Book size={18} /> Katalog Buku
          </button>
          <button style={menuButtonStyle('Anggota')} onClick={() => setActiveMenu('Anggota')}>
            <Users size={18} /> Profil Anggota
          </button>
          <button style={menuButtonStyle('Peminjaman')} onClick={() => setActiveMenu('Peminjaman')}>
            <History size={18} /> Riwayat Pinjam
          </button>
          <button style={menuButtonStyle('Pengembalian')} onClick={() => setActiveMenu('Pengembalian')}>
            <RotateCcw size={18} /> Pengembalian
          </button>
          <button style={menuButtonStyle('Denda')} onClick={() => setActiveMenu('Denda')}>
            <DollarSign size={18} /> Tagihan Denda
          </button>
        </div>

        <button onClick={logout} style={{ ...menuButtonStyle('Keluar'), marginTop: 'auto', marginBottom: '20px' }}>
          <LogOut size={18} /> Keluar Sistem
        </button>
      </div>

      {/* --- MAIN CONTENT AREA --- */}
      <div style={{ marginLeft: '260px', flex: 1, padding: '40px' }}>

        {/* Header Section */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
          <div>
            <h2 style={{ color: '#0D1B2A', margin: 0, fontSize: '28px' }}>Dashboard Layanan</h2>
            <p style={{ color: '#666', marginTop: '4px' }}>
              Selamat datang kembali, <strong style={{ color: '#7B1C1C' }}>{user?.name}</strong> 
              <span style={{ marginLeft: '10px', fontSize: '12px', padding: '2px 8px', background: '#E2E8F0', borderRadius: '4px', textTransform: 'uppercase' }}>
                {user?.role}
              </span>
            </p>
          </div>
          <LiveClock />
        </div>

        {/* --- LOGIKA SWITCH KONTEN --- */}
        {activeMenu === 'Dashboard' && (
          <div>
            {/* Aturan Banner Dinamis */}
            <div style={{ 
              backgroundColor: '#EBF8FF', borderLeft: '5px solid #3182CE', 
              padding: '20px', borderRadius: '8px', marginBottom: '30px', display: 'flex', gap: '15px', alignItems: 'center' 
            }}>
              <Info color="#3182CE" />
              <div>
                <div style={{ fontWeight: 'bold', color: '#2C5282' }}>Aturan Peminjaman {user?.role === 'dosen' ? 'Dosen' : 'Mahasiswa'}</div>
                <div style={{ fontSize: '14px', color: '#2A4365' }}>
                  Maksimal <strong>{rules.max} buku</strong> • Durasi <strong>{rules.durasi}</strong> • Perpanjangan: <strong>{rules.perpanjang}</strong>
                </div>
              </div>
            </div>

            {/* Stat Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
              <div style={cardStyle}>
                <BookOpen size={24} color="#7B1C1C" />
                <div style={cardValueStyle}>{activeLoans.length} / {rules.max}</div>
                <div style={cardLabelStyle}>Kuota Pinjam</div>
              </div>
              
              <div style={cardStyle}>
                <Clock size={24} color="#F59E0B" />
                <div style={cardValueStyle}>{activeLoans.length}</div>
                <div style={cardLabelStyle}>Buku Aktif</div>
              </div>

              <div style={cardStyle}>
                <AlertCircle size={24} color="#DC2626" />
                <div style={cardValueStyle}>{overdueLoans.length}</div>
                <div style={cardLabelStyle}>Terlambat</div>
              </div>

              <div style={cardStyle}>
                <DollarSign size={24} color="#059669" />
                <div style={cardValueStyle}>Rp {dendaSaya?.toLocaleString('id-ID')}</div>
                <div style={cardLabelStyle}>Total Denda</div>
              </div>
            </div>
          </div>
        )}

        {/* Menu Pages */}
        {activeMenu === 'Buku' && <BukuPage />}
        {activeMenu === 'Anggota' && <UserAnggotaPage />}
        {activeMenu === 'Peminjaman' && <UserPeminjamanPage />}
        {activeMenu === 'Pengembalian' && <UserPengembalianPage />}
        {activeMenu === 'Denda' && <UserDendaPage />}

      </div>
    </div>
  );
}

// Internal Styles untuk Card agar rapi
const cardStyle = {
  backgroundColor: 'white', padding: '24px', borderRadius: '12px',
  boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column', gap: '8px'
};
const cardValueStyle = { fontSize: '24px', fontWeight: '800', color: '#1A202C', marginTop: '10px' };
const cardLabelStyle = { fontSize: '13px', color: '#718096', fontWeight: '600' };