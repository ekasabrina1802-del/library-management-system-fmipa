import { useState, useRef, useEffect } from 'react';
import { Plus, Pencil, X, Check, Search, Eye, BookOpen, CheckCircle, Clock, XCircle, LayoutGrid, LayoutList, Bell } from 'lucide-react';
import { useApp } from '../components/AppContext';
import { useAuth } from '../components/AuthContext';
import ApiImage from '../components/ApiImage';

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

const getAvailableCopies = (book) => {
  // FORMAT BARU
  if (book?.copies?.length) {
    return book.copies.filter(
      c => c.status === 'available'
    );
  }

  // FORMAT LAMA
  return Array.from({
    length: Number(book?.stock) || 0
  }).map((_, i) => ({
    id: `legacy-${i}`,
    status: 'available'
  }));
};

const getBorrowedCopies = (book) => {
  // FORMAT BARU
  if (book?.copies?.length) {
    return book.copies.filter(
      c => c.status === 'borrowed'
    );
  }

  // FORMAT LAMA
  return [];
};

function generateCopies(bookCode, total) {
  return Array.from(
    { length: total },
    (_, i) => ({
      id: crypto.randomUUID(),

      copy_code:
        `${bookCode}-${String(i + 1).padStart(3, '0')}`,

      status: 'available'
    })
  );
}
function BookModal({ book, onSave, onClose, isReadOnly, user }) {
  const { loans, addLoan, addReminder, members } = useApp();
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
    stock: book?.copies?.length || book?.stock || 1,
    description: book?.description || '',
    image: null,
    imagePreview: book?.image_url || null
  });

  const currentMember = members.find(
    m =>
      String(m.id) === String(user?.anggotaId || user?.memberId) ||
      m.email === user?.email
  );

  const profileIncomplete =
    !currentMember?.name ||
    !currentMember?.nim ||
    !currentMember?.departemen ||
    !currentMember?.prodi ||
    !currentMember?.phone ||
    !currentMember?.address;
  const handleBorrowAction = async () => {
  // VALIDASI PROFIL WAJIB LENGKAP
  const profileIncomplete =
    !user?.name ||
    !user?.nim ||
    !user?.departemen ||
    !user?.prodi ||
    !user?.phone ||
    !user?.address;

  if (profileIncomplete) {

    alert(
      'Lengkapi profil anda terlebih dahulu sebelum meminjam buku.'
    );

    return;
  }
    if (getAvailableCopies(book).length <= 0) {
      alert(`Stok buku "${book.title}" sedang kosong. Kami akan mencatat permintaan notifikasi Anda.`);
      return;
    }
    const activeLoans = loans?.filter(
  l =>
    String(l.memberId) === String(user?.anggotaId || user?.memberId) &&
    ['dipinjam', 'diperpanjang', 'terlambat'].includes(String(l.status).toLowerCase())
).length || 0;
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

  // =========================
  // MODE BARU (copies)
  // =========================

  if (book.copies) {

    const availableCopies =
      getAvailableCopies(book);

    if (availableCopies.length === 0) {

      alert('Semua copy sedang dipinjam');

      return;
    }

    const selectedCopy =
      availableCopies[0];

    const result = await addLoan({

      memberId:
        user?.anggotaId ||
        user?.memberId,

      bookId: book.id,

      copyId: selectedCopy.id,

      copyCode:
        selectedCopy.copy_code

    });

    if (result.success) {

      alert(
        `Permintaan berhasil!\n\n` +
        `Silahkan ambil buku di meja petugas ` +
        `dengan menunjukkan kode buku:\n\n` +
        `${selectedCopy.copy_code}`
      );

      onClose();

    } else {

      alert(
        `Gagal meminjam: ${result.message}`
      );

    }

  }

  // =========================
  // MODE LAMA
  // =========================

  else {

    const result = await addLoan(

      book.no_induk,

      user?.anggotaId ||
      user?.memberId

    );

    if (result.success) {

      alert(
        'Permintaan berhasil! Silahkan ambil buku di meja petugas.'
      );

      onClose();

    } else {

      alert(
        `Gagal meminjam: ${result.message}`
      );

    }
  }}
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

  const isAvailable = getAvailableCopies(book).length > 0;
  const descriptionRef = useRef(null);
  useEffect(() => {
    if (descriptionRef.current) {
      descriptionRef.current.style.height = '0px';
      descriptionRef.current.style.height =
        descriptionRef.current.scrollHeight + 'px';
    }
  }, [form.description]);

  return (
    <div className="modal-overlay">
      <div className="modal" style={{ maxWidth: 900, width: '90%' }}>
        <div className="modal-header">
          <h3 className="modal-title">{isReadOnly ? 'Detail Informasi Buku' : (isEdit ? 'Edit Buku' : 'Tambah Buku Baru')}</h3>
          <button className="modal-close" onClick={onClose}><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Deskripsi *</label>
            <textarea
              ref={descriptionRef}
              className="form-control"
              value={form.description}
              onChange={f('description')}
              disabled={isReadOnly}
              style={{
                overflow: 'hidden',
                resize: 'none'
              }}
            />
          </div>
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
                <ApiImage
  src={form.imagePreview}
  alt="preview"
  style={{
    width: 100,
    height: 130,
    objectFit: 'cover',
    borderRadius: 6,
    display: 'block',
    border: '1px solid #ddd'
  }}
/>
              </div>
            ) : (
              <div style={{ width: 100, height: 130, border: '2px dashed #ddd', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999', fontSize: 12 }}>
                No Image
              </div>
            )}
          </div>
          <div className="form-group">

            <label className="form-label">
              Daftar Copy Buku
            </label>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 8
              }}
            >

              {(
                book?.copies?.length > 0
                  ? book.copies
                  : generateCopies(
                      form.no_induk || 'BOOK',
                      Number(form.stock) || 0
                    )
              ).map(copy => (

                <div
                  key={copy.id}
                  style={{
                    padding: 10,
                    border: '1px solid #ddd',
                    borderRadius: 8,
                    display: 'flex',
                    justifyContent: 'space-between'
                  }}
                >

                  <strong>
                    {copy.copy_code}
                  </strong>

                  <span>
                    {copy.status === 'available'
                      ? 'Tersedia'
                      : 'Dipinjam'}
                  </span>

                </div>
              ))}
            </div>
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
function BookCard({ book, onSelect, onDetail, isPetugas, selected }) {
  const isAvailable = getAvailableCopies(book).length > 0;

  return (
    <div
      onClick={() => onSelect(book)}
      style={{
        background: '#fff',
        borderRadius: 12,
        overflow: 'hidden',
        border: selected?.includes(book.id)
          ? '2px solid #7B1C1C'
          : '1px solid #eee',
        cursor: 'pointer',
        transition: 'transform 0.18s, box-shadow 0.18s',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: selected?.includes(book.id)
          ? '0 10px 25px rgba(123,28,28,0.28)'
          : '0 1px 4px rgba(0,0,0,0.06)',
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
          <ApiImage
  src={book.image_url}
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
            {getAvailableCopies(book).length}/
            {book.copies?.length || book.stock || 0} unit
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
  const { books, addBook, updateBook } = useApp();
  const { user } = useAuth();
  const isPetugas = user?.role === 'petugas';
  const isAdmin = user?.role === 'admin';
  const isAdminOrPetugas = isPetugas || isAdmin;

  const [filter, setFilter] = useState('Semua Kategori');
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'grid'
  const booksPerPage =
    viewMode === 'grid'
      ? 12
      : 10;
  const [modal, setModal] = useState(null);
  const [selected, setSelected] = useState([]);
  // --- LOGIKA STATISTIK ---
  const totalJudul = books.length;
  const totalUnitTersedia = books.reduce((s, b) => s + getAvailableCopies(b).length, 0);
  const totalDipinjam = books.reduce((s, b) =>
    s + getBorrowedCopies(b).length,
    0
  );
  const totalJudulHabis = books.filter(b => getAvailableCopies(b).length === 0).length;

  const filteredBooks = books.filter(b => {

  const matchCat =
    filter === 'Semua Kategori'
    || b.category === filter;

  const matchSearch =
    !search
    || b.title?.toLowerCase()
      .includes(search.toLowerCase())

    || b.no_induk?.toLowerCase()
      .includes(search.toLowerCase());

  return matchCat && matchSearch;

});

  const totalPages = Math.ceil(
    filteredBooks.length / booksPerPage
  );

  const startIndex =
    (currentPage - 1) * booksPerPage;

  const endIndex =
    startIndex + booksPerPage;

  const filtered =
    filteredBooks.slice(
      startIndex,
      endIndex
    );

  const handleRowClick = (book) => {
  // ✅ khusus petugas = select saja
  if (isPetugas) {
    toggleSelect(book.id);
    return;
  }

  // user lain tetap buka detail
  setModal({ mode: 'view', book });
};

  const toggleSelect = (id) => {
    setSelected((prev) =>
      prev.includes(id)
        ? []
        : [id]
    );
  };

  return (
    <div>
      {modal && (
        <BookModal
          book={modal.book}
          user={user}
          onSave={(f) => {
            if (modal.mode === 'edit') {
              const oldBook = modal.book;
              const borrowed =
                getBorrowedCopies(oldBook).length;

              const copies = generateCopies(
                f.no_induk,
                Number(f.stock)
              );

              copies.forEach((copy, index) => {

                if (index < borrowed) {
                  copy.status = 'borrowed';
                }

              });

              updateBook(modal.book.id, {
                ...f,
                copies
              });
            } else {
              const copies = generateCopies(
                f.no_induk,
                Number(f.stock)
              );

              addBook({
                ...f,
                copies
              });
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

      {/* Stats */}
      <div className="grid-4 mb-24" style={{ gap: '16px' }}>
      <div
        style={{
          background: 'linear-gradient(135deg, #7B1C1C, #a83232)',
          border: '1px solid transparent',
          borderRadius: 14,
          padding: '20px 22px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
        }}
      >
        <div
          style={{
            fontSize: 11,
            color: 'rgba(255,255,255,0.75)',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            fontWeight: 600,
            marginBottom: 6,
          }}
        >
          Koleksi Buku
        </div>

        <div
          style={{
            fontSize: 28,
            fontWeight: 800,
            color: 'white',
            lineHeight: 1,
            fontFamily: "'DM Mono', monospace",
          }}
        >
          {totalJudul}
        </div>

        <div style={{ marginTop: 6, opacity: 0.5 }}>
          <BookOpen size={16} color="white" />
        </div>
      </div>

      {/* Buku Tersedia */}
      <div
        style={{
          background: 'linear-gradient(135deg, #fffaf0, #ffffff)',
          border: '1px solid #FEEBC8',
          borderRadius: 14,
          padding: '20px 22px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
        }}
      >
        <div
          style={{
            fontSize: 11,
            color: '#D69E2E',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            fontWeight: 600,
            marginBottom: 6,
          }}
        >
          Buku Tersedia
        </div>

        <div
          style={{
            fontSize: 28,
            fontWeight: 800,
            color: '#D69E2E',
            lineHeight: 1,
            fontFamily: "'DM Mono', monospace",
          }}
        >
          {totalUnitTersedia}
        </div>

        <div style={{ marginTop: 6, opacity: 0.5 }}>
          <CheckCircle size={16} color="#D69E2E" />
        </div>
      </div>

      {/* Buku Dipinjam */}
      <div
        style={{
          background: 'linear-gradient(135deg, #fff5f5, #ffffff)',
          border: '1px solid #FED7D7',
          borderRadius: 14,
          padding: '20px 22px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
        }}
      >
        <div
          style={{
            fontSize: 11,
            color: '#E53E3E',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            fontWeight: 600,
            marginBottom: 6,
          }}
        >
          Buku Dipinjam
        </div>

        <div
          style={{
            fontSize: 28,
            fontWeight: 800,
            color: '#E53E3E',
            lineHeight: 1,
            fontFamily: "'DM Mono', monospace",
          }}
        >
          {totalDipinjam}
        </div>

        <div style={{ marginTop: 6, opacity: 0.5 }}>
          <Clock size={16} color="#E53E3E" />
        </div>
      </div>

      {/* Buku Habis */}
      <div
        style={{
          background: 'linear-gradient(135deg, #f7fafc, #ffffff)',
          border: '1px solid #E2E8F0',
          borderRadius: 14,
          padding: '20px 22px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
        }}
      >
        <div
          style={{
            fontSize: 11,
            color: '#4A5568',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            fontWeight: 600,
            marginBottom: 6,
          }}
        >
          Buku Habis
        </div>

        <div
          style={{
            fontSize: 28,
            fontWeight: 800,
            color: '#4A5568',
            lineHeight: 1,
            fontFamily: "'DM Mono', monospace",
          }}
        >
          {totalJudulHabis}
        </div>

        <div style={{ marginTop: 6, opacity: 0.5 }}>
          <XCircle size={16} color="#4A5568" />
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
              <input className="form-control" style={{ width: 220, paddingLeft: 32 }} placeholder="Cari judul atau penulis..." value={search} onChange={e => {setSearch(e.target.value); setCurrentPage(1);}} />
            </div>
            <select className="form-control" style={{ width: 180 }} value={filter} onChange={e => {setFilter(e.target.value); setCurrentPage(1);}}>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        <div
          style={{
            marginBottom: 16,
            padding: '10px 14px',
            borderRadius: 10,
            background: 'rgba(123,28,28,0.06)',
            border: '1px solid rgba(123,28,28,0.12)',
            color: '#7B1C1C',
            fontSize: 13,
            fontWeight: 500
          }}
        >
          📌 Silakan pilih salah satu buku terlebih dahulu untuk mengedit data buku.
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
                selected={selected}
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
                  <th style={{ width: 40 }}></th>
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
                  <tr
                    key={b.id}
                    onClick={() => handleRowClick(b)}
                    style={{
                      background: selected.includes(b.id)
                        ? 'rgba(123,28,28,0.10)'
                        : '#fff',

                      borderLeft: selected.includes(b.id)
                        ? '5px solid #7B1C1C'
                        : '5px solid transparent',

                      boxShadow: selected.includes(b.id)
                        ? '0 2px 10px rgba(123,28,28,0.12)'
                        : 'none',

                      transition: 'all 0.18s ease',
                      cursor: 'pointer'
                    }}
                  >
                    {/* KOLOM CENTANG */}
                    <td style={{ width: 40 }}>
                      {selected.includes(b.id) && (
                        <div
                          style={{
                            width: 22,
                            height: 22,
                            borderRadius: '50%',
                            background: '#7B1C1C',
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 12,
                            fontWeight: 700
                          }}
                        >
                          ✓
                        </div>
                      )}
                    </td>

                    {/* COVER */}
                    <td>
                      {b.image_url ? (

  <ApiImage
    src={b.image_url}
    alt={b.title}
    style={{
      width: 44,
      height: 58,
      objectFit: 'cover',
      borderRadius: 4
    }}
    fallback={<BookCover no_klasifikasi={b.no_klasifikasi} />}
  />
) : (
  <BookCover no_klasifikasi={b.no_klasifikasi} />
)}
                    </td>
                    <td><code style={{ background: '#eee', padding: '2px 6px', borderRadius: 4, fontSize: '11px' }}>{b.no_induk}</code></td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{b.title}</div>
                      <div style={{ fontSize: 11, color: '#666' }}>{b.isbn}</div>
                    </td>
                    <td><span className="badge badge-info">{b.category}</span></td>
                    <td style={{ fontWeight: 600 }}>{b.copies?.length || b.stock || 0}</td>
                    <td style={{ color: getAvailableCopies(b).length === 0 ? '#e53e3e' : '#38a169', fontWeight: 700 }}>{getAvailableCopies(b).length}</td>
                    <td>
                      <span className={`badge ${getAvailableCopies(b).length > 0 ? 'badge-success' : 'badge-danger'}`}>
                        {getAvailableCopies(b).length > 0 ? 'Tersedia' : 'Habis'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {/* Pagination */}
      {totalPages > 1 && (

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: 20,
            paddingTop: 16,
            borderTop: '1px solid #eee'
          }}
        >

          {/* Info */}
          <div
            style={{
              fontSize: 13,
              color: '#666'
            }}
          >
            Halaman {currentPage} dari {totalPages}
          </div>

          {/* Buttons */}
          <div
            style={{
              display: 'flex',
              gap: 8
            }}
          >

            <button
              className="btn btn-ghost btn-sm"

              disabled={currentPage === 1}

              onClick={() =>
                setCurrentPage(p => p - 1)
              }

              style={{
                opacity:
                  currentPage === 1
                    ? 0.5
                    : 1
              }}
            >
              ← Sebelumnya
            </button>

            <button
              className="btn btn-primary btn-sm"

              disabled={
                currentPage === totalPages
              }

              onClick={() =>
                setCurrentPage(p => p + 1)
              }

              style={{
                opacity:
                  currentPage === totalPages
                    ? 0.5
                    : 1
              }}
            >
              Selanjutnya →
            </button>

          </div>
        </div>
      )}
    </div>
  );
}