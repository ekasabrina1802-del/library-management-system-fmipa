import { useState } from 'react';
import { Plus, X, Check, Search, Printer, BookOpen, History, Trash2 } from 'lucide-react';
import { useApp } from '../components/AppContext';
import { useAuth } from '../components/AuthContext';

const API_URL = import.meta.env.VITE_API_URL;

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

function MemberModal({ member = null, onSave, onClose }) {
  const [form, setForm] = useState({

    name: member?.name || '',
    nim: member?.nim || '',
    departemen: member?.departemen || '',
    prodi: member?.prodi || '',
    type: member?.type || 'mahasiswa',
    email: member?.email || '',
    phone: member?.phone || '',
    address: member?.address || ''

  });
  const f = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));

  const handleSubmit = (e) => {
  e.preventDefault();
  onSave(form);
};
 
  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h3 className="modal-title">Tambah Anggota Baru</h3>
          <button className="modal-close" onClick={onClose}><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Nama Lengkap *</label>
              <input className="form-control" value={form.name} onChange={f('name')} required />
            </div>
            <div className="form-group">
              <label className="form-label">NIM / NIP *</label>
              <input className="form-control" value={form.nim} onChange={f('nim')} required />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Tipe Anggota</label>
            <select className="form-control" value={form.type} onChange={f('type')}>
              <option value="mahasiswa">Mahasiswa</option>
              <option value="dosen">Dosen</option>
            </select>
          </div>
          <div className="grid-2">

          <div className="form-group">
            <label className="form-label">Departemen</label>

            <select
              className="form-control"
              value={form.departemen}
              onChange={(e)=>{

                setForm({
                  ...form,
                  departemen: e.target.value,
                  prodi: ''
                });

              }}
            >
          <option value="">Pilih Departemen</option>

          {Object.keys(departmentData).map(dep => (
            <option key={dep} value={dep}>
              {dep}
            </option>
          ))}

        </select>

      </div>


      <div className="form-group">
        <label className="form-label">Program Studi</label>

        <select
          className="form-control"
          value={form.prodi}
          onChange={f('prodi')}
        >

          <option value="">Pilih Prodi</option>

          {(departmentData[form.departemen] || []).map(prodi => (
            <option key={prodi} value={prodi}>
              {prodi}
            </option>
          ))}

        </select>

      </div>

    </div>
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
      <div className="modal" style={{ maxWidth: 640 }}>
        <div className="modal-header">
          <h3 className="modal-title">Profil Anggota</h3>
          <button className="modal-close" onClick={onClose}><X size={20} /></button>
        </div>

        <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start', marginBottom: 24 }}>
          {member.photo_url ? (
  <img
    src={`${API_URL}${member.photo_url}`}
    alt={member.name}
    style={{ width: 72, height: 72, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
  />
) : (
  <div className="profile-avatar-lg">{initials}</div>
)}
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 18, fontWeight: 700 }}>{member.name}</div>
            <div style={{ fontSize: 13, color: 'var(--gray-text)' }}>{member.nim} · {member.prodi}</div>
            <div style={{ marginTop: 8, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <span className="badge badge-info">{member.type}</span>
              <span className="badge badge-neutral">{member.departemen}</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-outline btn-sm" onClick={() => onEdit(member)}>Edit Data</button>
          </div>
        </div>

        <div className="grid-3" style={{ marginBottom: 20 }}>
          <div style={{ textAlign: 'center', padding: 12, background: 'var(--off-white)', borderRadius: 8 }}>
            <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--maroon)' }}>{activeLoan}</div>
            <div style={{ fontSize: 11, color: 'var(--gray-text)' }}>Sedang Dipinjam</div>
          </div>
          <div style={{ textAlign: 'center', padding: 12, background: 'var(--off-white)', borderRadius: 8 }}>
            <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--navy)' }}>{memberLoans.filter(l => l.status === 'dikembalikan').length}</div>
            <div style={{ fontSize: 11, color: 'var(--gray-text)' }}>Sudah Kembali</div>
          </div>
          <div style={{ textAlign: 'center', padding: 12, background: 'var(--off-white)', borderRadius: 8 }}>
            <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--warning)' }}>{memberLoans.filter(l => l.status === 'terlambat').length}</div>
            <div style={{ fontSize: 11, color: 'var(--gray-text)' }}>Terlambat</div>
          </div>
        </div>

        <div style={{ fontWeight: 700, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
          <History size={16} /> Riwayat Peminjaman
        </div>
        <div className="table-container" style={{ maxHeight: 240, overflowY: 'auto' }}>
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
              {memberLoans.length === 0 ? (
                <tr><td colSpan={4} style={{ textAlign: 'center', padding: 20, color: 'var(--gray-text)' }}>Belum ada riwayat peminjaman</td></tr>
              ) : memberLoans.map(l => (
                <tr key={l.id}>
                  <td>{l.bookTitle}</td>
                  <td>{l.loanDate}</td>
                  <td>{l.returnDate || l.dueDate}</td>
                  <td>
                    <span className={`badge ${l.status === 'dikembalikan' ? 'badge-success' : l.status === 'terlambat' ? 'badge-danger' : 'badge-warning'}`}>{l.status}</span>
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

export default function AnggotaPage() {
  const { members, loans, addMember, updateMember, deleteMember } = useApp();
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('semua');
  const [addModal, setAddModal] = useState(false);
  const [detailMember, setDetailMember] = useState(null);
  const [editMember, setEditMember] = useState(null);
  const [deleteMemberData, setDeleteMemberData] = useState(null);

  const filtered = members.filter(m =>

  m.type !== 'staff' &&

  (typeFilter === 'semua' || m.type === typeFilter) &&

  (
    !search ||
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    m.nim.includes(search) ||
    m.departemen.toLowerCase().includes(search.toLowerCase())
  )

  );

  const mahasiswa = members.filter(m => m.type === 'mahasiswa' && m.status === 'aktif').length;
  const dosen = members.filter(m => m.type === 'dosen' && m.status === 'aktif').length;
  const staff = members.filter(m => m.type === 'staff' && m.status === 'aktif').length;

  const typeBadge = (type) => {
    if (type === 'mahasiswa') return <span className="badge badge-info">Mahasiswa</span>;
    if (type === 'dosen') return <span className="badge badge-success">Dosen</span>;
    return <span className="badge badge-neutral">Staff</span>;
  };

  return (
    <div>
      {addModal && <MemberModal onSave={(m) => { addMember(m); setAddModal(false); }} onClose={() => setAddModal(false)} />}
      {detailMember && (
    <MemberDetailModal
    member={detailMember}
    loans={loans}
    onClose={() => setDetailMember(null)}
    onEdit={(m) => {
      setDetailMember(null);
      setEditMember(m);
    }}
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

{deleteMemberData && (
  <div className="modal-overlay">
    <div
      className="modal"
      style={{
        maxWidth: 420,
        textAlign: 'center'
      }}
    >

      <div
        style={{
          fontSize: 18,
          fontWeight: 700,
          marginBottom: 10
        }}
      >
        Hapus Anggota?
      </div>

      <div
        style={{
          color: 'var(--gray-text)',
          marginBottom: 24
        }}
      >
        Yakin ingin menghapus
        <b> {deleteMemberData.name}</b> ?
      </div>

      <div
        style={{
          display: 'flex',
          gap: 10,
          justifyContent: 'center'
        }}
      >
        <button
          className="btn btn-ghost"
          onClick={() => setDeleteMemberData(null)}
        >
          Batal
        </button>

        <button
          className="btn btn-danger"
          onClick={async () => {
            const success =
              await deleteMember(deleteMemberData.id);
            if (success) {
              setDeleteMemberData(null);
            }

          }}
        >
          Hapus
        </button>
      </div>
    </div>
  </div>
)}

      <div className="page-header">
        <div className="page-breadcrumb">Data Anggota</div>
        <h1 className="page-title">Manajemen Anggota</h1>
        <p className="page-subtitle">Kelola data anggota perpustakaan — Mahasiswa dan Dosen</p>
      </div>

      <div className="grid-3 mb-24">
        <div className="stat-card">
          <div className="stat-icon maroon"><BookOpen size={18} /></div>
          <div>
            <div className="stat-value">{mahasiswa}</div>
            <div className="stat-label">Mahasiswa Aktif</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon navy"><BookOpen size={18} /></div>
          <div>
            <div className="stat-value">{dosen}</div>
            <div className="stat-label">Dosen Aktif</div>
          </div>
        </div>
      </div>

      <div className="card">
      <div className="flex-between mb-16" style={{ flexWrap:'wrap', gap:10 }}>

        <div style={{ display:'flex', alignItems:'center', gap:8 }}>

          <button
            className="btn btn-primary btn-sm"
            onClick={() => setAddModal(true)}
          >
            <Plus size={14} /> Tambah Anggota
          </button>


          <div style={{ display:'flex', gap:8 }}>

            <button
              className="btn btn-sm"
              onClick={()=>setTypeFilter('semua')}
            >
              Semua
            </button>


            <button
              className="btn btn-sm"
              onClick={()=>setTypeFilter('mahasiswa')}
              style={{
                background:'#dbeafe',
                color:'#2563eb',
                border:'none'
              }}
            >
              Mahasiswa
            </button>


            <button
              className="btn btn-sm"
              onClick={()=>setTypeFilter('dosen')}
              style={{
                background:'#dcfce7',
                color:'#16a34a',
                border:'none'
              }}
            >
              Dosen
            </button>

          </div>

        </div>


        <div style={{ position:'relative' }}>
          <Search
            size={13}
            style={{
              position:'absolute',
              left:9,
              top:'50%',
              transform:'translateY(-50%)',
              color:'var(--gray-text)'
            }}
          />

          <input
            className="form-control"
            style={{ paddingLeft:30, width:260 }}
            placeholder="Cari nama, NIM/NIP, departemen..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

      </div>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Nama</th>
                <th>NIM/NIP</th>
                <th>Departemen</th>
                <th>Tipe</th>
                <th>Tgl Bergabung</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(m => (
                <tr key={m.id} style={{ cursor: 'pointer' }} onClick={() => setDetailMember(m)}>
  <td><code style={{ background: 'var(--gray-light)', padding: '2px 6px', borderRadius: 4, fontSize: 11 }}>{m.custom_id || m.id}</code></td>
  <td>
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      {m.photo_url ? (
        <img
          src={`${API_URL}${m.photo_url}`}
          alt={m.name}
          style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
        />
      ) : (
        <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--maroon)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
          {m.name.split(' ').map(w => w[0]).slice(0, 2).join('')}
        </div>
      )}
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 13 }}>{m.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--gray-text)' }}>{m.email}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{m.nim}</td>
                  <td>{m.departemen}</td>
                  <td>{typeBadge(m.type)}</td>
                  <td style={{ color: 'var(--gray-text)' }}>{m.joinDate}</td>
                  <td>
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={(e) => {
                      e.stopPropagation();
                        setDeleteMemberData(m);
                      
                    }}
                  >
                    <Trash2 size={14} />
                  </button>
                </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ marginTop: 12, fontSize: 12, color: 'var(--gray-text)' }}>
          {filtered.length} anggota ditampilkan · Klik baris untuk melihat detail
        </div>
      </div>
    </div>
  );
}