import { useState } from 'react';
import { BookOpen, Clock, AlertCircle, CheckCircle, Search, ChevronRight, BookMarked, Info } from 'lucide-react';
import { useApp } from '../components/AppContext';
import { useAuth } from '../components/AuthContext';

const API_BASE_URL = "http://localhost:5000";

const COVER_COLORS = { MTK: '#7B1C1C', FIS: '#0D1B2A', KIM: '#1B5E20', BIO: '#1A237E' };
const COVER_LABELS = { MTK: 'Matematika', FIS: 'Fisika', KIM: 'Kimia', BIO: 'Biologi' };

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

export default function UserPeminjamanPage() {
  const { books, loans, members } = useApp();
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('aktif'); // 'aktif' | 'riwayat' | 'katalog'

  // Filter loans milik user yang sedang login
  // Sesuaikan field identifier sesuai AppContext kamu (nim / id / userId)
  const myLoans = loans.filter(l => l.memberId === user?.id || l.memberNim === user?.nim);
  const activeLoans = myLoans.filter(l => l.status === 'dipinjam' || l.status === 'terlambat');
  const historyLoans = myLoans.filter(l => l.status === 'dikembalikan').sort((a, b) => (b.returnDate || '').localeCompare(a.returnDate || ''));
  const totalDenda = myLoans.reduce((sum, l) => sum + (l.denda || 0), 0);
  const lateCount = myLoans.filter(l => l.status === 'terlambat' || (l.status === 'dipinjam' && daysUntilDue(l.dueDate) < 0)).length;

  // Katalog buku
  const filteredBooks = books.filter(b =>
    !search ||
    b.title?.toLowerCase().includes(search.toLowerCase()) ||
    b.code?.toLowerCase().includes(search.toLowerCase()) ||
    b.author?.toLowerCase().includes(search.toLowerCase())
  );

  const tabList = [
    { key: 'aktif', label: 'Pinjaman Aktif', count: activeLoans.length },
    { key: 'riwayat', label: 'Riwayat', count: historyLoans.length },
    { key: 'katalog', label: 'Katalog Buku', count: books.length },
  ];

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div className="page-breadcrumb">Transaksi</div>
        <h1 className="page-title">Peminjaman Saya</h1>
        <p className="page-subtitle">
          Pantau status pinjaman aktif, riwayat buku, dan ketersediaan koleksi perpustakaan FMIPA.
        </p>
      </div>

      {/* Info banner — cara meminjam */}
      <div style={{
        background: 'rgba(74,85,226,0.07)',
        border: '1px solid rgba(74,85,226,0.18)',
        borderRadius: 10,
        padding: '12px 16px',
        marginBottom: 20,
        display: 'flex',
        gap: 10,
        alignItems: 'flex-start',
      }}>
        <Info size={15} style={{ color: 'var(--primary)', flexShrink: 0, marginTop: 2 }} />
        <div style={{ fontSize: 12.5, color: 'var(--gray-text)', lineHeight: 1.6 }}>
          <strong style={{ color: 'var(--primary)' }}>Cara meminjam buku:</strong> Datang ke meja petugas perpustakaan dan sebutkan kode buku yang ingin dipinjam.
          Batas peminjaman <strong>7 hari</strong>. Keterlambatan dikenakan denda <strong>Rp 1.000/hari</strong>.
        </div>
      </div>

      {/* Stats */}
      <div className="grid-4" style={{ gap: 12, marginBottom: 24 }}>
        {[
          { label: 'Total Pinjaman', value: myLoans.length, color: 'var(--primary)', bg: 'rgba(74,85,226,0.08)', icon: <BookOpen size={16} /> },
          { label: 'Sedang Dipinjam', value: activeLoans.length, color: 'var(--warning)', bg: 'rgba(245,158,11,0.08)', icon: <Clock size={16} /> },
          { label: 'Terlambat', value: lateCount, color: 'var(--danger)', bg: 'rgba(183,28,28,0.08)', icon: <AlertCircle size={16} /> },
          { label: 'Total Denda', value: `Rp ${totalDenda.toLocaleString('id-ID')}`, color: totalDenda > 0 ? 'var(--danger)' : 'var(--success)', bg: totalDenda > 0 ? 'rgba(183,28,28,0.08)' : 'rgba(46,125,50,0.08)', icon: <CheckCircle size={16} /> },
        ].map((s, i) => (
          <div key={i} className="card" style={{ background: s.bg, border: 'none', textAlign: 'center', padding: '14px 12px' }}>
            <div style={{ display: 'flex', justifyContent: 'center', color: s.color, marginBottom: 4 }}>{s.icon}</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 11, color: 'var(--gray-text)', marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Alert jika ada yang terlambat */}
      {lateCount > 0 && (
        <div style={{
          background: 'rgba(183,28,28,0.08)',
          border: '1px solid rgba(183,28,28,0.25)',
          borderRadius: 10,
          padding: '12px 16px',
          marginBottom: 20,
          display: 'flex',
          gap: 10,
          alignItems: 'center',
        }}>
          <AlertCircle size={16} style={{ color: 'var(--danger)', flexShrink: 0 }} />
          <div style={{ fontSize: 13, color: 'var(--danger)', fontWeight: 600 }}>
            Kamu memiliki {lateCount} buku yang melewati batas waktu pengembalian. Segera kembalikan ke petugas perpustakaan.
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {/* Tab nav */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--gray-light)', background: 'var(--bg-secondary, #f9fafb)' }}>
          {tabList.map(t => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              style={{
                padding: '12px 20px',
                border: 'none',
                background: 'none',
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: activeTab === t.key ? 700 : 500,
                color: activeTab === t.key ? 'var(--primary)' : 'var(--gray-text)',
                borderBottom: activeTab === t.key ? '2px solid var(--primary)' : '2px solid transparent',
                display: 'flex',
                alignItems: 'center',
                gap: 7,
                transition: 'color 0.15s',
              }}
            >
              {t.label}
              <span style={{
                fontSize: 10,
                background: activeTab === t.key ? 'var(--primary)' : 'var(--gray-light)',
                color: activeTab === t.key ? 'white' : 'var(--gray-text)',
                borderRadius: 20,
                padding: '1px 7px',
                fontWeight: 700,
              }}>{t.count}</span>
            </button>
          ))}
        </div>

        <div style={{ padding: 20 }}>

          {/* ── TAB: PINJAMAN AKTIF ── */}
          {activeTab === 'aktif' && (
            
            <div>
              {activeLoans.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--gray-text)' }}>
                  <BookMarked size={36} style={{ opacity: 0.3, marginBottom: 12 }} />
                  <div style={{ fontSize: 14, fontWeight: 600 }}>Tidak ada pinjaman aktif</div>
                  <div style={{ fontSize: 12, marginTop: 4 }}>Kunjungi tab "Katalog Buku" untuk melihat koleksi yang tersedia</div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {activeLoans.map(l => {
                    const prefix = l.bookCode?.split('-')[0] || 'BK';
                    const days = daysUntilDue(l.dueDate);
                    const isLate = days < 0;
                    return (
                      <div key={l.id} style={{
                        display: 'flex',
                        gap: 16,
                        padding: '14px 16px',
                        background: isLate ? 'rgba(183,28,28,0.04)' : 'var(--bg-secondary, #f9fafb)',
                        borderRadius: 10,
                        border: `1px solid ${isLate ? 'rgba(183,28,28,0.2)' : 'var(--gray-light)'}`,
                        alignItems: 'flex-start',
                      }}>
                        {/* Cover mini BARU dengan logika gambar */}
<div style={{ width: 48, height: 64, borderRadius: 5, overflow: 'hidden', flexShrink: 0, background: '#eee' }}>
  {l.image_url ? (
    <img 
      src={`${API_BASE_URL}${l.image_url}`} 
      alt="cover"
      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
      onError={(e) => { e.target.src = 'https://via.placeholder.com/48x64?text=Book'; }}
    />
  ) : (
    <div style={{ width: '100%', height: '100%', background: COVER_COLORS[prefix] || '#555', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 9, fontWeight: 700, flexDirection: 'column', textAlign: 'center', padding: 4 }}>
      <BookOpen size={14} />
      <span>{prefix}</span>
    </div>
  )}
</div>

                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 3 }}>{l.bookTitle}</div>
                          <div style={{ fontSize: 11, color: 'var(--gray-text)', marginBottom: 8 }}>
                            Kode: <code style={{ background: 'var(--gray-light)', padding: '1px 6px', borderRadius: 3, fontSize: 11 }}>{l.bookCode}</code>
                          </div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
                            <div style={{ display: 'flex', gap: 4, alignItems: 'center', fontSize: 12, color: 'var(--gray-text)' }}>
                              <Clock size={12} />
                              Dipinjam: <strong>{l.loanDate}</strong>
                            </div>
                            <div style={{ display: 'flex', gap: 4, alignItems: 'center', fontSize: 12, color: isLate ? 'var(--danger)' : 'var(--gray-text)' }}>
                              <ChevronRight size={12} />
                              Batas: <strong>{l.dueDate}</strong>
                            </div>
                            <DueBadge dueDate={l.dueDate} status={l.status} />
                          </div>

                          {isLate && (
                            <div style={{ marginTop: 10, fontSize: 12, color: 'var(--danger)', fontWeight: 600, display: 'flex', gap: 6, alignItems: 'center' }}>
                              <AlertCircle size={13} />
                              Estimasi denda: Rp {(Math.abs(days) * 1000).toLocaleString('id-ID')} ({Math.abs(days)} hari × Rp 1.000)
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Reminder note */}
              <div style={{
                marginTop: 20,
                fontSize: 12,
                color: 'var(--gray-text)',
                background: 'var(--gray-light)',
                padding: '10px 14px',
                borderRadius: 8,
                lineHeight: 1.7,
              }}>
                📌 Untuk mengembalikan buku, serahkan langsung ke petugas perpustakaan dan sebutkan kode buku. Petugas akan memproses pengembalian dan menghitung denda (jika ada).
              </div>
            </div>
          )}

          {/* ── TAB: RIWAYAT ── */}
          {activeTab === 'riwayat' && (
            <div>
              {historyLoans.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--gray-text)' }}>
                  <BookMarked size={36} style={{ opacity: 0.3, marginBottom: 12 }} />
                  <div style={{ fontSize: 14, fontWeight: 600 }}>Belum ada riwayat peminjaman</div>
                </div>
              ) : (
                <div className="table-container" style={{ maxHeight: 480, overflowY: 'auto' }}>
                  <table>
                    <thead>
                      <tr>
                        <th>Kode</th>
                        <th>Judul Buku</th>
                        <th>Tgl Pinjam</th>
                        <th>Tgl Kembali</th>
                        <th>Denda</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {historyLoans.map(l => (
                        <tr key={l.id}>
                          <td>
                            <code style={{ fontSize: 11, background: 'var(--gray-light)', padding: '1px 5px', borderRadius: 3 }}>{l.bookCode}</code>
                          </td>
                          <td style={{ maxWidth: 180 }}>
                            <div style={{ fontSize: 12, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.bookTitle}</div>
                          </td>
                          <td style={{ fontSize: 11, color: 'var(--gray-text)', whiteSpace: 'nowrap' }}>{l.loanDate}</td>
                          <td style={{ fontSize: 11, color: 'var(--gray-text)', whiteSpace: 'nowrap' }}>{l.returnDate || '-'}</td>
                          <td style={{ fontSize: 12, fontWeight: (l.denda || 0) > 0 ? 700 : 400, color: (l.denda || 0) > 0 ? 'var(--danger)' : 'inherit' }}>
                            {(l.denda || 0) > 0 ? `Rp ${l.denda.toLocaleString('id-ID')}` : '-'}
                          </td>
                          <td>
                            <span className={`badge ${(l.denda || 0) > 0 ? 'badge-warning' : 'badge-success'}`} style={{ fontSize: 10 }}>
                              {(l.denda || 0) > 0 ? 'Terlambat' : 'Tepat Waktu'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ── TAB: KATALOG ── */}
          {activeTab === 'katalog' && (
            <div>
              {/* Search bar */}
              <div style={{ position: 'relative', marginBottom: 16 }}>
                <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-text)' }} />
                <input
                  className="form-control"
                  style={{ paddingLeft: 32 }}
                  placeholder="Cari judul, kode, atau pengarang..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
                {filteredBooks.length === 0 ? (
                  <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px 0', color: 'var(--gray-text)' }}>
                    Buku tidak ditemukan
                  </div>
                ) : filteredBooks.map(b => {
                  const prefix = b.code?.split('-')[0] || 'BK';
                  return (
                    <div key={b.code} style={{
                      background: 'var(--bg-secondary, #f9fafb)',
                      border: '1px solid var(--gray-light)',
                      borderRadius: 10,
                      overflow: 'hidden',
                    }}>
                      {/* Box Cover Katalog BARU */}
<div style={{ height: 140, width: '100%', background: '#eee', overflow: 'hidden', borderBottom: '1px solid var(--gray-light)' }}>
  {b.image_url ? (
    <img 
      src={`${API_BASE_URL}${b.image_url}`} 
      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
      alt="book cover"
      onError={(e) => { e.target.src = 'https://via.placeholder.com/220x140?text=No+Image'; }}
    />
  ) : (
    <div style={{ width: '100%', height: '100%', background: COVER_COLORS[prefix] || '#555', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700 }}>
      {prefix}
    </div>
  )}
</div>
                      <div style={{ padding: '12px 14px' }}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--gray-text)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>
                          {COVER_LABELS[prefix] || prefix}
                        </div>
                        <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 2, lineHeight: 1.4 }}>{b.title}</div>
                        {b.author && <div style={{ fontSize: 11, color: 'var(--gray-text)', marginBottom: 8 }}>{b.author}</div>}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <code style={{ fontSize: 11, background: 'var(--gray-light)', padding: '2px 7px', borderRadius: 4 }}>{b.code}</code>
                          <span className={`badge ${b.available > 0 ? 'badge-success' : 'badge-danger'}`} style={{ fontSize: 10 }}>
                            {b.available > 0 ? `${b.available} tersedia` : 'Habis'}
                          </span>
                        </div>
                        {b.available === 0 && (
                          <div style={{ fontSize: 11, color: 'var(--gray-text)', marginTop: 8 }}>
                            📋 Semua eksemplar sedang dipinjam. Hubungi petugas untuk informasi ketersediaan.
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div style={{ marginTop: 16, fontSize: 12, color: 'var(--gray-text)', textAlign: 'center' }}>
                Untuk meminjam, datang ke meja petugas dan sebutkan kode buku yang diinginkan.
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}