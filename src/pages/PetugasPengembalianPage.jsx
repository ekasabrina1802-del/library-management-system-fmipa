import { useState } from 'react';
import { Search, CheckCircle, AlertCircle, Filter, Calendar, Users } from 'lucide-react';
import { useApp } from '../components/AppContext';

const PERIOD_OPTIONS = [
  { value: 'all', label: 'Semua Waktu' },
  { value: 'daily', label: 'Hari Ini' },
  { value: 'weekly', label: 'Minggu Ini' },
  { value: 'monthly', label: 'Bulan Ini' },
  { value: 'yearly', label: 'Tahun Ini' },
];

const DENDA_PER_HARI = 10000;

function daysUntilDue(dueDate) {
  const today = new Date();
  const due = new Date(dueDate);
  return Math.floor((today - due) / (1000 * 60 * 60 * 24));
}

export default function PetugasPengembalianPage() {
  const { loans, returnBook } = useApp();
  const [searchInput, setSearchInput] = useState('');
  const [searchType, setSearchType] = useState('kode'); // 'kode' | 'nama'
  const [matchedLoans, setMatchedLoans] = useState([]);
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [period, setPeriod] = useState('all');
  const [historySearch, setHistorySearch] = useState('');

  const handleSearch = () => {
    setResult(null);
    setError('');
    setSelectedLoan(null);
    setMatchedLoans([]);

    const input = searchInput.trim();
    if (!input) { setError('Masukkan kode buku atau nama anggota.'); return; }

    let matched = [];
    if (searchType === 'kode') {
      matched = loans.filter(l => l.bookCode === input && (l.status === 'dipinjam' || l.status === 'terlambat'));
    } else {
      matched = loans.filter(l => l.memberName?.toLowerCase().includes(input.toLowerCase()) && (l.status === 'dipinjam' || l.status === 'terlambat'));
    }

    if (matched.length === 0) {
      setError(searchType === 'kode'
        ? 'Tidak ada peminjaman aktif untuk kode buku ini.'
        : 'Tidak ada peminjaman aktif untuk nama anggota ini.'
      );
      return;
    }

    if (matched.length === 1) {
      const loan = matched[0];
      const lateDays = daysUntilDue(loan.dueDate);
      const denda = lateDays > 0 ? lateDays * DENDA_PER_HARI : 0;
      setSelectedLoan({ ...loan, lateDays: lateDays > 0 ? lateDays : 0, estimatedDenda: denda });
    } else {
      setMatchedLoans(matched);
    }
  };

  const handleSelectLoan = (loan) => {
    const lateDays = daysUntilDue(loan.dueDate);
    const denda = lateDays > 0 ? lateDays * DENDA_PER_HARI : 0;
    setSelectedLoan({ ...loan, lateDays: lateDays > 0 ? lateDays : 0, estimatedDenda: denda });
    setMatchedLoans([]);
  };

  const handleReturn = async () => {
    const res = await returnBook(selectedLoan.bookCode, selectedLoan.id);
    if (res.success) {
      setResult(res);
      setSelectedLoan(null);
      setSearchInput('');
      setMatchedLoans([]);
    } else {
      setError(res.message);
    }
  };

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
    !historySearch ||
    l.bookTitle?.toLowerCase().includes(historySearch.toLowerCase()) ||
    l.memberName?.toLowerCase().includes(historySearch.toLowerCase()) ||
    l.bookCode?.toLowerCase().includes(historySearch.toLowerCase())
  );

  const totalDenda = completedLoans.reduce((sum, l) => sum + (l.denda || 0), 0);
  const totalTerlambat = completedLoans.filter(l => (l.denda || 0) > 0).length;

  const stats = [
    { label: 'Total Pengembalian', value: completedLoans.length, color: '#2E7D32', bg: 'rgba(46,125,50,0.08)', border: 'rgba(46,125,50,0.2)' },
    { label: 'Kasus Terlambat', value: totalTerlambat, color: '#991B1B', bg: 'rgba(153,27,27,0.08)', border: 'rgba(153,27,27,0.2)' },
    { label: 'Denda Terkumpul', value: `Rp ${totalDenda.toLocaleString('id-ID')}`, color: '#B45309', bg: 'rgba(180,83,9,0.08)', border: 'rgba(180,83,9,0.2)' },
  ];

  return (
    <div style={{ fontFamily: "'Segoe UI', sans-serif" }}>
      {/* Page Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: '#9B2C2C', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 6 }}>
          Petugas · Transaksi
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: '#1a1a1a', margin: 0, marginBottom: 6 }}>
          Pengembalian Buku
        </h1>
        <p style={{ fontSize: 13, color: '#6b7280', margin: 0 }}>
          Proses pengembalian dan kelola denda keterlambatan seluruh anggota perpustakaan FMIPA.
        </p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 24 }}>
        {stats.map((s, i) => (
          <div key={i} style={{ background: s.bg, border: `1px solid ${s.border}`, borderRadius: 12, padding: '16px 14px', textAlign: 'center' }}>
            <div style={{ fontSize: 24, fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.value}</div>
            <div style={{ fontSize: 11, color: '#6b7280', marginTop: 5, fontWeight: 500 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Main Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.8fr', gap: 20 }}>
        {/* Return Form */}
        <div>
          <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 14, padding: 20, boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4, color: '#1a1a1a' }}>Proses Pengembalian</div>
            <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 16 }}>Cari berdasarkan kode buku atau nama anggota.</div>

            {/* Search Type Toggle */}
            <div style={{ display: 'flex', background: '#f3f4f6', borderRadius: 8, padding: 4, marginBottom: 14, gap: 4 }}>
              {[
                { key: 'kode', label: 'Kode Buku', icon: <Search size={12} /> },
                { key: 'nama', label: 'Nama Anggota', icon: <Users size={12} /> },
              ].map(opt => (
                <button
                  key={opt.key}
                  onClick={() => { setSearchType(opt.key); setSearchInput(''); setMatchedLoans([]); setSelectedLoan(null); setError(''); setResult(null); }}
                  style={{
                    flex: 1, padding: '7px 12px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, transition: 'all 0.15s',
                    background: searchType === opt.key ? 'white' : 'transparent',
                    color: searchType === opt.key ? '#7B1C1C' : '#6b7280',
                    boxShadow: searchType === opt.key ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
                  }}
                >
                  {opt.icon} {opt.label}
                </button>
              ))}
            </div>

            {/* Input + Search */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                <input
                  style={{
                    width: '100%', paddingLeft: 32, paddingRight: 12, paddingTop: 9, paddingBottom: 9,
                    borderRadius: 8, border: '1.5px solid #e5e7eb', fontSize: 13, outline: 'none', boxSizing: 'border-box',
                  }}
                  placeholder={searchType === 'kode' ? 'No. Induk: 00001/FMIPA/2026' : 'Nama anggota...'}
                  value={searchInput}
                  onChange={e => { setSearchInput(e.target.value); setError(''); setResult(null); setMatchedLoans([]); setSelectedLoan(null); }}
                  onKeyDown={e => e.key === 'Enter' && handleSearch()}
                />
              </div>
              <button
                onClick={handleSearch}
                style={{
                  background: 'linear-gradient(135deg, #7B1C1C, #9B2C2C)', color: 'white', border: 'none',
                  borderRadius: 8, padding: '9px 16px', fontSize: 13, fontWeight: 700, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap',
                }}
              >
                <Search size={14} /> Cari
              </button>
            </div>

            {error && (
              <div style={{ background: 'rgba(183,28,28,0.08)', color: '#7B1C1C', padding: '10px 12px', borderRadius: 8, fontSize: 13, marginBottom: 12, display: 'flex', gap: 8, alignItems: 'center', border: '1px solid rgba(183,28,28,0.2)' }}>
                <AlertCircle size={14} /> {error}
              </div>
            )}

            {result && (
              <div style={{ background: 'rgba(46,125,50,0.08)', color: '#2E7D32', padding: '10px 12px', borderRadius: 8, fontSize: 13, marginBottom: 12, border: '1px solid rgba(46,125,50,0.2)' }}>
                <div style={{ fontWeight: 700 }}>✓ Pengembalian berhasil!</div>
                {result.denda > 0 && (
                  <div style={{ marginTop: 4, fontSize: 12 }}>Denda: <strong>Rp {Number(result.denda).toLocaleString('id-ID')}</strong></div>
                )}
              </div>
            )}

            {/* Multiple Loans — pick one */}
            {matchedLoans.length > 0 && (
              <div style={{ border: '1px solid #e5e7eb', borderRadius: 10, overflow: 'hidden', marginBottom: 12 }}>
                <div style={{ padding: '10px 14px', background: '#fafafa', fontSize: 12, fontWeight: 700, color: '#374151', borderBottom: '1px solid #f3f4f6' }}>
                  Pilih peminjaman ({matchedLoans.length} ditemukan):
                </div>
                <div style={{ maxHeight: 240, overflowY: 'auto' }}>
                  {matchedLoans.map(l => (
                    <div
                      key={l.id}
                      onClick={() => handleSelectLoan(l)}
                      style={{
                        padding: '12px 14px', cursor: 'pointer', borderBottom: '1px solid #f9fafb',
                        transition: 'background 0.15s',
                      }}
                      onMouseOver={e => e.currentTarget.style.background = 'rgba(123,28,28,0.04)'}
                      onMouseOut={e => e.currentTarget.style.background = 'white'}
                    >
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a' }}>{l.bookTitle}</div>
                      <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>
                        {l.memberName} · <code style={{ background: '#f3f4f6', padding: '1px 5px', borderRadius: 3 }}>{l.bookCode}</code>
                      </div>
                      <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>Batas: {l.dueDate}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Selected Loan Detail */}
            {selectedLoan && (
              <div style={{ border: '1.5px solid rgba(123,28,28,0.25)', borderRadius: 10, overflow: 'hidden' }}>
                <div style={{ padding: '10px 14px', background: 'rgba(123,28,28,0.06)', borderBottom: '1px solid rgba(123,28,28,0.15)' }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#7B1C1C' }}>Detail Pengembalian</div>
                </div>
                <div style={{ padding: 14 }}>
                  <div style={{ display: 'grid', gap: 8, fontSize: 13 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#6b7280' }}>Judul:</span>
                      <span style={{ fontWeight: 600, textAlign: 'right', maxWidth: '60%' }}>{selectedLoan.bookTitle}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#6b7280' }}>Peminjam:</span>
                      <span style={{ fontWeight: 600 }}>{selectedLoan.memberName}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#6b7280' }}>Kode Buku:</span>
                      <code style={{ fontWeight: 600, background: '#f3f4f6', padding: '1px 6px', borderRadius: 3, fontSize: 12 }}>{selectedLoan.bookCode}</code>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#6b7280' }}>Batas Kembali:</span>
                      <span style={{ fontWeight: 600 }}>{selectedLoan.dueDate}</span>
                    </div>
                  </div>

                  {selectedLoan.lateDays > 0 && (
                    <div style={{
                      marginTop: 12, padding: '10px 12px', background: 'rgba(183,28,28,0.08)',
                      borderRadius: 8, border: '1px solid rgba(183,28,28,0.2)',
                    }}>
                      <div style={{ color: '#7B1C1C', fontWeight: 700, fontSize: 13 }}>
                        Terlambat {selectedLoan.lateDays} hari
                      </div>
                      <div style={{ color: '#7B1C1C', fontSize: 12, marginTop: 4 }}>
                        Denda: <strong>Rp {selectedLoan.estimatedDenda.toLocaleString('id-ID')}</strong>
                        <span style={{ color: '#9ca3af', marginLeft: 6 }}>
                          (Rp {DENDA_PER_HARI.toLocaleString('id-ID')} × {selectedLoan.lateDays} hari)
                        </span>
                      </div>
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
                    <button
                      onClick={() => { setSelectedLoan(null); setMatchedLoans([]); }}
                      style={{
                        flex: 1, padding: '9px 16px', borderRadius: 8, border: '1.5px solid #e5e7eb',
                        background: 'white', color: '#374151', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                      }}
                    >
                      Batal
                    </button>
                    <button
                      onClick={handleReturn}
                      style={{
                        flex: 2, padding: '9px 16px', borderRadius: 8, border: 'none',
                        background: 'linear-gradient(135deg, #7B1C1C, #9B2C2C)', color: 'white',
                        fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                      }}
                    >
                      <CheckCircle size={14} /> Selesaikan Pengembalian
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* History Table */}
        <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 14, overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
          <div style={{
            padding: '16px 20px', borderBottom: '1px solid #f3f4f6',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            flexWrap: 'wrap', gap: 10,
            background: 'linear-gradient(to right, #fafafa, #fff5f5)',
          }}>
            <div style={{ fontWeight: 700, fontSize: 15, color: '#1a1a1a' }}>
              Riwayat Pengembalian
              <span style={{ marginLeft: 8, background: 'rgba(46,125,50,0.1)', color: '#2E7D32', padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 700 }}>
                {filteredCompleted.length}
              </span>
            </div>

            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ position: 'relative' }}>
                <Calendar size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#7B1C1C' }} />
                <select
                  value={period}
                  onChange={e => setPeriod(e.target.value)}
                  style={{
                    paddingLeft: 30, paddingRight: 28, paddingTop: 7, paddingBottom: 7,
                    borderRadius: 8, border: '1.5px solid rgba(123,28,28,0.3)',
                    background: 'white', color: '#7B1C1C', fontSize: 12, fontWeight: 600,
                    cursor: 'pointer', outline: 'none', appearance: 'none',
                  }}
                >
                  {PERIOD_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                <Filter size={11} style={{ position: 'absolute', right: 9, top: '50%', transform: 'translateY(-50%)', color: '#7B1C1C', pointerEvents: 'none' }} />
              </div>

              <div style={{ position: 'relative' }}>
                <Search size={12} style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                <input
                  style={{ paddingLeft: 28, paddingRight: 12, paddingTop: 7, paddingBottom: 7, borderRadius: 8, border: '1.5px solid #e5e7eb', fontSize: 12, outline: 'none', width: 180 }}
                  placeholder="Cari nama / judul / kode..."
                  value={historySearch}
                  onChange={e => setHistorySearch(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div style={{ overflowX: 'auto', maxHeight: 500, overflowY: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#fafafa', borderBottom: '1.5px solid #f3f4f6' }}>
                  {['Waktu Kembali', 'Kode', 'Judul', 'Peminjam', 'Denda', 'Status'].map(h => (
                    <th key={h} style={{
                      padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700,
                      color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap',
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
                  <tr key={l.id} style={{ borderBottom: '1px solid #f9fafb', background: idx % 2 === 0 ? 'white' : '#fafafa' }}>
                    <td style={{ padding: '10px 14px', fontSize: 11, color: '#9ca3af', whiteSpace: 'nowrap' }}>{l.returnDate}</td>
                    <td style={{ padding: '10px 14px' }}>
                      <code style={{ fontSize: 11, background: '#f3f4f6', padding: '2px 7px', borderRadius: 4, color: '#374151', fontWeight: 600 }}>{l.bookCode}</code>
                    </td>
                    <td style={{ padding: '10px 14px', maxWidth: 140 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.bookTitle}</div>
                    </td>
                    <td style={{ padding: '10px 14px', fontSize: 12, fontWeight: 600, color: '#1a1a1a', whiteSpace: 'nowrap' }}>{l.memberName}</td>
                    <td style={{ padding: '10px 14px', fontSize: 12, fontWeight: (l.denda || 0) > 0 ? 700 : 400, color: (l.denda || 0) > 0 ? '#991B1B' : '#9ca3af' }}>
                      {(l.denda || 0) > 0 ? `Rp ${Number(l.denda).toLocaleString('id-ID')}` : '—'}
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
    </div>
  );
}