import { BookOpen, Clock, AlertCircle, Phone, Mail, MapPin, GraduationCap, Building2, User, CheckCircle, XCircle, RotateCcw, CalendarDays, Shield } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { Pencil } from 'lucide-react';
import { useApp } from '../components/AppContext';
import { useAuth } from '../components/AuthContext';
import ApiImage from '../components/ApiImage';

  const departmentData = {
      "Matematika": [
        "S1 Pendidikan Matematika",
        "S1 Matematika",
        "S2 Matematika",
        "S2 Pendidikan Matematika",
        "S3 Pendidikan Matematika"
      ],

      "Fisika": [
        "S1 Pendidikan Fisika",
        "S1 Fisika",
        "S2 Pendidikan Fisika",
        "S2 Fisika"
      ],

      "Kimia": [
        "S1 Pendidikan Kimia",
        "S1 Kimia",
        "S2 Kimia"
      ],

      "Biologi": [
        "S1 Pendidikan Biologi",
        "S1 Biologi",
        "S2 Pendidikan Biologi"
      ],

      "Pendidikan Sains": [
        "S1 Pendidikan Ilmu Pengetahuan Alam",
        "S2 Pendidikan Sains",
        "S3 Pendidikan Sains"
      ],

      "Sains Data": [
        "S1 Sains Data"
      ],

      "Sains Aktuaria": [
        "S1 Sains Aktuaria"
      ],

      "Kecerdasan Artifisial": [
        "S1 Kecerdasan Artifisial"
      ]
    };


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

function StatCard({ value, label, color, bg, icon }) {
  return (
    <div style={{
      padding: '14px 16px', background: bg, borderRadius: 12,
      textAlign: 'center', border: '1px solid rgba(0,0,0,0.05)'
    }}>
      <div style={{ color, marginBottom: 4 }}>{icon}</div>
      <div style={{ fontSize: 24, fontWeight: 800, color, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 11, color: 'var(--gray-text)', marginTop: 4 }}>{label}</div>
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
    name: '',
    nim: '',
    departemen: '',
    prodi: '',
    email: '',
    phone: '',
    address: ''
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
    String(m.nim) === String(user?.nim) ||
    m.email === user?.email
);

const profileIncomplete =
      !member?.name ||
      !member?.nim ||
      !member?.departemen ||
      !member?.prodi ||
      !member?.phone ||
      !member?.address;

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

  const myLoans = loans.filter(l => l.memberId === member.id);
  const activeLoans = myLoans.filter(l => l.status === 'dipinjam').length;
  const lateLoans = myLoans.filter(l => l.status === 'terlambat').length;
  const returnedLoans = myLoans.filter(l => l.status === 'dikembalikan').length;
  const totalDenda = myLoans.reduce((s, l) => s + Number(l.denda || 0), 0);

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
    <div>
      <div className="page-header">
        <div className="page-breadcrumb">Profil Saya</div>
        <h1 className="page-title">Profil Anggota</h1>
        <p className="page-subtitle">Informasi keanggotaan dan riwayat aktivitas perpustakaan kamu.</p>
      </div>

      {!isActive && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '12px 16px', background: '#fef2f2',
          border: '1px solid #fecaca', borderRadius: 8,
          marginBottom: 20, fontSize: 13, color: '#dc2626',
        }}>
          <AlertCircle size={16} />
          <span>Status keanggotaan kamu saat ini <strong>nonaktif</strong>. Hubungi petugas untuk mengaktifkan kembali.</span>
        </div>
      )}

      {profileIncomplete && (
        <div
          style={{
            background: '#fff7ed',
            border: '1px solid #fdba74',
            color: '#9a3412',
            padding: '14px 18px',
            borderRadius: 10,
            marginBottom: 20,
            fontSize: 14,
            fontWeight: 500
          }}
        >
          Lengkapi data diri anda pada menu profil sebelum melakukan peminjaman buku.
        </div>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: '450px 1fr', gap: 24, alignItems: 'start' }}>

        {/* ── Kartu Profil Kiri ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Hero Card */}
          <div style={{
            background: 'linear-gradient(145deg, #7B1C1C 0%, #0D1B2A 100%)',
            borderRadius: 16, padding: 28, color: 'white', textAlign: 'center',
            position: 'relative', overflow: 'hidden', minHeight: 350
          }}>
            {/* Decorative circles */}
            <div style={{
              position: 'absolute', top: -30, right: -30,
              width: 120, height: 120, borderRadius: '50%',
              background: 'rgba(255,255,255,0.05)'
            }} />
            <div style={{
              position: 'absolute', bottom: -20, left: -20,
              width: 80, height: 80, borderRadius: '50%',
              background: 'rgba(255,255,255,0.05)'
            }} />

            {/* Avatar */}
            <div style={{ position: 'relative', display: 'inline-block', marginBottom: 14 }} ref={menuRef}>
             {preview || member.photo_url ? (
  <ApiImage
    src={preview || member.photo_url}
    alt={member.name}
    style={{
      width: 130,
      height: 130,
      borderRadius: '50%',
      objectFit: 'cover',
      border: '3px solid rgba(255,255,255,0.3)',
      display: 'block'
    }}
    fallback={
      <div style={{
        width: 130,
        height: 130,
        borderRadius: '50%',
        background: 'rgba(255,255,255,0.15)',
        border: '3px solid rgba(255,255,255,0.3)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 38,
        fontWeight: 700,
        color: 'white'
      }}>
        {initials}
      </div>
    }
  />
) : (
  <div style={{
    width: 130,
    height: 130,
    borderRadius: '50%',
    background: 'rgba(255,255,255,0.15)',
    border: '3px solid rgba(255,255,255,0.3)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 38,
    fontWeight: 700,
    color: 'white'
  }}>
    {initials}
  </div>
              )}
              <div
                onClick={() => document.getElementById('upload-photo').click()}
                title="Ganti foto"
                style={{
                  position: 'absolute', bottom: 2, right: 2,
                  background: 'white', borderRadius: '50%',
                  padding: 5, boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}
              >
                <Pencil size={13} color="#7B1C1C" />
              </div>
              </div>
            
            

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
                if (!result.success) { alert('Gagal upload foto'); setPreview(null); }
              }}
            />

            <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 4, position: 'relative' }}>
              {member.name}
            </div>
            <div style={{ fontSize: 12, opacity: 0.75, marginBottom: 12, position: 'relative' }}>
              {member.prodi}
            </div>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 14,
                marginTop: 18
              }}
            >

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  gap: 8,
                  flexWrap: 'wrap'
                }}
              >

                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                  background: isActive
                    ? 'rgba(74,222,128,0.2)'
                    : 'rgba(239,68,68,0.2)',
                  color: isActive
                    ? '#86efac'
                    : '#fca5a5',
                  border: `1px solid ${
                    isActive
                      ? 'rgba(74,222,128,0.3)'
                      : 'rgba(239,68,68,0.3)'
                  }`,
                  borderRadius: 20,
                  padding: '4px 12px',
                  fontSize: 11,
                  fontWeight: 600
                }}>
                  {isActive
                    ? <CheckCircle size={12} />
                    : <XCircle size={12} />
                  }

                  {isActive
                    ? 'Anggota Aktif'
                    : 'Nonaktif'}
                </span>

                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                  background: 'rgba(255,255,255,0.12)',
                  color: 'rgba(255,255,255,0.85)',
                  borderRadius: 20,
                  padding: '4px 12px',
                  fontSize: 11,
                  fontWeight: 600,
                  textTransform: 'capitalize'
                }}>
                  <Shield size={11} />
                  {member.type || 'mahasiswa'}
                </span>

              </div>

              <button
                onClick={openEditModal}
                className="btn btn-primary"
                style={{
                  minWidth: 180,
                  fontWeight: 700,

                  background: '#ffffff',
                  color: '#7B1C1C',

                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',

                  textAlign: 'center'
                }}
              >
                {profileIncomplete
                  ? 'Lengkapi Profil'
                  : 'Edit Profil'}
              </button>

            </div>
          </div>
          </div>

        {/* ── Panel Kanan ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Info Card */}
          <div className="card" style={{ minHeight: 350 }}>
            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 14, color: 'var(--navy)' }}>
              Informasi Keanggotaan
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, alignItems: 'start' }}>
              <InfoRow icon={<GraduationCap size={14} />} label="NIM / NIP" value={member.nim} mono />
              <InfoRow icon={<Building2 size={14} />} label="Departemen" value={member.departemen} />
              <InfoRow icon={<GraduationCap size={14} />} label="Program Studi" value={member.prodi} />
              <InfoRow icon={<Mail size={14} />} label="Email" value={member.email} />

              <InfoRow
                icon={<Phone size={14} />}
                label="No. Telp"
                value={member.phone || '-'}
              />

              <InfoRow
                icon={<MapPin size={14} />}
                label="Alamat"
                value={member.address || '-'}
              />

              <InfoRow icon={<CalendarDays size={14} />} label="Bergabung Sejak" value={member.joinDate} />
            </div>
          </div>

          {myLoans.length === 0 && (
            <div className="card" style={{ textAlign: 'center', padding: 40 }}>
              <BookOpen size={40} style={{ color: 'var(--gray-text)', marginBottom: 12 }} />
              <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 6 }}>Belum Ada Riwayat Peminjaman</div>
              <div style={{ fontSize: 12, color: 'var(--gray-text)' }}>
                Kunjungi menu Buku untuk mulai meminjam koleksi perpustakaan.
              </div>
            </div>
          )}
        </div>
      </div>
      {showEditModal && (
  <div className="modal-overlay">

    <div
      className="modal"
      style={{
        maxWidth: 700,
        width: '90%'
      }}
    >

      <div className="modal-header">
        <h3 className="modal-title">
          Lengkapi Profil
        </h3>

        <button
          className="modal-close"
          onClick={() => setShowEditModal(false)}
        >
          ×
        </button>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 16
        }}
      >

        <div className="form-group">
          <label className="form-label">
            Nama Lengkap
          </label>

          <input
            className="form-control"
            value={formData.name}
            onChange={(e) =>
              setFormData({
                ...formData,
                name: e.target.value
              })
            }
          />
        </div>

        <div className="form-group">
          <label className="form-label">
            NIM / NIP
          </label>

          <input
            className="form-control"
            value={formData.nim}
            onChange={(e) =>
              setFormData({
                ...formData,
                nim: e.target.value
              })
            }
          />
        </div>

        <div className="form-group">
          <label className="form-label">
            Departemen
          </label>

          <select
            className="form-control"
            value={formData.departemen}
            onChange={(e) => {

            const selectedDepartment = e.target.value;

            setFormData(prev => ({
              ...prev,
              departemen: selectedDepartment,
              prodi: ''
            }));

          }}
          >

            <option value="">
              Pilih Departemen
            </option>

            {Object.keys(departmentData).map(dep => (

              <option
                key={dep}
                value={dep}
              >
                {dep}
              </option>

            ))}

          </select>
        </div>

        <div className="form-group">
          <label className="form-label">
            Program Studi
          </label>

          <select
            className="form-control"
            value={formData.prodi}
            onChange={(e) =>
              setFormData({
                ...formData,
                prodi: e.target.value
              })
            }
          >

            <option value="">
              Pilih Program Studi
            </option>

            {(departmentData[String(formData.departemen).trim()] || []).map(prodi => (

              <option
                key={prodi}
                value={prodi}
              >
                {prodi}
              </option>

            ))}

          </select>
        </div>

        <div className="form-group">
          <label className="form-label">
            No. Telp
          </label>

          <input
            className="form-control"
            value={formData.phone}
            onChange={(e) =>
              setFormData({
                ...formData,
                phone: e.target.value
              })
            }
          />
        </div>

        <div className="form-group">
          <label className="form-label">
            Alamat
          </label>

          <input
            className="form-control"
            value={formData.address}
            onChange={(e) =>
              setFormData({
                ...formData,
                address: e.target.value
              })
            }
          />
        </div>

      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: 12,
          marginTop: 24
        }}
      >

        <button
          className="btn btn-ghost"
          onClick={() => setShowEditModal(false)}
        >
          Batal
        </button>

        <button
          className="btn btn-primary"
          onClick={async () => {

          if (
            !formData.name ||
            !formData.nim ||
            !formData.departemen ||
            !formData.prodi ||
            !formData.phone ||
            !formData.address
          ) {

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

          const success =
            await updateMember(
              member.id,
              updatedMember
            );

          if (!success) {
            alert('Gagal update profil');
            return;
          }

          setShowEditModal(false);

          alert('Profil berhasil diperbarui');

        }}
        >
          Simpan
        </button>

      </div>

    </div>

  </div>
)}
    </div>
  );
}
