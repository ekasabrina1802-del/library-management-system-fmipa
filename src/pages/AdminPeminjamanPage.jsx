import { useState } from 'react';
import { Search, Plus, Clock, AlertCircle, Trash2, Edit2, BarChart2, X, Check } from 'lucide-react';
import { useApp } from '../components/AppContext';

const COVER_COLORS = { MTK: '#7B1C1C', FIS: '#0D1B2A', KIM: '#1B5E20', BIO: '#1A237E' };

function daysUntilDue(dueDate) {
  const today = new Date();
  const due = new Date(dueDate);
  return Math.ceil((due - today) / (1000 * 60 * 60 * 24));
}

function DueBadge({ dueDate, status }) {
  if (status === 'dikembalikan') return <span className="badge badge-success">Selesai</span>;
  const days = daysUntilDue(dueDate);
  if (days < 0) return <span className="due-badge due-late">Terlambat {Math.abs(days)} hari</span>;
  if (days <= 3) return <span className="due-badge due-soon">Jatuh tempo {days} hari lagi</span>;
  return <span className="due-badge due-ok">Sisa {days} hari</span>;
}

export default function AdminPeminjamanPage() {
  const { books, members, loans, addLoan, deleteLoan, updateLoan } = useApp();
  const [nimInput, setNimInput] = useState('');
  const [bookCodeInput, setBookCodeInput] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [editLoan, setEditLoan] = useState(null);
  const [editDueDate, setEditDueDate] = useState('');
  const [editDenda, setEditDenda] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const findMemberByNim = (nim) => members.find(m => m.nim === nim || m.id === nim);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError(''); setResult(null);
    const member = findMemberByNim(nimInput.trim());
    if (!member) { setError('Anggota tidak ditemukan. Periksa NIM/NIP.'); return; }
    const res = addLoan(bookCodeInput.trim().toUpperCase(), member.id);
    if (res.success) {
      setResult({ ...res.loan, memberFull: member });
      setNimInput(''); setBookCodeInput('');
    } else {
      setError(res.message);
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

  const allLoans = [...loans].sort((a, b) => b.id?.localeCompare?.(a.id) || 0);
  const filteredLoans = allLoans.filter(l =>
    !search ||
    l.bookTitle?.toLowerCase().includes(search.toLowerCase()) ||
    l.memberName?.toLowerCase().includes(search.toLowerCase()) ||
    l.bookCode?.toLowerCase().includes(search.toLowerCase())
  );

  const activeLoans = loans.filter(l => l.status === 'dipinjam' || l.status === 'terlambat');
  const lateLoans = loans.filter(l => l.status === 'terlambat' || (l.status === 'dipinjam' && daysUntilDue(l.dueDate) < 0));
  const totalDenda = loans.reduce((sum, l) => sum + (l.denda || 0), 0);
  const returnedLoans = loans.filter(l => l.status === 'dikembalikan');

  return (
    <div>
      <div className="page-header">
        <div className="page-breadcrumb">Admin · Transaksi</div>
        <h1 className="page-title">Manajemen Peminjaman</h1>
        <p className="page-subtitle">Kelola semua transaksi peminjaman buku perpustakaan FMIPA.</p>
      </div>

      {/* Stats */}
      <div className="grid-4" style={{ gap: 12, marginBottom: 24 }}>
        {[
          { label: 'Total Transaksi', value: allLoans.length, color: 'var(--primary)', bg: 'rgba(74,85,226,0.08)' },
          { label: 'Aktif', value: activeLoans.length, color: 'var(--warning)', bg: 'rgba(245,158,11,0.08)' },
          { label: 'Terlambat', value: lateLoans.length, color: 'var(--danger)', bg: 'rgba(183,28,28,0.08)' },
          { label: 'Total Denda', value: `Rp ${totalDenda.toLocaleString('id-ID')}`, color: 'var(--success)', bg: 'rgba(46,125,50,0.08)' },
        ].map((s, i) => (
          <div key={i} className="card" style={{ background: s.bg, border: 'none', textAlign: 'center', padding: '14px 12px' }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 11, color: 'var(--gray-text)', marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ marginBottom: 24 }}>
        
        {/* Tabel Semua Transaksi */}
        <div className="card">
          <div className="flex-between mb-16">
            <div style={{ fontWeight: 700, fontSize: 15 }}>Semua Transaksi Peminjaman</div>
            <div style={{ position: 'relative' }}>
              <Search size={12} style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-text)' }} />
              <input className="form-control" style={{ paddingLeft: 28, width: 200, fontSize: 12, height: 30 }}
                placeholder="Cari anggota / buku..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
          </div>
          <div className="table-container" style={{ maxHeight: 500, overflowY: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th>Kode</th>
                  <th>Judul</th>
                  <th>Peminjam</th>
                  <th>Tgl Pinjam</th>
                  <th>Batas</th>
                  <th>Denda</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'center' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredLoans.length === 0 ? (
                  <tr><td colSpan={8} style={{ textAlign: 'center', padding: 30, color: 'var(--gray-text)' }}>Tidak ada transaksi</td></tr>
                ) : filteredLoans.map(l => (
                  <tr key={l.id}>
                    <td><code style={{ fontSize: 11, background: 'var(--gray-light)', padding: '1px 5px', borderRadius: 3 }}>{l.bookCode}</code></td>
                    <td style={{ maxWidth: 120 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.bookTitle}</div>
                    </td>
                    <td style={{ fontSize: 12 }}>
                      <div>{l.memberName}</div>
                      <div style={{ fontSize: 10, color: 'var(--gray-text)' }}>{l.memberType}</div>
                    </td>
                    <td style={{ fontSize: 11, color: 'var(--gray-text)', whiteSpace: 'nowrap' }}>{l.loanDate}</td>
                    <td style={{ fontSize: 11, whiteSpace: 'nowrap' }}>
                      <DueBadge dueDate={l.dueDate} status={l.status} />
                    </td>
                    <td style={{ fontSize: 12, fontWeight: (l.denda || 0) > 0 ? 700 : 400, color: (l.denda || 0) > 0 ? 'var(--danger)' : 'inherit' }}>
                      {(l.denda || 0) > 0 ? `Rp ${(l.denda).toLocaleString('id-ID')}` : '-'}
                    </td>
                    <td>
                      <span className={`badge ${l.status === 'dikembalikan' ? 'badge-success' : l.status === 'terlambat' ? 'badge-danger' : 'badge-warning'}`} style={{ fontSize: 10 }}>
                        {l.status}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                      <button onClick={() => handleEdit(l)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '3px 5px', color: 'var(--primary)' }} title="Edit">
                        <Edit2 size={13} />
                      </button>
                      <button onClick={() => setDeleteConfirm(l.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '3px 5px', color: 'var(--danger)' }} title="Hapus">
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal Edit */}
      {editLoan && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="card" style={{ width: 380, position: 'relative' }}>
            <button onClick={() => setEditLoan(null)} style={{ position: 'absolute', top: 12, right: 12, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--gray-text)' }}><X size={16} /></button>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>Edit Transaksi</div>
            <div style={{ fontSize: 12, color: 'var(--gray-text)', marginBottom: 16 }}>{editLoan.bookTitle} · {editLoan.memberName}</div>
            <div className="form-group">
              <label className="form-label">Tanggal Jatuh Tempo</label>
              <input type="date" className="form-control" value={editDueDate} onChange={e => setEditDueDate(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Denda (Rp)</label>
              <input type="number" className="form-control" placeholder="0" value={editDenda} onChange={e => setEditDenda(e.target.value)} />
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
              <button className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }} onClick={handleSaveEdit}>
                <Check size={14} /> Simpan
              </button>
              <button className="btn" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setEditLoan(null)}>
                Batal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Hapus */}
      {deleteConfirm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="card" style={{ width: 340, textAlign: 'center' }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>🗑️</div>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 8 }}>Hapus Transaksi?</div>
            <div style={{ fontSize: 13, color: 'var(--gray-text)', marginBottom: 20 }}>Tindakan ini tidak dapat dibatalkan. Data transaksi akan dihapus permanen.</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setDeleteConfirm(null)}>Batal</button>
              <button className="btn btn-danger" style={{ flex: 1, justifyContent: 'center', background: 'var(--danger)', color: 'white' }} onClick={() => handleDelete(deleteConfirm)}>Hapus</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}