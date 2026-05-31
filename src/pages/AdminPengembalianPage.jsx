import { useState } from 'react';
import { Search, Filter, Calendar, BookOpen, TrendingDown, AlertCircle, CheckCircle, ChevronRight, Banknote } from 'lucide-react';
import { useApp } from '../components/AppContext';

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
}

const PERIOD_OPTIONS = [
  { value: 'all',     label: 'Semua Waktu' },
  { value: 'daily',   label: 'Hari Ini' },
  { value: 'weekly',  label: 'Minggu Ini' },
  { value: 'monthly', label: 'Bulan Ini' },
  { value: 'yearly',  label: 'Tahun Ini' },
];

export default function AdminPengembalianPage() {
  const { loans } = useApp();
  const [search, setSearch] = useState('');
  const [period, setPeriod] = useState('all');

  const filterByPeriod = (items) => {
    if (period === 'all') return items;
    const now = new Date();
    return items.filter(item => {
      const date = new Date(item.returnDate || item.loanDate);
      if (period === 'daily')   return date.toDateString() === now.toDateString();
      if (period === 'weekly')  return (now - date) / 86400000 <= 7;
      if (period === 'monthly') return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
      if (period === 'yearly')  return date.getFullYear() === now.getFullYear();
      return true;
    });
  };

  const completedLoans = loans
    .filter(l => l.status === 'dikembalikan')
    .sort((a, b) => (b.returnDate || '').localeCompare(a.returnDate || ''));

  const filteredCompleted = filterByPeriod(completedLoans).filter(l =>
    !search ||
    l.bookTitle?.toLowerCase().includes(search.toLowerCase()) ||
    l.memberName?.toLowerCase().includes(search.toLowerCase()) ||
    l.bookCode?.toLowerCase().includes(search.toLowerCase())
  );

  const totalDenda    = completedLoans.reduce((sum, l) => sum + (l.denda || 0), 0);
  const lateCount     = completedLoans.filter(l => (l.denda || 0) > 0).length;
  const onTimeCount   = completedLoans.length - lateCount;

  const statCards = [
    { label: 'Total Pengembalian', value: completedLoans.length, color: '#E53E3E', bg: 'linear-gradient(135deg, #fff5f5, #ffffff)', border: '#FED7D7', shadow: 'rgba(229,62,62,0.08)', iconBg: '#fff1f1', icon: <BookOpen size={18} /> },
    { label: 'Tepat Waktu', value: onTimeCount, color: '#D69E2E', bg: 'linear-gradient(135deg, #fffaf0, #ffffff)', border: '#FEEBC8', shadow: 'rgba(214,158,46,0.08)', iconBg: '#fff7e6', icon: <CheckCircle size={18} /> },
    { label: 'Kasus Terlambat', value: lateCount, color: '#38A169', bg: 'linear-gradient(135deg, #f0fff4, #ffffff)', border: '#C6F6D5', shadow: 'rgba(56,161,105,0.08)', iconBg: '#ecfff3', icon: <AlertCircle size={18} /> },
    { label: 'Denda Terkumpul', value: `Rp ${totalDenda.toLocaleString('id-ID')}`, color: '#2563EB', bg: 'linear-gradient(135deg, #eff6ff, #ffffff)', border: '#BFDBFE', shadow: 'rgba(37,99,235,0.08)', iconBg: '#eef4ff', icon: <Banknote size={18} /> },
  ];

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div className="page-breadcrumb">DATA TRANSAKSI PENGEMBALIAN</div>
        <h1 className="page-title">Manajemen Pengembalian</h1>
        <p className="page-subtitle">Riwayat pengembalian buku dan rekap denda keterlambatan seluruh anggota.</p>
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid-4 mb-24" style={{ gap: '16px' }}>

        {statCards.map((s, i) => (

          <div
            key={i}
            style={{ background: s.bg, border: `1.5px solid ${s.border}`, borderRadius: 14, padding: '20px 22px', minHeight: 120, boxShadow: `0 2px 8px ${s.shadow}`, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}
          >

            <div>
              <div style={{ fontSize: 11, color: s.color, textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600, marginBottom: 6 }}>
                {s.label}
              </div>

              <div style={{ fontSize: i === 3 ? 18 : 28, fontWeight: 800, color: s.color, lineHeight: 1, fontFamily: "'DM Mono', monospace" }}>
                {s.value}
              </div>
            </div>

            <div
              style={{ width: 42, height: 42, borderRadius: 12, background: s.iconBg, border: `1px solid ${s.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.color, flexShrink: 0 }}
            >
              {s.icon}
            </div>
          </div>
        ))}
      </div>

      {/* ── Table Card ── */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>

        {/* Card header */}
        <div style={{
          padding: '14px 18px', borderBottom: '1px solid #f0ebe6',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          flexWrap: 'wrap', gap: 10,
          background: 'linear-gradient(to right, #fafafa, #fff5f5)',
        }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: '#1a1a1a', display: 'flex', alignItems: 'center', gap: 8 }}>
            Riwayat Pengembalian
            <span style={{
              fontSize: 11, background: 'rgba(46,125,50,0.1)', color: '#2E7D32',
              padding: '2px 8px', borderRadius: 20, fontWeight: 700,
              border: '1px solid rgba(46,125,50,0.2)',
            }}>{filteredCompleted.length}</span>
          </div>

          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            {/* Period filter */}
            <div style={{ position: 'relative' }}>
              <Calendar size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#7B1C1C', pointerEvents: 'none' }} />
              <select
                value={period}
                onChange={e => setPeriod(e.target.value)}
                className="form-control"
                style={{
                  paddingLeft: 30, paddingRight: 28, width: 'auto',
                  color: '#7B1C1C', fontWeight: 600, fontSize: 12,
                  border: '1.5px solid rgba(123,28,28,0.25)',
                  cursor: 'pointer', appearance: 'none',
                }}
              >
                {PERIOD_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
              <Filter size={11} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: '#7B1C1C', pointerEvents: 'none' }} />
            </div>

            {/* Search */}
            <div style={{ position: 'relative' }}>
              <Search size={13} style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
              <input
                className="form-control"
                style={{ paddingLeft: 30, width:'100%', minWidth: 140, maxWidth: 220 }}
                placeholder="Cari anggota / buku / kode..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Hint */}
        <div style={{
          padding: '8px 18px', background: 'rgba(123,28,28,0.03)',
          borderBottom: '1px solid #f0ebe6', fontSize: 11, color: '#9ca3af',
          display: 'flex', alignItems: 'center', gap: 5,
        }}>
          <ChevronRight size={11} /> Menampilkan seluruh riwayat pengembalian buku yang sudah selesai
        </div>

        {/* Table */}
        <div className="table-container" style={{ maxHeight: 500, overflowY: 'auto' }}>
          <table>
            <thead>
              <tr>
                <th>Tgl Kembali</th>
                <th>Kode Buku</th>
                <th>Judul</th>
                <th>Peminjam</th>
                <th>Tgl Pinjam</th>
                <th>Perpanjangan</th>
                <th>Denda</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredCompleted.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: 48, color: '#9ca3af', fontSize: 13 }}>
                    <BookOpen size={32} style={{ opacity: 0.15, display: 'block', margin: '0 auto 10px' }} />
                    Belum ada pengembalian pada periode ini
                  </td>
                </tr>
              ) : filteredCompleted.map((l, idx) => {
                const isLate    = (l.denda || 0) > 0;
                const jumlahExt = l.jumlahPerpanjangan || 0;
                return (
                  <tr key={l.id} style={{ background: idx % 2 === 0 ? 'white' : '#fafafa' }}>
                    <td style={{ fontSize: 12, color: '#6b7280', whiteSpace: 'nowrap' }}>
                      {formatDate(l.returnDate)}
                    </td>
                    <td>
                      <code style={{ background: '#f0ebe6', padding: '2px 7px', borderRadius: 4, fontSize: 11, color: '#7B1C1C', fontWeight: 600 }}>
                        {l.bookCode}
                      </code>
                    </td>
                    <td style={{ maxWidth: 160 }}>
                      <div style={{ fontWeight: 600, fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {l.bookTitle}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{l.memberName}</div>
                      {l.memberType && (
                        <div style={{ fontSize: 10, color: '#9ca3af', marginTop: 1, textTransform: 'capitalize' }}>{l.memberType}</div>
                      )}
                    </td>
                    <td style={{ fontSize: 12, color: '#6b7280', whiteSpace: 'nowrap' }}>
                      {formatDate(l.loanDate)}
                    </td>
                    <td style={{ fontSize: 12, color: jumlahExt > 0 ? '#B45309' : '#9ca3af', fontWeight: jumlahExt > 0 ? 700 : 400 }}>
                      {jumlahExt > 0 ? `${jumlahExt}×` : '—'}
                    </td>
                    <td style={{ fontSize: 12, fontWeight: isLate ? 700 : 400, color: isLate ? '#991B1B' : '#9ca3af', whiteSpace: 'nowrap' }}>
                      {isLate ? `Rp ${Number(l.denda).toLocaleString('id-ID')}` : '—'}
                    </td>
                    <td>
                      <span style={{
                        padding: '3px 9px', borderRadius: 20, fontSize: 10, fontWeight: 700,
                        background: isLate ? 'rgba(180,83,9,0.1)' : 'rgba(46,125,50,0.1)',
                        color: isLate ? '#B45309' : '#2E7D32',
                        whiteSpace: 'nowrap',
                      }}>
                        {isLate ? 'Terlambat' : 'Tepat Waktu'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div style={{ padding: '10px 18px', fontSize: 12, color: 'var(--gray-text)', borderTop: '1px solid #f5f0ee' }}>
          {filteredCompleted.length} pengembalian ditampilkan
        </div>
      </div>
    </div>
  );
}