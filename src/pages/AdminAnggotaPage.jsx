import { useState } from 'react';
import { Plus, X, Check, Search, Printer, BookOpen, History } from 'lucide-react';
import { useApp } from '../components/AppContext';
import { useAuth } from '../components/AuthContext';

function MemberModal({ member, onSave, onClose, role }) {
  const isEdit = !!member?.id;
  const isAdmin = role === 'admin';

  const [form, setForm] = useState({
    name: member?.name || '',
    nim: member?.nim || '',
    departemen: member?.departemen || '',
    prodi: member?.prodi || '',
    type: member?.type || (isAdmin ? 'staff' : 'mahasiswa'),
    email: member?.email || '',
    phone: member?.phone || '',
    address: member?.address || '',
    password: ''
  });

  const f = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();

    if (isAdmin && !isEdit && !form.password) {
      alert('Password wajib diisi untuk staff/petugas perpus.');
      return;
    }

    onSave({
      ...form,
      type: isAdmin ? 'staff' : form.type
    });
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h3 className="modal-title">
            {isEdit
              ? `Edit Data ${isAdmin ? 'Staff/Petugas' : 'Anggota'}`
              : `Tambah ${isAdmin ? 'Staff/Petugas' : 'Anggota'} Baru`}
          </h3>
          <button className="modal-close" onClick={onClose}><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Nama Lengkap *</label>
              <input className="form-control" value={form.name} onChange={f('name')} required />
            </div>

            <div className="form-group">
              <label className="form-label">{isAdmin ? 'NIP / Kode Staff *' : 'NIM / NIP *'}</label>
              <input className="form-control" value={form.nim} onChange={f('nim')} required />
            </div>
          </div>

          {isAdmin ? (
            <div className="form-group">
              <label className="form-label">Tipe Anggota</label>
              <input className="form-control" value="Staff / Petugas" disabled />
            </div>
          ) : (
            <div className="form-group">
              <label className="form-label">Tipe Anggota</label>
              <select className="form-control" value={form.type} onChange={f('type')}>
                <option value="mahasiswa">Mahasiswa</option>
                <option value="dosen">Dosen</option>
              </select>
            </div>
          )}

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Departemen</label>
              <input className="form-control" value={form.departemen} onChange={f('departemen')} />
            </div>

            <div className="form-group">
              <label className="form-label">Program Studi</label>
              <input className="form-control" value={form.prodi} onChange={f('prodi')} />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">{isAdmin ? 'Email Staff/Petugas *' : 'Email'}</label>
            <input
              className="form-control"
              type="email"
              value={form.email}
              onChange={f('email')}
              placeholder={isAdmin ? 'nama@fmipa.ac.id' : 'email anggota'}
              required={isAdmin}
            />
          </div>

          {isAdmin && !isEdit && (
            <div className="form-group">
              <label className="form-label">Password Awal *</label>
              <input
                className="form-control"
                type="password"
                value={form.password}
                onChange={f('password')}
                placeholder="Masukkan password awal petugas"
                required
              />
            </div>
          )}

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">No. Telp</label>
              <input className="form-control" value={form.phone} onChange={f('phone')} />
            </div>

            <div className="form-group">
              <label className="form-label">Alamat</label>
              <input className="form-control" value={form.address} onChange={f('address')} />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-ghost" onClick={onClose}>Batal</button>
            <button type="submit" className="btn btn-primary">
              <Check size={14} /> {isEdit ? 'Simpan Perubahan' : isAdmin ? 'Tambah Petugas' : 'Tambah Anggota'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function MemberDetailModal({ member, loans, onClose, onEdit }) {
  const memberLoans = loans.filter(l => l.memberId === member.id);
  const initials = member.name?.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  const activeLoan = memberLoans.filter(l => l.status === 'dipinjam' || l.status === 'terlambat').length;

  const typeBadge = (type) => {
    if (type === 'mahasiswa') return <span className="badge badge-info">Mahasiswa</span>;
    if (type === 'dosen') return <span className="badge badge-success">Dosen</span>;
    return <span className="badge badge-neutral">Staff</span>;
  };

  return (
    <div className="modal-overlay">
      <div className="modal" style={{ maxWidth: 640 }}>
        <div className="modal-header">
          <h3 className="modal-title">Profil Anggota</h3>
          <button className="modal-close" onClick={onClose}><X size={20} /></button>
        </div>

        <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start', marginBottom: 24 }}>
          <div className="profile-avatar-lg">{initials}</div>

          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 18, fontWeight: 700 }}>{member.name}</div>
            <div style={{ fontSize: 13, color: 'var(--gray-text)' }}>{member.nim} · {member.prodi}</div>
            <div style={{ marginTop: 8, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <span className={`badge ${member.status === 'aktif' ? 'badge-success' : 'badge-danger'}`}>{member.status}</span>
              {typeBadge(member.type)}
              <span className="badge badge-neutral">{member.departemen}</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-outline btn-sm" onClick={() => onEdit(member)}>Edit Data</button>
            <button className="btn btn-ghost btn-sm"><Printer size={13} /> Cetak Kartu</button>
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
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', padding: 20, color: 'var(--gray-text)' }}>
                    Belum ada riwayat peminjaman
                  </td>
                </tr>
              ) : memberLoans.map(l => (
                <tr key={l.id}>
                  <td>{l.bookTitle}</td>
                  <td>{l.loanDate}</td>
                  <td>{l.returnDate || l.dueDate}</td>
                  <td>
                    <span className={`badge ${l.status === 'dikembalikan' ? 'badge-success' : l.status === 'terlambat' ? 'badge-danger' : 'badge-warning'}`}>
                      {l.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ marginTop: 20, padding: 16, background: 'var(--off-white)', borderRadius: 8 }}>
          <div style={{ fontWeight: 700, marginBottom: 8, fontSize: 13 }}>
            <Printer size={14} style={{ display: 'inline', marginRight: 6 }} />
            Cetak Kartu Anggota Massal
          </div>
          <div style={{ fontSize: 12, color: 'var(--gray-text)' }}>
            Pilih hingga 10 anggota untuk mencetak kartu tanda anggota fisik secara massal dengan format standar perpustakaan.
          </div>
          <button className="btn btn-outline btn-sm" style={{ marginTop: 8 }}>Cetak Kartu Anggota Ini</button>
        </div>
      </div>
    </div>
  );
}

export default function AnggotaPage() {
  const { members, loans, addMember, updateMember } = useApp();
  const { user } = useAuth();

  const [search, setSearch] = useState('');
  const [addModal, setAddModal] = useState(false);
  const [editMember, setEditMember] = useState(null);
  const [detailMember, setDetailMember] = useState(null);

  const isAdmin = user?.role === 'admin';

  const filtered = members.filter(m => {
    const matchSearch =
      !search ||
      m.name?.toLowerCase().includes(search.toLowerCase()) ||
      m.nim?.includes(search) ||
      m.departemen?.toLowerCase().includes(search.toLowerCase());

    const matchRole = isAdmin ? m.type === 'staff' : m.type !== 'staff';

    return matchSearch && matchRole;
  });

  const mahasiswa = members.filter(m => m.type === 'mahasiswa' && m.status === 'aktif').length;
  const dosen = members.filter(m => m.type === 'dosen' && m.status === 'aktif').length;
  const staff = members.filter(m => m.type === 'staff' && m.status === 'aktif').length;

  const typeBadge = (type) => {
    if (type === 'mahasiswa') return <span className="badge badge-info">Mahasiswa</span>;
    if (type === 'dosen') return <span className="badge badge-success">Dosen</span>;
    return <span className="badge badge-neutral">Staff</span>;
  };

  const handleAddMember = async (m) => {
    const success = await addMember(m);
    if (success) setAddModal(false);
  };

  const handleUpdateMember = async (m) => {
    const success = await updateMember(editMember.id, m);

    if (success) {
      setEditMember(null);
      setDetailMember(null);
    }
  };

  return (
    <div>
      {addModal && (
        <MemberModal
          role={user?.role}
          onSave={handleAddMember}
          onClose={() => setAddModal(false)}
        />
      )}

      {editMember && (
        <MemberModal
          role={user?.role}
          member={editMember}
          onSave={handleUpdateMember}
          onClose={() => setEditMember(null)}
        />
      )}

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

      <div className="page-header">
        <div className="page-breadcrumb">{isAdmin ? 'Data Staff' : 'Data Anggota'}</div>
        <h1 className="page-title">{isAdmin ? 'Manajemen Staff/Petugas' : 'Manajemen Anggota'}</h1>
        <p className="page-subtitle">
          {isAdmin
            ? 'Kelola data staff/petugas perpustakaan FMIPA.'
            : 'Kelola data anggota perpustakaan — mahasiswa dan dosen FMIPA.'}
        </p>
      </div>

      {isAdmin ? (
        <div className="grid-3 mb-24">
          <div className="stat-card">
            <div className="stat-icon green"><BookOpen size={18} /></div>
            <div>
              <div className="stat-value">{staff}</div>
              <div className="stat-label">Staff/Petugas Aktif</div>
            </div>
          </div>
        </div>
      ) : (
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

          <div className="stat-card">
            <div className="stat-icon green"><BookOpen size={18} /></div>
            <div>
              <div className="stat-value">{mahasiswa + dosen}</div>
              <div className="stat-label">Total Anggota</div>
            </div>
          </div>
        </div>
      )}

      <div className="card">
        <div className="flex-between mb-16" style={{ flexWrap: 'wrap', gap: 10 }}>
          <button className="btn btn-primary btn-sm" onClick={() => setAddModal(true)}>
            <Plus size={14} /> {isAdmin ? 'Tambah Petugas' : 'Tambah Anggota'}
          </button>

          <div style={{ position: 'relative' }}>
            <Search size={13} style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-text)' }} />
            <input
              className="form-control"
              style={{ paddingLeft: 30, width: 260 }}
              placeholder={isAdmin ? 'Cari nama, NIP/kode, departemen...' : 'Cari nama, NIM/NIP, departemen...'}
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
                <th>{isAdmin ? 'NIP/Kode' : 'NIM/NIP'}</th>
                <th>Departemen</th>
                <th>No. Telp</th>
                <th>Alamat</th>
                <th>Tipe</th>
                <th>Tgl Bergabung</th>
                <th>Status</th>
              </tr>
            </thead>

            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: 30, color: 'var(--gray-text)' }}>
                    {isAdmin ? 'Belum ada data staff/petugas.' : 'Belum ada data anggota.'}
                  </td>
                </tr>
              ) : filtered.map(m => (
                <tr key={m.id} style={{ cursor: 'pointer' }} onClick={() => setDetailMember(m)}>
                  <td>
                    <code style={{ background: 'var(--gray-light)', padding: '2px 6px', borderRadius: 4, fontSize: 11 }}>
                      {m.id}
                    </code>
                  </td>

                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
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
                        {m.name?.split(' ').map(w => w[0]).slice(0, 2).join('')}
                      </div>

                      <div>
                        <div style={{ fontWeight: 600, fontSize: 13 }}>{m.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--gray-text)' }}>{m.email}</div>
                      </div>
                    </div>
                  </td>

                  <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{m.nim}</td>
                  <td>{m.departemen}</td>
                  <td>{m.phone || '-'}</td>
                  <td>{m.address || '-'}</td>
                  <td>{typeBadge(m.type)}</td>
                  <td style={{ color: 'var(--gray-text)' }}>{m.joinDate || m.created_at}</td>
                  <td>
                    <span className={`badge ${m.status === 'aktif' ? 'badge-success' : 'badge-danger'}`}>
                      {m.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ marginTop: 12, fontSize: 12, color: 'var(--gray-text)' }}>
          {filtered.length} {isAdmin ? 'staff/petugas' : 'anggota'} ditampilkan · Klik baris untuk melihat detail
        </div>
      </div>
    </div>
  );
}