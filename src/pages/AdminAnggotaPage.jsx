// AdminAnggotaPage.jsx — selaras dengan PetugasAnggotaPage
import { useState } from 'react';
import { X, Check, Search, BookOpen, Users, UserCheck, ChevronRight, ShieldCheck, ShieldOff, History, Clock, TrendingDown, CheckCircle, RefreshCw } from 'lucide-react';
import { useApp } from '../components/AppContext';
import ApiImage from '../components/ApiImage';

/* ─── Avatar ────────────────────────────────────────────────── */
function MemberAvatar({ member, size = 34, fontSize = 11 }) {
  const initials = member.name?.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() || '??';
  const fallback = (
    <div style={{ width: size, height: size, borderRadius: '50%', background: 'var(--maroon)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize, fontWeight: 700, flexShrink: 0 }}>
      {initials}
    </div>
  );
  if (!member.photo_url) return fallback;
  return (
    <ApiImage src={member.photo_url} alt={member.name}
      style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
      fallback={fallback} />
  );
}

/* ─── Role helpers ──────────────────────────────────────────── */
function getRoleLabel(member) {
  if (member.role === 'admin')   return 'Admin';
  if (member.role === 'petugas') return 'Petugas';
  if (member.type === 'dosen')   return 'Dosen';
  return 'Mahasiswa';
}

function RoleBadge({ member }) {
  if (member.role === 'admin')   return <span className="badge badge-danger">Admin</span>;
  if (member.role === 'petugas') return <span className="badge badge-warning">Petugas</span>;
  if (member.type === 'dosen')   return <span className="badge badge-success">Dosen</span>;
  return <span className="badge badge-info">Mahasiswa</span>;
}

/* ─── Add/Edit Modal ────────────────────────────────────────── */
function MemberModal({ member = null, onSave, onClose }) {
  const [form, setForm] = useState({
    name:     member?.name    || '',
    nim:      member?.nim     || '',
    type:     member?.type    || 'staff',
    email:    member?.email   || '',
    phone:    member?.phone   || '',
    address:  member?.address || '',
    password: '',
    photo:    null,
  });
  const f = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));
  const isEdit = !!member;

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData();
    Object.entries(form).forEach(([key, value]) => {
      if (value !== null && value !== '') formData.append(key, value);
    });
    onSave(formData);
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h3 className="modal-title">{isEdit ? 'Edit Data Petugas' : 'Tambah Petugas Baru'}</h3>
          <button className="modal-close" onClick={onClose}><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Nama Lengkap *</label>
            <input className="form-control" value={form.name} onChange={f('name')} required />
          </div>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Tipe Anggota</label>
              <select className="form-control" value={form.type} onChange={f('type')}>
                <option value="staff">Staff</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">NIP / Kode Staff</label>
              <input className="form-control" value={form.nim} onChange={f('nim')} placeholder="Kosongkan jika ingin otomatis" />
            </div>
          </div>
          {!isEdit && (
            <div className="form-group">
              <label className="form-label">Password Login *</label>
              <input className="form-control" type="password" value={form.password} onChange={f('password')} required />
            </div>
          )}
          <div className="form-group">
            <label className="form-label">Email</label>
            <input className="form-control" type="email" value={form.email} onChange={f('email')} required />
          </div>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">No. Telp</label>
              <input className="form-control" value={form.phone} onChange={f('phone')} required />
            </div>
            <div className="form-group">
              <label className="form-label">Alamat</label>
              <input className="form-control" value={form.address} onChange={f('address')} required />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Foto Profil</label>
            <input type="file" accept="image/*" className="form-control"
              onChange={(e) => setForm(p => ({ ...p, photo: e.target.files[0] }))} />
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
            <button type="button" className="btn btn-ghost" onClick={onClose}>Batal</button>
            <button type="submit" className="btn btn-primary">
              <Check size={14} /> {isEdit ? 'Simpan Perubahan' : 'Tambah Petugas'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─── Member Detail Modal — selaras PetugasAnggotaPage ─────── */
function MemberDetailModal({ member, loans, onClose, onEdit }) {
  const initials = member.name?.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() || '??';

  const memberLoans    = loans.filter(l => l.memberId === member.id);
  const activeLoans    = memberLoans.filter(l => ['dipinjam', 'terlambat', 'diperpanjang'].includes(l.status));
  const returnedLoans  = memberLoans.filter(l => l.status === 'dikembalikan');
  const lateCount      = memberLoans.filter(l => l.status === 'terlambat').length;

  const roleLabel = getRoleLabel(member);

  // Warna badge role di header (sama-sama putih bg untuk kontras di atas maroon)
  const rolePillColor = member.role === 'admin' ? '#fca5a5'
    : member.role === 'petugas' ? '#fde68a'
    : member.type === 'dosen' ? '#a7f3d0'
    : '#bfdbfe';

  function formatDate(d) {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  const infoRows = [
    { label: 'ID',            val: member.custom_id || member.id, isCode: true },
    { label: 'NIP / Kode',   val: member.nim || '—' },
    { label: 'Email',         val: member.email || '—' },
    { label: 'No. Telp',      val: member.phone || '—' },
    { label: 'Alamat',        val: member.address || '—' },
    { label: 'Tgl Bergabung', val: member.joinDate || '—' },
  ];

  return (
    <div className="modal-overlay">
      <div className="modal" style={{
        maxWidth: 740, width: '95%', padding: 0,
        overflow: 'hidden', borderRadius: 16,
        boxShadow: '0 24px 60px rgba(0,0,0,0.18)',
      }}>

        {/* ── Header — identik dengan PetugasAnggotaPage ── */}
        <div style={{
          background: 'linear-gradient(135deg, #6B1515 0%, #8B1E30 50%, #7B1C1C 100%)',
          padding: '22px 24px 20px', position: 'relative',
        }}>
          <button onClick={onClose} style={{
            position: 'absolute', top: 18, right: 18,
            color: 'rgba(255,255,255,0.7)', background: 'rgba(255,255,255,0.12)',
            border: 'none', borderRadius: '50%', width: 30, height: 30,
            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
          }}><X size={15} /></button>

          <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
            {/* Avatar */}
            {member.photo_url ? (
              <ApiImage src={member.photo_url} alt={member.name}
                style={{ width: 64, height: 64, borderRadius: '50%', objectFit: 'cover', flexShrink: 0, border: '2.5px solid rgba(255,255,255,0.35)', boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }}
                fallback={
                  <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 800, flexShrink: 0, border: '2.5px solid rgba(255,255,255,0.3)' }}>
                    {initials}
                  </div>
                } />
            ) : (
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 800, flexShrink: 0, border: '2.5px solid rgba(255,255,255,0.3)' }}>
                {initials}
              </div>
            )}

            {/* Info */}
            <div style={{ flex: 1, color: 'white' }}>
              <div style={{ fontSize: 18, fontWeight: 800, lineHeight: 1.2, letterSpacing: '-0.3px' }}>{member.name}</div>
              <div style={{ fontSize: 12, opacity: 0.7, marginTop: 4, fontFamily: 'monospace' }}>
                {member.nim || member.custom_id || member.id} · {member.departemen || 'Perpustakaan FMIPA'}
              </div>
              <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
                {/* Role pill — warna berbeda per role */}
                <span style={{
                  fontSize: 11, padding: '3px 10px', borderRadius: 20, fontWeight: 700,
                  background: 'rgba(255,255,255,0.18)', color: rolePillColor,
                  border: '1px solid rgba(255,255,255,0.2)',
                }}>{roleLabel}</span>
                <span style={{
                  fontSize: 11, background: 'rgba(255,255,255,0.1)', padding: '3px 10px',
                  borderRadius: 20, border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.85)',
                }}>{member.status || 'aktif'}</span>
              </div>
            </div>

            <button onClick={() => onEdit(member)} style={{
              fontSize: 12, padding: '7px 14px', borderRadius: 8, marginRight: 44, marginTop: 2,
              background: 'rgba(255,255,255,0.15)', color: 'white',
              border: '1px solid rgba(255,255,255,0.25)', cursor: 'pointer', fontWeight: 600, flexShrink: 0,
            }}>
              Edit Data
            </button>
          </div>

          {/* Stats row — sama persis dengan PetugasAnggotaPage */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginTop: 18 }}>
            {[
              { label: 'Sedang Dipinjam', val: activeLoans.length,   color: '#fde68a' },
              { label: 'Sudah Kembali',   val: returnedLoans.length,  color: '#a7f3d0' },
              { label: 'Terlambat',       val: lateCount, color: lateCount > 0 ? '#fca5a5' : '#a7f3d0' },
            ].map(s => (
              <div key={s.label} style={{
                textAlign: 'center', padding: '10px 0',
                background: 'rgba(255,255,255,0.1)', borderRadius: 10,
                border: '1px solid rgba(255,255,255,0.1)',
              }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: s.color, fontFamily: "'DM Mono', monospace", lineHeight: 1 }}>{s.val}</div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)', marginTop: 4, fontWeight: 500 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Body ── */}
        <div style={{ padding: '20px 24px 24px', maxHeight: '60vh', overflowY: 'auto' }}>

          {/* Info Petugas */}
          <div style={{ marginBottom: 22 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 12 }}>
              Informasi {roleLabel}
            </div>
            <div style={{ border: '1px solid #f0ebe6', borderRadius: 12, overflow: 'hidden' }}>
              {infoRows.map(({ label, val, isCode }, i) => (
                <div key={label} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '10px 16px',
                  background: i % 2 === 0 ? 'white' : '#fafafa',
                  borderBottom: i < infoRows.length - 1 ? '1px solid #f5f0ee' : 'none',
                }}>
                  <span style={{ fontSize: 12, color: '#9ca3af', fontWeight: 500 }}>{label}</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a', textAlign: 'right', maxWidth: '65%', wordBreak: 'break-word' }}>
                    {isCode
                      ? <code style={{ background: '#f0ebe6', padding: '2px 7px', borderRadius: 4, fontSize: 11, color: '#7B1C1C' }}>{val}</code>
                      : val}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Pinjaman Aktif — hanya tampil untuk anggota yang bisa pinjam (bukan petugas/admin murni) */}
          {(member.type === 'mahasiswa' || member.type === 'dosen') && (
            <>
              <div style={{ marginBottom: 22 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <Clock size={14} style={{ color: '#7B1C1C' }} />
                  <span style={{ fontWeight: 700, fontSize: 13, color: '#1a1a1a' }}>Pinjaman Aktif</span>
                  {activeLoans.length > 0 && (
                    <span style={{ fontSize: 10, background: '#fef2f2', color: '#7B1C1C', padding: '2px 8px', borderRadius: 20, fontWeight: 700, border: '1px solid rgba(123,28,28,0.2)' }}>
                      {activeLoans.length} buku
                    </span>
                  )}
                </div>
                {activeLoans.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '24px 16px', background: '#fafafa', borderRadius: 12, border: '1.5px dashed #e5e7eb', color: '#9ca3af', fontSize: 12 }}>
                    <BookOpen size={24} style={{ opacity: 0.15, display: 'block', margin: '0 auto 8px' }} />
                    Tidak ada pinjaman aktif saat ini
                  </div>
                ) : (
                  <div style={{ border: '1px solid #f0ebe6', borderRadius: 12, overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                      <thead>
                        <tr style={{ background: '#fafafa', borderBottom: '1px solid #f0ebe6' }}>
                          {['Judul Buku', 'Tgl Pinjam', 'Batas Kembali', 'Perpanjangan', 'Status'].map(h => (
                            <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#9ca3af', whiteSpace: 'nowrap', textTransform: 'uppercase', letterSpacing: '0.3px' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {activeLoans.map((l, idx) => {
                          const isLate    = l.status === 'terlambat';
                          const jumlahExt = l.jumlahPerpanjangan || 0;
                          const days      = Math.ceil((new Date(l.dueDate) - new Date()) / 86400000);
                          return (
                            <tr key={l.id} style={{ background: isLate ? 'rgba(183,28,28,0.025)' : idx % 2 === 0 ? 'white' : '#fafafa', borderBottom: '1px solid #f5f0ee' }}>
                              <td style={{ padding: '10px 12px', maxWidth: 180 }}>
                                <div style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.bookTitle}</div>
                                <code style={{ fontSize: 10, background: '#f0ebe6', padding: '1px 5px', borderRadius: 3, color: '#7B1C1C', marginTop: 2, display: 'inline-block' }}>{l.bookCode}</code>
                              </td>
                              <td style={{ padding: '10px 12px', color: '#6b7280', whiteSpace: 'nowrap' }}>{formatDate(l.loanDate)}</td>
                              <td style={{ padding: '10px 12px', whiteSpace: 'nowrap', color: isLate ? '#B71C1C' : '#374151', fontWeight: isLate ? 700 : 400 }}>{formatDate(l.dueDate)}</td>
                              <td style={{ padding: '10px 12px', color: jumlahExt > 0 ? '#B45309' : '#9ca3af', fontWeight: jumlahExt > 0 ? 700 : 400 }}>{jumlahExt}×</td>
                              <td style={{ padding: '10px 12px' }}>
                                {isLate
                                  ? <span className="badge badge-danger">Terlambat {Math.abs(days)}h</span>
                                  : days === 0 ? <span className="badge badge-warning">Hari ini!</span>
                                  : days <= 3 ? <span className="badge badge-warning">Sisa {days}h</span>
                                  : <span className="badge badge-success">Sisa {days}h</span>}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Divider */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <div style={{ height: 1, flex: 1, background: '#f0ebe6' }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600, fontSize: 11, color: '#b0aaa6', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  <History size={11} /> Riwayat Selesai
                </div>
                <div style={{ height: 1, flex: 1, background: '#f0ebe6' }} />
              </div>

              {/* Returned Loans */}
              {returnedLoans.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '18px 16px', background: '#fafafa', borderRadius: 12, border: '1.5px dashed #e5e7eb', color: '#9ca3af', fontSize: 12 }}>
                  Belum ada riwayat pengembalian
                </div>
              ) : (
                <div style={{ border: '1px solid #f0ebe6', borderRadius: 12, overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                    <thead>
                      <tr style={{ background: '#fafafa', borderBottom: '1px solid #f0ebe6' }}>
                        {['Judul Buku', 'Tgl Pinjam', 'Tgl Kembali', 'Perpanjangan', 'Denda', 'Status'].map(h => (
                          <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#9ca3af', whiteSpace: 'nowrap', textTransform: 'uppercase', letterSpacing: '0.3px' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {returnedLoans.map((l, idx) => {
                        const isLate    = (l.denda || 0) > 0;
                        const jumlahExt = l.jumlahPerpanjangan || 0;
                        return (
                          <tr key={l.id} style={{ background: idx % 2 === 0 ? 'white' : '#fafafa', borderBottom: '1px solid #f5f0ee' }}>
                            <td style={{ padding: '10px 12px', maxWidth: 160 }}>
                              <div style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.bookTitle}</div>
                              <code style={{ fontSize: 10, background: '#f0ebe6', padding: '1px 4px', borderRadius: 3, color: '#7B1C1C' }}>{l.bookCode}</code>
                            </td>
                            <td style={{ padding: '10px 12px', color: '#6b7280', whiteSpace: 'nowrap' }}>{formatDate(l.loanDate)}</td>
                            <td style={{ padding: '10px 12px', color: '#6b7280', whiteSpace: 'nowrap' }}>{formatDate(l.returnDate)}</td>
                            <td style={{ padding: '10px 12px', color: jumlahExt > 0 ? '#B45309' : '#9ca3af', fontWeight: jumlahExt > 0 ? 700 : 400 }}>
                              {jumlahExt > 0 ? `${jumlahExt}×` : '—'}
                            </td>
                            <td style={{ padding: '10px 12px', fontWeight: isLate ? 700 : 400, color: isLate ? '#991B1B' : '#9ca3af', whiteSpace: 'nowrap' }}>
                              {isLate ? `Rp ${Number(l.denda).toLocaleString('id-ID')}` : '—'}
                            </td>
                            <td style={{ padding: '10px 12px' }}>
                              <span className={`badge ${isLate ? 'badge-warning' : 'badge-success'}`} style={{ fontSize: 10 }}>
                                {isLate ? 'Terlambat' : 'Tepat Waktu'}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}

          {/* Untuk petugas/admin murni — tampilkan info singkat saja */}
          {member.type !== 'mahasiswa' && member.type !== 'dosen' && (
            <div style={{ textAlign: 'center', padding: '24px 16px', background: '#fafafa', borderRadius: 12, border: '1.5px dashed #e5e7eb', color: '#9ca3af', fontSize: 12 }}>
              <ShieldCheck size={24} style={{ opacity: 0.2, display: 'block', margin: '0 auto 8px', color: '#7B1C1C' }} />
              Akun {roleLabel} tidak memiliki riwayat peminjaman
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Main Page ─────────────────────────────────────────────── */
export default function AdminAnggotaPage() {
  const { members, loans, updateMember, promoteToPetugas, addMember } = useApp();
  const [search,       setSearch]       = useState('');
  const [roleFilter,   setRoleFilter]   = useState('semua');
  const [addModal,     setAddModal]     = useState(false);
  const [detailMember, setDetailMember] = useState(null);
  const [editMember,   setEditMember]   = useState(null);

  // Filter: semua kecuali admin, lalu filter by role
  const filtered = members
    .filter(m => m.role !== 'admin')
    .filter(m => {
      if (roleFilter === 'petugas')   return m.role === 'petugas';
      if (roleFilter === 'dosen')     return m.role === 'dosen' || (m.type === 'dosen' && m.role !== 'petugas');
      if (roleFilter === 'mahasiswa') return m.type === 'mahasiswa' && m.role !== 'petugas';
      return true; // semua
    })
    .filter(m =>
      !search ||
      m.name?.toLowerCase().includes(search.toLowerCase()) ||
      m.email?.toLowerCase().includes(search.toLowerCase()) ||
      m.nim?.includes(search)
    );

  const staffCount     = members.filter(m => m.role === 'petugas' && m.status === 'aktif').length;
  const dosenCount     = members.filter(m => (m.role === 'dosen' || m.type === 'dosen') && m.role !== 'petugas' && m.status === 'aktif').length;
  const mahasiswaCount = members.filter(m => m.type === 'mahasiswa' && m.role !== 'petugas' && m.status === 'aktif').length;
  const totalCount     = members.filter(m => m.role !== 'admin').length;

  const statCards = [
    { label: 'Petugas Aktif',  value: staffCount,     color: '#7B1C1C', bg: 'rgba(123,28,28,0.07)',  border: 'rgba(123,28,28,0.18)',  icon: <ShieldCheck size={16} /> },
    { label: 'Dosen',          value: dosenCount,      color: '#0D1B2A', bg: 'rgba(13,27,42,0.07)',   border: 'rgba(13,27,42,0.18)',   icon: <UserCheck size={16} /> },
    { label: 'Mahasiswa',      value: mahasiswaCount,  color: '#065F46', bg: 'rgba(6,95,70,0.07)',    border: 'rgba(6,95,70,0.18)',    icon: <Users size={16} /> },
    { label: 'Total Member',   value: totalCount,      color: '#B45309', bg: 'rgba(180,83,9,0.07)',   border: 'rgba(180,83,9,0.18)',   icon: <Users size={16} /> },
  ];

  const filterButtons = [
    { key: 'semua',     label: 'Semua',     activeColor: '#7B1C1C', activeBg: 'rgba(123,28,28,0.09)' },
    { key: 'petugas',   label: 'Petugas',   activeColor: '#B45309', activeBg: 'rgba(180,83,9,0.1)' },
    { key: 'dosen',     label: 'Dosen',     activeColor: '#0D1B2A', activeBg: 'rgba(13,27,42,0.09)' },
    { key: 'mahasiswa', label: 'Mahasiswa', activeColor: '#065F46', activeBg: 'rgba(6,95,70,0.09)' },
  ];

  return (
    <div>
      {addModal && (
        <MemberModal onSave={async (m) => { const ok = await addMember(m); if (ok) setAddModal(false); }} onClose={() => setAddModal(false)} />
      )}
      {editMember && (
        <MemberModal member={editMember}
          onSave={async (m) => { const ok = await updateMember(editMember.id, m); if (ok) setEditMember(null); }}
          onClose={() => setEditMember(null)} />
      )}
      {detailMember && (
        <MemberDetailModal
          member={detailMember}
          loans={loans}
          onEdit={(m) => { setDetailMember(null); setEditMember(m); }}
          onClose={() => setDetailMember(null)} />
      )}

      {/* Page Header */}
      <div className="page-header">
        <div className="page-breadcrumb">DATA PETUGAS</div>
        <h1 className="page-title">Manajemen Petugas</h1>
        <p className="page-subtitle">Kelola data petugas (Staff) perpustakaan dan hak akses role</p>
      </div>

      {/* Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 24 }}>
        {statCards.map((s, i) => (
          <div key={i} style={{ background: s.bg, border: `1px solid ${s.border}`, borderRadius: 14, padding: '20px 22px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: s.bg, border: `1px solid ${s.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.color, flexShrink: 0 }}>
              {s.icon}
            </div>
            <div>
              <div style={{ fontSize: 11, color: s.color, textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600, marginBottom: 4 }}>{s.label}</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: s.color, lineHeight: 1, fontFamily: "'DM Mono', monospace" }}>{s.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Table Card */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>

        {/* Card header */}
        <div style={{ padding: '14px 18px', borderBottom: '1px solid #f0ebe6', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, background: 'linear-gradient(to right, #fafafa, #fff5f5)' }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: '#1a1a1a', display: 'flex', alignItems: 'center', gap: 8 }}>
            Daftar Member
            <span style={{ fontSize: 11, background: 'rgba(123,28,28,0.08)', color: '#7B1C1C', padding: '2px 8px', borderRadius: 20, fontWeight: 700, border: '1px solid rgba(123,28,28,0.15)' }}>
              {filtered.length} member
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            {/* Role filter toggle */}
            <div style={{ display: 'flex', gap: 6, background: '#f3f4f6', borderRadius: 9, padding: 3 }}>
              {filterButtons.map(btn => {
                const isActive = roleFilter === btn.key;
                return (
                  <button key={btn.key} onClick={() => setRoleFilter(btn.key)} style={{
                    padding: '5px 13px', borderRadius: 7, border: 'none', cursor: 'pointer',
                    fontSize: 12, fontWeight: 600, transition: 'all 0.15s',
                    background: isActive ? btn.activeBg : 'transparent',
                    color: isActive ? btn.activeColor : '#6b7280',
                    boxShadow: isActive ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
                  }}>{btn.label}</button>
                );
              })}
            </div>

            {/* Search */}
            <div style={{ position: 'relative' }}>
              <Search size={13} style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
              <input className="form-control" style={{ paddingLeft: 30, width: 220 }} placeholder="Cari nama, email, NIP..."
                value={search} onChange={e => setSearch(e.target.value)} />
            </div>

            {/* Add button */}
            <button className="btn btn-primary btn-sm" onClick={() => setAddModal(true)}
              style={{ display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}>
              <ShieldCheck size={13} /> Tambah Petugas
            </button>
          </div>
        </div>

        {/* Hint */}
        <div style={{ padding: '8px 18px', background: 'rgba(123,28,28,0.03)', borderBottom: '1px solid #f0ebe6', fontSize: 11, color: '#9ca3af', display: 'flex', alignItems: 'center', gap: 5 }}>
          <ChevronRight size={11} /> Klik baris untuk melihat profil · Gunakan tombol aksi untuk ubah role
        </div>

        {/* Table */}
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Nama</th>
                <th>No. Telp</th>
                <th>Alamat</th>
                <th>Tgl Bergabung</th>
                <th>Role</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: 48, color: '#9ca3af', fontSize: 13 }}>
                    <Users size={32} style={{ opacity: 0.15, display: 'block', margin: '0 auto 10px' }} />
                    Tidak ada data ditemukan
                  </td>
                </tr>
              ) : filtered.map(m => (
                <tr key={m.id} style={{ cursor: 'pointer' }} onClick={() => setDetailMember(m)}>
                  <td><code style={{ background: 'var(--gray-light)', padding: '2px 6px', borderRadius: 4, fontSize: 11 }}>{m.custom_id || m.id}</code></td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <MemberAvatar member={m} size={34} />
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 13 }}>{m.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--gray-text)' }}>{m.email}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ color: 'var(--gray-text)', fontSize: 13 }}>{m.phone || '—'}</td>
                  <td style={{ color: 'var(--gray-text)', fontSize: 13, maxWidth: 160 }}>
                    <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.address || '—'}</div>
                  </td>
                  <td style={{ color: 'var(--gray-text)', fontSize: 12 }}>{m.joinDate}</td>
                  <td><RoleBadge member={m} /></td>
                  <td onClick={e => e.stopPropagation()}>
                    {(m.role === 'dosen' || m.type === 'dosen') && m.role !== 'petugas' ? (
                      <button
                        onClick={async () => {
                          if (!m.email?.endsWith('@unesa.ac.id')) { alert('Hanya akun dosen UNESA yang dapat dijadikan petugas'); return; }
                          if (confirm(`Jadikan ${m.name} sebagai petugas perpustakaan?`)) await promoteToPetugas(m.id);
                        }}
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: 5,
                          padding: '5px 12px', borderRadius: 7, border: 'none',
                          background: 'linear-gradient(135deg, #7B1C1C, #9B2335)',
                          color: 'white', fontSize: 11, fontWeight: 700,
                          cursor: 'pointer', whiteSpace: 'nowrap',
                          boxShadow: '0 1px 4px rgba(123,28,28,0.25)',
                        }}
                      >
                        <ShieldCheck size={11} /> Jadikan Petugas
                      </button>
                    ) : m.role === 'petugas' ? (
                      <button
                      onClick={async () => {
                        if (!confirm(`Kembalikan role ${m.name} menjadi dosen?`)) return;

                      const ok = await updateMember(m.id, {
                        role: '',
                        type: 'dosen'
                      });

                        if (ok) {
                          console.log('Role berhasil dicabut');
                        }
                      }}
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: 5,
                          padding: '5px 12px', borderRadius: 7,
                          border: '1.5px solid rgba(180,83,9,0.35)',
                          background: 'rgba(180,83,9,0.06)',
                          color: '#B45309', fontSize: 11, fontWeight: 700,
                          cursor: 'pointer', whiteSpace: 'nowrap',
                        }}
                      >
                        <ShieldOff size={11} /> Cabut Role
                      </button>
                    ) : (
                      <div
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: 5,
                          padding: '5px 12px', borderRadius: 7,
                          border: '1.5px solid rgba(37,99,235,0.2)',
                          background: 'rgba(37,99,235,0.06)',
                          color: '#2563eb', fontSize: 11, fontWeight: 700,
                          whiteSpace: 'nowrap',
                        }}
                      >
                        <Users size={11} /> Mahasiswa
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ padding: '10px 18px', fontSize: 12, color: 'var(--gray-text)', borderTop: '1px solid #f5f0ee' }}>
          {filtered.length} member ditampilkan
        </div>
      </div>
    </div>
  );
}