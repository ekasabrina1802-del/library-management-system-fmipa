import { BookOpen, Clock, AlertCircle, Phone, Mail, MapPin, GraduationCap, Building2, History, User } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { Pencil } from 'lucide-react';
import { useApp } from '../components/AppContext';
import { useAuth } from '../components/AuthContext';


const API_URL = import.meta.env.VITE_API_URL;

export default function AnggotaUserPage() {
  const { members, loans, uploadMemberPhoto } = useApp();
  const { user } = useAuth();
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);
  const [preview, setPreview] = useState(null);

  useEffect(() => {
  function handleClickOutside(e) {
    if (menuRef.current && !menuRef.current.contains(e.target)) {
      setShowMenu(false);
    }
  }

  document.addEventListener('mousedown', handleClickOutside);
  return () => document.removeEventListener('mousedown', handleClickOutside);
}, []);

  // Cari data member berdasarkan user yang login
  const member = members.find(
    m => m.id === user?.memberId || 
         m.nim === user?.nim || 
         m.email === user?.email
  );

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
      <p className="page-subtitle">
        Informasi keanggotaan kamu.
      </p>
    </div>

    {/* Alert jika nonaktif */}
    {!isActive && (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '12px 16px',
          background: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: 8,
          marginBottom: 20,
          fontSize: 13,
          color: '#dc2626',
        }}
      >
        <AlertCircle size={16} />
        <span>
          Status keanggotaan kamu saat ini <strong>nonaktif</strong>.
        </span>
      </div>
    )}

    {/* Layout utama */}
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          width: 420,
          background: 'white',
          borderRadius: 16,
          padding: 24,
          boxShadow: '0 8px 24px rgba(0,0,0,0.06)',
        }}
      >

        {/* Avatar + Nama */}
        <div style={{ position: 'relative', display: 'inline-block' }} ref={menuRef}>
          {preview || member.photo_url ? (
            <img
              src={preview ? preview : `${API_URL}${member.photo_url}`}
              alt={member.name}
              style={{
                width: 100,
                height: 100,
                borderRadius: '50%',
                objectFit: 'cover',
                display: 'block',
              }}
            />
          ) : (
            <div
              style={{
                width: 100,
                height: 100,
                borderRadius: '50%',
                background: 'var(--maroon)',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 30,
                fontWeight: 700,
              }}
            >
              {initials}
            </div>
          )}

          {/* ✏️ Tombol edit */}
          <div
            onClick={() => document.getElementById('upload-photo').click()}
            style={{
              position: 'absolute',
              bottom: 0,
              right: 0,
              background: 'white',
              borderRadius: '50%',
              padding: 6,
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
              cursor: 'pointer',
            }}
          >
            <Pencil size={16} />
          </div>
        </div>

          {/* Dropdown */}
          {showMenu && (
            <div
              style={{
                position: 'absolute',
                marginTop: 8,
                background: 'white',
                borderRadius: 10,
                boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                padding: 8,
              }}
            >
              <div
                style={{
                  padding: '10px 12px',
                  fontSize: 13,
                  cursor: 'pointer',
                }}
                onClick={() => {
                  setShowMenu(false);
                  document.getElementById('upload-photo').click();
                }}
              >
                Change Photo
              </div>
            </div>
          )}

          <div style={{ fontSize: 18, fontWeight: 700 }}>
            {member.name}
          </div>
          <div style={{ fontSize: 13, color: 'var(--gray-text)' }}>
            {member.prodi}
          </div>

          <div style={{ marginTop: 8 }}>
            <span className={`badge ${isActive ? 'badge-success' : 'badge-danger'}`}>
              {member.status}
            </span>
          </div>
        </div>

        {/* Upload hidden */}
        <input
          id="upload-photo"
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
         onChange={async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const url = URL.createObjectURL(file);
  setPreview(url);

  const result = await uploadMemberPhoto(member.id, file);

  if (!result.success) {
    alert('Gagal upload foto');
    setPreview(null);
  }
}}
        />

        {/* Info Detail */}
        <div className="card">
          <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 14 }}>
            Informasi Keanggotaan
          </div>

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
    </div>
);

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
}}