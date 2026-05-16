import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { BookOpen, Users, Banknote, TrendingUp, Clock, RotateCcw, UserPlus, BookMarked, Database, AlertCircle, FileDown } from 'lucide-react';
import { useApp } from '../components/AppContext';
import { useAuth } from '../components/AuthContext';


function LiveClock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return (
    <div style={{ textAlign: 'right' }}>
      <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--navy)', fontVariantNumeric: 'tabular-nums' }}>
        {now.toLocaleTimeString('id-ID')}
      </div>
      <div style={{ fontSize: 12, color: 'var(--gray-text)' }}>
        {now.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
      </div>
    </div>
  );
}

const activityIcons = {
  loan: <BookMarked size={14} />,
  return: <RotateCcw size={14} />,
  member: <UserPlus size={14} />,
  denda: <Banknote size={14} />,
  book: <BookOpen size={14} />,
  system: <Database size={14} />,
  delete: <AlertCircle size={14} />,
};

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

function normalizeStatus(status) {
  return String(status || '').toLowerCase();
}

function getLoanDateValue(loan) {
  return loan.loanDate || loan.tgl_pinjam || loan.created_at || null;
}

function getReturnDateValue(loan) {
  return loan.returnDate || loan.tgl_kembali || null;
}

function buildMonthlyChartData(loans) {
  const now = new Date();
  const currentYear = now.getFullYear();

  const initial = MONTH_NAMES.map(month => ({
    month,
    pinjam: 0,
    kembali: 0,
  }));

  loans.forEach(loan => {
    const loanDate = getLoanDateValue(loan);
    if (loanDate) {
      const d = new Date(loanDate);
      if (!isNaN(d) && d.getFullYear() === currentYear) {
        initial[d.getMonth()].pinjam += 1;
      }
    }

    const returnDate = getReturnDateValue(loan);
    if (returnDate) {
      const d = new Date(returnDate);
      if (!isNaN(d) && d.getFullYear() === currentYear) {
        initial[d.getMonth()].kembali += 1;
      }
    }
  });

  return initial;
}

function buildDailyChartData(loans) {
  const today = new Date();
  const days = [];

  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);

    const key = d.toISOString().slice(0, 10);
    const label = d.toLocaleDateString('id-ID', { weekday: 'short' });

    days.push({
      key,
      day: label,
      pinjam: 0,
      kembali: 0,
    });
  }

  loans.forEach(loan => {
    const loanDate = getLoanDateValue(loan);
    if (loanDate) {
      const key = new Date(loanDate).toISOString().slice(0, 10);
      const row = days.find(d => d.key === key);
      if (row) row.pinjam += 1;
    }

    const returnDate = getReturnDateValue(loan);
    if (returnDate) {
      const key = new Date(returnDate).toISOString().slice(0, 10);
      const row = days.find(d => d.key === key);
      if (row) row.kembali += 1;
    }
  });

  return days;
}

export default function DashboardPage() {
  const { books, members, loans, activityLog, getDendaTotal } = useApp();
  const { user } = useAuth();
  const [chartType, setChartType] = useState('bulanan');
  const [logPage, setLogPage] = useState(1);
  const LOG_PER_PAGE = 20;

 const totalBooks = books.length;
  const totalAvail = books.reduce((s, b) => s + Number(b.available || 0), 0);

  const activeMembers = members.filter(m => m.status === 'aktif').length;

  const activeLoanCount = loans.filter(l =>
    ['dipinjam', 'diperpanjang', 'terlambat'].includes(normalizeStatus(l.status))
  ).length;

  const overdueLoanCount = loans.filter(l =>
    normalizeStatus(l.status) === 'terlambat'
  ).length;

  const dendaTotal = getDendaTotal();

  const monthlyChartData = buildMonthlyChartData(loans);
  const dailyChartData = buildDailyChartData(loans);

  const chartData = chartType === 'bulanan' ? monthlyChartData : dailyChartData;
  const chartKey = chartType === 'bulanan' ? 'month' : 'day';


  const todayStr = new Date().toLocaleDateString('id-ID');
  const todayLog = activityLog.filter(a => a.time && a.time.includes(todayStr));
  const totalLogPages = Math.ceil(todayLog.length / LOG_PER_PAGE);
  const pagedLog = todayLog.slice((logPage - 1) * LOG_PER_PAGE, logPage * LOG_PER_PAGE);

  return (
    <div>
      <div className="flex-between mb-24">
        <div className="page-header" style={{ margin: 0 }}>
          <div className="page-breadcrumb">Sistem Informasi Perpustakaan</div>
          <h1 className="page-title">Ringkasan Statistik Perpustakaan</h1>
          <p className="page-subtitle">
            {user?.role === 'admin' ? 'Panel Administrasi & Monitoring' : 'Panel Petugas — Kelola Peminjaman & Pengembalian'}
          </p>
        </div>
        <LiveClock />
      </div>

      {/* Stat Cards */}
      <div className="grid-4 mb-24">
        <div className="stat-card">
          <div className="stat-icon maroon"><BookOpen size={20} /></div>
          <div>
            <div className="stat-value">{totalBooks}</div>
            <div className="stat-label">Total Buku Terkatalog</div>
            <div className="stat-change">↑ {totalAvail} tersedia</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon navy"><Users size={20} /></div>
          <div>
            <div className="stat-value">{activeMembers}</div>
            <div className="stat-label">Anggota Aktif</div>
            <div className="stat-change" style={{ color: 'var(--info)' }}>
              {members.filter(m => m.type === 'mahasiswa').length} mahasiswa · {members.filter(m => m.type === 'dosen').length} dosen
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon orange"><BookMarked size={20} /></div>
          <div>
            <div className="stat-value">{activeLoanCount}</div>
            <div className="stat-label">Sedang Dipinjam</div>
            <div className="stat-change" style={{ color: 'var(--warning)' }}>
              {overdueLoanCount} terlambat
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green"><Banknote size={20} /></div>
          <div>
            <div className="stat-value">Rp {(dendaTotal / 1000).toFixed(0)}k</div>
            <div className="stat-label">Denda Masuk Bulan Ini</div>
            <div className="stat-change">Total: Rp {dendaTotal.toLocaleString('id-ID')}</div>
          </div>
        </div>
      </div>

      <div className="grid-2 mb-24" style={{ gridTemplateColumns: '1fr' }}>
        {/* Chart */}
        <div className="card">
          <div className="flex-between mb-16">
            <div>
              <div style={{ fontWeight: 700, color: 'var(--navy)', fontSize: 15 }}>Grafik Peminjaman</div>
              <div style={{ fontSize: 12, color: 'var(--gray-text)' }}>Rekap pinjam & kembali</div>
            </div>
            <div className="chart-tabs">
              <button className={`chart-tab ${chartType === 'bulanan' ? 'active' : ''}`} onClick={() => setChartType('bulanan')}>Bulanan</button>
              <button className={`chart-tab ${chartType === 'harian' ? 'active' : ''}`} onClick={() => setChartType('harian')}>Harian</button>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData} margin={{ top: 0, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#EEE9E4" />
              <XAxis dataKey={chartKey} tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="pinjam" name="Dipinjam" fill="#7B1C1C" radius={[4, 4, 0, 0]} />
              <Bar dataKey="kembali" name="Dikembalikan" fill="#0D1B2A" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Activity Log */}
{user?.role === 'admin' && (
  <div className="card">
    <div className="flex-between mb-16">
      <div>
        <div style={{ fontWeight: 700, color: 'var(--navy)', fontSize: 15 }}>
          Aktivitas Terbaru
        </div>
        <div style={{ fontSize: 12, color: 'var(--gray-text)' }}>
          Log semua aktivitas sistem
        </div>
      </div>
      <span className="badge badge-info">{todayLog.length} entri hari ini</span>
    </div>

    <div style={{ maxHeight: 300, overflowY: 'auto' }}>
      {todayLog.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 32, color: 'var(--gray-text)', fontSize: 13 }}>
          Belum ada aktivitas hari ini.
        </div>
      ) : pagedLog.map(a => (
        <div key={a.id} className="activity-item">
          <div className="activity-dot" />
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
              <div>
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                  fontSize: 11,
                  fontWeight: 700,
                  color: 'var(--maroon)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  {activityIcons[a.icon] || <Clock size={12} />}
                  {a.type}
                </span>
                <div className="activity-text">{a.desc}</div>
              </div>
              <div className="activity-time" style={{ flexShrink: 0 }}>
                {a.time}
              </div>
            </div>
          </div>
        </div>
      ))}
      {totalLogPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, paddingTop: 12, borderTop: '1px solid #eee' }}>
          <span style={{ fontSize: 12, color: 'var(--gray-text)' }}>
            Hal {logPage} / {totalLogPages}
          </span>
          <div style={{ display: 'flex', gap: 6 }}>
            <button className="btn btn-ghost btn-sm" disabled={logPage === 1} onClick={() => setLogPage(p => p - 1)}>
              ← Sebelumnya
            </button>
            <button className="btn btn-primary btn-sm" disabled={logPage === totalLogPages} onClick={() => setLogPage(p => p + 1)}>
              Selanjutnya →
            </button>
          </div>
        </div>
      )}
    </div>
  </div>
)}
</div>
);
}