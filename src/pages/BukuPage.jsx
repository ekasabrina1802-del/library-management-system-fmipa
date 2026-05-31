import { useState, useRef, useEffect } from 'react';
import { Plus, Pencil, X, Check, Search, Eye, BookOpen, CheckCircle, Clock, XCircle, LayoutGrid, LayoutList, Bell } from 'lucide-react';
import { useApp } from '../components/AppContext';
import { useAuth } from '../components/AuthContext';
import ApiImage from '../components/ApiImage';

const CATEGORIES = ['Semua Kategori', 'Matematika', 'Fisika', 'Kimia', 'Biologi'];
const COVER_COLORS = { MTK: '#7B1C1C', FIS: '#0D1B2A', KIM: '#1B5E20', BIO: '#1A237E' };

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

function RemindMeButton({ book, user, addReminder, reminders }) {
  const userId =
  user?.anggotaId ||
  user?.memberId ||
  user?.id;

  const notified = reminders?.some(
    r =>
      String(r.bookId) === String(book.id) &&
      String(r.userId) === String(userId)
  );

  const handleClick = () => {
    addReminder(book, userId);
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

// ✅ FIX: Hanya pakai data copies asli dari server — TIDAK ada fallback legacy
// Ini memastikan ID copy selalu berasal dari data asli, bukan di-generate ulang
const getAvailableCopies = (book) => {
  if (!book?.copies?.length) return [];
  return book.copies.filter(c => c.status === 'available');
};

const getBorrowedCopies = (book) => {
  if (!book?.copies?.length) return [];
  return book.copies.filter(c => c.status === 'borrowed');
};

// ✅ FIX: generateCopies hanya dipakai saat TAMBAH buku baru
// Saat EDIT, copies lama dipreserve (lihat bagian onSave)
function generateCopies(bookCode, total) {
  return Array.from(
    { length: total },
    (_, i) => ({
      id: crypto.randomUUID(),
      copy_code: `${bookCode}-${String(i + 1).padStart(3, '0')}`,
      status: 'available'
    })
  );
}

function SuccessToast({ bookTitle, noInduk, onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div style={{
      position: 'fixed', top: 24, right: 24, zIndex: 99999,
      background: 'linear-gradient(135deg, #1a472a, #2D6A4F)',
      color: 'white', borderRadius: 16, padding: '20px 24px',
      maxWidth: 360, width: 'calc(100vw - 48px)',
      boxShadow: '0 8px 32px rgba(0,0,0,0.25), 0 0 0 1px rgba(255,255,255,0.08)',
      animation: 'slideInToast 0.35s cubic-bezier(0.34,1.56,0.64,1)',
      display: 'flex', flexDirection: 'column', gap: 10,
    }}>
      <style>{`
        @keyframes slideInToast {
          from { opacity: 0; transform: translateX(60px) scale(0.92); }
          to   { opacity: 1; transform: translateX(0) scale(1); }
        }
      `}</style>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: '50%',
            background: 'rgba(255,255,255,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18
          }}>✓</div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 15 }}>Peminjaman Berhasil!</div>
            <div style={{ fontSize: 11, opacity: 0.7, marginTop: 1 }}>Perpustakaan FMIPA UNESA</div>
          </div>
        </div>
        <button onClick={onClose} style={{
          background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white',
          borderRadius: 8, width: 28, height: 28, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14
        }}>✕</button>
      </div>

      <div style={{ height: 1, background: 'rgba(255,255,255,0.12)' }} />

      <div style={{
        background: 'rgba(255,255,255,0.08)', borderRadius: 10,
        padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 4
      }}>
        <div style={{ fontSize: 13, fontWeight: 700, lineHeight: 1.4 }}>{bookTitle}</div>
        <code style={{
          fontSize: 11, opacity: 0.7,
          background: 'rgba(0,0,0,0.2)', padding: '2px 8px',
          borderRadius: 4, alignSelf: 'flex-start'
        }}>{noInduk}</code>
      </div>

      <div style={{ fontSize: 12, opacity: 0.75, lineHeight: 1.5 }}>
        📍 Silakan ambil buku ke Perpustakaan FMIPA UNESA
      </div>

      <div style={{ height: 3, background: 'rgba(255,255,255,0.15)', borderRadius: 99, overflow: 'hidden' }}>
        <div style={{
          height: '100%', background: 'rgba(255,255,255,0.5)', borderRadius: 99,
          animation: 'shrinkBar 4s linear forwards'
        }} />
        <style>{`
          @keyframes shrinkBar {
            from { width: 100%; }
            to   { width: 0%; }
          }
        `}</style>
      </div>
    </div>
  );
}

function BookModal({ book, onSave, onClose, isReadOnly, user }) {
  const { loans, addLoan, addReminder, members, reminders } = useApp();
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

  const currentMember = members?.find(
    m =>
      String(m.id) === String(user?.anggotaId || user?.memberId) ||
      m.email === user?.email
  );

  const [loadingBorrow, setLoadingBorrow] = useState(false);
  const [toast, setToast] = useState(null);

  const handleBorrowAction = async () => {
    if (!currentMember) {
      alert('Data anggota tidak ditemukan.');
      return;
    }

    const profileIncomplete =
      !currentMember.name ||
      !currentMember.nim ||
      !currentMember.departemen ||
      !currentMember.prodi ||
      !currentMember.phone ||
      !currentMember.address;

    if (profileIncomplete) {
      alert('Lengkapi profil anda terlebih dahulu sebelum meminjam buku.');
      return;
    }

    // ✅ FIX: Ambil copy dengan ID asli dari data server
    const availableCopy = getAvailableCopies(book)[0];

    if (!availableCopy) {
      alert(`Stok buku "${book.title}" sedang kosong.`);
      return;
    }

    // ✅ FIX: Pastikan ID copy terkirim dengan benar ke backend
    const payload = {
      memberId: user?.anggotaId || user?.memberId,
      bookId: book.id,
      copyId: availableCopy.id,       // ← ID asli dari server
      copyCode: availableCopy.copy_code
    };

    console.log("Payload pinjam:", payload);

    setLoadingBorrow(true);
    const result = await addLoan(payload);
    setLoadingBorrow(false);

    if (result.success) {
      setToast({ bookTitle: book.title, noInduk: book.no_induk });
    } else {
      alert(`Gagal meminjam: ${result.message}`);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isReadOnly) return;
    if (!isEdit && !form.image) {
      alert("Foto buku wajib diunggah!");
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

  return (
    <>
      {toast && (
        <SuccessToast
          bookTitle={toast.bookTitle}
          noInduk={toast.noInduk}
          onClose={() => { setToast(null); onClose(); }}
        />
      )}

      <div
        className="modal-overlay"
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.55)',
          zIndex: 9999,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: 20,
          overflowY: 'auto'
        }}
      >
        <div
          className="modal"
          style={{
            background: '#fff',
            width: '100%',
            maxWidth: 900,
            borderRadius: 16,
            padding: '24px',
            maxHeight: 'calc(100vh - 40px)',
            overflowY: 'auto',
            boxShadow: '0 20px 50px rgba(0,0,0,0.25)',
            scrollbarWidth: 'thin',
            scrollbarColor: '#7B1C1C #f3f3f3'
          }}
        >
          <div
            className="modal-header"
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 24,
              position: 'sticky',
              top: 0,
              background: '#fff',
              zIndex: 10,
              paddingBottom: 12
            }}
          >
            <h3 className="modal-title">
              {isReadOnly
                ? 'Detail Informasi Buku'
                : (isEdit ? 'Edit Buku' : 'Tambah Buku Baru')}
            </h3>
            <button
              className="modal-close"
              onClick={onClose}
              style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}
            >
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Deskripsi *</label>
              <textarea
                className="form-control"
                value={form.description}
                onChange={f('description')}
                disabled={isReadOnly}
                rows={4}
                style={{ resize: 'vertical', minHeight: 120 }}
              />
            </div>

            <div className="grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="form-group">
                <label className="form-label">No. Induk *</label>
                <input className="form-control" value={form.no_induk} onChange={f('no_induk')} disabled={isReadOnly} required />
              </div>
              <div className="form-group">
                <label className="form-label">No. Klasifikasi *</label>
                <input className="form-control" value={form.no_klasifikasi} onChange={f('no_klasifikasi')} disabled={isReadOnly} required />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Kategori *</label>
              <select className="form-control" value={form.category} onChange={f('category')} disabled={isReadOnly}>
                {CATEGORIES.slice(1).map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Judul Buku *</label>
              <input className="form-control" value={form.title} onChange={f('title')} disabled={isReadOnly} required />
            </div>

            <div className="grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="form-group">
                <label className="form-label">Penulis *</label>
                <input className="form-control" value={form.author} onChange={f('author')} disabled={isReadOnly} required />
              </div>
              <div className="form-group">
                <label className="form-label">Penerbit *</label>
                <input className="form-control" value={form.publisher} onChange={f('publisher')} disabled={isReadOnly} />
              </div>
            </div>

            <div className="grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
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

            {/* ✅ FIX: Tampilkan daftar copy dengan ID asli agar terlihat & bisa diverifikasi */}
            {book?.copies?.length > 0 && (
              <div className="form-group">
                <label className="form-label">Daftar Copy Buku</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {book.copies.map(copy => (
                    <div
                      key={copy.id}
                      style={{
                        padding: '8px 12px',
                        border: `1px solid ${copy.status === 'available' ? '#C6F6D5' : '#FED7D7'}`,
                        borderRadius: 8,
                        background: copy.status === 'available' ? '#f0fff4' : '#fff5f5',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: 8
                      }}
                    >
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <strong style={{ fontSize: 13 }}>{copy.copy_code}</strong>
                        {/* ✅ Tampilkan ID copy agar bisa di-debug jika perlu */}
                        <code style={{ fontSize: 10, color: '#999' }}>{copy.id}</code>
                      </div>
                      <span style={{
                        fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20,
                        background: copy.status === 'available' ? '#2D6A4F' : '#c0392b',
                        color: 'white'
                      }}>
                        {copy.status === 'available' ? 'Tersedia' : 'Dipinjam'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Foto Buku {!isEdit && '*'}</label>
              {!isReadOnly && (
                <input
                  type="file"
                  className="form-control"
                  accept="image/*"
                  onChange={f('image')}
                  required={!isEdit}
                />
              )}
              {form.imagePreview && (
                <img
                  src={form.imagePreview}
                  alt="preview"
                  style={{
                    width: 120, height: 160, objectFit: 'cover',
                    borderRadius: 8, marginTop: 12, border: '1px solid #ddd'
                  }}
                />
              )}
            </div>

            <div style={{
              display: 'flex', justifyContent: 'flex-end', gap: 12,
              marginTop: 24, paddingTop: 20, borderTop: '1px solid #eee'
            }}>
              <button type="button" className="btn btn-ghost" onClick={onClose}>Tutup</button>

              {isReadOnly && (user?.role === 'mahasiswa' || user?.role === 'dosen') && (
                isAvailable ? (
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleBorrowAction}
                    disabled={loadingBorrow}
                  >
                    {loadingBorrow ? 'Memproses...' : 'Pinjam Buku'}
                  </button>
                ) : (
                  <RemindMeButton
                    book={book}
                    user={user}
                    addReminder={addReminder}
                    reminders={reminders}
                  />
                )
              )}

              {!isReadOnly && (
                <button type="submit" className="btn btn-primary">Simpan</button>
              )}
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

function BookCard({ book, onSelect, onDetail, isPetugas, selected }) {
  const isAvailable = getAvailableCopies(book).length > 0;

  return (
    <div
      onClick={() => onSelect(book)}
      style={{
        background: '#fff',
        borderRadius: 12,
        overflow: 'hidden',
        border: selected?.includes(book.id) ? '2px solid #7B1C1C' : '1px solid #eee',
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
      <div style={{
        position: 'relative', background: '#f7f3f0',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: 160, overflow: 'hidden',
      }}>
        {book.image_url ? (
          <ApiImage src={book.image_url} alt={book.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <BookCover no_klasifikasi={book.no_klasifikasi} size="lg" />
        )}
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

      <div style={{ padding: '12px 14px', flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
        <span style={{ fontSize: 10, fontWeight: 600, color: '#7B1C1C', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          {book.category}
        </span>
        <div style={{
          fontWeight: 700, fontSize: 13, color: '#1a1a1a', lineHeight: 1.35,
          overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical'
        }}>
          {book.title}
        </div>
        <div style={{ fontSize: 11, color: '#777', marginTop: 2 }}>{book.author}</div>

        <div style={{
          marginTop: 'auto', paddingTop: 10,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
          flexWrap: 'nowrap', borderTop: '1px solid #f0ebe6'
        }}>
          <code style={{ background: '#f0ebe6', padding: '2px 7px', borderRadius: 4, fontSize: 10, color: '#555' }}>
            {book.no_induk}
          </code>
          <span style={{ fontSize: 9.5, fontWeight: 600, whiteSpace: 'nowrap', flexShrink: 0, color: isAvailable ? '#2D6A4F' : '#c0392b' }}>
            {getAvailableCopies(book).length}/{book.copies?.length || 0} unit
          </span>
        </div>

        <div
          onClick={(e) => { e.stopPropagation(); onDetail(book); }}
          style={{
            marginTop: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: 5, padding: '6px', borderRadius: 7, background: '#f7f3f0',
            color: '#7B1C1C', fontSize: 11, fontWeight: 600, cursor: 'pointer'
          }}
        >
          <Eye size={11} /> Lihat Detail
        </div>
      </div>
    </div>
  );
}

export default function BukuPage() {
  const { books, addBook, updateBook } = useApp();
  const { user } = useAuth();
  const isPetugas = user?.role === 'petugas';
  const isAdmin = user?.role === 'admin';
  const isAdminOrPetugas = isPetugas || isAdmin;

  const [filter, setFilter] = useState('Semua Kategori');
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState('list');
  const booksPerPage = viewMode === 'grid' ? 12 : 10;
  const [modal, setModal] = useState(null);
  const [selected, setSelected] = useState([]);

  const totalJudul = books.length;
  const totalUnitTersedia = books.reduce((s, b) => s + getAvailableCopies(b).length, 0);
  const totalDipinjam = books.reduce((s, b) => s + getBorrowedCopies(b).length, 0);
  const totalJudulHabis = books.filter(b => getAvailableCopies(b).length === 0).length;

  const filteredBooks = books.filter(b => {
    const matchCat = filter === 'Semua Kategori' || b.category === filter;
    const matchSearch = !search
      || b.title?.toLowerCase().includes(search.toLowerCase())
      || b.no_induk?.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const totalPages = Math.ceil(filteredBooks.length / booksPerPage);
  const startIndex = (currentPage - 1) * booksPerPage;
  const filtered = filteredBooks.slice(startIndex, startIndex + booksPerPage);

  const handleRowClick = (book) => {
    if (isPetugas) { toggleSelect(book.id); return; }
    setModal({ mode: 'view', book });
  };

  const toggleSelect = (id) => {
    setSelected((prev) => prev.includes(id) ? [] : [id]);
  };

  // ✅ FIX: Handler save yang benar untuk mode EDIT
  // Preserve semua copies yang sudah ada (borrowed maupun available) dengan ID aslinya
  // Hanya generate copies BARU jika stok bertambah
  const handleSave = (f, existingBook) => {
    if (existingBook) {
      // MODE EDIT: preserve copies lama, tambah/kurangi sesuai stok baru
      const newStock = Number(f.stock);
      const oldCopies = existingBook.copies || [];
      const borrowedCopies = oldCopies.filter(c => c.status === 'borrowed');
      const availableCopies = oldCopies.filter(c => c.status === 'available');

      let updatedCopies;

      if (newStock >= oldCopies.length) {
        // Stok bertambah atau sama: pertahankan semua copies lama + tambah yang baru
        const additionalCount = newStock - oldCopies.length;
        const newCopies = generateCopies(f.no_induk, additionalCount).map((copy, i) => ({
          ...copy,
          copy_code: `${f.no_induk}-${String(oldCopies.length + i + 1).padStart(3, '0')}`
        }));
        updatedCopies = [...oldCopies, ...newCopies];
      } else {
        // Stok berkurang: prioritaskan pertahankan yang borrowed dulu, sisanya available
        const keepAvailable = availableCopies.slice(0, newStock - borrowedCopies.length);
        updatedCopies = [...borrowedCopies, ...keepAvailable];
      }

      updateBook(existingBook.id, { ...f, copies: updatedCopies });
    } else {
      // MODE TAMBAH BARU: generate semua copies fresh
      const copies = generateCopies(f.no_induk, Number(f.stock));
      addBook({ ...f, copies });
    }
    setModal(null);
  };

  return (
    <div>
      {modal && (
        <BookModal
          book={modal.book}
          user={user}
          onSave={(f) => handleSave(f, modal.mode === 'edit' ? modal.book : null)}
          onClose={() => setModal(null)}
          isReadOnly={modal.mode === 'view'}
        />
      )}

      <div className="page-header">
        <div className="page-breadcrumb">{isAdminOrPetugas ? 'DATA ADMINISTRASI BUKU' : 'DATA BUKU'}</div>
        <h1 className="page-title">{isAdminOrPetugas ? 'Manajemen Buku' : 'Katalog Koleksi Buku'}</h1>
        <p className="page-subtitle">
          Selamat datang, <strong>{user?.name || 'User'}</strong>! Kelola dan pantau ketersediaan koleksi ilmiah FMIPA.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid-4 mb-24" style={{ gap: '16px' }}>
        <div style={{ background: 'linear-gradient(135deg, #fff5f5, #ffffff)', border: '1.5px solid #FED7D7', borderRadius: 14, padding: '20px 22px', minHeight: 120, boxShadow: '0 2px 8px rgba(229,62,62,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: 11, color: '#E53E3E', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600, marginBottom: 6 }}>Koleksi Buku</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: '#E53E3E', lineHeight: 1, fontFamily: "'DM Mono', monospace" }}>{totalJudul}</div>
          </div>
          <div style={{ width: 42, height: 42, borderRadius: 12, background: '#fff1f1', border: '1px solid #FED7D7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#E53E3E' }}>
            <BookOpen size={18} />
          </div>
        </div>

        <div style={{ background: 'linear-gradient(135deg, #fffaf0, #ffffff)', border: '1.5px solid #FEEBC8', borderRadius: 14, padding: '20px 22px', minHeight: 120, boxShadow: '0 2px 8px rgba(214,158,46,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: 11, color: '#D69E2E', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600, marginBottom: 6 }}>Buku Tersedia</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: '#D69E2E', lineHeight: 1, fontFamily: "'DM Mono', monospace" }}>{totalUnitTersedia}</div>
          </div>
          <div style={{ width: 42, height: 42, borderRadius: 12, background: '#fff7e6', border: '1px solid #FEEBC8', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#D69E2E' }}>
            <CheckCircle size={18} />
          </div>
        </div>

        <div style={{ background: 'linear-gradient(135deg, #f0fff4, #ffffff)', border: '1.5px solid #C6F6D5', borderRadius: 14, padding: '20px 22px', minHeight: 120, boxShadow: '0 2px 8px rgba(56,161,105,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: 11, color: '#38A169', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600, marginBottom: 6 }}>Buku Dipinjam</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: '#38A169', lineHeight: 1, fontFamily: "'DM Mono', monospace" }}>{totalDipinjam}</div>
          </div>
          <div style={{ width: 42, height: 42, borderRadius: 12, background: '#ecfff3', border: '1px solid #C6F6D5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#38A169' }}>
            <Clock size={18} />
          </div>
        </div>

        <div style={{ background: 'linear-gradient(135deg, #eff6ff, #ffffff)', border: '1.5px solid #BFDBFE', borderRadius: 14, padding: '20px 22px', minHeight: 120, boxShadow: '0 2px 8px rgba(37,99,235,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: 11, color: '#2563EB', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600, marginBottom: 6 }}>Buku Habis</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: '#2563EB', lineHeight: 1, fontFamily: "'DM Mono', monospace" }}>{totalJudulHabis}</div>
          </div>
          <div style={{ width: 42, height: 42, borderRadius: 12, background: '#eef4ff', border: '1px solid #BFDBFE', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563EB' }}>
            <XCircle size={18} />
          </div>
        </div>
      </div>

      <div className="card">
        {/* ── TOOLBAR ── */}
        <div className="mb-16" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

          {/* Baris 1: Tombol aksi */}
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
                <Eye size={14} /> Klik tombol "Lihat Detail" atau select kolom untuk melihat informasi buku
              </div>
            )}
          </div>

          {/* Baris 2: Toggle List/Grid */}
          <div style={{ display: 'flex', background: '#f0ebe6', borderRadius: 8, padding: 3, gap: 2, alignSelf: 'flex-start' }}>
            <button
              onClick={() => setViewMode('list')}
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '5px 10px', borderRadius: 6, border: 'none',
                background: viewMode === 'list' ? '#7B1C1C' : 'transparent',
                color: viewMode === 'list' ? 'white' : '#888',
                fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s'
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
                fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s'
              }}
            >
              <LayoutGrid size={13} /> Grid
            </button>
          </div>

          {/* Baris 3: Search + Filter */}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: 140 }}>
              <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#999' }} />
              <input
                className="form-control"
                style={{ width: '100%', paddingLeft: 32 }}
                placeholder="Cari judul atau no. induk..."
                value={search}
                onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
              />
            </div>
            <select
              className="form-control"
              style={{ minWidth: 130, maxWidth: 180 }}
              value={filter}
              onChange={e => { setFilter(e.target.value); setCurrentPage(1); }}
            >
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        {isPetugas && (
          <div style={{
            marginBottom: 16, padding: '10px 14px', borderRadius: 10,
            background: 'rgba(123,28,28,0.06)', border: '1px solid rgba(123,28,28,0.12)',
            color: '#7B1C1C', fontSize: 13, fontWeight: 500
          }}>
            📌 Silakan pilih salah satu buku terlebih dahulu untuk mengedit data buku.
          </div>
        )}

        {/* ── GRID VIEW ── */}
        {viewMode === 'grid' ? (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(min(45%, 160px), 1fr))',
            gap: 16,
            padding: '4px 0'
          }}>
            {filtered.map(b => (
              <BookCard
                key={b.id}
                book={b}
                isPetugas={isPetugas}
                selected={selected}
                onSelect={(book) => { if (isPetugas) toggleSelect(book.id); }}
                onDetail={(book) => setModal({ mode: 'view', book })}
              />
            ))}
            {filtered.length === 0 && (
              <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: 48, color: '#aaa', fontSize: 13 }}>
                Tidak ada buku yang ditemukan.
              </div>
            )}
          </div>
        ) : (
          /* ── LIST / TABLE VIEW ── */
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
                      background: selected.includes(b.id) ? 'rgba(123,28,28,0.10)' : '#fff',
                      borderLeft: selected.includes(b.id) ? '5px solid #7B1C1C' : '5px solid transparent',
                      boxShadow: selected.includes(b.id) ? '0 2px 10px rgba(123,28,28,0.12)' : 'none',
                      transition: 'all 0.18s ease',
                      cursor: 'pointer'
                    }}
                  >
                    <td style={{ width: 40 }}>
                      {selected.includes(b.id) && (
                        <div style={{
                          width: 22, height: 22, borderRadius: '50%',
                          background: '#7B1C1C', color: 'white',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 12, fontWeight: 700
                        }}>✓</div>
                      )}
                    </td>
                    <td>
                      {b.image_url ? (
                        <ApiImage
                          src={b.image_url}
                          alt={b.title}
                          style={{ width: 44, height: 58, objectFit: 'cover', borderRadius: 4 }}
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
                    <td style={{ fontWeight: 600 }}>{b.copies?.length || 0}</td>
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
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          marginTop: 20, paddingTop: 16, borderTop: '1px solid #eee'
        }}>
          <div style={{ fontSize: 13, color: '#666' }}>Halaman {currentPage} dari {totalPages}</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              className="btn btn-ghost btn-sm"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(p => p - 1)}
              style={{ opacity: currentPage === 1 ? 0.5 : 1 }}
            >← Sebelumnya</button>
            <button
              className="btn btn-primary btn-sm"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(p => p + 1)}
              style={{ opacity: currentPage === totalPages ? 0.5 : 1 }}
            >Selanjutnya →</button>
          </div>
        </div>
      )}
    </div>
  );
}