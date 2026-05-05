import { useState } from 'react';
import { Search, Plus, Clock, AlertCircle, Filter, Calendar, BookOpen } from 'lucide-react';
import { useApp } from '../components/AppContext';

const API_BASE_URL = import.meta.env.VITE_API_URL;
const COVER_COLORS = { MTK: '#7B1C1C', FIS: '#0D1B2A', KIM: '#1B5E20', BIO: '#1A237E' };

const PERIOD_OPTIONS = [
  { value: 'all', label: 'Semua Waktu' },
  { value: 'daily', label: 'Hari Ini' },
  { value: 'weekly', label: 'Minggu Ini' },
  { value: 'monthly', label: 'Bulan Ini' },
  { value: 'yearly', label: 'Tahun Ini' },
];

function daysUntilDue(dueDate) {
  const today = new Date();
  const due = new Date(dueDate);
  return Math.ceil((due - today) / (1000 * 60 * 60 * 24));
}

function DueBadge({ dueDate, status }) {
  if (status === 'dikembalikan') return (
    <span style={{ background: 'rgba(46,125,50,0.12)', color: '#2E7D32', padding: '2px 8px', borderRadius: 20, fontSize: 10, fontWeight: 700 }}>Selesai</span>
  );
  const days = daysUntilDue(dueDate);
  if (days < 0) return (
    <span style={{ background: 'rgba(183,28,28,0.12)', color: '#B71C1C', padding: '2px 8px', borderRadius: 20, fontSize: 10, fontWeight: 700 }}>Terlambat {Math.abs(days)}h</span>
  );
  if (days <= 3) return (
    <span style={{ background: 'rgba(245,158,11,0.12)', color: '#B45309', padding: '2px 8px', borderRadius: 20, fontSize: 10, fontWeight: 700 }}>Jatuh tempo {days}h</span>
  );
  return (
    <span style={{ background: 'rgba(46,125,50,0.12)', color: '#2E7D32', padding: '2px 8px', borderRadius: 20, fontSize: 10, fontWeight: 700 }}>Sisa {days}h</span>
  );
}

export default function PetugasPeminjamanPage() {
  const { books, members, loans, addLoan } = useApp();
  const [nimInput, setNimInput] = useState('');
  const [bookCodeInput, setBookCodeInput] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [period, setPeriod] = useState('all');

  const findMemberByNim = (nim) => members.find(m => m.nim === nim || String(m.id) === nim);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setResult(null);

    const member = findMemberByNim(nimInput.trim());

    if (!member) {
      setError('Anggota tidak ditemukan. Periksa NIM/NIP.');
      return;
    }

    if (member && !['mahasiswa', 'dosen'].includes(member.type?.toLowerCase())) {
      setError(`${member.name} (${member.type}) tidak memiliki hak peminjaman.`);
      return;
    }

    const res = await addLoan(bookCodeInput.trim(), member.id);

    if (res.success) {
      setResult({ memberFull: member });
      setNimInput('');
      setBookCodeInput('');
    } else {
      setError(res.message);
    }
  };

  const filterByPeriod = (items) => {
    if (period === 'all') return items;
    const now = new Date();
    return items.filter(item => {
      const date = new Date(item.loanDate || item.borrowDate);
      if (period === 'daily') return date.toDateString() === now.toDateString();
      if (period === 'weekly') return (now - date) / (1000 * 60 * 60 * 24) <= 7;
      if (period === 'monthly') return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
      if (period === 'yearly') return date.getFullYear() === now.getFullYear();
      return true;
    });
  };

  const activeLoans = loans.filter(l => l.status === 'dipinjam' || l.status === 'terlambat');
  const lateCount = loans.filter(l => l.status === 'terlambat' || (l.status === 'dipinjam' && daysUntilDue(l.dueDate) < 0)).length;

  const filteredActiveLoans = filterByPeriod(activeLoans).filter(l =>
    !search ||
    l.bookTitle?.toLowerCase().includes(search.toLowerCase()) ||
    l.memberName?.toLowerCase().includes(search.toLowerCase()) ||
    l.bookCode?.toLowerCase().includes(search.toLowerCase())
  );

  const stats = [
    { label: 'Total Aktif', value: activeLoans.length, color: '#7B1C1C', bg: 'rgba(123,28,28,0.08)', border: 'rgba(123,28,28,0.2)' },
    { label: 'Terlambat', value: lateCount, color: '#991B1B', bg: 'rgba(153,27,27,0.08)', border: 'rgba(153,27,27,0.2)' },
    { label: 'Buku Tersedia', value: books.filter(b => b.available > 0).length, color: '#2E7D32', bg: 'rgba(46,125,50,0.08)', border: 'rgba(46,125,50,0.2)' },
    { label: 'Total Anggota', value: members.length, color: '#B45309', bg: 'rgba(180,83,9,0.08)', border: 'rgba(180,83,9,0.2)' },
  ];

  return (
    <div style={{ fontFamily: "'Segoe UI', sans-serif" }}>
      {/* Page Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: '#9B2C2C', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 6 }}>
          Petugas · Transaksi
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: '#1a1a1a', margin: 0, marginBottom: 6 }}>
          Transaksi Peminjaman
        </h1>
        <p style={{ fontSize: 13, color: '#6b7280', margin: 0 }}>
          Catat peminjaman buku baru dan pantau pinjaman aktif anggota perpustakaan FMIPA.
        </p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 24 }}>
        {stats.map((s, i) => (
          <div key={i} style={{ background: s.bg, border: `1px solid ${s.border}`, borderRadius: 12, padding: '16px 14px', textAlign: 'center' }}>
            <div style={{ fontSize: 24, fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.value}</div>
            <div style={{ fontSize: 11, color: '#6b7280', marginTop: 5, fontWeight: 500 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Main Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr', gap: 20, marginBottom: 24 }}>
        {/* Form Peminjaman */}
        <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 14, padding: 20, boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4, color: '#1a1a1a' }}>Form Peminjaman</div>
          <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 20 }}>Masukkan identitas anggota dan No. Induk buku yang dipinjam.</div>

          <form onSubmit={handleSubmit}>
            {/* NIM Input */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>
                Nomor Identitas (NIM/NIP)
              </label>
              <div style={{ position: 'relative' }}>
                <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                <input
                  style={{
                    width: '100%', paddingLeft: 32, paddingRight: 12, paddingTop: 9, paddingBottom: 9,
                    borderRadius: 8, border: '1.5px solid #e5e7eb', fontSize: 13, outline: 'none', boxSizing: 'border-box',
                    transition: 'border-color 0.15s',
                  }}
                  placeholder="Contoh: 20264"
                  value={nimInput}
                  onChange={e => setNimInput(e.target.value)}
                  required
                  onFocus={e => e.target.style.borderColor = '#9B2C2C'}
                  onBlur={e => e.target.style.borderColor = '#e5e7eb'}
                />
              </div>
              {nimInput && (() => {
                const m = findMemberByNim(nimInput.trim());
                return m ? (
                  <div style={{ fontSize: 12, color: '#2E7D32', marginTop: 5, display: 'flex', alignItems: 'center', gap: 4 }}>
                    ✓ {m.name} — {m.departemen || m.type}
                  </div>
                ) : (
                  <div style={{ fontSize: 12, color: '#B71C1C', marginTop: 5 }}>Anggota tidak ditemukan</div>
                );
              })()}
            </div>

            {/* Book Code Input */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>
                No. Induk Buku
              </label>
              <div style={{ position: 'relative' }}>
                <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                <input
                  style={{
                    width: '100%', paddingLeft: 32, paddingRight: 12, paddingTop: 9, paddingBottom: 9,
                    borderRadius: 8, border: '1.5px solid #e5e7eb', fontSize: 13, outline: 'none', boxSizing: 'border-box',
                    transition: 'border-color 0.15s',
                  }}
                  placeholder="Contoh: 00001/FMIPA/2026"
                  value={bookCodeInput}
                  onChange={e => setBookCodeInput(e.target.value)}
                  required
                  onFocus={e => e.target.style.borderColor = '#9B2C2C'}
                  onBlur={e => e.target.style.borderColor = '#e5e7eb'}
                />
              </div>
              {bookCodeInput && (() => {
                const b = books.find(b => b.no_induk === bookCodeInput.trim());
                return b ? (
                  <div style={{ fontSize: 12, color: b.available > 0 ? '#2E7D32' : '#B71C1C', marginTop: 5 }}>
                    {b.available > 0 ? `✓ "${b.title}" — ${b.available} tersedia` : `✗ "${b.title}" — Stok habis`}
                  </div>
                ) : (
                  <div style={{ fontSize: 12, color: '#B45309', marginTop: 5 }}>Buku tidak ditemukan</div>
                );
              })()}
            </div>

            {error && (
              <div style={{
                background: 'rgba(183,28,28,0.08)', color: '#7B1C1C', padding: '10px 12px',
                borderRadius: 8, fontSize: 13, marginBottom: 14, display: 'flex', gap: 8, alignItems: 'flex-start',
                border: '1px solid rgba(183,28,28,0.2)',
              }}>
                <AlertCircle size={15} style={{ flexShrink: 0, marginTop: 1 }} /> {error}
              </div>
            )}

            {result && (
              <div style={{
                background: 'rgba(46,125,50,0.08)', color: '#2E7D32', padding: '10px 12px',
                borderRadius: 8, fontSize: 13, marginBottom: 14, border: '1px solid rgba(46,125,50,0.2)',
              }}>
                ✓ Peminjaman berhasil diproses untuk {result.memberFull?.name}!
              </div>
            )}

            <button
              type="submit"
              style={{
                width: '100%', background: 'linear-gradient(135deg, #7B1C1C, #9B2C2C)', color: 'white',
                border: 'none', borderRadius: 8, padding: '10px 16px', fontSize: 13, fontWeight: 700,
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                transition: 'opacity 0.15s',
              }}
              onMouseOver={e => e.currentTarget.style.opacity = '0.9'}
              onMouseOut={e => e.currentTarget.style.opacity = '1'}
            >
              <Plus size={14} /> Proses Peminjaman
            </button>
          </form>

          {/* Quick Book Codes */}
          <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid #f3f4f6' }}>
            <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 8, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              No. Induk Buku Tersedia
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {books.filter(b => b.available > 0).map(b => (
                <span
                  key={b.id}
                  onClick={() => setBookCodeInput(b.no_induk)}
                  style={{
                    fontSize: 11, padding: '3px 8px', background: '#f9fafb', borderRadius: 4, cursor: 'pointer',
                    border: '1px solid #e5e7eb', color: '#374151', transition: 'all 0.15s',
                    fontFamily: 'monospace',
                  }}
                  onMouseOver={e => { e.currentTarget.style.background = 'rgba(123,28,28,0.08)'; e.currentTarget.style.borderColor = 'rgba(123,28,28,0.3)'; e.currentTarget.style.color = '#7B1C1C'; }}
                  onMouseOut={e => { e.currentTarget.style.background = '#f9fafb'; e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.color = '#374151'; }}
                >
                  {b.no_induk}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Active Loans List */}
        <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 14, overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
          {/* Header */}
          <div style={{
            padding: '16px 20px', borderBottom: '1px solid #f3f4f6',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            flexWrap: 'wrap', gap: 10,
            background: 'linear-gradient(to right, #fafafa, #fff5f5)',
          }}>
            <div style={{ fontWeight: 700, fontSize: 15, color: '#1a1a1a' }}>
              Daftar Pinjaman Aktif
              <span style={{ marginLeft: 8, background: 'rgba(180,83,9,0.1)', color: '#B45309', padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 700 }}>
                {filteredActiveLoans.length} aktif
              </span>
            </div>

            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              {/* Period Filter */}
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
                  {PERIOD_OPTIONS.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
                <Filter size={11} style={{ position: 'absolute', right: 9, top: '50%', transform: 'translateY(-50%)', color: '#7B1C1C', pointerEvents: 'none' }} />
              </div>

              {/* Search */}
              <div style={{ position: 'relative' }}>
                <Search size={12} style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                <input
                  style={{
                    paddingLeft: 30, paddingRight: 12, paddingTop: 7, paddingBottom: 7,
                    borderRadius: 8, border: '1.5px solid #e5e7eb', fontSize: 12, outline: 'none', width: 180,
                  }}
                  placeholder="Cari anggota / buku..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Loan Cards */}
          <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 480, overflowY: 'auto' }}>
            {filteredActiveLoans.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px 0', color: '#9ca3af' }}>
                <BookOpen size={36} style={{ opacity: 0.3, marginBottom: 12, display: 'block', margin: '0 auto 12px' }} />
                <div style={{ fontSize: 14, fontWeight: 600 }}>
                  {period !== 'all' ? 'Tidak ada pinjaman pada periode ini' : 'Tidak ada pinjaman aktif'}
                </div>
              </div>
            ) : filteredActiveLoans.map(l => {
              const prefix = l.bookCode?.split('/')[0] || 'BK';
              const book = books.find(b => b.no_induk === l.bookCode);
              const isLate = daysUntilDue(l.dueDate) < 0;

              return (
                <div key={l.id} style={{
                  display: 'flex', gap: 14, padding: '12px 14px',
                  background: isLate ? 'rgba(183,28,28,0.04)' : '#fafafa',
                  borderRadius: 10,
                  border: `1px solid ${isLate ? 'rgba(183,28,28,0.2)' : '#f3f4f6'}`,
                  alignItems: 'flex-start',
                  transition: 'border-color 0.15s',
                }}>
                  {/* Cover */}
                  <div style={{ width: 44, height: 58, borderRadius: 5, overflow: 'hidden', flexShrink: 0, background: '#e5e7eb' }}>
                    {book?.image_url ? (
                      <img src={`${API_BASE_URL}${book.image_url}`} alt={l.bookTitle} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', background: COVER_COLORS[prefix] || '#555', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 9, fontWeight: 700 }}>
                        {prefix}
                      </div>
                    )}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 2, color: '#1a1a1a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.bookTitle}</div>
                    <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 8 }}>
                      {l.memberName}
                      {l.memberType && <span style={{ marginLeft: 6, background: '#f3f4f6', padding: '1px 6px', borderRadius: 4, fontSize: 10, fontWeight: 600 }}>{l.memberType}</span>}
                    </div>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 11, color: '#9ca3af', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Clock size={10} /> {l.loanDate}
                      </span>
                      <DueBadge dueDate={l.dueDate} status={l.status} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}