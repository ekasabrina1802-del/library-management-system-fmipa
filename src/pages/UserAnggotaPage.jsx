import { BookOpen, Clock, AlertCircle, Phone, Mail, MapPin, GraduationCap, Building2, History, User } from 'lucide-react';
import { useApp } from '../components/AppContext';
import { useAuth } from '../components/AuthContext';

export default function AnggotaUserPage() {
  const { members, loans } = useApp();
  const { user } = useAuth();

  // Cari data member berdasarkan user yang login
  // Asumsi: user.memberId atau user.nim dipakai untuk match ke members
  const member = members.find(m => m.id === user?.memberId || m.nim === user?.nim || m.email === user?.email);

  // Jika tidak ditemukan
  if (!member) {
    return (
      <div>
        <div className="page-header">
          <div className="page-breadcrumb">Profil Saya</div>
          <h1 className="page-title">Profil Anggota</h1>
        </div>
        <div className="card" style={{ textAlign: 'center', padding: 60 }}>
          <User size={48} style={{ color: 'var(--gray-text)', marginBottom: 16 }} />
          <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>Data anggota tidak ditemukan</div>
          <div style={{ fontSize: 13, color: 'var(--gray-text)' }}>
            Hubungi petugas perpustakaan untuk mendaftarkan diri sebagai anggota.
          </div>
        </div>
      </div>
    );
  }

  // Data peminjaman milik user ini
  const myLoans = loans.filter(l => l.memberId === member.id);
  const activeLoans = myLoans.filter(l => l.status === 'dipinjam');
  const lateLoans = myLoans.filter(l => l.status === 'terlambat');
  const returnedLoans = myLoans.filter(l => l.status === 'dikembalikan');

  const initials = member.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  const isActive = member.status === 'aktif';

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <h1 className="page-title">Profil Saya</h1>
        <p className="page-subtitle">Informasi keanggotaan dan riwayat peminjaman buku kamu.</p>
      </div>

      {/* Alert jika nonaktif */}
      {!isActive && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '12px 16px', background: '#fef2f2', border: '1px solid #fecaca',
          borderRadius: 8, marginBottom: 20, fontSize: 13, color: '#dc2626'
        }}>
          <AlertCircle size={16} />
          <span>Status keanggotaan kamu saat ini <strong>nonaktif</strong>. Kamu tidak dapat melakukan peminjaman baru. Hubungi petugas untuk informasi lebih lanjut.</span>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 20, alignItems: 'start' }}>

        {/* ── Kolom Kiri: Kartu Profil ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Avatar & Info Utama */}
          <div className="card" style={{ textAlign: 'center', padding: 28 }}>
            <div style={{
              width: 72, height: 72, borderRadius: '50%',
              background: isActive ? 'var(--maroon)' : '#9ca3af',
              color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 24, fontWeight: 700, margin: '0 auto 14px'
            }}>
              {initials}
            </div>
            <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 4 }}>{member.name}</div>
            <div style={{ fontSize: 12, color: 'var(--gray-text)', marginBottom: 12 }}>{member.prodi}</div>
            <div style={{ display: 'flex', gap: 6, justifyContent: 'center', flexWrap: 'wrap' }}>
              <span className={`badge ${isActive ? 'badge-success' : 'badge-danger'}`}>{member.status}</span>
              <span className="badge badge-info">{member.type}</span>
            </div>
          </div>

          {/* Info Detail */}
          <div className="card">
            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 14 }}>Informasi Keanggotaan</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <InfoRow icon={<GraduationCap size={14} />} label="NIM / NIP" value={member.nim} mono />
              <InfoRow icon={<Building2 size={14} />} label="Departemen" value={member.departemen} />
              <InfoRow icon={<GraduationCap size={14} />} label="Program Studi" value={member.prodi} />
              <InfoRow icon={<Mail size={14} />} label="Email" value={member.email} />
              {member.phone && <InfoRow icon={<Phone size={14} />} label="No. Telp" value={member.phone} />}
              {member.address && <InfoRow icon={<MapPin size={14} />} label="Alamat" value={member.address} />}
              <InfoRow icon={<Clock size={14} />} label="Bergabung Sejak" value={member.joinDate} />
            </div>
          </div>
        </div>

        {/* ── Kolom Kanan: Statistik + Riwayat ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Stat Cards */}
          <div className="grid-3">
            <StatMini
              value={activeLoans.length}
              label="Sedang Dipinjam"
              color="var(--navy)"
              bg="var(--off-white)"
              icon={<BookOpen size={15} />}
            />
            <StatMini
              value={lateLoans.length}
              label="Terlambat"
              color="#dc2626"
              bg="#fef2f2"
              icon={<AlertCircle size={15} />}
            />
            <StatMini
              value={returnedLoans.length}
              label="Sudah Dikembalikan"
              color="#16a34a"
              bg="#f0fdf4"
              icon={<History size={15} />}
            />
          </div>

          {/* Peminjaman Aktif */}
          {(activeLoans.length > 0 || lateLoans.length > 0) && (
            <div className="card">
              <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
                <BookOpen size={15} color="var(--maroon)" />
                Buku yang Sedang Dipinjam
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[...activeLoans, ...lateLoans].map(l => (
                  <div key={l.id} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '10px 14px',
                    background: l.status === 'terlambat' ? '#fef2f2' : 'var(--off-white)',
                    borderRadius: 8,
                    border: l.status === 'terlambat' ? '1px solid #fecaca' : '1px solid transparent'
                  }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{l.bookTitle}</div>
                      <div style={{ fontSize: 11, color: 'var(--gray-text)', marginTop: 2 }}>
                        Dipinjam: {l.loanDate} · Jatuh tempo: {l.dueDate}
                      </div>
                    </div>
                    <span className={`badge ${l.status === 'terlambat' ? 'badge-danger' : 'badge-warning'}`}>
                      {l.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Riwayat Peminjaman */}
          <div className="card">
            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
              <History size={15} /> Riwayat Peminjaman
            </div>
            <div className="table-container" style={{ maxHeight: 320, overflowY: 'auto' }}>
              <table>
                <thead>
                  <tr>
                    <th>Judul Buku</th>
                    <th>Tgl Pinjam</th>
                    <th>Tgl Kembali</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {myLoans.length === 0 ? (
                    <tr>
                      <td colSpan={4} style={{ textAlign: 'center', padding: 32, color: 'var(--gray-text)' }}>
                        <BookOpen size={28} style={{ marginBottom: 8, display: 'block', margin: '0 auto 8px' }} />
                        Belum ada riwayat peminjaman
                      </td>
                    </tr>
                  ) : (
                    // Terbaru dulu
                    [...myLoans].reverse().map(l => (
                      <tr key={l.id}>
                        <td style={{ fontWeight: 500 }}>{l.bookTitle}</td>
                        <td style={{ color: 'var(--gray-text)', fontSize: 12 }}>{l.loanDate}</td>
                        <td style={{ color: 'var(--gray-text)', fontSize: 12 }}>{l.returnDate || l.dueDate}</td>
                        <td>
                          <span className={`badge ${
                            l.status === 'dikembalikan' ? 'badge-success' :
                            l.status === 'terlambat' ? 'badge-danger' : 'badge-warning'
                          }`}>{l.status}</span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

// ─── Helper Components ────────────────────────────────────────────────────────

function InfoRow({ icon, label, value, mono }) {
  return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
      <span style={{ color: 'var(--maroon)', marginTop: 1, flexShrink: 0 }}>{icon}</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 10, color: 'var(--gray-text)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 1 }}>{label}</div>
        <div style={{ fontSize: 13, fontWeight: 500, fontFamily: mono ? 'monospace' : 'inherit' }}>{value || '—'}</div>
      </div>
    </div>
  );
}

function StatMini({ value, label, color, bg, icon }) {
  return (
    <div style={{ padding: 16, background: bg, borderRadius: 10, textAlign: 'center' }}>
      <div style={{ color, marginBottom: 6 }}>{icon}</div>
      <div style={{ fontSize: 28, fontWeight: 700, color, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 11, color: 'var(--gray-text)', marginTop: 4 }}>{label}</div>
    </div>
  );
}