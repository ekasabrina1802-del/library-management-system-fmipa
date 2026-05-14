import { useState } from 'react';
import { X, Check, Search, BookOpen } from 'lucide-react';
import { useApp } from '../components/AppContext';
import { useAuth } from '../components/AuthContext';
import ApiImage from '../components/ApiImage';


function MemberModal({ member = null, onSave, onClose }) {
  const [form, setForm] = useState({
  name: member?.name || '',
  nim: member?.nim || '',
  type: member?.type || 'staff',
  email: member?.email || '',
  phone: member?.phone || '',
  address: member?.address || '',
  password: '',


  photo: null
  });
  const f = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));


  const handleSubmit = (e) => {
  e.preventDefault();


  const formData = new FormData();


  Object.entries(form).forEach(([key, value]) => {
    if (value !== null && value !== '') {
      formData.append(key, value);
    }
  });

  onSave(formData);
};


  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h3 className="modal-title">Edit Data Petugas </h3>
          <button className="modal-close" onClick={onClose}><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit}>
        <div className="grid-2">
          <div className="form-group full-width">
            <label className="form-label">Nama Lengkap *</label>
            <input
              className="form-control"
              value={form.name}
              onChange={f('name')}
              required
            />
          </div>
        </div>
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


          {!member && (
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
            <input className="form-control" type="email" value={form.email} onChange={f('email')}  required />
          </div>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">No. Telp</label>
              <input className="form-control" value={form.phone} onChange={f('phone')}  required />
            </div>
            <div className="form-group">
              <label className="form-label">Alamat</label>
              <input className="form-control" value={form.address} onChange={f('address')}  required />
            </div>
           
            <div className="form-group full-width">
            <label className="form-label">Foto Profil</label>


            <input
              type="file"
              accept="image/*"
              className="form-control"
              onChange={(e) =>
                setForm(p => ({
                  ...p,
                  photo: e.target.files[0]
                }))
              }
            />
          </div>
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-ghost" onClick={onClose}>Batal</button>
            <button type="submit" className="btn btn-primary"><Check size={14} /> Simpan Perubahan</button>
          </div>
        </form>
      </div>
    </div>
  );
}


function MemberDetailModal({ member, loans, onClose, onEdit }) {
  const memberLoans = loans.filter(l => l.memberId === member.id);
  const initials = member.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  const activeLoan = memberLoans.filter(l => l.status === 'dipinjam' || l.status === 'terlambat').length;


  return (
    <div className="modal-overlay">
      <div className="modal" style={{ maxWidth: 760 }}>
        <div className="modal-header">
          <h3 className="modal-title">Profil Petugas</h3>
          <button className="modal-close" onClick={onClose}><X size={20} /></button>
        </div>


        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '120px 1fr',
            gap: 24,
            marginBottom: 24,
            alignItems: 'start'
          }}
        >
         {member.photo_url ? (
  <ApiImage
    src={member.photo_url}
    alt={member.name}
    style={{
      width: 120,
      height: 120,
      borderRadius: '50%',
      objectFit: 'cover'
    }}
    fallback={
      <div
        style={{
          width: 120,
          height: 120,
          borderRadius: '50%',
          background: 'var(--maroon)',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 42,
          fontWeight: 700
        }}
      >
        {initials}
      </div>
    }
  />
) : (
  <div
    style={{
      width: 120,
      height: 120,
      borderRadius: '50%',
      background: 'var(--maroon)',
      color: 'white',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: 42,
      fontWeight: 700
    }}
  >
    {initials}
  </div>
)}
          <div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: 20
              }}
            >
              <div>
                <div style={{ fontSize: 28, fontWeight: 700 }}>
                  {member.name}
                </div>


                <div style={{ color: 'var(--gray-text)' }}>
                  Staff Perpustakaan FMIPA
                </div>
              </div>


              <button
                className="btn btn-outline btn-sm"
                onClick={() => onEdit(member)}
              >
                Edit Data
              </button>
            </div>


            <div className="grid-2">


              <div className="card">
                <div className="text-sm text-muted">ID</div>
                <div className="fw-600">{member.id}</div>
              </div>


              <div className="card">
                <div className="text-sm text-muted">Tipe Anggota</div>
                <div className="fw-600">{member.type}</div>
              </div>


              <div className="card">
                <div className="text-sm text-muted">Email</div>
                <div className="fw-600">{member.email}</div>
              </div>


              <div className="card">
                <div className="text-sm text-muted">Tgl Bergabung</div>
                <div className="fw-600">{member.joinDate}</div>
              </div>


              <div className="card">
                <div className="text-sm text-muted">No. Telp</div>
                <div className="fw-600">{member.phone}</div>
              </div>


              <div className="card">
                <div className="text-sm text-muted">Alamat</div>
                <div className="fw-600">{member.address}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


export default function AnggotaPage() {
const { members, loans, updateMember, promoteToPetugas, addMember } = useApp();
  const [search, setSearch] = useState('');
  const [addModal, setAddModal] = useState(false);
  const [detailMember, setDetailMember] = useState(null);
  const [editMember, setEditMember] = useState(null);


const filtered = members.filter(m =>
  m.role !== 'admin' &&
  m.email?.endsWith("@unesa.ac.id") &&
  (
    !search ||
    m.name?.toLowerCase().includes(search.toLowerCase()) ||
    m.email?.toLowerCase().includes(search.toLowerCase())
  )
);

 const staff = members.filter(m => m.role === 'petugas' && m.status === 'aktif').length;


  return (
    <div>
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
          loans={loans}
          onEdit={(m) => {
            setDetailMember(null);
            setEditMember(m);
          }}
          onClose={() => setDetailMember(null)}
        />
      )}
      

      <div className="page-header">
        <div className="page-breadcrumb">Data Petugas</div>
        <h1 className="page-title">Manajemen Petugas</h1>
        <p className="page-subtitle">Kelola data petugas (Staff) perpustakaan</p>
      </div>


      <div className="grid-3 mb-24">
        <div className="stat-card">
          <div className="stat-icon green"><BookOpen size={18} /></div>
          <div>
            <div className="stat-value">{staff}</div>
            <div className="stat-label">Staff Aktif</div>
          </div>
        </div>
      </div>


      <div className="card">
        <div className="flex-between mb-16" style={{ flexWrap: 'wrap', gap: 10 }}>
          <div style={{ position: 'relative' }}>
            <Search size={13} style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-text)' }} />
            <input className="form-control" style={{ paddingLeft: 30, width: 260 }} placeholder="Cari nama atau email..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Nama</th>
                <th>No. Telp</th>
                <th>Alamat</th>
                <th>Tgl Bergabung</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(m => (
                <tr key={m.id} style={{ cursor: 'pointer' }} onClick={() => setDetailMember(m)}>

  <td>
    <code style={{ background: 'var(--gray-light)', padding: '2px 6px', borderRadius: 4, fontSize: 11 }}>{m.custom_id || m.id}</code></td>
  <td>

    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
     {m.photo_url ? (
  <ApiImage
    src={m.photo_url}
    alt={m.name}
    style={{
      width: 32,
      height: 32,
      borderRadius: '50%',
      objectFit: 'cover',
      flexShrink: 0
    }}
    fallback={
      <div style={{
        width: 32,
        height: 32,
        borderRadius: '50%',
        background: 'var(--maroon)',
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 11,
        fontWeight: 700,
        flexShrink: 0
      }}>
        {m.name.split(' ').map(w => w[0]).slice(0, 2).join('')}
      </div>
    }
  />
) : (
  <div style={{
    width: 32,
    height: 32,
    borderRadius: '50%',
    background: 'var(--maroon)',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 11,
    fontWeight: 700,
    flexShrink: 0
  }}>
    {m.name.split(' ').map(w => w[0]).slice(0, 2).join('')}
  </div>
)}
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 13 }}>{m.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--gray-text)' }}>{m.email}</div>
                      </div>
                    </div>
                  </td>
                 
                  <td style={{ color: 'var(--gray-text)' }}>
                    {m.phone}
                  </td>


                  <td style={{ color: 'var(--gray-text)' }}>
                    {m.address}
                  </td>


                  <td style={{ color: 'var(--gray-text)' }}>
                    {m.joinDate}
                  </td>

                  <td>
  {m.role !== 'petugas' ? (
    <button
      className="btn btn-primary btn-sm"
      onClick={async (e) => {
        e.stopPropagation();

        if (!m.email?.endsWith("@unesa.ac.id")) {
          alert("Hanya email @unesa.ac.id yang bisa menjadi petugas");
          return;
        }

        await promoteToPetugas(m.id);
      }}
    >
      Jadikan Petugas
    </button>
  ) : (
    <span className="badge badge-warning">Petugas</span>
  )}
</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ marginTop: 12, fontSize: 12, color: 'var(--gray-text)' }}>
          {filtered.length} Staff ditampilkan · Klik baris untuk melihat detail
        </div>
      </div>
    </div>
  );
}

