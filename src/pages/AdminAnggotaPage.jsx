// AdminAnggotaPage.jsx — UI aligned with design system
import { useState } from 'react';
import { X, Check, Search, BookOpen, Users, UserCheck, ChevronRight, Shield, ShieldCheck, ShieldOff } from 'lucide-react';
import { useApp } from '../components/AppContext';
import { useAuth } from '../components/AuthContext';
import ApiImage from '../components/ApiImage';

/* ─── Avatar Component ──────────────────────────────────────── */
function MemberAvatar({ member, size = 34, fontSize = 11 }) {
  const initials = member.name?.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() || '??';
  const fallback = (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: 'var(--maroon)', color: 'white',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize, fontWeight: 700, flexShrink: 0,
    }}>{initials}</div>
  );
  if (!member.photo_url) return fallback;
  return (
    <ApiImage
      src={member.photo_url} alt={member.name}
      style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
      fallback={fallback}
    />
  );
}

/* ─── Member Edit/Add Modal ─────────────────────────────────── */
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

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData();
    Object.entries(form).forEach(([key, value]) => {
      if (value !== null && value !== '') formData.append(key, value);
    });
    onSave(formData);
  };

  const isEdit = !!member;

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
              <input
                className="form-control"
                value={form.nim}
                onChange={f('nim')}
                placeholder="Kosongkan jika ingin otomatis"
              />
            </div>
          </div>

          {!isEdit && (
            <div className="form-group">
              <label className="form-label">Password Login *</label>
              <input
                className="form-control"
                type="password"
                value={form.password}
                onChange={f('password')}
                required
              />
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
            <input
              type="file"
              accept="image/*"
              className="form-control"
              onChange={(e) => setForm(p => ({ ...p, photo: e.target.files[0] }))}
            />
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

/* ─── Member Detail Modal ───────────────────────────────────── */
function MemberDetailModal({ member, onClose, onEdit }) {
  const initials = member.name?.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() || '??';

  const roleLabel = member.role === 'petugas' ? 'Petugas' : member.role === 'admin' ? 'Admin' : 'Dosen';
  const roleColor = member.role === 'petugas' ? '#B45309' : member.role === 'admin' ? '#7B1C1C' : '#0D1B2A';
  const roleBg    = member.role === 'petugas' ? 'rgba(180,83,9,0.1)' : member.role === 'admin' ? 'rgba(123,28,28,0.1)' : 'rgba(13,27,42,0.08)';

  const infoRows = [
    { label: 'ID',            val: member.custom_id || member.id },
    { label: 'NIP / Kode',   val: member.nim || '—' },
    { label: 'Email',         val: member.email || '—' },
    { label: 'No. Telp',      val: member.phone || '—' },
    { label: 'Alamat',        val: member.address || '—' },
    { label: 'Tgl Bergabung', val: member.joinDate || '—' },
  ];

  return (
    <div className="modal-overlay">
      <div className="modal" style={{ maxWidth: 520, width: '95%', padding: 0, overflow: 'hidden', borderRadius: 16, boxShadow: '0 24px 60px rgba(0,0,0,0.18)' }}>

        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #6B1515 0%, #8B1E30 50%, #7B1C1C 100%)',
          padding: '24px 24px 22px', position: 'relative',
        }}>
          <button
            onClick={onClose}
            style={{
              position: 'absolute', top: 18, right: 18,
              color: 'rgba(255,255,255,0.7)', background: 'rgba(255,255,255,0.12)',
              border: 'none', borderRadius: '50%', width: 30, height: 30,
              display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
            }}
          ><X size={15} /></button>

          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            {/* Avatar */}
            {member.photo_url ? (
              <ApiImage
                src={member.photo_url} alt={member.name}
                style={{ width: 72, height: 72, borderRadius: '50%', objectFit: 'cover', flexShrink: 0, border: '2.5px solid rgba(255,255,255,0.35)', boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }}
                fallback={
                  <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 800, flexShrink: 0, border: '2.5px solid rgba(255,255,255,0.3)' }}>
                    {initials}
                  </div>
                }
              />
            ) : (
              <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 800, flexShrink: 0, border: '2.5px solid rgba(255,255,255,0.3)' }}>
                {initials}
              </div>
            )}

            <div style={{ flex: 1, color: 'white' }}>
              <div style={{ fontSize: 20, fontWeight: 800, lineHeight: 1.2, letterSpacing: '-0.3px' }}>
                {member.name}
              </div>
              <div style={{ fontSize: 12, opacity: 0.7, marginTop: 4 }}>
                Staff Perpustakaan FMIPA
              </div>
              <div style={{ marginTop: 10, display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                <span style={{ fontSize: 11, background: roleBg, color: roleColor, padding: '3px 10px', borderRadius: 20, fontWeight: 700, border: `1px solid ${roleColor}30`, backdropFilter: 'blur(4px)', background: 'rgba(255,255,255,0.18)', color: 'white', border: '1px solid rgba(255,255,255,0.25)' }}>
                  {roleLabel}
                </span>
                <span style={{ fontSize: 11, background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.8)', padding: '3px 10px', borderRadius: 20, border: '1px solid rgba(255,255,255,0.15)' }}>
                  {member.status || 'aktif'}
                </span>
              </div>
            </div>

            <button
              onClick={() => onEdit(member)}
              style={{
                fontSize: 12, padding: '7px 14px', borderRadius: 8,
                background: 'rgba(255,255,255,0.15)', color: 'white',
                border: '1px solid rgba(255,255,255,0.25)', cursor: 'pointer',
                fontWeight: 600, flexShrink: 0, alignSelf: 'flex-start',
                marginTop: 2,
              }}
            >
              Edit Data
            </button>
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: '20px 24px 24px' }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 14 }}>
            Informasi Petugas
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0, border: '1px solid #f0ebe6', borderRadius: 12, overflow: 'hidden' }}>
            {infoRows.map(({ label, val }, i) => (
              <div key={label} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '11px 16px',
                background: i % 2 === 0 ? 'white' : '#fafafa',
                borderBottom: i < infoRows.length - 1 ? '1px solid #f5f0ee' : 'none',
              }}>
                <span style={{ fontSize: 12, color: '#9ca3af', fontWeight: 500 }}>{label}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a', textAlign: 'right', maxWidth: '65%', wordBreak: 'break-word' }}>
                  {label === 'ID'
                    ? <code style={{ background: '#f0ebe6', padding: '2px 7px', borderRadius: 4, fontSize: 11, color: '#7B1C1C' }}>{val}</code>
                    : val}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Role Badge ────────────────────────────────────────────── */
function RoleBadge({ member }) {
  if (member.role === 'admin')   return <span className="badge badge-danger">Admin</span>;
  if (member.role === 'petugas') return <span className="badge badge-warning">Petugas</span>;
  if (member.type === 'dosen')   return <span className="badge badge-success">Dosen</span>;
  return <span className="badge badge-secondary">Mahasiswa</span>;
}

/* ─── Main Page ─────────────────────────────────────────────── */
export default function AdminAnggotaPage() {
  const { members, loans, updateMember, promoteToPetugas, addMember } = useApp();
  const [search,       setSearch]       = useState('');
  const [addModal,     setAddModal]     = useState(false);
  const [detailMember, setDetailMember] = useState(null);
  const [editMember,   setEditMember]   = useState(null);

  const filtered = members
    .filter(m => m.role !== 'admin')
    .filter(m =>
      !search ||
      m.name?.toLowerCase().includes(search.toLowerCase()) ||
      m.email?.toLowerCase().includes(search.toLowerCase()) ||
      m.nim?.includes(search)
    );

  const staffCount  = members.filter(m => m.role === 'petugas' && m.status === 'aktif').length;
  const dosenCount  = members.filter(m => m.role === 'dosen'   && m.status === 'aktif').length;
  const mahasiswaCount  = members.filter(m => m.role === 'mahasiswa' && m.status === 'aktif').length;
  const totalCount  = members.filter(m => m.role !== 'admin').length;

  const statCards = [
    { label: 'Petugas Aktif', value: staffCount,  color: '#7B1C1C', bg: 'rgba(123,28,28,0.07)', border: 'rgba(123,28,28,0.18)', icon: <ShieldCheck size={16} /> },
    { label: 'Dosen',         value: dosenCount,  color: '#0D1B2A', bg: 'rgba(13,27,42,0.07)',  border: 'rgba(13,27,42,0.18)',  icon: <UserCheck size={16} /> },
    { label: 'Mahasiswa', value: mahasiswaCount, color: '#065F46', bg: 'rgba(6,95,70,0.07)', border: 'rgba(6,95,70,0.18)', icon: <Users size={16} /> },
    { label: 'Total Member',  value: totalCount,  color: '#B45309', bg: 'rgba(180,83,9,0.07)',  border: 'rgba(180,83,9,0.18)',  icon: <Users size={16} /> },
  ];

  return (
    <div>
      {/* Modals */}
      {addModal && (
        <MemberModal
          onSave={async (m) => {
            const success = await addMember(m);
            if (success) setAddModal(false);
          }}
          onClose={() => setAddModal(false)}
        />
      )}
      {editMember && (
        <MemberModal
          member={editMember}
          onSave={async (m) => {
            const success = await updateMember(editMember.id, m);
            if (success) setEditMember(null);
          }}
          onClose={() => setEditMember(null)}
        />
      )}
      {detailMember && (
        <MemberDetailModal
          member={detailMember}
          onEdit={(m) => { setDetailMember(null); setEditMember(m); }}
          onClose={() => setDetailMember(null)}
        />
      )}

      {/* Page Header */}
      <div className="page-header">
        <div className="page-breadcrumb">DATA PETUGAS</div>
        <h1 className="page-title">Manajemen Petugas</h1>
        <p className="page-subtitle">Kelola data petugas (Staff) perpustakaan dan hak akses role</p>
      </div>

      {/* ── Stat Cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 24 }}>
        {statCards.map((s, i) => (
          <div key={i} style={{
            background: s.bg, border: `1px solid ${s.border}`,
            borderRadius: 14, padding: '20px 22px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            display: 'flex', alignItems: 'center', gap: 16,
          }}>
            <div style={{
              width: 40, height: 40, borderRadius: 10,
              background: s.bg, border: `1px solid ${s.border}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: s.color, flexShrink: 0,
            }}>
              {s.icon}
            </div>
            <div>
              <div style={{ fontSize: 11, color: s.color, textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600, marginBottom: 4 }}>
                {s.label}
              </div>
              <div style={{ fontSize: 28, fontWeight: 800, color: s.color, lineHeight: 1, fontFamily: "'DM Mono', monospace" }}>
                {s.value}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Table Card ── */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>

        {/* Card header */}
        <div style={{
          padding: '14px 18px', borderBottom: '1px solid #f0ebe6',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          flexWrap: 'wrap', gap: 10,
          background: 'linear-gradient(to right, #fafafa, #fff5f5)',
        }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: '#1a1a1a', display: 'flex', alignItems: 'center', gap: 8 }}>
            Daftar Petugas & Member
            <span style={{
              fontSize: 11, background: 'rgba(123,28,28,0.08)', color: '#7B1C1C',
              padding: '2px 8px', borderRadius: 20, fontWeight: 700,
              border: '1px solid rgba(123,28,28,0.15)',
            }}>{filtered.length} member</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {/* Search */}
            <div style={{ position: 'relative' }}>
              <Search size={13} style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
              <input
                className="form-control"
                style={{ paddingLeft: 30, width: 240 }}
                placeholder="Cari nama, email, NIP..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            {/* Add button */}
            <button
              className="btn btn-primary btn-sm"
              onClick={() => setAddModal(true)}
              style={{ display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}
            >
              <ShieldCheck size={13} /> Tambah Petugas
            </button>
          </div>
        </div>

        {/* Hint */}
        <div style={{
          padding: '8px 18px', background: 'rgba(123,28,28,0.03)',
          borderBottom: '1px solid #f0ebe6', fontSize: 11, color: '#9ca3af',
          display: 'flex', alignItems: 'center', gap: 5,
        }}>
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
                <tr
                  key={m.id}
                  style={{ cursor: 'pointer' }}
                  onClick={() => setDetailMember(m)}
                >
                  <td>
                    <code style={{ background: 'var(--gray-light)', padding: '2px 6px', borderRadius: 4, fontSize: 11 }}>
                      {m.custom_id || m.id}
                    </code>
                  </td>
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
                    <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {m.address || '—'}
                    </div>
                  </td>
                  <td style={{ color: 'var(--gray-text)', fontSize: 12 }}>{m.joinDate}</td>
                  <td><RoleBadge member={m} /></td>
                  <td onClick={e => e.stopPropagation()}>
                    {m.role === 'dosen' ? (
                      <button
                        className="btn btn-primary btn-sm"
                        style={{ whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 5 }}
                        onClick={async () => {
                          if (!m.email?.endsWith('@unesa.ac.id')) {
                            alert('Hanya akun dosen UNESA yang dapat dijadikan petugas');
                            return;
                          }
                          if (confirm(`Jadikan ${m.name} sebagai petugas perpustakaan?`)) {
                            await promoteToPetugas(m.id);
                          }
                        }}
                      >
                        <ShieldCheck size={12} /> Jadikan Petugas
                      </button>
                    ) : m.role === 'petugas' ? (
                      <button
                        className="btn btn-outline btn-sm"
                        style={{ whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 5, color: '#B45309', borderColor: 'rgba(180,83,9,0.3)' }}
                        onClick={async () => {
                          if (confirm(`Kembalikan role ${m.name} menjadi dosen?`)) {
                            await updateMember(m.id, { role: 'dosen' });
                          }
                        }}
                      >
                        <ShieldOff size={12} /> Cabut Role
                      </button>
                    ) : (
                      <span className="badge badge-info">Mahasiswa</span>
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