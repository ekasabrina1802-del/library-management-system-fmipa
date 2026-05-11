import { useState } from 'react';
import { Search, CheckCircle, AlertCircle, Clock, BookOpen, Info, ChevronRight } from 'lucide-react';
import { useApp } from '../components/AppContext';
import { useAuth } from '../components/AuthContext';

function daysUntilDue(dueDate) {
  const today = new Date();
  const due = new Date(dueDate);
  return Math.ceil((due - today) / (1000 * 60 * 60 * 24));
}

export default function UserPengembalianPage() {
  const { loans } = useApp();
  const { user } = useAuth();
  const [search, setSearch] = useState('');

  // Filter hanya milik user login
 const myMemberId = user?.anggotaId || user?.memberId;

const myLoans = loans.filter(
  l => String(l.memberId) === String(myMemberId)
);

const completedLoans = myLoans
  .filter(l => String(l.status).toLowerCase() === 'dikembalikan')
  .sort((a, b) => (b.returnDate || '').localeCompare(a.returnDate || ''));

const activeLoans = myLoans.filter(
  l => ['dipinjam', 'diperpanjang', 'terlambat'].includes(String(l.status).toLowerCase())
);

  const totalDenda = completedLoans.reduce((sum, l) => sum + (l.denda || 0), 0);
  const dendaAktif = activeLoans
    .filter(l => daysUntilDue(l.dueDate) < 0)
    .reduce((sum, l) => sum + Math.abs(daysUntilDue(l.dueDate)) * 500, 0);
  const terlambatCount = completedLoans.filter(l => (l.denda || 0) > 0).length;

  const filteredCompleted = completedLoans.filter(l =>
    !search ||
    l.bookTitle?.toLowerCase().includes(search.toLowerCase()) ||
    l.bookCode?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div className="page-breadcrumb">Transaksi</div>
        <h1 className="page-title">Riwayat Pengembalian</h1>
        <p className="page-subtitle">
          Lihat status pengembalian buku dan catatan denda keterlambatan kamu.
        </p>
      </div>

      {/* Info banner */}
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
          <strong style={{ color: 'var(--primary)' }}>Cara mengembalikan buku:</strong> Serahkan buku langsung ke petugas perpustakaan dan sebutkan kode buku.
          Denda keterlambatan dihitung <strong>Rp 500 per hari</strong> sejak batas waktu.
        </div>
      </div>

      {/* Stats */}
      <div className="grid-3" style={{ gap: 12, marginBottom: 24 }}>

        {/* Total Dikembalikan */}
        <div
          style={{
            background: 'linear-gradient(135deg, #f0fff4, #ffffff)',
            border: '1px solid #C6F6D5',
            borderRadius: 14,
            padding: '20px 22px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
          }}
        >
          <div
            style={{
              fontSize: 11,
              color: '#38A169',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              fontWeight: 600,
              marginBottom: 6,
            }}
          >
            Total Dikembalikan
          </div>

          <div
            style={{
              fontSize: 28,
              fontWeight: 800,
              color: '#38A169',
              lineHeight: 1,
              fontFamily: "'DM Mono', monospace",
            }}
          >
            {completedLoans.length}
          </div>

          <div style={{ marginTop: 6, opacity: 0.5 }}>
            <CheckCircle size={16} color="#38A169" />
          </div>
        </div>

        {/* Kasus Terlambat */}
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
            Kasus Terlambat
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
            {terlambatCount}
          </div>

          <div style={{ marginTop: 6, opacity: 0.5 }}>
            <AlertCircle size={16} color="#E53E3E" />
          </div>
        </div>

        {/* Total Denda Dibayar */}
        <div
          style={{
            background:
              totalDenda > 0
                ? 'linear-gradient(135deg, #0f2e96, #2563EB)'
                : 'linear-gradient(135deg, #0f2e96, #2563EB)',

            border: '1px solid transparent',

            borderRadius: 14,
            padding: '20px 22px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
          }}
        >
          <div
            style={{
              fontSize: 11,
              color: 'white',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              fontWeight: 600,
              marginBottom: 6,
            }}
          >
            Total Denda Dibayar
          </div>

          <div
            style={{
              fontSize: 28,
              fontWeight: 800,
              color: totalDenda > 0 ? '#D69E2E' : '#ffffff',
              lineHeight: 1,
              fontFamily: "'DM Mono', monospace",
            }}
          >
            Rp {totalDenda.toLocaleString('id-ID')}
          </div>

          <div style={{ marginTop: 6, opacity: 0.5 }}>
            <Clock size={16} color="white" />

          </div>
        </div>
      </div>

      {/* Alert denda aktif (belum dikembalikan tapi sudah terlambat) */}
      {dendaAktif > 0 && (
        <div style={{
          background: 'rgba(245,158,11,0.08)',
          border: '1px solid rgba(245,158,11,0.3)',
          borderRadius: 10,
          padding: '12px 16px',
          marginBottom: 20,
          display: 'flex',
          gap: 10,
          alignItems: 'center',
        }}>
          <AlertCircle size={16} style={{ color: 'var(--warning)', flexShrink: 0 }} />
          <div style={{ fontSize: 13, color: 'var(--warning)', fontWeight: 600 }}>
            Kamu memiliki estimasi denda berjalan sebesar <strong>Rp {dendaAktif.toLocaleString('id-ID')}</strong> dari buku yang belum dikembalikan. Segera kembalikan ke petugas.
          </div>
        </div>
      )}
      
      {/* Riwayat Pengembalian */}
      <div className="card">
        <div className="flex-between mb-16">
          <div>
            <div style={{ fontWeight: 700, fontSize: 15 }}>Riwayat Pengembalian</div>
            <div style={{ fontSize: 11, color: 'var(--gray-text)', marginTop: 2 }}>
              Semua buku yang pernah kamu kembalikan
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span className="badge badge-success">{completedLoans.length} selesai</span>
            <div style={{ position: 'relative' }}>
              <Search size={11} style={{ position: 'absolute', left: 7, top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-text)' }} />
              <input
                className="form-control"
                style={{ paddingLeft: 24, width: 160, fontSize: 11, height: 28 }}
                placeholder="Cari buku..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="table-container" style={{ maxHeight: 460, overflowY: 'auto' }}>
          <table>
            <thead>
              <tr>
                <th>Tgl Kembali</th>
                <th>Kode</th>
                <th>Judul Buku</th>
                <th>Tgl Pinjam</th>
                <th>Denda</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredCompleted.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: 40, color: 'var(--gray-text)' }}>
                    {completedLoans.length === 0
                      ? 'Belum ada riwayat pengembalian'
                      : 'Tidak ada hasil pencarian'}
                  </td>
                </tr>
              ) : filteredCompleted.map(l => (
                <tr key={l.id}>
                  <td style={{ fontSize: 11, color: 'var(--gray-text)', whiteSpace: 'nowrap' }}>{l.returnDate}</td>
                  <td>
                    <code style={{ fontSize: 11, background: 'var(--gray-light)', padding: '1px 5px', borderRadius: 3 }}>{l.bookCode}</code>
                  </td>
                  <td style={{ maxWidth: 180 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.bookTitle}</div>
                  </td>
                  <td style={{ fontSize: 11, color: 'var(--gray-text)', whiteSpace: 'nowrap' }}>{l.loanDate}</td>
                  <td style={{
                    fontSize: 12,
                    fontWeight: (l.denda || 0) > 0 ? 700 : 400,
                    color: (l.denda || 0) > 0 ? 'var(--danger)' : 'inherit',
                  }}>
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
      </div>
    </div>
  );
}