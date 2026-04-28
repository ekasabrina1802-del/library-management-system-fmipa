import { useState } from 'react';
import { Search, CheckCircle, AlertCircle, Edit2, Trash2, X, Check } from 'lucide-react';
import { useApp } from '../components/AppContext';

export default function AdminPengembalianPage() {
  const { loans, returnBook, updateLoan, deleteLoan } = useApp();
  const [codeInput, setCodeInput] = useState('');
  const [activeDetail, setActiveDetail] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [editDenda, setEditDenda] = useState(null);
  const [editDendaValue, setEditDendaValue] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const handleSearch = () => {
    setResult(null); setError('');
    const code = codeInput.trim().toUpperCase();
    const loan = loans.find(l => l.bookCode === code && (l.status === 'dipinjam' || l.status === 'terlambat'));
    if (!loan) { setError('Tidak ada peminjaman aktif untuk kode buku ini.'); setActiveDetail(null); return; }
    const today = new Date();
    const dueDate = new Date(loan.dueDate);
    const days = Math.floor((today - dueDate) / (1000 * 60 * 60 * 24));
    const denda = days > 0 ? days * 1000 : 0;
    setActiveDetail({ ...loan, lateDays: days > 0 ? days : 0, estimatedDenda: denda });
  };

  const handleReturn = () => {
    const res = returnBook(activeDetail.bookCode);
    if (res.success) { setResult(res); setActiveDetail(null); setCodeInput(''); }
  };

  const handleEditDenda = (loan) => {
    setEditDenda(loan);
    setEditDendaValue(loan.denda || 0);
  };

  const handleSaveDenda = () => {
    if (updateLoan) updateLoan(editDenda.id, { denda: parseInt(editDendaValue) || 0 });
    setEditDenda(null);
  };

  const handleDeleteReturn = (id) => {
    if (deleteLoan) deleteLoan(id);
    setDeleteConfirm(null);
  };

  const completedLoans = loans.filter(l => l.status === 'dikembalikan').sort((a, b) => (b.returnDate || '').localeCompare(a.returnDate || ''));
  const filteredCompleted = completedLoans.filter(l =>
    !search ||
    l.bookTitle?.toLowerCase().includes(search.toLowerCase()) ||
    l.memberName?.toLowerCase().includes(search.toLowerCase()) ||
    l.bookCode?.toLowerCase().includes(search.toLowerCase())
  );

  const totalDendaTerkumpul = completedLoans.reduce((sum, l) => sum + (l.denda || 0), 0);
  const totalTerlambat = completedLoans.filter(l => (l.denda || 0) > 0).length;

  return (
    <div>
      <div className="page-header">
        <div className="page-breadcrumb">Admin · Transaksi</div>
        <h1 className="page-title">Manajemen Pengembalian Buku</h1>
        <p className="page-subtitle">Proses pengembalian dan kelola denda keterlambatan seluruh anggota.</p>
      </div>

      {/* Stats */}
      <div className="grid-3" style={{ gap: 12, marginBottom: 24 }}>
        {[
          { label: 'Total Pengembalian', value: completedLoans.length, color: 'var(--success)', bg: 'rgba(46,125,50,0.08)' },
          { label: 'Kasus Terlambat', value: totalTerlambat, color: 'var(--danger)', bg: 'rgba(183,28,28,0.08)' },
          { label: 'Total Denda Terkumpul', value: `Rp ${totalDendaTerkumpul.toLocaleString('id-ID')}`, color: 'var(--warning)', bg: 'rgba(245,158,11,0.08)' },
        ].map((s, i) => (
          <div key={i} className="card" style={{ background: s.bg, border: 'none', textAlign: 'center', padding: '14px 12px' }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 11, color: 'var(--gray-text)', marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

     <div style={{ marginBottom: 24 }}>
    
        {/* Return history — admin dapat edit/hapus denda */}
        <div className="card">
          <div className="flex-between mb-16">
            <div>
              <div style={{ fontWeight: 700, fontSize: 15 }}>Riwayat Pengembalian</div>
              <div style={{ fontSize: 11, color: 'var(--gray-text)', marginTop: 2 }}>Admin dapat mengubah/menghapus denda</div>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <span className="badge badge-success">{completedLoans.length} selesai</span>
              <div style={{ position: 'relative' }}>
                <Search size={11} style={{ position: 'absolute', left: 7, top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-text)' }} />
                <input className="form-control" style={{ paddingLeft: 24, width: 150, fontSize: 11, height: 28 }}
                  placeholder="Cari..." value={search} onChange={e => setSearch(e.target.value)} />
              </div>
            </div>
          </div>
          <div className="table-container" style={{ maxHeight: 460, overflowY: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th>Waktu</th>
                  <th>Kode</th>
                  <th>Peminjam</th>
                  <th>Denda</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'center' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredCompleted.length === 0 ? (
                  <tr><td colSpan={6} style={{ textAlign: 'center', padding: 30, color: 'var(--gray-text)' }}>Belum ada pengembalian</td></tr>
                ) : filteredCompleted.map(l => (
                  <tr key={l.id}>
                    <td style={{ fontSize: 11, color: 'var(--gray-text)', whiteSpace: 'nowrap' }}>{l.returnDate}</td>
                    <td><code style={{ fontSize: 11, background: 'var(--gray-light)', padding: '1px 5px', borderRadius: 3 }}>{l.bookCode}</code></td>
                    <td style={{ fontSize: 12 }}>{l.memberName}</td>
                    <td style={{ fontSize: 12, fontWeight: (l.denda || 0) > 0 ? 700 : 400, color: (l.denda || 0) > 0 ? 'var(--danger)' : 'inherit' }}>
                      {(l.denda || 0) > 0 ? `Rp ${l.denda.toLocaleString('id-ID')}` : '-'}
                    </td>
                    <td>
                      <span className={`badge ${(l.denda || 0) > 0 ? 'badge-warning' : 'badge-success'}`} style={{ fontSize: 10 }}>
                        {(l.denda || 0) > 0 ? 'Terlambat' : 'Tepat Waktu'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                      <button onClick={() => handleEditDenda(l)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '3px 5px', color: 'var(--primary)' }} title="Edit Denda">
                        <Edit2 size={13} />
                      </button>
                      <button onClick={() => setDeleteConfirm(l.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '3px 5px', color: 'var(--danger)' }} title="Hapus Riwayat">
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

      {/* Modal Edit Denda */}
      {editDenda && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="card" style={{ width: 360, position: 'relative' }}>
            <button onClick={() => setEditDenda(null)} style={{ position: 'absolute', top: 12, right: 12, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--gray-text)' }}><X size={16} /></button>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>Edit Denda</div>
            <div style={{ fontSize: 12, color: 'var(--gray-text)', marginBottom: 16 }}>{editDenda.bookTitle} · {editDenda.memberName}</div>
            <div className="form-group">
              <label className="form-label">Jumlah Denda (Rp)</label>
              <input type="number" className="form-control" placeholder="0" value={editDendaValue} onChange={e => setEditDendaValue(e.target.value)} />
              <div style={{ fontSize: 11, color: 'var(--gray-text)', marginTop: 4 }}>Masukkan 0 untuk menghapus denda.</div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }} onClick={handleSaveDenda}>
                <Check size={14} /> Simpan Denda
              </button>
              <button className="btn" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setEditDenda(null)}>Batal</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Hapus */}
      {deleteConfirm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="card" style={{ width: 340, textAlign: 'center' }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>🗑️</div>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 8 }}>Hapus Riwayat?</div>
            <div style={{ fontSize: 13, color: 'var(--gray-text)', marginBottom: 20 }}>Data pengembalian ini akan dihapus permanen.</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setDeleteConfirm(null)}>Batal</button>
              <button className="btn" style={{ flex: 1, justifyContent: 'center', background: 'var(--danger)', color: 'white', border: 'none' }} onClick={() => handleDeleteReturn(deleteConfirm)}>Hapus</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}