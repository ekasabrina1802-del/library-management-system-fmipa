import { useState } from 'react';
import { Search, Filter, Calendar } from 'lucide-react';
import { useApp } from '../components/AppContext';

const PERIOD_OPTIONS = [
  { value: 'all', label: 'Semua Waktu' },
  { value: 'daily', label: 'Hari Ini' },
  { value: 'weekly', label: 'Minggu Ini' },
  { value: 'monthly', label: 'Bulan Ini' },
  { value: 'yearly', label: 'Tahun Ini' },
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
      if (period === 'daily') return date.toDateString() === now.toDateString();
      if (period === 'weekly') return (now - date) / (1000 * 60 * 60 * 24) <= 7;
      if (period === 'monthly') return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
      if (period === 'yearly') return date.getFullYear() === now.getFullYear();
      return true;
    });
  };

  const completedLoans = loans.filter(l => l.status === 'dikembalikan').sort((a, b) => (b.returnDate || '').localeCompare(a.returnDate || ''));
  const filteredCompleted = filterByPeriod(completedLoans).filter(l =>
    !search ||
    l.bookTitle?.toLowerCase().includes(search.toLowerCase()) ||
    l.memberName?.toLowerCase().includes(search.toLowerCase()) ||
    l.bookCode?.toLowerCase().includes(search.toLowerCase())
  );

  const totalDendaTerkumpul = completedLoans.reduce((sum, l) => sum + (l.denda || 0), 0);
  const totalTerlambat = completedLoans.filter(l => (l.denda || 0) > 0).length;

  const stats = [
    { label: 'Total Pengembalian', value: completedLoans.length, color: '#2E7D32', bg: 'rgba(46,125,50,0.08)', border: 'rgba(46,125,50,0.2)' },
    { label: 'Kasus Terlambat', value: totalTerlambat, color: '#991B1B', bg: 'rgba(153,27,27,0.08)', border: 'rgba(153,27,27,0.2)' },
    { label: 'Denda Terkumpul', value: `Rp ${totalDendaTerkumpul.toLocaleString('id-ID')}`, color: '#B45309', bg: 'rgba(180,83,9,0.08)', border: 'rgba(180,83,9,0.2)' },
  ];

  return (
    <div style={{ fontFamily: "'Segoe UI', sans-serif" }}>
      {/* Page Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: '#9B2C2C', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 6 }}>
          Admin · Transaksi
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: '#1a1a1a', margin: 0, marginBottom: 6 }}>
          Manajemen Pengembalian Buku
        </h1>
        <p style={{ fontSize: 13, color: '#6b7280', margin: 0 }}>
          Proses pengembalian dan kelola denda keterlambatan seluruh anggota.
        </p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 24 }}>
        {stats.map((s, i) => (
          <div key={i} style={{
            background: s.bg, border: `1px solid ${s.border}`,
            borderRadius: 12, padding: '16px 14px', textAlign: 'center',
          }}>
            <div style={{ fontSize: 24, fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.value}</div>
            <div style={{ fontSize: 11, color: '#6b7280', marginTop: 5, fontWeight: 500 }}>{s.label}</div>
          </div>
        ))}
      </div>


      {/* Riwayat Pengembalian */}
      <div style={{
        background: 'white', border: '1px solid #e5e7eb',
        borderRadius: 14, overflow: 'hidden',
        boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
      }}>
        <div style={{
          padding: '16px 20px', borderBottom: '1px solid #f3f4f6',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          flexWrap: 'wrap', gap: 12,
          background: 'linear-gradient(to right, #fafafa, #fff5f5)',
        }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, color: '#1a1a1a' }}>
              Riwayat Pengembalian
              <span style={{
                marginLeft: 8, background: 'rgba(46,125,50,0.1)', color: '#2E7D32',
                padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 700,
              }}>{filteredCompleted.length}</span>
            </div>
            <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>Admin dapat mengubah/menghapus denda</div>
          </div>

          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative' }}>
              <Calendar size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#7B1C1C' }} />
              <select
                value={period}
                onChange={e => setPeriod(e.target.value)}
                style={{
                  paddingLeft: 30, paddingRight: 30, paddingTop: 8, paddingBottom: 8,
                  borderRadius: 8, border: '1.5px solid rgba(123,28,28,0.3)',
                  background: 'white', color: '#7B1C1C', fontSize: 12, fontWeight: 600,
                  cursor: 'pointer', outline: 'none', appearance: 'none',
                }}
              >
                {PERIOD_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
              <Filter size={11} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: '#7B1C1C', pointerEvents: 'none' }} />
            </div>

            <div style={{ position: 'relative' }}>
              <Search size={12} style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
              <input
                style={{
                  paddingLeft: 28, paddingRight: 12, paddingTop: 8, paddingBottom: 8,
                  borderRadius: 8, border: '1.5px solid #e5e7eb',
                  fontSize: 12, outline: 'none', width: 180,
                }}
                placeholder="Cari..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div style={{ overflowX: 'auto', maxHeight: 480, overflowY: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#fafafa', borderBottom: '1.5px solid #f3f4f6' }}>
                {['Waktu Kembali', 'Kode', 'Judul', 'Peminjam', 'Denda', 'Status'].map(h => (
                  <th key={h} style={{
                    padding: '10px 14px', textAlign: 'left',
                    fontSize: 11, fontWeight: 700, color: '#6b7280',
                    textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredCompleted.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: 40, color: '#9ca3af', fontSize: 13 }}>
                    Belum ada pengembalian pada periode ini
                  </td>
                </tr>
              ) : filteredCompleted.map((l, idx) => (
                <tr key={l.id} style={{
                  borderBottom: '1px solid #f9fafb',
                  background: idx % 2 === 0 ? 'white' : '#fafafa',
                }}>
                  <td style={{ padding: '10px 14px', fontSize: 11, color: '#9ca3af', whiteSpace: 'nowrap' }}>{l.returnDate}</td>
                  <td style={{ padding: '10px 14px' }}>
                    <code style={{ fontSize: 11, background: '#f3f4f6', padding: '2px 7px', borderRadius: 4, color: '#374151', fontWeight: 600 }}>{l.bookCode}</code>
                  </td>
                  <td style={{ padding: '10px 14px', maxWidth: 140 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.bookTitle}</div>
                  </td>
                  <td style={{ padding: '10px 14px', fontSize: 12, fontWeight: 600, color: '#1a1a1a' }}>{l.memberName}</td>
                  <td style={{
                    padding: '10px 14px', fontSize: 12,
                    fontWeight: (l.denda || 0) > 0 ? 700 : 400,
                    color: (l.denda || 0) > 0 ? '#991B1B' : '#9ca3af',
                  }}>
                    {(l.denda || 0) > 0 ? `Rp ${l.denda.toLocaleString('id-ID')}` : '—'}
                  </td>
                  <td style={{ padding: '10px 14px' }}>
                    <span style={{
                      padding: '3px 8px', borderRadius: 20, fontSize: 10, fontWeight: 700,
                      background: (l.denda || 0) > 0 ? 'rgba(180,83,9,0.12)' : 'rgba(46,125,50,0.12)',
                      color: (l.denda || 0) > 0 ? '#B45309' : '#2E7D32',
                    }}>
                      {(l.denda || 0) > 0 ? 'Terlambat' : 'Tepat Waktu'}
                    </span>
                  </td>

                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}