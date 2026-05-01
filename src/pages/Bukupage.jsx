import { useState } from 'react';
import { Plus, Pencil, Trash2, X, Check, Search, Filter, Eye, BookOpen, CheckCircle, Clock, XCircle } from 'lucide-react';
import { useApp } from '../components/AppContext';
import { useAuth } from '../components/AuthContext';

const API_URL = import.meta.env.VITE_API_URL;
const CATEGORIES = ['Semua Kategori', 'Matematika', 'Fisika', 'Kimia', 'Biologi'];
const COVER_COLORS = { MTK: '#7B1C1C', FIS: '#0D1B2A', KIM: '#1B5E20', BIO: '#1A237E' };

// --- Komponen Pendukung ---

function BookCover({ no_klasifikasi }) {
  const kode = no_klasifikasi?.split('/')[0];
  const map = { '510': 'MTK', '530': 'FIS', '540': 'KIM', '570': 'BIO' };
  const prefix = map[kode] || 'BK';
  return (
    <div style={{
      width: 44, height: 58, borderRadius: 4, flexShrink: 0,
      background: COVER_COLORS[prefix] || '#555',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: 'white', fontSize: 9, fontWeight: 700, textAlign: 'center', padding: 3
    }}>{prefix}</div>
  );
}

function BookModal({ book, onSave, onClose, isReadOnly, user }) {
  const { loans } = useApp(); // Mengambil data peminjaman aktif
  const isEdit = !!book?.id;
  
  const [form, setForm] = useState({
    no_induk: book?.no_induk || '',
    no_klasifikasi: book?.no_klasifikasi || '',
    title: book?.title || '',
    author: book?.author || '',
    publisher: book?.publisher || '',
    year: book?.year || new Date().getFullYear(),
    isbn: book?.isbn || '',
    category: book?.category || 'Matematika',
    stock: book?.stock || 1,
    description: book?.description || '',
    image: null,
    imagePreview: book?.image_url ? `${API_URL}${book.image_url}` : null
  });

  // Logika Aturan Peminjaman
  const handleBorrowAction = () => {
    // 1. Cek stok fisik
    if (book.available <= 0) {
      alert(`Stok buku "${book.title}" sedang kosong. Kami akan mencatat permintaan notifikasi Anda.`);
      return;
    }

    // 2. Hitung pinjaman aktif user saat ini
    const activeLoans = loans?.filter(l => l.user_id === user?.id && l.status === 'Dipinjam').length || 0;

    // 3. Tentukan aturan berdasarkan Role
    const rules = {
      mahasiswa: { max: 3, duration: '1 Minggu', extend: '2x' },
      dosen: { max: 10, duration: '1 Bulan', extend: 'N/A' }
    };

    const userRule = rules[user?.role] || rules.mahasiswa;

    // 4. Validasi Maksimal Pinjaman
    if (activeLoans >= userRule.max) {
      alert(`Gagal Pinjam! Batas maksimal ${user?.role} adalah ${userRule.max} buku. Saat ini Anda masih meminjam ${activeLoans} buku.`);
      return;
    }

    // 5. Konfirmasi Akhir
    const confirmBorrow = window.confirm(
      `Konfirmasi Peminjaman:\n\n` +
      `Judul: ${book.title}\n` +
      `Durasi: ${userRule.duration}\n` +
      `Batas Maksimal: ${userRule.max} buku\n\n` +
      `Apakah Anda ingin melanjutkan?`
    );

    if (confirmBorrow) {
      alert('Permintaan berhasil! Silahkan ambil buku di meja petugas dengan menunjukkan kode buku.');
      onClose();
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isReadOnly) return;
    onSave(form);
  };

  const f = (k) => (e) => !isReadOnly && setForm(p => ({ ...p, [k]: e.target.value }));

  return (
    <div className="modal-overlay">
      <div className="modal" style={{ maxWidth: 900, width: '90%' }}>
        <div className="modal-header">
          <h3 className="modal-title">{isReadOnly ? 'Detail Informasi Buku' : (isEdit ? 'Edit Buku' : 'Tambah Buku Baru')}</h3>
          <button className="modal-close" onClick={onClose}><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">No. Induk *</label>
              <input className="form-control" value={form.no_induk} onChange={f('no_induk')} disabled={isReadOnly} required />
            </div>
            <div className="form-group">
              <label className="form-label">No. Klasifikasi *</label>
              <input className="form-control" value={form.no_klasifikasi} onChange={f('no_klasifikasi')} disabled={isReadOnly} required />
            </div>
            <div className="form-group">
              <label className="form-label">Kategori *</label>
              <select className="form-control" value={form.category} onChange={f('category')} disabled={isReadOnly}>
                {CATEGORIES.slice(1).map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Judul Buku *</label>
            <input className="form-control" value={form.title} onChange={f('title')} disabled={isReadOnly} required />
          </div>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Penulis *</label>
              <input className="form-control" value={form.author} onChange={f('author')} disabled={isReadOnly} required />
            </div>
            <div className="form-group">
              <label className="form-label">Penerbit *</label>
              <input className="form-control" value={form.publisher} onChange={f('publisher')} disabled={isReadOnly} />
            </div>
          </div>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">ISBN *</label>
              <input className="form-control" value={form.isbn} onChange={f('isbn')} disabled={isReadOnly} />
            </div>
            <div className="form-group">
              <label className="form-label">Tahun Terbit *</label>
              <input className="form-control" type="number" value={form.year} onChange={f('year')} disabled={isReadOnly} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Jumlah Stok *</label>
            <input className="form-control" type="number" value={form.stock} onChange={f('stock')} disabled={isReadOnly} />
          </div>
          <div className="form-group">
            <label className="form-label">Foto Buku</label>
            {form.imagePreview && <img src={form.imagePreview} alt="preview" style={{ width: 100, marginTop: 8, borderRadius: 6, display: 'block' }} />}
          </div>
          <div className="form-group">
            <label className="form-label">Deskripsi *</label>
            <textarea className="form-control" value={form.description} onChange={f('description')} rows={3} disabled={isReadOnly} />
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 16, borderTop: '1px solid #eee', paddingTop: '16px' }}>
            <button type="button" className="btn btn-ghost" onClick={onClose}>{isReadOnly ? 'Tutup' : 'Batal'}</button>
            
            {/* FITUR PINJAM UNTUK USER (MAHASISWA/DOSEN) */}
            {isReadOnly && (user?.role === 'mahasiswa' || user?.role === 'dosen') && (
              book.available > 0 ? (
                <button type="button" className="btn btn-primary" style={{ background: '#2D6A4F' }} onClick={handleBorrowAction}>
                  <BookOpen size={14} /> Pinjam Buku
                </button>
              ) : (
                <button type="button" className="btn btn-outline" style={{ color: '#D69E2E', borderColor: '#D69E2E' }} onClick={() => alert('Notifikasi diaktifkan! Kami akan memberi tahu Anda jika buku ini sudah tersedia.')}>
                  <Clock size={14} /> Ingatkan Saya
                </button>
              )
            )}

            {!isReadOnly && <button type="submit" className="btn btn-primary"><Check size={14} /> Simpan</button>}
          </div>
        </form>
      </div>
    </div>
  );
}

// --- Komponen Utama Halaman Buku ---

export default function BukuPage() {
  const { books, addBook, updateBook, deleteBook } = useApp();
  const { user } = useAuth();
  const isAdminOrPetugas = user?.role === 'admin' || user?.role === 'petugas';

  const [filter, setFilter] = useState('Semua Kategori');
  const [search, setSearch] = useState('');
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [modal, setModal] = useState(null);
  const [deleteMode, setDeleteMode] = useState(false);
  const [selected, setSelected] = useState([]);

  // --- LOGIKA STATISTIK ---
  const totalJudul = books.length; 
  const totalUnitTersedia = books.reduce((s, b) => s + Number(b.available || 0), 0); 
  const totalDipinjam = books.reduce((s, b) => s + (Number(b.stock || 0) - Number(b.available || 0)), 0);
  const totalJudulHabis = books.filter(b => Number(b.available) === 0).length;

  const filtered = books.filter(b => {
    const matchCat = filter === 'Semua Kategori' || b.category === filter;
    const matchSearch = !search || b.title?.toLowerCase().includes(search.toLowerCase()) || b.no_induk?.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  }).slice(0, rowsPerPage);

  const handleRowClick = (book) => {
    if (deleteMode) toggleSelect(book.id);
    else if (isAdminOrPetugas) setSelected([book.id]); 
    else setModal({ mode: 'view', book });
  };

  const toggleSelect = (id) => setSelected(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);

  return (
    <div>
      {modal && (
        <BookModal 
          book={modal.book} 
          user={user} // Kirim seluruh objek user
          onSave={(f) => { modal.mode === 'edit' ? updateBook(modal.book.id, f) : addBook(f); setModal(null); }} 
          onClose={() => setModal(null)} 
          isReadOnly={modal.mode === 'view'} 
        />
      )}

      <div className="page-header">
        <div className="page-breadcrumb">{isAdminOrPetugas ? 'ADMINISTRASI & ARCHIVES' : 'PORTAL PENGGUNA'}</div>
        <h1 className="page-title">{isAdminOrPetugas ? 'Manajemen Buku' : 'Katalog Koleksi Buku'}</h1>
        <p className="page-subtitle">
          Selamat datang, <strong>{user?.name || 'User'}</strong>! Kelola dan pantau ketersediaan koleksi ilmiah FMIPA.
        </p>
      </div>

      <div className="grid-4 mb-24" style={{ gap: '16px' }}>
        <div className="stat-card" style={{ background: '#FFF5F5', border: '1px solid #FED7D7' }}>
          <div className="stat-icon" style={{ background: '#7B1C1C', color: 'white' }}><BookOpen size={20} /></div>
          <div>
            <div className="stat-value" style={{ color: '#7B1C1C' }}>{totalJudul}</div>
            <div className="stat-label">Koleksi Buku (Judul)</div>
          </div>
        </div>
        <div className="stat-card" style={{ background: '#F0FFF4', border: '1px solid #C6F6D5' }}>
          <div className="stat-icon" style={{ background: '#2D6A4F', color: 'white' }}><CheckCircle size={20} /></div>
          <div>
            <div className="stat-value" style={{ color: '#2D6A4F' }}>{totalUnitTersedia}</div>
            <div className="stat-label">Buku Tersedia (Unit)</div>
          </div>
        </div>
        <div className="stat-card" style={{ background: '#FFFAF0', border: '1px solid #FEEBC8' }}>
          <div className="stat-icon" style={{ background: '#D69E2E', color: 'white' }}><Clock size={20} /></div>
          <div>
            <div className="stat-value" style={{ color: '#D69E2E' }}>{totalDipinjam}</div>
            <div className="stat-label">Buku Dipinjam</div>
          </div>
        </div>
        <div className="stat-card" style={{ background: '#F7FAFC', border: '1px solid #E2E8F0' }}>
          <div className="stat-icon" style={{ background: '#4A5568', color: 'white' }}><XCircle size={20} /></div>
          <div>
            <div className="stat-value" style={{ color: '#4A5568' }}>{totalJudulHabis}</div>
            <div className="stat-label">Buku Habis (Judul)</div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="flex-between mb-16">
          <div style={{ display: 'flex', gap: 8 }}>
            {isAdminOrPetugas ? (
              <>
                <button className="btn btn-primary btn-sm" onClick={() => setModal({ mode: 'add' })}><Plus size={14} /> Tambah Buku</button>
                <button className="btn btn-outline btn-sm" onClick={() => selected.length === 1 ? setModal({ mode: 'edit', book: books.find(b => b.id === selected[0]) }) : alert('Pilih 1 buku')}>
                   <Pencil size={14} /> Edit
                </button>
                <button className={`btn btn-sm ${deleteMode ? 'btn-danger' : 'btn-ghost'}`} onClick={() => deleteMode ? (deleteBook(selected), setSelected([]), setDeleteMode(false)) : setDeleteMode(true)}>
                   <Trash2 size={14} /> {deleteMode ? `Hapus (${selected.length})` : 'Hapus'}
                </button>
              </>
            ) : <div className="info-text" style={{ color: '#666', fontSize: '13px' }}><Eye size={14} /> Klik baris untuk detail & peminjaman</div>}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{ position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#999' }} />
              <input className="form-control" style={{ width: 220, paddingLeft: 32 }} placeholder="Cari judul atau penulis..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <select className="form-control" style={{ width: 180 }} value={filter} onChange={e => setFilter(e.target.value)}>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                {deleteMode && <th style={{ width: 40 }}></th>}
                <th>Cover</th>
                <th>No. Induk</th>
                <th>Judul Buku</th>
                <th>Kategori</th>
                <th>Stok</th>
                <th>Tersedia</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(b => (
                <tr key={b.id} onClick={() => handleRowClick(b)} style={{ background: selected.includes(b.id) ? 'rgba(123,28,28,0.06)' : '', cursor: 'pointer' }}>
                  {deleteMode && <td onClick={(e) => e.stopPropagation()}><input type="checkbox" checked={selected.includes(b.id)} readOnly /></td>}
                  <td>{b.image_url ? <img src={`${API_URL}${b.image_url}`} style={{ width: 44, height: 58, objectFit: 'cover', borderRadius: 4 }} /> : <BookCover no_klasifikasi={b.no_klasifikasi} />}</td>
                  <td><code style={{ background: '#eee', padding: '2px 6px', borderRadius: 4, fontSize: '11px' }}>{b.no_induk}</code></td>
                  <td><div style={{ fontWeight: 600 }}>{b.title}</div><div style={{ fontSize: 11, color: '#666' }}>{b.isbn}</div></td>
                  <td><span className="badge badge-info">{b.category}</span></td>
                  <td style={{ fontWeight: 600 }}>{b.stock}</td>
                  <td style={{ color: b.available === 0 ? '#e53e3e' : '#38a169', fontWeight: 700 }}>{b.available}</td>
                  <td>
                    <span className={`badge ${b.available > 0 ? 'badge-success' : 'badge-danger'}`}>
                      {b.available > 0 ? 'Tersedia' : 'Habis'}
                    </span>
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