import { useState } from 'react';
import { Search, CheckCircle, AlertCircle } from 'lucide-react';
import { useApp } from '../components/AppContext';

export default function PengembalianPage() {
  const { loans, returnBook } = useApp();
  const [codeInput, setCodeInput] = useState('');
  const [activeDetail, setActiveDetail] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const DENDA_PER_HARI = 10000;

  const handleSearch = () => {
    setResult(null);
    setError('');

    const code = codeInput.trim();

    const loan = loans.find(
      l => l.bookCode === code && (l.status === 'dipinjam' || l.status === 'terlambat')
    );

    if (!loan) {
      setError('Tidak ada peminjaman aktif untuk No. Induk buku ini.');
      setActiveDetail(null);
      return;
    }

    const today = new Date();
    const dueDate = new Date(loan.dueDate);
    const days = Math.floor((today - dueDate) / (1000 * 60 * 60 * 24));
    const denda = days > 0 ? days * DENDA_PER_HARI : 0;

    setActiveDetail({
      ...loan,
      lateDays: days > 0 ? days : 0,
      estimatedDenda: denda
    });
  };

  const handleReturn = async () => {
    const res = await returnBook(activeDetail.bookCode);

    if (res.success) {
      setResult(res);
      setActiveDetail(null);
      setCodeInput('');
    } else {
      setError(res.message);
    }
  };

  const completedLoans = loans
    .filter(l => l.status === 'dikembalikan')
    .sort((a, b) => b.returnDate?.localeCompare(a.returnDate));

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Pengembalian Buku</h1>
        <p className="page-subtitle">Masukkan No. Induk buku untuk proses pengembalian</p>
      </div>

      <div className="grid-2" style={{ gap: 20 }}>
        <div>
          <div className="card">
            <div style={{ fontWeight: 700, marginBottom: 12 }}>Input No. Induk Buku</div>

            <div style={{ display: 'flex', gap: 8 }}>
              <input
                className="form-control"
                placeholder="Contoh: 00001/FMIPA/2026"
                value={codeInput}
                onChange={e => {
                  setCodeInput(e.target.value);
                  setError('');
                  setResult(null);
                  setActiveDetail(null);
                }}
              />
              <button className="btn btn-primary" onClick={handleSearch}>
                <Search size={14} /> Cari
              </button>
            </div>

            {error && (
              <div style={{ color: 'red', marginTop: 10 }}>
                <AlertCircle size={14} /> {error}
              </div>
            )}

            {result && (
              <div style={{ color: 'green', marginTop: 10 }}>
                <CheckCircle size={14} /> Pengembalian berhasil
                {result.denda > 0 && (
                  <div>Denda: Rp {result.denda.toLocaleString('id-ID')}</div>
                )}
              </div>
            )}
          </div>

          {activeDetail && (
            <div className="card" style={{ marginTop: 16 }}>
              <div style={{ fontWeight: 700, marginBottom: 8 }}>Detail</div>

              <div>Judul: {activeDetail.bookTitle}</div>
              <div>Peminjam: {activeDetail.memberName}</div>
              <div>Batas: {activeDetail.dueDate}</div>

              {activeDetail.lateDays > 0 && (
                <div style={{ color: 'red', marginTop: 8 }}>
                  Terlambat {activeDetail.lateDays} hari — Denda Rp {activeDetail.estimatedDenda.toLocaleString('id-ID')}
                  <br />
                  <span style={{ fontSize: 12 }}>
                    Rp {DENDA_PER_HARI.toLocaleString('id-ID')} × {activeDetail.lateDays} hari
                  </span>
                </div>
              )}

              <button
                className="btn btn-primary"
                style={{ marginTop: 10 }}
                onClick={handleReturn}
              >
                <CheckCircle size={14} /> Selesaikan Pengembalian
              </button>
            </div>
          )}
        </div>

        <div className="card">
          <div style={{ fontWeight: 700, marginBottom: 12 }}>
            Riwayat Pengembalian ({completedLoans.length})
          </div>

          <table>
            <thead>
              <tr>
                <th>Tanggal</th>
                <th>Kode</th>
                <th>Judul</th>
                <th>Denda</th>
              </tr>
            </thead>

            <tbody>
              {completedLoans.map(l => (
                <tr key={l.id}>
                  <td>{l.returnDate}</td>
                  <td>{l.bookCode}</td>
                  <td>{l.bookTitle}</td>
                  <td>{l.denda > 0 ? `Rp ${Number(l.denda).toLocaleString('id-ID')}` : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}