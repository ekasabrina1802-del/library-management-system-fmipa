import { useState } from 'react';
import { Plus, Pencil, Trash2, X, Check, Search, Eye, BookOpen, CheckCircle, Clock, XCircle, LayoutGrid, LayoutList, Bell } from 'lucide-react';
import { useApp } from '../components/AppContext';
import { useAuth } from '../components/AuthContext';

const API_URL = import.meta.env.VITE_API_URL;
const CATEGORIES = ['Semua Kategori', 'Matematika', 'Fisika', 'Kimia', 'Biologi'];
const COVER_COLORS = { MTK: '#7B1C1C', FIS: '#0D1B2A', KIM: '#1B5E20', BIO: '#1A237E' };

// --- Komponen Pendukung ---

function BookCover({ no_klasifikasi, size = 'sm' }) {
  const kode = no_klasifikasi?.split('/')[0];
  const map = { '510': 'MTK', '530': 'FIS', '540': 'KIM', '570': 'BIO' };
  const prefix = map[kode] || 'BK';
  const isLg = size === 'lg';
  return (
    <div style={{
      width: isLg ? 90 : 44,
      height: isLg ? 120 : 58,
      borderRadius: isLg ? 8 : 4,
      flexShrink: 0,
      background: COVER_COLORS[prefix] || '#555',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: 'white', fontSize: isLg ? 14 : 9, fontWeight: 700,
      textAlign: 'center', padding: 3,
      boxShadow: isLg ? '3px 3px 10px rgba(0,0,0,0.25)' : 'none'
    }}>{prefix}</div>
  );
}

// ---- Tombol "Ingatkan Saya" yang menarik ----
function RemindMeButton({ book, user, addReminder }) {
  const [notified, setNotified] = useState(false);

  const handleClick = () => {
    addReminder(book, user.memberId || user.id);
    setNotified(true);
  };

  if (notified) {
    return (
      <button
        disabled
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '8px 16px', borderRadius: 8,
          background: 'linear-gradient(135deg, #2D6A4F, #40916C)',
          color: 'white', border: 'none', fontSize: 13,
          fontWeight: 600, cursor: 'default', opacity: 0.9,
          boxShadow: '0 2px 8px rgba(45,106,79,0.3)'
        }}
      >
        <CheckCircle size={14} />
        Notifikasi Aktif!
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 7,
        padding: '8px 18px', borderRadius: 8,
        background: 'linear-gradient(135deg, #ED8936, #DD6B20)',
        color: 'white', border: 'none', fontSize: 13,
        fontWeight: 600, cursor: 'pointer',
        boxShadow: '0 2px 8px rgba(221,107,32,0.35)',
        transition: 'transform 0.15s, box-shadow 0.15s',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-1px)';
        e.currentTarget.style.boxShadow = '0 4px 14px rgba(221,107,32,0.45)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 2px 8px rgba(221,107,32,0.35)';
      }}
    >
      <Bell size={14} />
      Ingatkan Saya
    </button>
  );
}

function BookModal({ book, onSave, onClose, isReadOnly, user }) {
  const { loans, addLoan, addReminder } = useApp();
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

  const handleBorrowAction = async () => {
    if ((book.available ?? 0) <= 0) {
      alert(`Stok buku "${book.title}" sedang kosong. Kami akan mencatat permintaan notifikasi Anda.`);
      return;
    }
    const activeLoans = loans?.filter(l => l.user_id === user?.id && l.status === 'Dipinjam').length || 0;
    const rules = {
      mahasiswa: { max: 3, duration: '1 Minggu', extend: '2x' },
      dosen: { max: 10, duration: '1 Bulan', extend: 'N/A' }
    };
    const userRule = rules[user?.role] || rules.mahasiswa;
    if (activeLoans >= userRule.max) {
      alert(`Gagal Pinjam! Batas maksimal ${user?.role} adalah ${userRule.max} buku. Saat ini Anda masih meminjam ${activeLoans} buku.`);
      return;
    }
    const confirmBorrow = window.confirm(
      `Konfirmasi Peminjaman:\n\nJudul: ${book.title}\nDurasi: ${userRule.duration}\nBatas Maksimal: ${userRule.max} buku\n\nApakah Anda ingin melanjutkan?`
    );
    if (confirmBorrow) {
      const result = await addLoan(book.no_induk, user?.id);
      if (result.success) {
        alert('Permintaan berhasil! Silahkan ambil buku di meja petugas dengan menunjukkan kode buku.');
        onClose();
      } else {
        alert(`Gagal meminjam: ${result.message}`);
      }
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isReadOnly) return;
    if (!isEdit && !form.image) {
      alert("Foto buku wajib diunggah untuk buku baru!");
      return;
    }
    onSave(form);
  };

  const f = (k) => (e) => {
    if (isReadOnly) return;
    if (e.target.type === 'file') {
      const file = e.target.files[0];
      if (file) {
        setForm(p => ({ ...p, [k]: file }));
        const reader = new FileReader();
        reader.onloadend = () => setForm(p => ({ ...p, imagePreview: reader.result }));
        reader.readAsDataURL(file);
      }
    } else {
      setForm(p => ({ ...p, [k]: e.target.value }));
    }
  };

  const isAvailable = (book?.available ?? book?.stock ?? 0) > 0;

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
            <label className="form-label">Foto Buku {!isEdit && '*'}</label>
            {!isReadOnly && (
              <input type="file" className="form-control" accept="image/*" onChange={f('image')}
                style={{ marginBottom: 8 }} required={!isEdit} />
            )}
            {form.imagePreview ? (
              <div style={{ position: 'relative', width: 100 }}>
                <img src={form.imagePreview} alt="preview"
                  style={{ width: 100, height: 130, objectFit: 'cover', borderRadius: 6, display: 'block', border: '1px solid #ddd' }} />
              </div>
            ) : (
              <div style={{ width: 100, height: 130, border: '2px dashed #ddd', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999', fontSize: 12 }}>
                No Image
              </div>
            )}
          </div>
          <div className="form-group">
            <label className="form-label">Deskripsi *</label>
            <textarea className="form-control" value={form.description} onChange={f('description')} rows={3} disabled={isReadOnly} />
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 16, borderTop: '1px solid #eee', paddingTop: '16px' }}>
            <button type="button" className="btn btn-ghost" onClick={onClose}>{isReadOnly ? 'Tutup' : 'Batal'}</button>

            {isReadOnly && (user?.role === 'mahasiswa' || user?.role === 'dosen') && (
              isAvailable ? (
                <button type="button" className="btn btn-primary" style={{ background: '#2D6A4F' }} onClick={handleBorrowAction}>
                  <BookOpen size={14} /> Pinjam Buku
                </button>
              ) : (
                <RemindMeButton book={book} user={user} addReminder={addReminder} />
              )
            )}

            {!isReadOnly && <button type="submit" className="btn btn-primary"><Check size={14} /> Simpan</button>}
          </div>
        </form>
      </div>
    </div>
  );
}

// ---- Kartu Buku untuk Grid View ----
function BookCard({ book, onSelect, onDetail, isPetugas }) {
  const isAvailable = (book.available ?? 0) > 0;

  return (
    <div
      onClick={() => onSelect(book)}
      style={{
        background: '#fff',
        borderRadius: 12,
        overflow: 'hidden',
        border: '1px solid #eee',
        cursor: 'pointer',
        transition: 'transform 0.18s, box-shadow 0.18s',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-3px)';
        e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.12)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.06)';
      }}
    >
      {/* Cover area */}
      <div style={{
        position: 'relative',
        background: '#f7f3f0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: 160,
        overflow: 'hidden',
      }}>
        {book.image_url ? (
          <img
            src={`${API_URL}${book.image_url}`}
            alt={book.title}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <BookCover no_klasifikasi={book.no_klasifikasi} size="lg" />
        )}

        {/* Status badge overlay */}
        <div style={{
          position: 'absolute', top: 8, right: 8,
          background: isAvailable ? '#2D6A4F' : '#c0392b',
          color: 'white', fontSize: 10, fontWeight: 700,
          padding: '3px 8px', borderRadius: 20,
          boxShadow: '0 1px 4px rgba(0,0,0,0.2)'
        }}>
          {isAvailable ? `✓ Tersedia` : '✕ Habis'}
        </div>
      </div>

      {/* Info area */}
      <div style={{ padding: '12px 14px', flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
        <span style={{
          fontSize: 10, fontWeight: 600, color: '#7B1C1C',
          textTransform: 'uppercase', letterSpacing: '0.5px'
        }}>
          {book.category}
        </span>
        <div style={{
          fontWeight: 700, fontSize: 13, color: '#1a1a1a',
          lineHeight: 1.35, overflow: 'hidden',
          display: '-webkit-box', WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical'
        }}>
          {book.title}
        </div>
        <div style={{ fontSize: 11, color: '#777', marginTop: 2 }}>{book.author}</div>

        <div style={{
          marginTop: 'auto', paddingTop: 10,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          borderTop: '1px solid #f0ebe6'
        }}>
          <code style={{
            background: '#f0ebe6', padding: '2px 7px',
            borderRadius: 4, fontSize: 10, color: '#555'
          }}>
            {book.no_induk}
          </code>
          <span style={{
            fontSize: 11, fontWeight: 600,
            color: isAvailable ? '#2D6A4F' : '#c0392b'
          }}>
            {book.available}/{book.stock} unit
          </span>
        </div>

        {/* Detail hint */}
        <div
          onClick={(e) => {
            e.stopPropagation();
            onDetail(book);
          }}
          style={{
            marginTop: 8,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 5,
            padding: '6px',
            borderRadius: 7,
            background: '#f7f3f0',
            color: '#7B1C1C',
            fontSize: 11,
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          <Eye size={11} /> Lihat Detail
        </div>
      </div>
    </div>
  );
}

// --- Komponen Utama Halaman Buku ---

export default function BukuPage() {
  const { books, addBook, updateBook, deleteBook } = useApp();
  const { user } = useAuth();
  const isPetugas = user?.role === 'petugas';
  const isAdmin = user?.role === 'admin';
  const isAdminOrPetugas = isPetugas || isAdmin;

  const [filter, setFilter] = useState('Semua Kategori');
  const [search, setSearch] = useState('');
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [modal, setModal] = useState(null);
  const [deleteMode, setDeleteMode] = useState(false);
  const [selected, setSelected] = useState([]);
  // ← NEW: tampilan grid atau list
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'grid'

  // --- LOGIKA STATISTIK ---
  const totalJudul = books.length;
  const totalUnitTersedia = books.reduce((s, b) => s + Number(b.available ?? 0), 0);
  const totalDipinjam = books.reduce((s, b) => {
    const stock = Number(b.stock ?? 0);
    const available = Number(b.available ?? 0);
    return s + (stock - available);
  }, 0);
  const totalJudulHabis = books.filter(b => Number(b.available ?? 0) === 0).length;

  const filtered = books.filter(b => {
    const matchCat = filter === 'Semua Kategori' || b.category === filter;
    const matchSearch = !search || b.title?.toLowerCase().includes(search.toLowerCase()) || b.no_induk?.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  }).slice(0, rowsPerPage);

  const handleRowClick = (book) => {
  // ✅ khusus petugas = select saja
  if (isPetugas) {
    toggleSelect(book.id);
    return;
  }

  // user lain tetap buka detail
  setModal({ mode: 'view', book });
};

  const toggleSelect = (id) => setSelected(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);

  return (
    <div>
      {modal && (
        <BookModal
          book={modal.book}
          user={user}
          onSave={(f) => {
            if (modal.mode === 'edit') {
              const oldBook = modal.book;
              const borrowed = Number(oldBook.stock ?? 0) - Number(oldBook.available ?? 0);
              const newAvailable = Math.min(Number(f.stock), Math.max(0, Number(f.stock) - borrowed));
              updateBook(modal.book.id, { ...f, available: newAvailable });
            } else {
              addBook(f);
            }
            setModal(null);
          }}
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

      {/* Statistik */}
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
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {isPetugas ? (
              <>
                <button className="btn btn-primary btn-sm" onClick={() => setModal({ mode: 'add' })}>
                  <Plus size={14} /> Tambah Buku
                </button>
                <button className="btn btn-outline btn-sm" onClick={() => selected.length === 1 ? setModal({ mode: 'edit', book: books.find(b => b.id === selected[0]) }) : alert('Pilih 1 buku')}>
                  <Pencil size={14} /> Edit
                </button>
                <button className={`btn btn-sm ${deleteMode ? 'btn-danger' : 'btn-ghost'}`} onClick={() => deleteMode ? (deleteBook(selected), setSelected([]), setDeleteMode(false)) : setDeleteMode(true)}>
                  <Trash2 size={14} /> {deleteMode ? `Hapus (${selected.length})` : 'Hapus'}
                </button>
              </>
            ) : (
              <div className="info-text" style={{ color: '#666', fontSize: '13px', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Eye size={14} /> Klik tombol "Lihat Detail" untuk melihat informasi buku
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {/* Toggle Grid/List — hanya untuk user non-petugas/admin, tapi bisa dibuka untuk semua */}
            <div style={{
              display: 'flex', background: '#f0ebe6',
              borderRadius: 8, padding: 3, gap: 2
            }}>
              <button
                onClick={() => setViewMode('list')}
                style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  padding: '5px 10px', borderRadius: 6, border: 'none',
                  background: viewMode === 'list' ? '#7B1C1C' : 'transparent',
                  color: viewMode === 'list' ? 'white' : '#888',
                  fontSize: 12, fontWeight: 600, cursor: 'pointer',
                  transition: 'all 0.15s'
                }}
              >
                <LayoutList size={13} /> List
              </button>
              <button
                onClick={() => setViewMode('grid')}
                style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  padding: '5px 10px', borderRadius: 6, border: 'none',
                  background: viewMode === 'grid' ? '#7B1C1C' : 'transparent',
                  color: viewMode === 'grid' ? 'white' : '#888',
                  fontSize: 12, fontWeight: 600, cursor: 'pointer',
                  transition: 'all 0.15s'
                }}
              >
                <LayoutGrid size={13} /> Grid
              </button>
            </div>

            <div style={{ position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#999' }} />
              <input className="form-control" style={{ width: 220, paddingLeft: 32 }} placeholder="Cari judul atau penulis..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <select className="form-control" style={{ width: 180 }} value={filter} onChange={e => setFilter(e.target.value)}>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        {/* ---- GRID VIEW ---- */}
        {viewMode === 'grid' ? (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
            gap: 16,
            padding: '4px 0'
          }}>
            {filtered.map(b => (
              <BookCard
                key={b.id}
                book={b}
                isPetugas={isPetugas}
                onSelect={(book) => {
                  if (isPetugas) {
                    toggleSelect(book.id); // hanya petugas yang select
                  }
                }}
                onDetail={(book) => {
                  setModal({ mode: 'view', book }); // lihat detail hanya dari tombol
                }}
              />
            ))}
            {filtered.length === 0 && (
              <div style={{
                gridColumn: '1/-1', textAlign: 'center',
                padding: 48, color: '#aaa', fontSize: 13
              }}>
                Tidak ada buku yang ditemukan.
              </div>
            )}
          </div>
        ) : (
          /* ---- LIST / TABLE VIEW ---- */
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
                  <tr key={b.id} onClick={() => handleRowClick(b)}
                    style={{ background: selected.includes(b.id) ? 'rgba(123,28,28,0.06)' : '', cursor: 'pointer' }}>
                    {deleteMode && <td onClick={(e) => e.stopPropagation()}><input type="checkbox" checked={selected.includes(b.id)} readOnly /></td>}
                    <td>
                      {b.image_url
                        ? <img src={`${API_URL}${b.image_url}`} style={{ width: 44, height: 58, objectFit: 'cover', borderRadius: 4 }} />
                        : <BookCover no_klasifikasi={b.no_klasifikasi} />}
                    </td>
                    <td><code style={{ background: '#eee', padding: '2px 6px', borderRadius: 4, fontSize: '11px' }}>{b.no_induk}</code></td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{b.title}</div>
                      <div style={{ fontSize: 11, color: '#666' }}>{b.isbn}</div>
                    </td>
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
        )}
      </div>
    </div>
  );
}