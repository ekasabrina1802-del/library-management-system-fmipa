import { useState } from 'react';
import { Search, Plus, Clock, AlertCircle, Trash2, Edit2, X, Check, Filter, Calendar } from 'lucide-react';
import { useApp } from '../components/AppContext';

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

const PERIOD_OPTIONS = [
  { value: 'all', label: 'Semua Waktu' },
  { value: 'daily', label: 'Hari Ini' },
  { value: 'weekly', label: 'Minggu Ini' },
  { value: 'monthly', label: 'Bulan Ini' },
  { value: 'yearly', label: 'Tahun Ini' },
];

export default function AdminPeminjamanPage() {
  const { books, members, loans, addLoan, deleteLoan, updateLoan } = useApp();
  const [nimInput, setNimInput] = useState('');
  const [bookCodeInput, setBookCodeInput] = useState('');
  const [formResult, setFormResult] = useState(null);
  const [formError, setFormError] = useState('');
  const [search, setSearch] = useState('');
  const [period, setPeriod] = useState('all');
  const [editLoan, setEditLoan] = useState(null);
  const [editDueDate, setEditDueDate] = useState('');
  const [editDenda, setEditDenda] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const findMemberByNim = (nim) => members.find(m => m.nim === nim || m.id === nim);

  const handleSubmit = (e) => {
    e.preventDefault();
    setFormError('');
    setFormResult(null);
    const member = findMemberByNim(nimInput.trim());
    if (!member) { setFormError('Anggota tidak ditemukan. Periksa NIM/NIP.'); return; }
    const res = addLoan(bookCodeInput.trim().toUpperCase(), member.id);
    if (res.success) {
      setFormResult({ ...res.loan, memberFull: member });
      setNimInput('');
      setBookCodeInput('');
    } else {
      setFormError(res.message);
    }
  };

  const handleEdit = (loan) => {
    setEditLoan(loan);
    setEditDueDate(loan.dueDate);
    setEditDenda(loan.denda || 0);
  };

  const handleSaveEdit = () => {
    if (updateLoan) updateLoan(editLoan.id, { dueDate: editDueDate, denda: parseInt(editDenda) || 0 });
    setEditLoan(null);
  };

  const handleDelete = (loanId) => {
    if (deleteLoan) deleteLoan(loanId);
    setDeleteConfirm(null);
  };

  const filterByPeriod = (items) => {
    if (period === 'all') return items;
    const now = new Date();
    return items.filter(item => {
      const date = new Date(item.borrowDate || item.loanDate);
      if (period === 'daily') return date.toDateString() === now.toDateString();
      if (period === 'weekly') return (now - date) / (1000 * 60 * 60 * 24) <= 7;
      if (period === 'monthly') return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
      if (period === 'yearly') return date.getFullYear() === now.getFullYear();
      return true;
    });
  };

  const allLoans = [...loans].sort((a, b) => b.id?.localeCompare?.(a.id) || 0);
  const filteredLoans = filterByPeriod(allLoans).filter(l =>
    !search ||
    l.bookTitle?.toLowerCase().includes(search.toLowerCase()) ||
    l.memberName?.toLowerCase().includes(search.toLowerCase()) ||
    l.bookCode?.toLowerCase().includes(search.toLowerCase())
  );

  const activeLoans = loans.filter(l => l.status === 'dipinjam' || l.status === 'terlambat');
  const lateLoans = loans.filter(l => l.status === 'terlambat' || (l.status === 'dipinjam' && daysUntilDue(l.dueDate) < 0));
  const totalDenda = loans.reduce((sum, l) => sum + (l.denda || 0), 0);

  const stats = [
    { label: 'Total Transaksi', value: allLoans.length, color: '#7B1C1C', bg: 'rgba(123,28,28,0.08)', border: 'rgba(123,28,28,0.2)' },
    { label: 'Aktif', value: activeLoans.length, color: '#B45309', bg: 'rgba(180,83,9,0.08)', border: 'rgba(180,83,9,0.2)' },
    { label: 'Terlambat', value: lateLoans.length, color: '#991B1B', bg: 'rgba(153,27,27,0.08)', border: 'rgba(153,27,27,0.2)' },
    { label: 'Total Denda', value: `Rp ${totalDenda.toLocaleString('id-ID')}`, color: '#2E7D32', bg: 'rgba(46,125,50,0.08)', border: 'rgba(46,125,50,0.2)' },
  ];

  return (
    <div style={{ fontFamily: "'Segoe UI', sans-serif" }}>
      {/* Page Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: '#9B2C2C', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 6 }}>
          Admin · Transaksi
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: '#1a1a1a', margin: 0, marginBottom: 6 }}>
          Manajemen Peminjaman
        </h1>
        <p style={{ fontSize: 13, color: '#6b7280', margin: 0 }}>
          Kelola semua transaksi peminjaman buku perpustakaan FMIPA.
        </p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 24 }}>
        {stats.map((s, i) => (
          <div key={i} style={{
            background: s.bg,
            border: `1px solid ${s.border}`,
            borderRadius: 12,
            padding: '16px 14px',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: 24, fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.value}</div>
            <div style={{ fontSize: 11, color: '#6b7280', marginTop: 5, fontWeight: 500 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tabel Transaksi */}
      <div style={{
        background: 'white', border: '1px solid #e5e7eb',
        borderRadius: 14, overflow: 'hidden',
        boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
      }}>
        {/* Table Header */}
        <div style={{
          padding: '16px 20px', borderBottom: '1px solid #f3f4f6',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          flexWrap: 'wrap', gap: 12,
          background: 'linear-gradient(to right, #fafafa, #fff5f5)',
        }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: '#1a1a1a' }}>
            Semua Transaksi Peminjaman
            <span style={{
              marginLeft: 8, background: 'rgba(123,28,28,0.1)', color: '#7B1C1C',
              padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 700,
            }}>{filteredLoans.length}</span>
          </div>

          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            {/* Period Filter */}
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

            {/* Search */}
            <div style={{ position: 'relative' }}>
              <Search size={12} style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
              <input
                style={{
                  paddingLeft: 30, paddingRight: 12, paddingTop: 8, paddingBottom: 8,
                  borderRadius: 8, border: '1.5px solid #e5e7eb',
                  fontSize: 12, outline: 'none', width: 200,
                }}
                placeholder="Cari anggota / buku..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Table */}
        <div style={{ overflowX: 'auto', maxHeight: 520, overflowY: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#fafafa', borderBottom: '1.5px solid #f3f4f6' }}>
                {['Kode', 'Judul', 'Peminjam', 'Tgl Pinjam', 'Jatuh Tempo', 'Denda', 'Status'].map(h => (
                  <th key={h} style={{
                    padding: '10px 14px', textAlign: 'left',
                    fontSize: 11, fontWeight: 700, color: '#6b7280',
                    textTransform: 'uppercase', letterSpacing: '0.5px',
                    whiteSpace: 'nowrap',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredLoans.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: 40, color: '#9ca3af', fontSize: 13 }}>
                    Tidak ada transaksi pada periode ini
                  </td>
                </tr>
              ) : filteredLoans.map((l, idx) => (
                <tr key={l.id} style={{
                  borderBottom: '1px solid #f9fafb',
                  background: idx % 2 === 0 ? 'white' : '#fafafa',
                  transition: 'background 0.15s',
                }}>
                  <td style={{ padding: '10px 14px' }}>
                    <code style={{
                      fontSize: 11, background: '#f3f4f6',
                      padding: '2px 7px', borderRadius: 4, color: '#374151', fontWeight: 600,
                    }}>{l.bookCode}</code>
                  </td>
                  <td style={{ padding: '10px 14px', maxWidth: 140 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#1a1a1a' }}>{l.bookTitle}</div>
                  </td>
                  <td style={{ padding: '10px 14px' }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#1a1a1a' }}>{l.memberName}</div>
                    <div style={{ fontSize: 10, color: '#9ca3af', marginTop: 1 }}>{l.memberType}</div>
                  </td>
                  <td style={{ padding: '10px 14px', fontSize: 11, color: '#9ca3af', whiteSpace: 'nowrap' }}>{l.loanDate}</td>
                  <td style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>
                    <DueBadge dueDate={l.dueDate} status={l.status} />
                  </td>
                  <td style={{ padding: '10px 14px', fontSize: 12, fontWeight: (l.denda || 0) > 0 ? 700 : 400, color: (l.denda || 0) > 0 ? '#991B1B' : '#9ca3af' }}>
                    {(l.denda || 0) > 0 ? `Rp ${l.denda.toLocaleString('id-ID')}` : '—'}
                  </td>
                  <td style={{ padding: '10px 14px' }}>
                    <span style={{
                      padding: '3px 8px', borderRadius: 20, fontSize: 10, fontWeight: 700,
                      background: l.status === 'dikembalikan' ? 'rgba(46,125,50,0.12)' : l.status === 'terlambat' ? 'rgba(153,27,27,0.12)' : 'rgba(180,83,9,0.12)',
                      color: l.status === 'dikembalikan' ? '#2E7D32' : l.status === 'terlambat' ? '#991B1B' : '#B45309',
                    }}>{l.status}</span>
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