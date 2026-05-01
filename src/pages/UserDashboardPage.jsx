import { useState, useEffect } from 'react';
import {
  BookOpen, Clock, AlertCircle,
  DollarSign, Info
} from 'lucide-react';
import { useApp } from '../components/AppContext';
import { useAuth } from '../components/AuthContext';

// Komponen jam live
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

export default function UserDashboardPage() {
  const { loans, getDendaTotal } = useApp();
  const { user } = useAuth();

  const isDosen = user?.role === 'dosen';
  const rules = isDosen
    ? { max: 10, durasi: '1 Bulan', perpanjang: 'N/A' }
    : { max: 3, durasi: '1 Minggu', perpanjang: '2 Kali' };

  const myLoans = loans.filter(l => l.user_id === user?.id);
  const activeLoans = myLoans.filter(l => l.status === 'dipinjam');
  const overdueLoans = myLoans.filter(l => l.status === 'terlambat');
  const dendaSaya = getDendaTotal(user?.id);

  return (
    <div>
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

      {/* Aturan Banner */}
      <div style={{
        backgroundColor: '#EBF8FF', borderLeft: '5px solid #3182CE',
        padding: '20px', borderRadius: '8px', marginBottom: '30px',
        display: 'flex', gap: '15px', alignItems: 'center'
      }}>
        <Info color="#3182CE" />
        <div>
          <div style={{ fontWeight: 'bold', color: '#2C5282' }}>
            Aturan Peminjaman {isDosen ? 'Dosen' : 'Mahasiswa'}
          </div>
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
  );
}

const cardStyle = {
  backgroundColor: 'white', padding: '24px', borderRadius: '12px',
  boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column', gap: '8px'
};
const cardValueStyle = { fontSize: '24px', fontWeight: '800', color: '#1A202C', marginTop: '10px' };
const cardLabelStyle = { fontSize: '13px', color: '#718096', fontWeight: '600' };