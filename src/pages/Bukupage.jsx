import { useState } from 'react';
import { Plus, Pencil, Trash2, X, Check, Search, Filter } from 'lucide-react';
import { useApp } from '../components/AppContext';
import { useAuth } from '../components/AuthContext';

const CATEGORIES = ['All Categories', 'Mathematics', 'Physics', 'Chemistry', 'Biology'];
const COVER_COLORS = { MTK: '#7B1C1C', FIS: '#0D1B2A', KIM: '#1B5E20', BIO: '#1A237E' };

function BookCover({ no_klasifikasi, title }) {
  const kode = no_klasifikasi?.split('/')[0]; // ambil 510, 530, dll

  const map = {
    '510': 'MTK',
    '530': 'FIS',
    '540': 'KIM',
    '570': 'BIO'
  };

  const prefix = map[kode] || 'BK';

  return (
    <div style={{
      width: 44,
      height: 58,
      borderRadius: 4,
      flexShrink: 0,
      background: COVER_COLORS[prefix] || '#555',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'white',
      fontSize: 9,
      fontWeight: 700,
      textAlign: 'center',
      padding: 3
    }}>
      {prefix}
    </div>
  );
}

function BookModal({ book, onSave, onClose }) {
  const isEdit = !!book?.id;
  const [form, setForm] = useState({
  no_induk: book?.no_induk || '',
  no_klasifikasi: book?.no_klasifikasi || '',
  title: book?.title || '',
  author: book?.author || '',
  publisher: book?.publisher || '',
  year: book?.year || new Date().getFullYear(),
  isbn: book?.isbn || '',
  category: book?.category || 'Mathematics',
  stock: book?.stock || 1,
  description: book?.description || ''
});

  const handleSubmit = (e) => { e.preventDefault(); onSave(form); };
  const f = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));

  return (
    <div className="modal-overlay">
      <div className="modal" style={{ maxWidth: 640 }}>
        <div className="modal-header">
          <h3 className="modal-title">{isEdit ? 'Edit Buku' : 'Tambah Buku Baru'}</h3>
          <button className="modal-close" onClick={onClose}><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">No. Induk *</label>
              <input className="form-control" value={form.no_induk} onChange={f('no_induk')} placeholder="00009/FMIPA/2025" required />
            </div>
            <div className="form-group">
              <label className="form-label">No. Klasifikasi *</label>
              <input className="form-control" value={form.no_klasifikasi} onChange={f('no_klasifikasi')} placeholder="541/SHI/d" required />
            </div>
            <div className="form-group">
              <label className="form-label">Kategori</label>
              <select className="form-control" value={form.category} onChange={f('category')}>
              {CATEGORIES.slice(1).map(c => <option key={c}>{c}</option>)}
            </select>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Judul Buku *</label>
            <input className="form-control" value={form.title} onChange={f('title')} placeholder="Judul lengkap buku" required />
          </div>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Penulis *</label>
              <input className="form-control" value={form.author} onChange={f('author')} placeholder="Nama penulis" required />
            </div>
            <div className="form-group">
              <label className="form-label">Penerbit</label>
              <input className="form-control" value={form.publisher} onChange={f('publisher')} placeholder="Nama penerbit" />
            </div>
          </div>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">ISBN</label>
              <input className="form-control" value={form.isbn} onChange={f('isbn')} placeholder="978-x-xxx-xxxxx-x" />
            </div>
            <div className="form-group">
              <label className="form-label">Tahun Terbit</label>
              <input className="form-control" type="number" value={form.year} onChange={f('year')} min="1900" max="2030" />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Jumlah Stok</label>
            <input className="form-control" type="number" value={form.stock} onChange={f('stock')} min="1" />
          </div>
          <div className="form-group">
            <label className="form-label">Deskripsi</label>
            <textarea className="form-control" value={form.description} onChange={f('description')} rows={3} placeholder="Deskripsi singkat buku..." />
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
            <button type="button" className="btn btn-ghost" onClick={onClose}>Batal</button>
            <button type="submit" className="btn btn-primary">
              <Check size={14} /> {isEdit ? 'Simpan Perubahan' : 'Tambah Buku'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function BukuPage() {
  const { books, addBook, updateBook, deleteBook } = useApp();
  console.log(books);
  const { user } = useAuth();
  const [filter, setFilter] = useState('All Categories');
  const [search, setSearch] = useState('');
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [modal, setModal] = useState(null); // null | {mode:'add'|'edit', book?}
  const [deleteMode, setDeleteMode] = useState(false);
  const [selected, setSelected] = useState([]);

  const filtered = books.filter(b => {
    const matchDis = filter === 'All Categories' || b.category === filter;
    const matchSearch = !search || b.title.toLowerCase().includes(search.toLowerCase()) ||
      b.author.toLowerCase().includes(search.toLowerCase()) || b.no_induk?.toLowerCase().includes(search.toLowerCase()) ||
b.no_klasifikasi?.toLowerCase().includes(search.toLowerCase())
    return matchDis && matchSearch;
  }).slice(0, rowsPerPage);

  const handleSave = (form) => {
    if (modal.mode === 'edit') updateBook(modal.book.id, form);
    else addBook(form);
    setModal(null);
  };

  const handleDelete = () => {
    if (selected.length === 0) return alert('Pilih buku yang akan dihapus.');
    if (confirm(`Hapus ${selected.length} buku? Tindakan ini tidak dapat dibatalkan.`)) {
      deleteBook(selected);
      setSelected([]);
      setDeleteMode(false);
    }
  };

  const toggleSelect = (id) => setSelected(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);

  const statusBadge = (b) => {
    if (b.available === 0) return <span className="badge badge-danger">Habis</span>;
    if (b.available <= 1) return <span className="badge badge-warning">Terbatas</span>;
    return <span className="badge badge-success">Tersedia</span>;
  };

  return (
    <div>
      {modal && <BookModal book={modal.book} onSave={handleSave} onClose={() => setModal(null)} />}

      <div className="page-header">
        <div className="page-breadcrumb">Administrasi & Archives</div>
        <h1 className="page-title">Manajemen Buku</h1>
        <p className="page-subtitle">Sistem Manajemen Perpustakaan FMIPA. Optimalkan pengelolaan data pustaka dan ketersediaan koleksi ilmiah fakultas.</p>
      </div>

      {/* Summary Cards */}
      <div className="grid-3 mb-24">
        <div className="stat-card">
          <div className="stat-icon maroon"><Filter size={18} /></div>
          <div>
            <div className="stat-value">{books.reduce((s, b) => s + b.stock, 0)}</div>
            <div className="stat-label">Total Collection</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green"><Check size={18} /></div>
          <div>
            <div className="stat-value">{books.reduce((s, b) => s + b.available, 0)}</div>
            <div className="stat-label">Available</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon orange"><X size={18} /></div>
          <div>
            <div className="stat-value">{books.reduce((s, b) => s + (b.stock - b.available), 0)}</div>
            <div className="stat-label">Borrowed</div>
          </div>
        </div>
      </div>

      <div className="card">
        {/* Toolbar */}
        <div className="flex-between mb-16" style={{ flexWrap: 'wrap', gap: 10 }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {user?.role === 'petugas' && (
              <>
                <button className="btn btn-primary btn-sm" onClick={() => setModal({ mode: 'add' })}>
                  <Plus size={14} /> Add New Book
                </button>
                <button className="btn btn-outline btn-sm" onClick={() => { if (selected.length === 1) setModal({ mode: 'edit', book: books.find(b => b.id === selected[0]) }); else alert('Pilih satu buku untuk diedit.'); }}>
                  <Pencil size={14} /> Edit Buku
                </button>
                <button className={`btn btn-sm ${deleteMode ? 'btn-danger' : 'btn-ghost'}`} onClick={() => deleteMode ? handleDelete() : setDeleteMode(true)}>
                  <Trash2 size={14} /> {deleteMode ? `Hapus (${selected.length})` : 'Delete Book'}
                </button>
                {deleteMode && (
                  <button className="btn btn-ghost btn-sm" onClick={() => { setDeleteMode(false); setSelected([]); }}>Batal</button>
                )}
              </>
            )}
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <div style={{ position: 'relative' }}>
              <Search size={13} style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-text)' }} />
              <input className="form-control" style={{ paddingLeft: 30, width: 200 }} placeholder="Cari buku..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <select className="form-control" style={{ width: 170 }} value={filter} onChange={e => setFilter(e.target.value)}>
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
            <select className="form-control" style={{ width: 130 }} value={rowsPerPage} onChange={e => setRowsPerPage(Number(e.target.value))}>
              <option value={10}>10 per halaman</option>
              <option value={20}>20 per halaman</option>
              <option value={50}>50 per halaman</option>
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
                <th>No. Klasifikasi</th>
                <th>Judul Buku</th>
                <th>Penulis</th>
                <th>Kategori</th>
                <th>Tahun</th>
                <th>Stok</th>
                <th>Tersedia</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
  <tr>
    <td colSpan={10} style={{ textAlign: 'center', padding: 40, color: 'var(--gray-text)' }}>
      Tidak ada buku ditemukan
    </td>
  </tr>
    ) : filtered.map(b => {
      console.log("DATA B:", b);
      return (
      
      <tr
        key={b.id}
        style={{ background: selected.includes(b.id) ? 'rgba(123,28,28,0.06)' : '' }}
      >
        {deleteMode && (
          <td>
            <input
              type="checkbox"
              checked={selected.includes(b.id)}
              onChange={() => toggleSelect(b.id)}
              style={{ accentColor: 'var(--maroon)' }}
            />
          </td>
        )}

        {/* COVER */}
        <td>
          <BookCover
            no_klasifikasi={b.no_klasifikasi}
            title={b.title}
          />
        </td>

        {/* NO INDUK + KLASIFIKASI */}
        <td>
          <code
            style={{
              background: 'var(--gray-light)',
              padding: '2px 6px',
              borderRadius: 4,
              fontSize: 11
            }}
          >
            {b.no_induk || b.code}
          </code>
        </td>

        <td>
          <span style={{ fontSize: 11, color: 'var(--gray-text)' }}>
            {b.no_klasifikasi || '-'}
          </span>
        </td>
        {/* JUDUL */}
        <td>
          <div style={{ fontWeight: 600, fontSize: 13 }}>{b.title}</div>
          <div style={{ fontSize: 11, color: 'var(--gray-text)' }}>{b.isbn}</div>
        </td>

        {/* PENULIS */}
        <td style={{ color: 'var(--gray-text)' }}>{b.author}</td>

        {/* KATEGORI */}
        <td>
          <span className="badge badge-info">
            {b.category || b.discipline}
          </span>
        </td>

        {/* TAHUN */}
        <td>{b.year}</td>

        {/* STOK */}
        <td style={{ fontWeight: 600 }}>{b.stock}</td>

        {/* TERSEDIA */}
        <td
          style={{
            fontWeight: 600,
            color: b.available === 0 ? 'var(--danger)' : 'var(--success)'
          }}
        >
          {b.available}
        </td>

        {/* STATUS */}
        <td>{statusBadge(b)}</td>
      </tr>
     );
})}
            </tbody>
          </table>
        </div>
        <div style={{ marginTop: 12, fontSize: 12, color: 'var(--gray-text)' }}>
          Menampilkan {filtered.length} dari {books.length} buku
        </div>
      </div>
    </div>
  );
}