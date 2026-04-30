import { useState, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import {
  AlertTriangle, CheckCircle, Clock, BookOpen,
  ChevronDown, ChevronUp, CreditCard, Bell, Info
} from 'lucide-react';
import { useApp } from '../components/AppContext';

/* ─────────────────────────────────────────────
   CONSTANTS
───────────────────────────────────────────── */
const DENDA_PER_HARI = 2000; // Rp per day late

/* ─────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────── */
function daysBetween(a, b) {
  return Math.floor((new Date(b) - new Date(a)) / 86400000);
}

function formatRp(n) {
  return `Rp ${Number(n || 0).toLocaleString('id-ID')}`;
}

function formatDate(d) {
  if (!d) return '-';
  return new Date(d).toLocaleDateString('id-ID', {
    day: '2-digit', month: 'short', year: 'numeric'
  });
}

function daysFromNow(dateStr) {
  return daysBetween(new Date().toISOString().slice(0, 10), dateStr);
}

/* ─────────────────────────────────────────────
   SUB-COMPONENTS
───────────────────────────────────────────── */

/** Pill badge for loan status */
function StatusBadge({ status }) {
  const map = {
    dipinjam:    { label: 'Dipinjam',    cls: 'badge-warning' },
    terlambat:   { label: 'Terlambat',   cls: 'badge-danger' },
    dikembalikan:{ label: 'Dikembalikan',cls: 'badge-success' },
  };
  const { label, cls } = map[status] || { label: status, cls: '' };
  return <span className={`badge ${cls}`}>{label}</span>;
}

/** Expandable row with fine breakdown */
function LoanRow({ l }) {
  const [open, setOpen] = useState(false);
  const denda = Number(l.denda || 0);
  const today = new Date().toISOString().slice(0, 10);

  // Calculate days late for breakdown
  let daysLate = 0;
  if (l.status === 'terlambat') {
    daysLate = daysBetween(l.dueDate, today);
  } else if (l.status === 'dikembalikan' && denda > 0) {
    daysLate = Math.round(denda / DENDA_PER_HARI);
  }

  // Reminder for active loans
  const remaining = l.status === 'dipinjam' ? daysFromNow(l.dueDate) : null;

  return (
    <>
      <tr
        onClick={() => denda > 0 || remaining !== null ? setOpen(o => !o) : null}
        style={{
          cursor: denda > 0 || remaining !== null ? 'pointer' : 'default',
          background: open ? 'var(--gray-light)' : undefined,
        }}
      >
        <td style={{ fontSize: 11, color: 'var(--gray-text)' }}>{l.id}</td>
        <td>
          <code style={{
            fontSize: 11, background: 'var(--gray-light)',
            padding: '2px 6px', borderRadius: 4
          }}>{l.bookCode}</code>
        </td>
        <td style={{ fontWeight: 600, fontSize: 12, maxWidth: 180 }}>{l.bookTitle}</td>
        <td style={{ fontSize: 12 }}>{formatDate(l.loanDate)}</td>
        <td style={{ fontSize: 12 }}>
          <span style={{
            color: remaining !== null && remaining <= 3
              ? (remaining < 0 ? 'var(--danger)' : 'var(--warning, #E65100)')
              : 'inherit'
          }}>
            {formatDate(l.dueDate)}
          </span>
        </td>
        <td style={{ fontSize: 12 }}>{formatDate(l.returnDate)}</td>
        <td style={{
          fontWeight: denda > 0 ? 700 : 400,
          color: denda > 0 ? 'var(--danger)' : 'var(--gray-text)',
          fontSize: 12
        }}>
          {denda > 0 ? formatRp(denda) : '-'}
        </td>
        <td>
          {/* Payment status chip */}
          {denda > 0 && (
            <span className={`badge ${l.dendaPaid === 'dibayar' ? 'badge-success' : l.dendaPaid === 'diverifikasi' ? 'badge-info' : 'badge-danger'}`}
              style={{ fontSize: 10, marginRight: 4 }}>
              {l.dendaPaid === 'dibayar' ? 'Dibayar' : l.dendaPaid === 'diverifikasi' ? 'Diverifikasi' : 'Belum Bayar'}
            </span>
          )}
        </td>
        <td>
          <StatusBadge status={l.status} />
        </td>
        <td style={{ fontSize: 12, color: 'var(--gray-text)' }}>
          {(denda > 0 || remaining !== null) && (
            open ? <ChevronUp size={14} /> : <ChevronDown size={14} />
          )}
        </td>
      </tr>

      {/* Expandable detail row */}
      {open && (
        <tr style={{ background: 'var(--gray-light)' }}>
          <td colSpan={10} style={{ padding: '10px 16px' }}>
            <div style={{
              display: 'flex', gap: 16, flexWrap: 'wrap',
              fontSize: 12, color: 'var(--text-main)'
            }}>
              {/* Fine breakdown */}
              {denda > 0 && daysLate > 0 && (
                <div style={{
                  background: '#fff', border: '1px solid #f0e0e0',
                  borderRadius: 8, padding: '10px 14px', minWidth: 220
                }}>
                  <div style={{ fontWeight: 700, color: 'var(--danger)', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 5 }}>
                    <Info size={13} /> Rincian Denda
                  </div>
                  <div style={{ color: 'var(--gray-text)', marginBottom: 4 }}>
                    Terlambat <b style={{ color: 'var(--danger)' }}>{daysLate} hari</b>
                  </div>
                  <div style={{ fontFamily: 'monospace', fontSize: 11, color: '#555', marginBottom: 4 }}>
                    {daysLate} hari × {formatRp(DENDA_PER_HARI)}/hari = <b style={{ color: 'var(--danger)' }}>{formatRp(denda)}</b>
                  </div>
                  <div style={{
                    marginTop: 6,
                    padding: '4px 8px',
                    borderRadius: 5,
                    background: l.dendaPaid ? '#e8f5e9' : '#fff3e0',
                    color: l.dendaPaid ? '#2E7D32' : '#E65100',
                    fontSize: 11, fontWeight: 600
                  }}>
                    {l.dendaPaid === 'diverifikasi'
                      ? '✓ Denda sudah diverifikasi petugas'
                      : l.dendaPaid === 'dibayar'
                        ? '✓ Sudah dibayar, menunggu verifikasi'
                        : '⚠ Denda belum dibayar'}
                  </div>
                </div>
              )}

              {/* Due reminder */}
              {remaining !== null && (
                <div style={{
                  background: remaining < 0
                    ? '#fff5f5' : remaining <= 3 ? '#fff8e1' : '#f1f8e9',
                  border: `1px solid ${remaining < 0 ? '#ffcdd2' : remaining <= 3 ? '#ffe082' : '#c8e6c9'}`,
                  borderRadius: 8, padding: '10px 14px', minWidth: 220
                }}>
                  <div style={{
                    fontWeight: 700, marginBottom: 5, display: 'flex', alignItems: 'center', gap: 5,
                    color: remaining < 0 ? 'var(--danger)' : remaining <= 3 ? '#E65100' : '#2E7D32'
                  }}>
                    <Bell size={13} />
                    {remaining < 0
                      ? `Anda terlambat ${Math.abs(remaining)} hari`
                      : remaining === 0
                        ? 'Jatuh tempo hari ini!'
                        : `Batas kembali ${remaining} hari lagi`}
                  </div>
                  <div style={{ fontSize: 11, color: '#555' }}>
                    {remaining < 0
                      ? `Denda berjalan: ${formatRp(Math.abs(remaining) * DENDA_PER_HARI)} (${Math.abs(remaining)} × ${formatRp(DENDA_PER_HARI)})`
                      : `Kembalikan sebelum ${formatDate(l.dueDate)} untuk menghindari denda.`}
                  </div>
                </div>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

/* ─────────────────────────────────────────────
   MAIN PAGE
───────────────────────────────────────────── */
export default function UserDendaPage() {
  const { loans, currentUser } = useApp();
  const [filter, setFilter] = useState('semua');

  // ── Scope to current user ──
  const myLoans = useMemo(
    () => loans.filter(l => l.memberId === currentUser?.id || l.memberName === currentUser?.name),
    [loans, currentUser]
  );

  const today = new Date().toISOString().slice(0, 10);

  // ── Summary stats ──
  const totalDendaBelumBayar = myLoans
    .filter(l => Number(l.denda) > 0 && l.dendaPaid !== 'diverifikasi')
    .reduce((s, l) => s + Number(l.denda || 0), 0);

  const bukuTerlambat = myLoans.filter(
    l => l.status === 'terlambat' || (l.status === 'dipinjam' && l.dueDate < today)
  ).length;

  const totalTransaksi = myLoans.length;

  const akunAman = totalDendaBelumBayar === 0 && bukuTerlambat === 0;

  // ── Monthly denda chart ──
  const dendaMonthly = Object.values(
    myLoans
      .filter(l => Number(l.denda) > 0)
      .reduce((acc, l) => {
        const month = new Date(l.returnDate || l.dueDate || l.loanDate)
          .toLocaleDateString('id-ID', { month: 'short' });
        if (!acc[month]) acc[month] = { month, denda: 0 };
        acc[month].denda += Number(l.denda || 0);
        return acc;
      }, {})
  );

  // ── Filtered table ──
  const filteredLoans = myLoans.filter(l => {
    if (filter === 'dipinjam') return l.status === 'dipinjam' && l.dueDate >= today;
    if (filter === 'terlambat') return l.status === 'terlambat' || (l.status === 'dipinjam' && l.dueDate < today);
    if (filter === 'selesai') return l.status === 'dikembalikan';
    return true;
  });

  // ── Active reminders ──
  const reminders = myLoans.filter(l => {
    if (l.status !== 'dipinjam') return false;
    const diff = daysFromNow(l.dueDate);
    return diff <= 3; // within 3 days or overdue
  }).sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

  return (
    <div>
      {/* ── Header ── */}
      <div className="page-header">
        <div className="page-breadcrumb">Akun Saya</div>
        <h1 className="page-title">Riwayat & Denda</h1>
        <p className="page-subtitle">
          Pantau status peminjaman, denda, dan tagihan perpustakaan milikmu.
        </p>
      </div>

      {/* ── Reminders banner ── */}
      {reminders.length > 0 && (
        <div style={{
          marginBottom: 20,
          display: 'flex', flexDirection: 'column', gap: 8
        }}>
          {reminders.map(l => {
            const diff = daysFromNow(l.dueDate);
            const isLate = diff < 0;
            return (
              <div key={l.id} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                background: isLate ? '#fff5f5' : '#fff8e1',
                border: `1px solid ${isLate ? '#ffcdd2' : '#ffe082'}`,
                borderRadius: 10, padding: '10px 16px', fontSize: 13
              }}>
                <Bell size={15} color={isLate ? 'var(--danger)' : '#E65100'} />
                <span>
                  <b>"{l.bookTitle}"</b>
                  {isLate
                    ? <> — <span style={{ color: 'var(--danger)', fontWeight: 700 }}>terlambat {Math.abs(diff)} hari</span>, denda berjalan {formatRp(Math.abs(diff) * DENDA_PER_HARI)}</>
                    : diff === 0
                      ? <> — jatuh tempo <b>hari ini</b>!</>
                      : <> — jatuh tempo <b>{diff} hari lagi</b> ({formatDate(l.dueDate)})</>
                  }
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Summary cards ── */}
      <div className="grid-4 mb-24">
        {/* Status akun */}
        <div style={{
          background: akunAman ? 'linear-gradient(135deg,#2E7D32,#43A047)' : 'linear-gradient(135deg,#7B1C1C,#c0392b)',
          color: '#fff', borderRadius: 12, padding: '18px 20px',
          display: 'flex', flexDirection: 'column', gap: 6
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, opacity: 0.85 }}>
            {akunAman ? <CheckCircle size={14} /> : <AlertTriangle size={14} />}
            Status Akun
          </div>
          <div style={{ fontSize: 20, fontWeight: 800 }}>
            {akunAman ? 'Aman ✓' : 'Ada Tunggakan'}
          </div>
          <div style={{ fontSize: 11, opacity: 0.8 }}>
            {akunAman ? 'Tidak ada denda atau keterlambatan.' : 'Segera selesaikan denda / kembalikan buku.'}
          </div>
        </div>

        {/* Total denda belum bayar */}
        <div className="denda-highlight">
          <div style={{ fontSize: 11, opacity: 0.7, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>
            Denda Belum Bayar
          </div>
          <div className="amount">
            {totalDendaBelumBayar > 0 ? `Rp ${(totalDendaBelumBayar / 1000).toFixed(0)}K` : 'Rp 0'}
          </div>
          <div style={{ fontSize: 12, opacity: 0.8, marginTop: 4 }}>
            {formatRp(totalDendaBelumBayar)}
          </div>
        </div>

        {/* Buku terlambat */}
        <div className="stat-card">
          <div>
            <div className="stat-value" style={{ color: bukuTerlambat > 0 ? 'var(--danger)' : undefined }}>
              {bukuTerlambat}
            </div>
            <div className="stat-label">Buku Terlambat</div>
          </div>
          <AlertTriangle size={28} color={bukuTerlambat > 0 ? 'var(--danger)' : 'var(--gray-text)'} strokeWidth={1.5} />
        </div>

        {/* Total transaksi */}
        <div className="stat-card">
          <div>
            <div className="stat-value">{totalTransaksi}</div>
            <div className="stat-label">Total Transaksi</div>
          </div>
          <BookOpen size={28} color="var(--primary)" strokeWidth={1.5} />
        </div>
      </div>

      {/* ── Chart (only if there's denda data) ── */}
      {dendaMonthly.length > 0 && (
        <div className="card mb-24">
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>
            Riwayat Denda per Bulan
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={dendaMonthly}>
              <CartesianGrid strokeDasharray="3 3" stroke="#EEE9E4" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={v => formatRp(v)} />
              <Bar dataKey="denda" name="Denda" fill="#7B1C1C" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* ── Loan table ── */}
      <div className="card">
        <div className="flex-between mb-16" style={{ flexWrap: 'wrap', gap: 10 }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15 }}>Riwayat Peminjaman Saya</div>
            <div style={{ fontSize: 12, color: 'var(--gray-text)' }}>
              Klik baris untuk melihat rincian denda / reminder
            </div>
          </div>

          {/* Filter tabs */}
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {[
              { key: 'semua',    label: 'Semua' },
              { key: 'dipinjam', label: 'Sedang Dipinjam' },
              { key: 'terlambat',label: 'Terlambat' },
              { key: 'selesai',  label: 'Selesai' },
            ].map(f => (
              <button
                key={f.key}
                className={`chart-tab ${filter === f.key ? 'active' : ''}`}
                onClick={() => setFilter(f.key)}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Kode Buku</th>
                <th>Judul Buku</th>
                <th>Tgl Pinjam</th>
                <th>Batas Kembali</th>
                <th>Tgl Kembali</th>
                <th>Denda</th>
                <th>Pembayaran</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filteredLoans.length === 0 ? (
                <tr>
                  <td colSpan={10} style={{ textAlign: 'center', padding: 36, color: 'var(--gray-text)' }}>
                    Tidak ada data untuk filter ini.
                  </td>
                </tr>
              ) : filteredLoans.map(l => (
                <LoanRow key={l.id} l={l} />
              ))}
            </tbody>
          </table>
        </div>

        <div style={{
          marginTop: 12, display: 'flex', justifyContent: 'space-between',
          fontSize: 12, color: 'var(--gray-text)'
        }}>
          <span>{filteredLoans.length} transaksi</span>
          {filteredLoans.some(l => Number(l.denda) > 0) && (
            <span>
              Total Denda (filter ini): <b style={{ color: 'var(--danger)' }}>
                {formatRp(filteredLoans.reduce((s, l) => s + Number(l.denda || 0), 0))}
              </b>
            </span>
          )}
        </div>
      </div>

      {/* ── Payment info note ── */}
      {totalDendaBelumBayar > 0 && (
        <div style={{
          marginTop: 16,
          background: '#fff8e1',
          border: '1px solid #ffe082',
          borderRadius: 10,
          padding: '14px 18px',
          display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 13
        }}>
          <CreditCard size={16} color="#E65100" style={{ flexShrink: 0, marginTop: 1 }} />
          <div>
            <b>Cara membayar denda:</b> Datang ke meja petugas perpustakaan dengan membawa kartu anggota. Setelah pembayaran diterima, status akan diperbarui oleh petugas.
          </div>
        </div>
      )}
    </div>
  );
}