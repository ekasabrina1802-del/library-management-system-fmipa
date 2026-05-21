import {
  AlertCircle,
  Mail,
  MapPin,
  GraduationCap,
  Building2,
  User,
  CheckCircle,
  XCircle,
  CalendarDays,
  Shield,
  BookMarked,
  AlertTriangle,
  Phone
} from 'lucide-react';

import { useState, useRef, useEffect } from 'react';
import { Pencil } from 'lucide-react';
import { useApp } from '../components/AppContext';
import { useAuth } from '../components/AuthContext';
import ApiImage from '../components/ApiImage';

const departmentData = {
  "Matematika": ["S1 Pendidikan Matematika","S1 Matematika","S2 Matematika","S2 Pendidikan Matematika","S3 Pendidikan Matematika"],
  "Fisika": ["S1 Pendidikan Fisika","S1 Fisika","S2 Pendidikan Fisika","S2 Fisika"],
  "Kimia": ["S1 Pendidikan Kimia","S1 Kimia","S2 Kimia"],
  "Biologi": ["S1 Pendidikan Biologi","S1 Biologi","S2 Pendidikan Biologi"],
  "Pendidikan Sains": ["S1 Pendidikan Ilmu Pengetahuan Alam","S2 Pendidikan Sains","S3 Pendidikan Sains"],
  "Sains Data": ["S1 Sains Data"],
  "Sains Aktuaria": ["S1 Sains Aktuaria"],
  "Kecerdasan Artifisial": ["S1 Kecerdasan Artifisial"]
};

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800&family=DM+Sans:wght@300;400;500;600&display=swap');

  .profile-page * { box-sizing: border-box; }

  .profile-page {
    font-family: 'DM Sans', sans-serif;
    min-height: 100vh;
    background: #f0eee9;
    padding: 0;
  }

  /* ── Banner Hero ── */
  .hero-banner {
    position: relative;
    width: 100%;
    height: 200px;
    background: linear-gradient(135deg, #6b0f0f 0%, #1a0a0a 45%, #0d1b2a 100%);
    overflow: hidden;
  }
  .hero-banner::before {
    content: '';
    position: absolute;
    inset: 0;
    background:
      radial-gradient(ellipse 60% 80% at 70% 50%, rgba(180,30,30,0.25) 0%, transparent 70%),
      radial-gradient(ellipse 40% 60% at 20% 80%, rgba(13,27,42,0.8) 0%, transparent 60%);
  }
  .hero-banner-rings {
    position: absolute;
    top: -80px; right: -80px;
    width: 380px; height: 380px;
    border-radius: 50%;
    border: 1px solid rgba(255,255,255,0.06);
    box-shadow: 0 0 0 40px rgba(255,255,255,0.03), 0 0 0 80px rgba(255,255,255,0.02);
  }
  .hero-banner-dot {
    position: absolute;
    bottom: 40px; left: 60px;
    width: 6px; height: 6px;
    border-radius: 50%;
    background: rgba(255,255,255,0.3);
  }
  .hero-banner-dot2 {
    position: absolute;
    top: 50px; left: 38%;
    width: 3px; height: 3px;
    border-radius: 50%;
    background: rgba(255,160,80,0.5);
  }
  .hero-overlay {
    position: absolute;
    left: 340px;
    bottom: 42px;
    z-index: 5;
  }

  .hero-name {
    font-family: 'Playfair Display', serif;
    font-size: 48px;
    font-weight: 800;
    color: white;
    line-height: 1;
    margin-bottom: 10px;
    text-shadow: 0 4px 20px rgba(0,0,0,0.35);
  }

  .hero-prodi {
    font-size: 18px;
    color: rgba(255,255,255,0.78);
    margin-bottom: 18px;
    font-weight: 500;
    letter-spacing: 0.03em;
  }

  /* ── Layout ── */
  .profile-body {
    max-width: 1100px;
    margin: 0 auto;
    padding: 0 32px 60px;
    position: relative;
  }

  /* ── Avatar Float ── */
  .avatar-float {
    position: relative;
    margin-top: -90px;
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    z-index: 10;
    margin-bottom: 36px;
  }

  .avatar-ring {
    position: relative;
    flex-shrink: 0;
  }
  .avatar-ring::before {
    content: '';
    position: absolute;
    inset: -4px;
    border-radius: 50%;
    background: linear-gradient(135deg, #c0392b, #7B1C1C, #0d1b2a);
    z-index: -1;
  }
  .avatar-img {
    width: 190px;
    height: 190px;
    border-radius: 50%;
    object-fit: cover;
    display: block;
    border: 4px solid #f0eee9;
    background: #2a1010;
    font-size: 52px;
    font-weight: 800;
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: 'Playfair Display', serif;
  }
  .avatar-edit-btn {
    position: absolute;
    bottom: 8px; right: 8px;
    background: white;
    border-radius: 50%;
    width: 34px; height: 34px;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer;
    box-shadow: 0 2px 12px rgba(0,0,0,0.2);
    border: 2px solid #f0eee9;
    transition: transform 0.2s;
  }
  .avatar-edit-btn:hover { transform: scale(1.1); }

  .avatar-meta {
    padding-bottom: 12px;
    flex: 1;
  }
  .avatar-meta-name {
    font-family: 'Playfair Display', serif;
    font-size: 32px;
    font-weight: 800;
    color: white;
    line-height: 1.1;
    text-shadow: 0 2px 12px rgba(0,0,0,0.4);
    margin-bottom: 6px;
  }
  .avatar-meta-prodi {
    font-size: 14px;
    color: rgba(255,255,255,0.65);
    letter-spacing: 0.04em;
    margin-bottom: 14px;
  }
  .badge-row {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    align-items: center;
  }
  .badge {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    border-radius: 20px;
    padding: 4px 13px;
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.03em;
    backdrop-filter: blur(8px);
  }
  .badge-active {
    background: rgba(74,222,128,0.18);
    color: #86efac;
    border: 1px solid rgba(74,222,128,0.3);
  }
  .badge-inactive {
    background: rgba(239,68,68,0.18);
    color: #fca5a5;
    border: 1px solid rgba(239,68,68,0.3);
  }
  .badge-type {
    background: rgba(255,255,255,0.12);
    color: rgba(255,255,255,0.8);
    border: 1px solid rgba(255,255,255,0.15);
    text-transform: capitalize;
  }

  .edit-btn {
    margin-left: auto;
    padding-bottom: 12px;
    display: flex;
    align-items: flex-end;
  }
  .btn-edit-profile {
    background: white;
    color: #7B1C1C;
    border: none;
    border-radius: 10px;
    padding: 11px 28px;
    font-size: 13px;
    font-weight: 700;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 7px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.15);
    transition: all 0.2s;
    font-family: 'DM Sans', sans-serif;
    white-space: nowrap;
  }
  .btn-edit-profile:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 28px rgba(0,0,0,0.2);
  }

  /* ── Grid Layout ── */
  .content-grid {
    display: grid;
    grid-template-columns: 1fr 300px;
    gap: 24px;
    align-items: start;
  }
  .content-left { display: flex; flex-direction: column; gap: 20px; }
  .content-right { display: flex; flex-direction: column; gap: 20px; }

  /* ── Cards ── */
  .card-glass {
    background: white;
    border-radius: 16px;
    padding: 28px;
    border: 1px solid rgba(0,0,0,0.06);
    box-shadow: 0 2px 16px rgba(0,0,0,0.05);
  }
  .card-title {
    font-family: 'Playfair Display', serif;
    font-size: 16px;
    font-weight: 700;
    color: #1a0a0a;
    margin-bottom: 22px;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .card-title::after {
    content: '';
    flex: 1;
    height: 1px;
    background: linear-gradient(to right, #e0d8d8, transparent);
    margin-left: 8px;
  }

  /* ── Info Grid ── */
  .info-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
  }
  .info-item {}
  .info-item-label {
    font-size: 10px;
    color: #9b8e8e;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    margin-bottom: 3px;
    display: flex;
    align-items: center;
    gap: 5px;
  }
  .info-item-label svg { color: #7B1C1C; }
  .info-item-value {
    font-size: 14px;
    font-weight: 600;
    color: #1a0a0a;
    line-height: 1.4;
  }
  .info-item-value.mono { font-family: 'Courier New', monospace; letter-spacing: 0.02em; }

  /* ── ID Card ── */
  .id-card {
    background: linear-gradient(135deg, #7B1C1C 0%, #0d1b2a 100%);
    border-radius: 16px;
    padding: 24px;
    color: white;
    position: relative;
    overflow: hidden;
  }
  .id-card::before {
    content: 'FMIPA';
    position: absolute;
    bottom: -20px; right: -10px;
    font-family: 'Playfair Display', serif;
    font-size: 72px;
    font-weight: 800;
    color: rgba(255,255,255,0.04);
    line-height: 1;
    pointer-events: none;
  }
  .id-card-logo-row {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 20px;
  }
  .id-card-logo-circle {
    width: 36px; height: 36px;
    border-radius: 50%;
    background: rgba(255,255,255,0.12);
    display: flex; align-items: center; justify-content: center;
    font-family: 'Playfair Display', serif;
    font-size: 13px;
    font-weight: 800;
  }
  .id-card-org { font-size: 11px; opacity: 0.6; line-height: 1.3; }
  .id-card-divider { height: 1px; background: rgba(255,255,255,0.1); margin: 16px 0; }
  .id-card-row { display: flex; justify-content: space-between; margin-bottom: 10px; }
  .id-card-key { font-size: 10px; opacity: 0.5; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 3px; }
  .id-card-val { font-size: 13px; font-weight: 600; }
  .id-card-nim {
    font-family: 'Courier New', monospace;
    font-size: 18px;
    font-weight: 700;
    letter-spacing: 0.06em;
    margin: 4px 0 16px;
  }
  .id-card-strip {
    height: 4px;
    border-radius: 2px;
    background: linear-gradient(to right, rgba(255,255,255,0.4), rgba(255,255,255,0.05));
    margin-bottom: 16px;
  }

  /* ── Alert ── */
  .alert-warning {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    padding: 14px 18px;
    background: #fff7ed;
    border: 1px solid #fdba74;
    border-radius: 12px;
    margin-bottom: 20px;
    color: #9a3412;
    font-size: 13px;
    font-weight: 500;
  }
  .alert-danger {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 16px;
    background: #fef2f2;
    border: 1px solid #fecaca;
    border-radius: 12px;
    margin-bottom: 16px;
    font-size: 13px;
    color: #dc2626;
  }

  /* ── Empty State ── */
  .empty-state {
    text-align: center;
    padding: 40px;
  }
  .empty-icon {
    width: 56px; height: 56px;
    border-radius: 14px;
    background: #f5f0f0;
    display: flex; align-items: center; justify-content: center;
    margin: 0 auto 14px;
  }

  /* ── Modal ── */
  .modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.5);
    backdrop-filter: blur(4px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 20px;
  }
  .modal-box {
    background: white;
    border-radius: 20px;
    padding: 32px;
    width: 100%;
    max-width: 680px;
    box-shadow: 0 24px 80px rgba(0,0,0,0.25);
    max-height: 90vh;
    overflow-y: auto;
  }
  .modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 28px;
  }
  .modal-title {
    font-family: 'Playfair Display', serif;
    font-size: 20px;
    font-weight: 800;
    color: #1a0a0a;
  }
  .modal-close {
    width: 32px; height: 32px;
    border-radius: 50%;
    border: none;
    background: #f5f0f0;
    cursor: pointer;
    font-size: 18px;
    display: flex; align-items: center; justify-content: center;
    color: #555;
    transition: background 0.2s;
  }
  .modal-close:hover { background: #ecdede; }
  .modal-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 18px;
  }
  .form-group { display: flex; flex-direction: column; gap: 6px; }
  .form-label { font-size: 12px; font-weight: 600; color: #6b5555; text-transform: uppercase; letter-spacing: 0.05em; }
  .form-control {
    border: 1.5px solid #e5dada;
    border-radius: 10px;
    padding: 10px 14px;
    font-size: 14px;
    font-family: 'DM Sans', sans-serif;
    color: #1a0a0a;
    outline: none;
    transition: border-color 0.2s, box-shadow 0.2s;
    background: #faf8f8;
    appearance: none;
  }
  .form-control:focus {
    border-color: #7B1C1C;
    box-shadow: 0 0 0 3px rgba(123,28,28,0.1);
    background: white;
  }
  .modal-actions {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    margin-top: 28px;
    padding-top: 20px;
    border-top: 1px solid #f0e8e8;
  }
  .btn-cancel {
    padding: 10px 24px;
    border-radius: 10px;
    border: 1.5px solid #e5dada;
    background: white;
    color: #6b5555;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    font-family: 'DM Sans', sans-serif;
    transition: all 0.2s;
  }
  .btn-cancel:hover { background: #f5f0f0; }
  .btn-save {
    padding: 10px 28px;
    border-radius: 10px;
    border: none;
    background: linear-gradient(135deg, #7B1C1C, #0d1b2a);
    color: white;
    font-size: 13px;
    font-weight: 700;
    cursor: pointer;
    font-family: 'DM Sans', sans-serif;
    transition: all 0.2s;
    box-shadow: 0 4px 14px rgba(123,28,28,0.3);
  }
  .btn-save:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(123,28,28,0.35); }
`;

function InfoItem({ icon, label, value, mono }) {
  return (
    <div className="info-item">
      <div className="info-item-label">
        {icon}
        {label}
      </div>
      <div className={`info-item-value${mono ? ' mono' : ''}`}>{value || '—'}</div>
    </div>
  );
}


export default function AnggotaUserPage() {
  const { members, loans, uploadMemberPhoto, updateMember } = useApp();
  const { user } = useAuth();
  const menuRef = useRef(null);
  const [preview, setPreview] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '', nim: '', departemen: '', prodi: '', email: '', phone: '', address: ''
  });

  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {}
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const member = members.find(
    m =>
      String(m.id) === String(user?.anggotaId || user?.memberId) ||
      (user?.email && m.email?.toLowerCase() === user.email.toLowerCase())
  );

  const isDosen = member?.type === 'dosen';
  const profileIncomplete = isDosen
    ? !member?.name || !member?.departemen || !member?.prodi ||
      !member?.phone || !member?.address
    : !member?.name || !member?.nim || !member?.departemen ||
      !member?.prodi || !member?.phone || !member?.address;

  if (!member) {
    return (
      <div className="profile-page">
        <style>{styles}</style>
        <div style={{ padding: 60, textAlign: 'center' }}>
          <User size={48} style={{ color: '#9b8e8e', marginBottom: 16 }} />
          <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>Data anggota tidak ditemukan</div>
          <div style={{ fontSize: 13, color: '#9b8e8e' }}>Hubungi petugas perpustakaan untuk mendaftarkan diri sebagai anggota.</div>
        </div>
      </div>
    );
  }

  const myLoans = loans.filter(l => l.memberId === member.id);
  const initials = member.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  const isActive = member.status === 'aktif';

  const openEditModal = () => {
    setFormData({
      name: member?.name || '',
      nim: member?.nim || '',
      departemen: member?.departemen || '',
      prodi: member?.prodi || '',
      email: member?.email || '',
      phone: member?.phone || '',
      address: member?.address || ''
    });
    setShowEditModal(true);
  };

  return (
    <div className="profile-page">
      <style>{styles}</style>

      {/* ── Hero Banner ── */}
      <div className="hero-banner">
      <div className="hero-banner-rings" />
      <div className="hero-banner-dot" />
      <div className="hero-banner-dot2" />

      <div className="hero-overlay">
        <div className="hero-name">{member.name}</div>

        <div className="hero-prodi">
          {member.prodi}
        </div>

        <div className="badge-row">
          <span className={`badge ${isActive ? 'badge-active' : 'badge-inactive'}`}>
            {isActive ? <CheckCircle size={11} /> : <XCircle size={11} />}
            {isActive ? 'Anggota Aktif' : 'Nonaktif'}
          </span>

          <span className="badge badge-type">
            <Shield size={10} />
            {member.type || 'mahasiswa'}
          </span>
        </div>
      </div>
    </div>

      <div className="profile-body">

        {/* ── Alerts ── */}
        {!isActive && (
          <div className="alert-danger">
            <AlertCircle size={16} />
            <span>Status keanggotaan kamu saat ini <strong>nonaktif</strong>. Hubungi petugas untuk mengaktifkan kembali.</span>
          </div>
        )}
        {profileIncomplete && (
          <div className="alert-warning">
            <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
            <span>Lengkapi data diri anda pada menu profil sebelum melakukan peminjaman buku.</span>
          </div>
        )}

        {/* ── Avatar Float Row ── */}
        <div className="avatar-float">
          <div className="avatar-ring" ref={menuRef}>
            {preview || member.photo_url ? (
              <ApiImage
                src={preview || member.photo_url}
                alt={member.name}
                style={{ width: 190, height: 190, borderRadius: '50%', objectFit: 'cover', border: '4px solid #f0eee9', display: 'block' }}
                fallback={
                  <div className="avatar-img">{initials}</div>
                }
              />
            ) : (
              <div className="avatar-img">{initials}</div>
            )}
            <div className="avatar-edit-btn" onClick={() => document.getElementById('upload-photo').click()} title="Ganti foto">
              <Pencil size={13} color="#7B1C1C" />
            </div>
            <input id="upload-photo" type="file" accept="image/*" style={{ display: 'none' }}
              onChange={async (e) => {
                const file = e.target.files[0];
                if (!file) return;
                const url = URL.createObjectURL(file);
                setPreview(url);
                const result = await uploadMemberPhoto(member.id, file);
                if (!result.success) { alert('Gagal upload foto'); setPreview(null); }
              }}
            />
          </div>

          <div className="edit-btn">
            <button className="btn-edit-profile" onClick={openEditModal}>
              <Pencil size={13} />
              {profileIncomplete ? 'Lengkapi Profil' : 'Edit Profil'}
            </button>
          </div>
        </div>

        {/* ── Content Grid ── */}
        <div className="content-grid">
          {/* Left Column */}
          <div className="content-left">

            {/* Informasi Keanggotaan */}
            <div className="card-glass">
              <div className="card-title">
                <GraduationCap size={16} color="#7B1C1C" />
                Informasi Keanggotaan
              </div>
              <div className="info-grid">
                <InfoItem icon={<GraduationCap size={12} />} label="NIM / NIP" value={member.nim} mono />
                <InfoItem icon={<Building2 size={12} />} label="Departemen" value={member.departemen} />
                <InfoItem icon={<GraduationCap size={12} />} label="Program Studi" value={member.prodi} />
                <InfoItem icon={<Mail size={12} />} label="Email" value={member.email} />
                <InfoItem icon={<Phone size={12} />} label="No. Telp" value={member.phone || '-'} />
                <InfoItem icon={<MapPin size={12} />} label="Alamat" value={member.address || '-'} />
                <InfoItem icon={<CalendarDays size={12} />} label="Bergabung Sejak" value={member.joinDate} />
              </div>
            </div>


            {myLoans.length === 0 && (
              <div className="card-glass">
                <div className="empty-state">
                  <div className="empty-icon">
                    <BookMarked size={24} color="#9b8e8e" />
                  </div>
                  <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 6, color: '#1a0a0a' }}>Belum Ada Riwayat Peminjaman</div>
                  <div style={{ fontSize: 12, color: '#9b8e8e' }}>Kunjungi menu Buku untuk mulai meminjam koleksi perpustakaan.</div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column */}
          <div className="content-right">

            {/* ID Card Visual */}
            <div className="id-card">
              <div className="id-card-logo-row">
                <div className="id-card-logo-circle">F</div>
                <div className="id-card-org">
                  <div style={{ fontWeight: 700, fontSize: 12 }}>Perpustakaan FMIPA</div>
                  <div style={{ opacity: 0.5, fontSize: 10 }}>UNESA — Library System</div>
                </div>
              </div>
              <div className="id-card-strip" />
              <div style={{ fontSize: 10, opacity: 0.5, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Nomor Anggota</div>
              <div className="id-card-nim">{member.nim || '—'}</div>
              <div className="id-card-divider" />
              <div style={{ marginBottom: 10 }}>
                <div className="id-card-key">Nama Lengkap</div>
                <div className="id-card-val">{member.name}</div>
              </div>
              <div className="id-card-row">
                <div>
                  <div className="id-card-key">Departemen</div>
                  <div className="id-card-val" style={{ fontSize: 12 }}>{member.departemen || '—'}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className="id-card-key">Status</div>
                  <div className="id-card-val" style={{ fontSize: 12, color: isActive ? '#86efac' : '#fca5a5' }}>
                    {isActive ? 'Aktif' : 'Nonaktif'}
                  </div>
                </div>
              </div>
              <div className="id-card-divider" />
              <div style={{ fontSize: 10, opacity: 0.4, letterSpacing: '0.05em' }}>Bergabung {member.joinDate} · {member.type || 'Mahasiswa'}</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Edit Modal ── */}
      {showEditModal && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowEditModal(false); }}>
          <div className="modal-box">
            <div className="modal-header">
              <div className="modal-title">Edit Profil</div>
              <button className="modal-close" onClick={() => setShowEditModal(false)}>×</button>
            </div>
            <div className="modal-grid">
              <div className="form-group">
                <label className="form-label">Nama Lengkap</label>
                <input className="form-control" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Nama lengkap" />
              </div>
              <div className="form-group">
                <label className="form-label">NIM / NIP</label>
                <input className="form-control" value={formData.nim} onChange={(e) => setFormData({ ...formData, nim: e.target.value })} placeholder="NIM atau NIP" />
              </div>
              <div className="form-group">
                <label className="form-label">Departemen</label>
                <select className="form-control" value={formData.departemen}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, departemen: e.target.value, prodi: '' }));
                  }}>
                  <option value="">Pilih Departemen</option>
                  {Object.keys(departmentData).map(dep => (
                    <option key={dep} value={dep}>{dep}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Program Studi</label>
                <select className="form-control" value={formData.prodi} onChange={(e) => setFormData({ ...formData, prodi: e.target.value })}>
                  <option value="">Pilih Program Studi</option>
                  {(departmentData[String(formData.departemen).trim()] || []).map(prodi => (
                    <option key={prodi} value={prodi}>{prodi}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">No. Telp</label>
                <input className="form-control" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} placeholder="08xxxxxxxxxx" />
              </div>
              <div className="form-group">
                <label className="form-label">Alamat</label>
                <input className="form-control" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} placeholder="Kota, Provinsi" />
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setShowEditModal(false)}>Batal</button>
              <button className="btn-save" onClick={async () => {
                if (!formData.name || !formData.nim || !formData.departemen || !formData.prodi || !formData.phone || !formData.address) {
                  alert('Semua data wajib diisi');
                  return;
                }
                const updatedMember = {
                  id: member.id,
                  name: formData.name,
                  nim: formData.nim,
                  departemen: formData.departemen,
                  prodi: formData.prodi,
                  phone: formData.phone,
                  address: formData.address,
                  email: member.email,
                  role: member.role,
                  type: member.type,
                  status: member.status,
                  joinDate: member.joinDate,
                  photo_url: member.photo_url || ''
                };
                const success = await updateMember(member.id, updatedMember);
                if (!success) { alert('Gagal update profil'); return; }
                setShowEditModal(false);
                alert('Profil berhasil diperbarui');
              }}>
                Simpan Perubahan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}