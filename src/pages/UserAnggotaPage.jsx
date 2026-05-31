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
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&display=swap');

  html,
  body,
  #root {
    overflow-x: hidden;
  }

  .profile-page * {
    box-sizing: border-box;
  }

  .profile-page {
    font-family: 'DM Sans', sans-serif;
    min-height: 100vh;
    background: #f0eee9;
    padding: 0;
  }

  /* ── Banner Hero — avatar + teks semuanya di DALAM banner ── */
  .hero-banner {
    position: relative;
    width: 100%;
    height: 200px;
    background: linear-gradient(135deg, #6b0f0f 0%, #1a0a0a 45%, #0d1b2a 100%);
    overflow: visible; 
  }
  .hero-banner::before {
    content: '';
    position: absolute;
    inset: 0;
    overflow: hidden;
    background:
      radial-gradient(ellipse 60% 80% at 70% 50%, rgba(180,30,30,0.25) 0%, transparent 70%),
      radial-gradient(ellipse 40% 60% at 20% 80%, rgba(13,27,42,0.8) 0%, transparent 60%);
  }
  .hero-banner-rings {
    position: absolute;
    top: -80px; right: -80px;
    width: 380px;
    height: 380px;
    border-radius: 50%;
    border: 1px solid rgba(255,255,255,0.06);
    box-shadow: 0 0 0 40px rgba(255,255,255,0.03), 0 0 0 80px rgba(255,255,255,0.02);
    overflow: hidden;
  }
  .hero-banner-dot {
    position: absolute;
    bottom: 40px; left: 180px;
    width: 5px; height: 5px;
    border-radius: 50%;
    background: rgba(255,255,255,0.25);
  }
  .hero-banner-dot2 {
    position: absolute;
    top: 40px; right: 30%;
    width: 3px; height: 3px;
    border-radius: 50%;
    background: rgba(255,160,80,0.5);
  }

  /* 
    Row di dalam banner: avatar kiri + teks kanan
    Avatar sengaja dibuat kecil (80px) dan absolute di pojok kiri bawah
    Teks mulai dari kiri + 100px (lebar avatar 80 + gap 20)
  */
  .hero-content {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    padding: 0 20px 40px 25px;
    display: flex;
    align-items: flex-end;
    gap: 16px;
    z-index: 5;
  }

  /* Avatar menonjol ke bawah setengah ukurannya (80/2=40) */
  .avatar-wrapper {
    position: relative;
    flex-shrink: 0;
    width: 80px;
    height: 80px;
    margin-bottom: -75px;
  }
  .avatar-wrapper::before {
    content: '';
    position: absolute;
    inset: -4px;
    border-radius: 50%;
    background: linear-gradient(
      135deg,
      #c0392b 0%,
      #7B1C1C 45%,
      #0d1b2a 100%
    );

    box-shadow:
      0 8px 24px rgba(0,0,0,0.18),
      0 2px 8px rgba(123,28,28,0.2);

    z-index: 0;
  }
  .avatar-img-el {
    position: relative;
    z-index: 1;
    width: 80px;
    height: 80px;
    border-radius: 50%;
    object-fit: cover;
    border: 4px solid #f8f6f2;
    background: #2a1010;
    font-size: 26px;
    font-weight: 800;
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: 'Playfair Display', serif;
  }
  .avatar-edit-btn {
    position: absolute;
    bottom: 2px; right: 2px;
    z-index: 2;
    background: white;
    border-radius: 50%;
    width: 24px; height: 24px;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer;
    box-shadow: 0 2px 8px rgba(0,0,0,0.25);
    border: 2px solid #f0eee9;
    transition: transform 0.2s;
  }
  .avatar-edit-btn:hover { transform: scale(1.1); }

  /* Teks nama & info di sebelah kanan avatar, di dalam banner */
  .hero-text {
    flex: 1;
    min-width: 0;
    color: white;
    padding-bottom: 4px;
    margin-left: 12px;
  }
  .hero-name {
    font-family: 'Playfair Display', serif;
    font-size: clamp(20px, 3vw, 38px);
    font-weight: 800;
    color: white;
    line-height: 1.1;
    margin-bottom: 4px;
    text-shadow: 0 3px 16px rgba(0,0,0,0.4);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .hero-prodi {
    font-family: 'DM Sans', sans-serif;
    font-size: 13px;
    color: rgba(255,255,255,0.72);
    margin-bottom: 10px;
    font-weight: 500;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .badge-row {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
    align-items: center;
  }
  .badge {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    border-radius: 20px;
    padding: 3px 10px;
    font-size: 11px;
    font-weight: 600;
    font-family: 'DM Sans', sans-serif;
    letter-spacing: 0.02em;
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
    color: rgba(255,255,255,0.85);
    border: 1px solid rgba(255,255,255,0.2);
    text-transform: capitalize;
  }

  /* ── Body ── */
  .profile-body {
    max-width: 1100px;
    margin: 0 auto;
    padding: 0 20px 60px;
    position: relative;
  }
  .after-banner-row {
    display: flex;
    justify-content: flex-end;
    align-items: flex-start;
    padding-top: 20px;
    margin-bottom: 20px;
  }
  .btn-edit-profile {
    background: white;
    color: #7B1C1C;
    border: 1.5px solid rgba(123,28,28,0.15);
    border-radius: 10px;
    padding: 9px 22px;
    font-size: 13px;
    font-weight: 700;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 7px;
    box-shadow: 0 2px 12px rgba(0,0,0,0.08);
    transition: all 0.2s;
    font-family: 'DM Sans', sans-serif;
    white-space: nowrap;
  }
  .btn-edit-profile:hover {
    transform: translateY(-1px);
    box-shadow: 0 6px 20px rgba(0,0,0,0.12);
  }

  /* ── Content Grid ── */
  .content-grid {
    display: flex;
    flex-direction: column;
    gap: 24px;
  }
  .content-left { display: flex; flex-direction: column; gap: 20px; }
  .content-right { display: flex; flex-direction: column; gap: 20px; }

  /* ── Info Grid ── */
  .info-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px 28px;
  }

  /* ── Info Item — semua DM Sans, tidak ada Courier ── */
  .info-item {
    display: flex;
    flex-direction: column;
    gap: 3px;
  }
  .info-item-label {
    font-family: 'DM Sans', sans-serif;
    font-size: 10px;
    font-weight: 600;
    color: #a09898;
    text-transform: uppercase;
    letter-spacing: 0.07em;
    display: flex;
    align-items: center;
    gap: 5px;
  }
  .info-item-label svg { color: #7B1C1C; flex-shrink: 0; }
  .info-item-value {
    font-family: 'DM Sans', sans-serif;
    font-size: 14px;
    font-weight: 700;
    color: #1a0a0a;
    line-height: 1.4;
    word-break: break-word;
  }

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

  /* ── Alerts ── */
  .alert-warning {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    padding: 13px 16px;
    background: #fff7ed;
    border: 1px solid #fdba74;
    border-radius: 12px;
    margin-bottom: 12px;
    color: #9a3412;
    font-size: 13px;
    font-weight: 500;
    font-family: 'DM Sans', sans-serif;
  }
  .alert-danger {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 16px;
    background: #fef2f2;
    border: 1px solid #fecaca;
    border-radius: 12px;
    margin-bottom: 10px;
    font-size: 13px;
    color: #dc2626;
    font-family: 'DM Sans', sans-serif;
  }

  /* ── Alert Obligation (tanggungan) ── */
  .alert-obligation {
    display: flex;
    align-items: flex-start;
    gap: 14px;
    padding: 16px 18px;
    background: linear-gradient(135deg, #fef2f2 0%, #fff5f5 100%);
    border: 1px solid #fca5a5;
    border-left: 4px solid #dc2626;
    border-radius: 14px;
    margin-bottom: 16px;
    font-family: 'DM Sans', sans-serif;
    box-shadow: 0 2px 12px rgba(220,38,38,0.08);
  }
  .alert-obligation-icon {
    width: 36px;
    height: 36px;
    border-radius: 10px;
    background: rgba(220,38,38,0.1);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    margin-top: 1px;
  }
  .alert-obligation-body {
    flex: 1;
    min-width: 0;
  }
  .alert-obligation-title {
    font-size: 13px;
    font-weight: 700;
    color: #dc2626;
    margin-bottom: 3px;
  }
  .alert-obligation-desc {
    font-size: 12px;
    color: #9a3412;
    line-height: 1.5;
    opacity: 0.85;
  }
    
  /* ── Empty State ── */
  .empty-state {
    text-align: center;
    padding: 36px 20px;
  }
  .empty-icon {
    width: 52px; height: 52px;
    border-radius: 14px;
    background: #f5f0f0;
    display: flex; align-items: center; justify-content: center;
    margin: 0 auto 14px;
  }

  /* ── ID Card ── */
  .id-card {
    background: linear-gradient(135deg, #7B1C1C 0%, #0d1b2a 100%);
    border-radius: 16px;
    padding: 24px;
    color: white;
    position: relative;
    overflow: hidden;
    font-family: 'DM Sans', sans-serif;
  }
  .id-card-logo-row {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 18px;
  }
  .id-card-logo-circle {
    width: 34px; height: 34px;
    border-radius: 50%;
    background: rgba(255,255,255,0.12);
    display: flex; align-items: center; justify-content: center;
    font-family: 'Playfair Display', serif;
    font-size: 13px;
    font-weight: 800;
  }
  .id-card-org {
    font-family: 'DM Sans', sans-serif;
    font-size: 11px;
    opacity: 0.6;
    line-height: 1.3;
  }
  .id-card-divider { height: 1px; background: rgba(255,255,255,0.1); margin: 14px 0; }
  .id-card-row { display: flex; justify-content: space-between; margin-bottom: 10px; }
  .id-card-key {
    font-family: 'DM Sans', sans-serif;
    font-size: 10px;
    opacity: 0.5;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    margin-bottom: 3px;
  }
  .id-card-val {
    font-family: 'DM Sans', sans-serif;
    font-size: 13px;
    font-weight: 700;
  }
  .id-card-nim {
    font-family: 'DM Sans', sans-serif;
    font-size: 17px;
    font-weight: 800;
    letter-spacing: 0.04em;
    margin: 4px 0 16px;
  }
  .id-card-strip {
    height: 4px;
    border-radius: 2px;
    background: linear-gradient(to right, rgba(255,255,255,0.4), rgba(255,255,255,0.05));
    margin-bottom: 16px;
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
    font-family: 'DM Sans', sans-serif;
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
  .form-label {
    font-family: 'DM Sans', sans-serif;
    font-size: 11px;
    font-weight: 600;
    color: #6b5555;
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }
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

  /* ── RESPONSIVE ── */
  @media (max-width: 900px) {
    .content-grid { grid-template-columns: 1fr; }
  }

  @media (max-width: 600px) {
    .hero-banner { height: 170px; }
    .hero-content { padding: 0 14px 34px 28px; gap: 20px; }
    .avatar-wrapper { width: 80px; height: 80px; margin-bottom: -60px; }
    .avatar-img-el { width: 80px !important; height: 80px !important; font-size: 22px !important; }
    .hero-name { font-size: clamp(17px, 5vw, 24px); }
    .hero-prodi { font-size: 11px; margin-bottom: 8px; }
    .after-banner-row { padding-top: 20px; }
    .info-grid { grid-template-columns: 1fr 1fr; gap: 16px; }
    .card-glass { padding: 18px; }
    .profile-body { padding: 0 14px 40px; }
  }

  @media (max-width: 420px) {
    .hero-banner { height: 155px; }
    .hero-content { padding: 0 12px 30px 12px; gap: 10px; }
    .avatar-wrapper { width: 60px; height: 60px; margin-bottom: -30px; }
    .avatar-img-el { width: 60px !important; height: 60px !important; font-size: 18px !important; }
    .hero-name { font-size: 16px; }
    .hero-prodi { display: none; }
    .after-banner-row { padding-top: 38px; }
    .info-grid { grid-template-columns: 1fr; }
    .modal-box { padding: 18px; border-radius: 14px; }
    .modal-grid { grid-template-columns: 1fr; gap: 12px; }
    .modal-actions { flex-direction: column-reverse; gap: 8px; }
    .btn-cancel, .btn-save { width: 100%; justify-content: center; }
  }
`;

function InfoItem({ icon, label, value }) {
  return (
    <div className="info-item">
      <div className="info-item-label">
        {icon}
        {label}
      </div>
      <div className="info-item-value">{value || '—'}</div>
    </div>
  );
}

export default function AnggotaUserPage() {
  const { members, loans, uploadMemberPhoto, updateMember } = useApp();
  const { user } = useAuth();
  const avatarRef = useRef(null);
  const [preview, setPreview] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '', nim: '', departemen: '', prodi: '', email: '', phone: '', address: ''
  });

  const clean = (v) => String(v || '').trim().toLowerCase();

const member = members.find(
  m =>
    String(m.id) === String(user?.anggotaId || user?.memberId) ||
    clean(m.email) === clean(user?.email) ||
    clean(m.nim) === clean(user?.nim)
);

  const isDosen = member?.type === 'dosen';
  const profileIncomplete = isDosen
    ? !member?.name || !member?.departemen || !member?.prodi || !member?.phone || !member?.address
    : !member?.name || !member?.nim || !member?.departemen || !member?.prodi || !member?.phone || !member?.address;

if (!members.length) {
  return (
    <div className="profile-page">
      <style>{styles}</style>
      <div style={{ padding: 60, textAlign: 'center' }}>
        <User size={48} style={{ color: '#9b8e8e', marginBottom: 16 }} />
        <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8, fontFamily: "'DM Sans', sans-serif" }}>
          Memuat data anggota...
        </div>
      </div>
    </div>
  );
}

  if (!member) {
    return (
      <div className="profile-page">
        <style>{styles}</style>
        <div style={{ padding: 60, textAlign: 'center' }}>
          <User size={48} style={{ color: '#9b8e8e', marginBottom: 16 }} />
          <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8, fontFamily: "'DM Sans', sans-serif" }}>
            Data anggota tidak ditemukan
          </div>
          <div style={{ fontSize: 13, color: '#9b8e8e', fontFamily: "'DM Sans', sans-serif" }}>
            Hubungi petugas perpustakaan untuk mendaftarkan diri sebagai anggota.
          </div>
        </div>
      </div>
    );
  }

  const myLoans = loans.filter(l => l.memberId === member.id);
  const hasActiveLoan = myLoans.some(
    l => l.status === 'dipinjam' || l.status === 'terlambat'
  );
  const hasUnpaidFine = myLoans.some(
    l => l.fine && l.fine > 0 && !l.finePaid
  );
  const hasObligation = hasActiveLoan || hasUnpaidFine;
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

      {/* ── Hero Banner — avatar + teks di dalam banner ── */}
      <div className="hero-banner">
        <div className="hero-banner-rings" />
        <div className="hero-banner-dot" />
        <div className="hero-banner-dot2" />

        <div className="hero-content">
          {/* Avatar kecil di kiri, menonjol sedikit ke bawah */}
          <div className="avatar-wrapper" ref={avatarRef}>
            {preview || member.photo_url ? (
              <ApiImage
                src={preview || member.photo_url}
                alt={member.name}
                style={{
                  position: 'relative', zIndex: 1,
                  width: '80px', height: '80px',
                  borderRadius: '50%', objectFit: 'cover',
                  border: '3px solid #f0eee9', display: 'block'
                }}
                fallback={<div className="avatar-img-el">{initials}</div>}
              />
            ) : (
              <div className="avatar-img-el">{initials}</div>
            )}
            <div
              className="avatar-edit-btn"
              onClick={() => document.getElementById('upload-photo').click()}
              title="Ganti foto"
            >
              <Pencil size={10} color="#7B1C1C" />
            </div>
            <input
              id="upload-photo"
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={async (e) => {
                const file = e.target.files[0];
                if (!file) return;
                setPreview(URL.createObjectURL(file));
                const result = await uploadMemberPhoto(member.id, file);
                if (!result.success) { alert('Gagal upload foto'); setPreview(null); }
              }}
            />
          </div>

          {/* Teks nama + prodi + badge di sebelah kanan avatar */}
          <div className="hero-text">
            <div className="hero-name">{member.name}</div>
            <div className="hero-prodi">{member.prodi}</div>
            <div className="badge-row">
              <span className={`badge ${isActive ? 'badge-active' : 'badge-inactive'}`}>
                {isActive ? <CheckCircle size={10} /> : <XCircle size={10} />}
                {isActive ? 'Anggota Aktif' : 'Nonaktif'}
              </span>
              <span className="badge badge-type">
                <Shield size={9} />
                {member.type || 'mahasiswa'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="profile-body">

        {/* Row setelah banner: ruang untuk avatar yang menonjol + tombol edit di kanan */}
        <div className="after-banner-row">
          <button
            className="btn-edit-profile"
            onClick={() => { if (!hasObligation) openEditModal(); }}
            disabled={hasObligation}
            title={hasObligation ? 'Selesaikan tanggungan pinjaman/denda anda terlebih dahulu untuk bisa edit profil' : ''}
            style={hasObligation ? { opacity: 0.45, cursor: 'not-allowed', pointerEvents: 'auto' } : {}}
          >
            <Pencil size={13} />
            {hasObligation ? 'Ada Tanggungan' : profileIncomplete ? 'lengkapi Profil' : 'Edit Profil'}
          </button>
        </div>

        {/* ── Alerts ── */}
        {!isActive && (
          <div className="alert-danger" style={{ marginBottom: 16 }}>
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>Status keanggotaan kamu saat ini <strong>nonaktif</strong>. Hubungi petugas untuk mengaktifkan kembali.</span>
          </div>
        )}
        {profileIncomplete && (
          <div className="alert-warning" style={{ marginBottom: 16 }}>
            <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
            <span>Lengkapi data diri anda sebelum melakukan peminjaman buku.</span>
          </div>
        )}

        {hasObligation && (
          <div className="alert-obligation">
            <div className="alert-obligation-icon">
              <AlertCircle size={18} color="#dc2626" />
            </div>
            <div className="alert-obligation-body">
              <div className="alert-obligation-title">Profil kamu terkunci!  Ada Tanggungan Aktif</div>
              <div className="alert-obligation-desc">
                {hasActiveLoan && hasUnpaidFine
                  ? 'Kamu memiliki buku yang belum dikembalikan dan denda yang belum dibayar.'
                  : hasActiveLoan
                  ? 'Kamu memiliki buku yang belum dikembalikan.'
                  : 'Kamu memiliki denda yang belum dibayar.'}
                {' '}Selesaikan tanggungan terlebih dahulu untuk dapat mengedit profil.
              </div>
            </div>
          </div>
        )}

        {/* ── Content Grid ── */}
        <div className="content-grid">

          {/* Left Column */}
          <div className="content-left">
            <div className="card-glass">
              <div className="card-title">
                <GraduationCap size={16} color="#7B1C1C" />
                Informasi Keanggotaan
              </div>
              <div className="info-grid">
                <InfoItem icon={<GraduationCap size={12} />} label="NIM / NIP"        value={member.nim} />
                <InfoItem icon={<Building2     size={12} />} label="Departemen"       value={member.departemen} />
                <InfoItem icon={<GraduationCap size={12} />} label="Program Studi"    value={member.prodi} />
                <InfoItem icon={<Mail          size={12} />} label="Email"            value={member.email} />
                <InfoItem icon={<Phone         size={12} />} label="No. Telp"         value={member.phone || '-'} />
                <InfoItem icon={<MapPin        size={12} />} label="Alamat"           value={member.address || '-'} />
                <InfoItem icon={<CalendarDays  size={12} />} label="Bergabung Sejak"  value={member.joinDate} />
              </div>
            </div>

            {myLoans.length === 0 && (
              <div className="card-glass">
                <div className="empty-state">
                  <div className="empty-icon">
                    <BookMarked size={24} color="#9b8e8e" />
                  </div>
                  <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 6, color: '#1a0a0a', fontFamily: "'DM Sans', sans-serif" }}>
                    Belum Ada Riwayat Peminjaman
                  </div>
                  <div style={{ fontSize: 12, color: '#9b8e8e', fontFamily: "'DM Sans', sans-serif" }}>
                    Kunjungi menu Buku untuk mulai meminjam koleksi perpustakaan.
                  </div>
                </div>
              </div>
            )}
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
                <input className="form-control" value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Nama lengkap" />
              </div>
              <div className="form-group">
                <label className="form-label">NIM / NIP</label>
                <input className="form-control" value={formData.nim}
                  onChange={(e) => setFormData({ ...formData, nim: e.target.value })} placeholder="NIM atau NIP" />
              </div>
              <div className="form-group">
                <label className="form-label">Departemen</label>
                <select className="form-control" value={formData.departemen}
                  onChange={(e) => setFormData(prev => ({ ...prev, departemen: e.target.value, prodi: '' }))}>
                  <option value="">Pilih Departemen</option>
                  {Object.keys(departmentData).map(dep => (
                    <option key={dep} value={dep}>{dep}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Program Studi</label>
                <select className="form-control" value={formData.prodi}
                  onChange={(e) => setFormData({ ...formData, prodi: e.target.value })}>
                  <option value="">Pilih Program Studi</option>
                  {(departmentData[String(formData.departemen).trim()] || []).map(prodi => (
                    <option key={prodi} value={prodi}>{prodi}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">No. Telp</label>
                <input className="form-control" value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })} placeholder="08xxxxxxxxxx" />
              </div>
              <div className="form-group">
                <label className="form-label">Alamat</label>
                <input className="form-control" value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })} placeholder="Kota, Provinsi" />
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setShowEditModal(false)}>Batal</button>
              <button className="btn-save" onClick={async () => {
                if (!formData.name || !formData.nim || !formData.departemen || !formData.prodi || !formData.phone || !formData.address) {
                  alert('Semua data wajib diisi'); return;
                }
                const success = await updateMember(member.id, {
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
                });
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
    </div>
  );
}