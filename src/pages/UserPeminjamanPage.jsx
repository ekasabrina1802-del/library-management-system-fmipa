import { useState } from 'react';
import { BookOpen, Clock, AlertCircle, CheckCircle, ChevronRight, BookMarked, Info } from 'lucide-react';
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

 const myMemberId = user?.anggotaId || user?.memberId;

const myLoans = loans.filter(
  l => String(l.memberId) === String(myMemberId)
);

const activeLoans = myLoans.filter(
  l => ['dipinjam', 'diperpanjang', 'terlambat'].includes(String(l.status).toLowerCase())
);

const historyLoans = myLoans
  .filter(l => String(l.status).toLowerCase() === 'dikembalikan')
  .sort((a, b) => (b.returnDate || '').localeCompare(a.returnDate || ''));

const totalDenda = myLoans.reduce((sum, l) => sum + Number(l.denda || 0), 0);

const lateCount = myLoans.filter(
  l =>
    String(l.status).toLowerCase() === 'terlambat' ||
    (
      ['dipinjam', 'diperpanjang'].includes(String(l.status).toLowerCase()) &&
      daysUntilDue(l.dueDate) < 0
    )
).length;

  const tabList = [
    { key: 'aktif', label: 'Pinjaman Aktif', count: activeLoans.length },
    { key: 'riwayat', label: 'Riwayat', count: historyLoans.length },
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
          Batas peminjaman <strong>7 hari</strong>. Keterlambatan dikenakan denda <strong>Rp 500/hari</strong>.
        </div>
      </div>

      {/* Stats */}
<div className="grid-4" style={{ gap: 12, marginBottom: 24 }}>

  {/* Total Pinjaman */}
  <div
    style={{
      background: 'linear-gradient(135deg, #7B1C1C, #a83232)',
      border: '1px solid transparent',
      borderRadius: 14,
      padding: '20px 22px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
    }}
  >
    <div
      style={{
        fontSize: 11,
        color: 'rgba(255,255,255,0.75)',
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
        fontWeight: 600,
        marginBottom: 6,
      }}
    >
      Total Pinjaman
    </div>

    <div
      style={{
        fontSize: 28,
        fontWeight: 800,
        color: 'white',
        lineHeight: 1,
        fontFamily: "'DM Mono', monospace",
      }}
    >
      {myLoans.length}
    </div>

    <div style={{ marginTop: 6, opacity: 0.5 }}>
      <BookOpen size={16} color="white" />
    </div>
  </div>

  {/* Sedang Dipinjam */}
  <div
    style={{
      background: 'linear-gradient(135deg, #fffaf0, #ffffff)',
      border: '1px solid #FEEBC8',
      borderRadius: 14,
      padding: '20px 22px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
    }}
  >
    <div
      style={{
        fontSize: 11,
        color: '#D69E2E',
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
        fontWeight: 600,
        marginBottom: 6,
      }}
    >
      Sedang Dipinjam
    </div>

    <div
      style={{
        fontSize: 28,
        fontWeight: 800,
        color: '#D69E2E',
        lineHeight: 1,
        fontFamily: "'DM Mono', monospace",
      }}
    >
      {activeLoans.length}
    </div>

    <div style={{ marginTop: 6, opacity: 0.5 }}>
      <Clock size={16} color="#D69E2E" />
    </div>
  </div>

  {/* Terlambat */}
  <div
    style={{
      background: 'linear-gradient(135deg, #fff5f5, #ffffff)',
      border: '1px solid #FED7D7',
      borderRadius: 14,
      padding: '20px 22px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
    }}
  >
    <div
      style={{
        fontSize: 11,
        color: '#E53E3E',
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
        fontWeight: 600,
        marginBottom: 6,
      }}
    >
      Terlambat
    </div>

    <div
      style={{
        fontSize: 28,
        fontWeight: 800,
        color: '#E53E3E',
        lineHeight: 1,
        fontFamily: "'DM Mono', monospace",
      }}
    >
      {lateCount}
    </div>

    <div style={{ marginTop: 6, opacity: 0.5 }}>
      <AlertCircle size={16} color="#E53E3E" />
    </div>
  </div>

  {/* Total Denda */}
  <div
    style={{
      background:
        totalDenda > 0
          ? 'linear-gradient(135deg, #fff5f5, #ffffff)'
          : 'linear-gradient(135deg, #f0fff4, #ffffff)',
      border:
        totalDenda > 0
          ? '1px solid #FED7D7'
          : '1px solid #C6F6D5',
      borderRadius: 14,
      padding: '20px 22px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
    }}
  >
    <div
      style={{
        fontSize: 11,
        color: totalDenda > 0 ? '#E53E3E' : '#38A169',
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
        fontWeight: 600,
        marginBottom: 6,
      }}
    >
      Total Denda
    </div>

    <div
      style={{
        fontSize: 28,
        fontWeight: 800,
        color: totalDenda > 0 ? '#E53E3E' : '#38A169',
        lineHeight: 1,
        fontFamily: "'DM Mono', monospace",
      }}
    >
      Rp {totalDenda.toLocaleString('id-ID')}
    </div>

    <div style={{ marginTop: 6, opacity: 0.5 }}>
      <CheckCircle
        size={16}
        color={totalDenda > 0 ? '#E53E3E' : '#38A169'}
      />
    </div>
  </div>
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
                              Estimasi denda: Rp {(Math.abs(days) * 500).toLocaleString('id-ID')} ({Math.abs(days)} hari × Rp 500)
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

        </div>
      </div>
    </div>
  );
}