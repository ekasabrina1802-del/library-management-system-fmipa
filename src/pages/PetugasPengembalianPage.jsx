import { useState } from 'react';
import { Search, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { useApp } from '../components/AppContext';

export default function PengembalianPage() {
  const { loans, returnBook } = useApp();
  const [codeInput, setCodeInput] = useState('');
  const [activeDetail, setActiveDetail] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleSearch = () => {
    setResult(null); setError('');
    const code = codeInput.trim().toUpperCase();
    const loan = loans.find(l => l.bookCode === code && (l.status === 'dipinjam' || l.status === 'terlambat'));
    if (!loan) {
      setError('Tidak ada peminjaman aktif untuk kode buku ini.');
      setActiveDetail(null);
      return;
    }
    const today = new Date();
    const dueDate = new Date(loan.dueDate);
    const days = Math.floor((today - dueDate) / (1000 * 60 * 60 * 24));
    const denda = days > 0 ? days * 1000 : 0;
    setActiveDetail({ ...loan, lateDays: days > 0 ? days : 0, estimatedDenda: denda });
  };

  const handleReturn = () => {
    const res = returnBook(activeDetail.bookCode);
    if (res.success) {
      setResult(res);
      setActiveDetail(null);
      setCodeInput('');
    }
  };

  const completedLoans = loans.filter(l => l.status === 'dikembalikan').sort((a, b) => b.returnDate?.localeCompare(a.returnDate));

  return (
    <div>
      <div className="page-header">
        <div className="page-breadcrumb">Transaksi</div>
        <h1 className="page-title">Transaksi Pengembalian Buku</h1>
        <p className="page-subtitle">Masukkan kode unik buku untuk memproses pengembalian mandiri oleh petugas. Pastikan fisik buku dalam kondisi baik saat diterima.</p>
      </div>

      <div className="grid-2" style={{ gridTemplateColumns: '1fr 1.5fr', gap: 20, marginBottom: 24 }}>
        {/* Input & Detail */}
        <div>
          <div className="card mb-16">
            <div style={{ fontWeight: 700, marginBottom: 4, fontSize: 15 }}>Input Kode Buku</div>
            <div style={{ fontSize: 12, color: 'var(--gray-text)', marginBottom: 16 }}>Masukkan kode buku yang dikembalikan oleh anggota.</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-text)' }} />
                <input
                  className="form-control"
                  style={{ paddingLeft: 32 }}
                  placeholder="Kode buku, cth: MTK-001"
                  value={codeInput}
                  onChange={e => { setCodeInput(e.target.value); setError(''); setResult(null); setActiveDetail(null); }}
                  onKeyDown={e => e.key === 'Enter' && handleSearch()}
                />
              </div>
              <button className="btn btn-primary" onClick={handleSearch}>Cari</button>
            </div>

            {error && (
              <div style={{ background: 'rgba(183,28,28,0.08)', color: 'var(--danger)', padding: '10px 12px', borderRadius: 6, fontSize: 13, marginTop: 12, display: 'flex', gap: 8 }}>
                <AlertCircle size={15} style={{ flexShrink: 0 }} /> {error}
              </div>
            )}

            {result && (
              <div style={{ background: 'rgba(46,125,50,0.08)', color: 'var(--success)', padding: '12px', borderRadius: 6, marginTop: 12 }}>
                <div style={{ fontWeight: 700, marginBottom: 4 }}>✓ Pengembalian Berhasil</div>
                <div style={{ fontSize: 12 }}>"{result.loan.bookTitle}" — {result.loan.memberName}</div>
                {result.denda > 0 && <div style={{ fontSize: 12, color: 'var(--warning)', marginTop: 4, fontWeight: 600 }}>Denda: Rp {result.denda.toLocaleString('id-ID')}</div>}
              </div>
            )}
          </div>

          {activeDetail && (
            <div className="card">
              <div style={{ fontWeight: 700, marginBottom: 16, fontSize: 15 }}>Detail Transaksi Aktif</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--gray-text)', fontSize: 12 }}>Judul Buku</span>
                  <span style={{ fontWeight: 600, fontSize: 13 }}>{activeDetail.bookTitle}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--gray-text)', fontSize: 12 }}>Kode Buku</span>
                  <code style={{ background: 'var(--gray-light)', padding: '2px 8px', borderRadius: 4 }}>{activeDetail.bookCode}</code>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--gray-text)', fontSize: 12 }}>Peminjam</span>
                  <span style={{ fontWeight: 600, fontSize: 13 }}>{activeDetail.memberName}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--gray-text)', fontSize: 12 }}>Tipe</span>
                  <span className={`badge ${activeDetail.memberType === 'mahasiswa' ? 'badge-info' : 'badge-success'}`}>{activeDetail.memberType}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--gray-text)', fontSize: 12 }}>Batas Kembali</span>
                  <span style={{ fontWeight: 600, color: activeDetail.lateDays > 0 ? 'var(--danger)' : 'var(--success)' }}>{activeDetail.dueDate}</span>
                </div>
                {activeDetail.lateDays > 0 && (
                  <div style={{ background: 'rgba(183,28,28,0.08)', borderRadius: 8, padding: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <AlertCircle size={14} style={{ color: 'var(--danger)' }} />
                      <span style={{ fontWeight: 700, color: 'var(--danger)', fontSize: 13 }}>Status: TERLAMBAT</span>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--gray-text)' }}>Keterlambatan: {activeDetail.lateDays} hari</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--danger)', marginTop: 4 }}>
                      Denda: Rp {activeDetail.estimatedDenda.toLocaleString('id-ID')} (Rp 1.000 × {activeDetail.lateDays} hari)
                    </div>
                  </div>
                )}
              </div>
              <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: 16 }} onClick={handleReturn}>
                <CheckCircle size={15} /> Selesaikan Pengembalian
              </button>
            </div>
          )}
        </div>

        {/* Return history */}
        <div className="card">
          <div className="flex-between mb-16">
            <div style={{ fontWeight: 700, fontSize: 15 }}>Daftar Pengembalian</div>
            <span className="badge badge-success">{completedLoans.length} selesai</span>
          </div>
          <div className="table-container" style={{ maxHeight: 480, overflowY: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th>Waktu</th>
                  <th>Kode</th>
                  <th>Judul</th>
                  <th>Peminjam</th>
                  <th>Denda</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {completedLoans.length === 0 ? (
                  <tr><td colSpan={6} style={{ textAlign: 'center', padding: 30, color: 'var(--gray-text)' }}>Belum ada pengembalian</td></tr>
                ) : completedLoans.map(l => (
                  <tr key={l.id}>
                    <td style={{ fontSize: 11, color: 'var(--gray-text)', whiteSpace: 'nowrap' }}>{l.returnDate}</td>
                    <td><code style={{ fontSize: 11, background: 'var(--gray-light)', padding: '1px 5px', borderRadius: 3 }}>{l.bookCode}</code></td>
                    <td style={{ maxWidth: 160 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.bookTitle}</div>
                    </td>
                    <td style={{ fontSize: 12 }}>{l.memberName}</td>
                    <td style={{ fontSize: 12, fontWeight: l.denda > 0 ? 700 : 400, color: l.denda > 0 ? 'var(--danger)' : 'inherit' }}>
                      {l.denda > 0 ? `Rp ${l.denda.toLocaleString('id-ID')}` : '-'}
                    </td>
                    <td>
                      <span className={`badge ${l.denda > 0 ? 'badge-warning' : 'badge-success'}`}>
                        {l.denda > 0 ? 'Terlambat' : 'Tepat Waktu'}
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