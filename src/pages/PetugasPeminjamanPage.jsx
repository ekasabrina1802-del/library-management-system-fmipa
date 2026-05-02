import { useState } from 'react';
import { Search, Plus, Clock, AlertCircle } from 'lucide-react';
import { useApp } from '../components/AppContext';

// Variabel untuk alamat server backend
const API_BASE_URL = import.meta.env.VITE_API_URL;

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

export default function PeminjamanPage() {
  const { books, members, loans, addLoan } = useApp();
  const [nimInput, setNimInput] = useState('');
  const [bookCodeInput, setBookCodeInput] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const findMemberByNim = (nim) => members.find(m => m.nim === nim || String(m.id) === nim);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setResult(null);

    const member = findMemberByNim(nimInput.trim());
    if (
        member &&
        !['mahasiswa', 'dosen'].includes(
          member.role?.toLowerCase()
        )
      ) {
        setError(
          `${member.name} (${member.role}) tidak memiliki hak peminjaman.`
        );
        return;
      }
      
    if (!member) {
      setError('Anggota tidak ditemukan. Periksa NIM/NIP.');
      return;
    }

    const res = await addLoan(bookCodeInput.trim(), member.id);

    if (res.success) {
      setResult({ dueDate: 'berhasil diproses', memberFull: member });
      setNimInput('');
      setBookCodeInput('');
    } else {
      setError(res.message);
    }
  };

  const activeLoans = loans.filter(l => l.status === 'dipinjam' || l.status === 'terlambat');

  return (
    <div>
      <div className="page-header">
        <div className="page-breadcrumb">Transaksi</div>
        <h1 className="page-title">Transaksi Peminjaman</h1>
        <p className="page-subtitle">Catat peminjaman buku baru untuk anggota perpustakaan FMIPA.</p>
      </div>

      <div className="grid-2" style={{ gridTemplateColumns: '1fr 1.6fr', gap: 20, marginBottom: 24 }}>
        <div className="card">
          <div style={{ fontWeight: 700, marginBottom: 4, fontSize: 15 }}>Form Peminjaman</div>
          <div style={{ fontSize: 12, color: 'var(--gray-text)', marginBottom: 20 }}>Masukkan identitas anggota dan No. Induk buku yang dipinjam.</div>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Nomor Identitas (NIM/NIP)</label>
              <div style={{ position: 'relative' }}>
                <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-text)' }} />
                <input
                  className="form-control"
                  style={{ paddingLeft: 32 }}
                  placeholder="Contoh: 20264"
                  value={nimInput}
                  onChange={e => setNimInput(e.target.value)}
                  required
                />
              </div>

              {nimInput && (() => {
                const m = findMemberByNim(nimInput.trim());
                return m ? (
                  <div style={{ fontSize: 12, color: 'var(--success)', marginTop: 4 }}>✓ {m.name} — {m.departemen}</div>
                ) : (
                  <div style={{ fontSize: 12, color: 'var(--danger)', marginTop: 4 }}>Anggota tidak ditemukan</div>
                );
              })()}
            </div>

            <div className="form-group">
              <label className="form-label">No. Induk Buku</label>
              <div style={{ position: 'relative' }}>
                <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-text)' }} />
                <input
                  className="form-control"
                  style={{ paddingLeft: 32 }}
                  placeholder="Contoh: 00001/FMIPA/2026"
                  value={bookCodeInput}
                  onChange={e => setBookCodeInput(e.target.value)}
                  required
                />
              </div>

              {bookCodeInput && (() => {
                const b = books.find(b => b.no_induk === bookCodeInput.trim());
                return b ? (
                  <div style={{ fontSize: 12, color: b.available > 0 ? 'var(--success)' : 'var(--danger)', marginTop: 4 }}>
                    {b.available > 0 ? `✓ "${b.title}" — ${b.available} tersedia` : `✗ "${b.title}" — Stok habis`}
                  </div>
                ) : (
                  <div style={{ fontSize: 12, color: 'var(--warning)', marginTop: 4 }}>Buku tidak ditemukan</div>
                );
              })()}
            </div>

            {error && (
              <div style={{ background: 'rgba(183,28,28,0.08)', color: 'var(--danger)', padding: '10px 12px', borderRadius: 6, fontSize: 13, marginBottom: 12, display: 'flex', gap: 8 }}>
                <AlertCircle size={15} style={{ flexShrink: 0, marginTop: 1 }} /> {error}
              </div>
            )}

            {result && (
              <div style={{ background: 'rgba(46,125,50,0.08)', color: 'var(--success)', padding: '10px 12px', borderRadius: 6, fontSize: 13, marginBottom: 12 }}>
                ✓ Peminjaman berhasil diproses!
              </div>
            )}

            <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
              <Plus size={14} /> Proses Peminjaman
            </button>
          </form>

          <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--gray-light)' }}>
            <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8, color: 'var(--gray-text)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              No. Induk Buku Tersedia
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {books.filter(b => b.available > 0).map(b => (
                <span
                  key={b.id}
                  style={{ fontSize: 11, padding: '2px 8px', background: 'var(--gray-light)', borderRadius: 4, cursor: 'pointer' }}
                  onClick={() => setBookCodeInput(b.no_induk)}
                >
                  {b.no_induk}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex-between mb-16">
            <div style={{ fontWeight: 700, fontSize: 15 }}>Daftar Pinjaman Aktif</div>
            <span className="badge badge-warning">{activeLoans.length} aktif</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 440, overflowY: 'auto' }}>
            {activeLoans.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 40, color: 'var(--gray-text)' }}>Tidak ada peminjaman aktif</div>
            ) : activeLoans.map(l => {
             const prefix = l.bookCode?.split('/')[0] || 'BK';

                // cari buku yang cocok dengan loan
                const book = books.find(
                  b => b.no_induk === l.bookCode
                );

              return (
                <div key={l.id} className="loan-card">
                  {/* Bagian Gambar yang diperbaiki */}
                  <div style={{ width: 44, height: 58, borderRadius: 4, overflow: 'hidden', flexShrink: 0, background: '#eee' }}>
                    {book?.image_url ? (
                    <img
                      src={`${API_BASE_URL}${book.image_url}`}
                      alt={l.bookTitle}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover'
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: '100%',
                        height: '100%',
                        background: COVER_COLORS[prefix] || '#555',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontSize: 10,
                        fontWeight: 700
                      }}
                    >
                      {prefix}
                    </div>
                  )}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 2 }}>{l.bookTitle}</div>
                    <div style={{ fontSize: 11, color: 'var(--gray-text)', marginBottom: 6 }}>
                      {l.memberName} · <span className="badge badge-neutral" style={{ fontSize: 10, padding: '1px 6px' }}>{l.memberType}</span>
                    </div>

                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <Clock size={11} style={{ color: 'var(--gray-text)' }} />
                      <span style={{ fontSize: 11, color: 'var(--gray-text)' }}>Pinjam: {l.loanDate}</span>
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