import { useState, useMemo } from 'react';
import {
  Search, BookOpen, BookX, Eye, X, CheckCircle, XCircle,
  Clock, Filter, GraduationCap, Layers, BookMarked, LayoutGrid, List,
} from 'lucide-react';
import { useApp } from '../components/AppContext';
import { useAuth } from '../components/AuthContext';

// ─── Konstanta ────────────────────────────────────────────────────────────────
const DISCIPLINES = ['Semua Disiplin', 'Mathematics', 'Physics', 'Chemistry', 'Biology'];

const DISCIPLINE_META = {
  Mathematics: { color: '#7B1C1C', bg: 'rgba(123,28,28,0.08)', label: 'MTK' },
  Physics:     { color: '#0D1B2A', bg: 'rgba(13,27,42,0.08)',  label: 'FIS' },
  Chemistry:   { color: '#1B5E20', bg: 'rgba(27,94,32,0.08)',  label: 'KIM' },
  Biology:     { color: '#1A237E', bg: 'rgba(26,35,126,0.08)', label: 'BIO' },
};

const CODE_COLORS = { MTK: '#7B1C1C', FIS: '#0D1B2A', KIM: '#1B5E20', BIO: '#1A237E' };

// ─── Helpers ──────────────────────────────────────────────────────────────────
const getPrefix = (code) => code?.split('-')[0] || 'BK';
const getCoverColor = (code) => CODE_COLORS[getPrefix(code)] || '#555';

// ─── Status Badge ─────────────────────────────────────────────────────────────
function StatusBadge({ available, size = 'sm' }) {
  const pad = size === 'lg' ? '5px 14px' : '3px 10px';
  const fs  = size === 'lg' ? 12 : 11;
  if (available === 0)
    return <span className="badge badge-danger"   style={{ padding: pad, fontSize: fs, gap: 4 }}><XCircle size={fs} />Tidak Tersedia</span>;
  if (available <= 1)
    return <span className="badge badge-warning"  style={{ padding: pad, fontSize: fs, gap: 4 }}><Clock size={fs} />Terbatas</span>;
  return   <span className="badge badge-success"  style={{ padding: pad, fontSize: fs, gap: 4 }}><CheckCircle size={fs} />Tersedia</span>;
}

// ─── Book Card (Grid view) ────────────────────────────────────────────────────
function BookCard({ book, onClick }) {
  const coverColor = getCoverColor(book.code);
  const prefix     = getPrefix(book.code);
  const meta       = DISCIPLINE_META[book.discipline] || {};

  return (
    <div
      style={{
        background: 'var(--white)',
        border: '1px solid var(--gray-light)',
        borderRadius: 12,
        overflow: 'hidden',
        cursor: 'default',
        transition: 'transform 0.18s, box-shadow 0.18s',
        display: 'flex',
        flexDirection: 'column',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-3px)';
        e.currentTarget.style.boxShadow = '0 8px 28px rgba(0,0,0,0.10)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      {/* Cover */}
      <div style={{
        height: 180,
        background: coverColor,
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        {book.cover ? (
          <img
            src={book.cover}
            alt={book.title}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : null}

        {/* Subtle texture rings */}
        <div style={{
          position: 'absolute', width: 130, height: 130, borderRadius: '50%',
          border: '1px solid rgba(255,255,255,0.08)', top: '50%', left: '50%',
          transform: 'translate(-50%,-50%)',
        }} />
        <div style={{
          position: 'absolute', width: 90, height: 90, borderRadius: '50%',
          border: '1px solid rgba(255,255,255,0.08)', top: '50%', left: '50%',
          transform: 'translate(-50%,-50%)',
        }} />

        {/* Book icon placeholder */}
        <BookMarked size={28} color="rgba(255,255,255,0.35)" style={{ position: 'absolute', top: 12, right: 12 }} />

        <div style={{
          fontSize: 28, fontWeight: 900, color: 'rgba(255,255,255,0.18)',
          fontFamily: "'Playfair Display', serif", letterSpacing: 2,
          position: 'absolute', bottom: 8, right: 12,
        }}>
          {prefix}
        </div>

        {/* Availability dot */}
        <div style={{
          position: 'absolute', top: 12, left: 12,
          width: 10, height: 10, borderRadius: '50%',
          background: book.available === 0 ? 'var(--danger)' : book.available <= 1 ? 'var(--warning)' : '#4CAF50',
          boxShadow: '0 0 0 3px rgba(255,255,255,0.25)',
        }} />

        {/* Stock pill */}
        <div style={{
          position: 'absolute', bottom: 10, left: 12,
          background: 'rgba(255,255,255,0.15)',
          backdropFilter: 'blur(4px)',
          borderRadius: 20, padding: '2px 10px',
          fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.9)',
          letterSpacing: 0.5,
        }}>
          {book.available}/{book.stock} tersedia
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: '14px 14px 16px', flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
        {/* Discipline tag */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
          <span style={{
            fontSize: 10, fontWeight: 700, letterSpacing: 1,
            textTransform: 'uppercase', color: meta.color || 'var(--gray-text)',
            background: meta.bg || 'var(--gray-light)',
            padding: '2px 8px', borderRadius: 4,
          }}>
            {book.discipline}
          </span>
          <span style={{ fontSize: 10, color: 'var(--gray-text)' }}>{book.year}</span>
        </div>

        {/* Title */}
        <div style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: 14, fontWeight: 700, color: 'var(--navy)',
          lineHeight: 1.35,
          display: '-webkit-box', WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical', overflow: 'hidden',
          flex: 1,
        }}>
          {book.title}
        </div>

        {/* Author */}
        <div style={{ fontSize: 12, color: 'var(--gray-text)', marginTop: 2 }}>
          {book.author}
        </div>

        {/* Footer */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--gray-light)',
        }}>
          <StatusBadge available={book.available} />
          <button
            className="btn btn-outline btn-sm"
            style={{ gap: 4, padding: '4px 10px', fontSize: 11 }}
            onClick={(e) => {
              e.stopPropagation();
              onClick();
            }}
          >
            <Eye size={11} /> Detail
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Book Row (List view) ─────────────────────────────────────────────────────
function BookRow({ book, onClick }) {
  return (
    <tr style={{ cursor: 'pointer' }} onClick={onClick}>
      <td>
        <div style={{
          width: 44, height: 58, borderRadius: 5, flexShrink: 0,
          background: getCoverColor(book.code),
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'rgba(255,255,255,0.9)', fontSize: 9, fontWeight: 700,
        }}>
          {getPrefix(book.code)}
        </div>
      </td>
      <td>
        <code style={{ background: 'var(--gray-light)', padding: '2px 6px', borderRadius: 4, fontSize: 11 }}>
          {book.code}
        </code>
      </td>
      <td>
        <div style={{ fontWeight: 600, fontSize: 13 }}>{book.title}</div>
        <div style={{ fontSize: 11, color: 'var(--gray-text)' }}>{book.isbn}</div>
      </td>
      <td style={{ color: 'var(--gray-text)', fontSize: 13 }}>{book.author}</td>
      <td>
        {(() => {
          const meta = DISCIPLINE_META[book.discipline] || {};
          return (
            <span style={{
              fontSize: 10, fontWeight: 700, letterSpacing: 1,
              textTransform: 'uppercase', color: meta.color || 'var(--gray-text)',
              background: meta.bg || 'var(--gray-light)',
              padding: '3px 9px', borderRadius: 4,
            }}>
              {book.discipline}
            </span>
          );
        })()}
      </td>
      <td style={{ fontSize: 13 }}>{book.year}</td>
      <td style={{ fontWeight: 600 }}>{book.stock}</td>
      <td style={{ fontWeight: 700, color: book.available === 0 ? 'var(--danger)' : 'var(--success)' }}>
        {book.available}
      </td>
      <td><StatusBadge available={book.available} /></td>
      <td>
        <button className="btn btn-ghost btn-sm" style={{ gap: 4 }}>
          <Eye size={12} /> Lihat
        </button>
      </td>
    </tr>
  );
}

// ─── Modal Detail Buku ────────────────────────────────────────────────────────
function BookDetailModal({ book, onClose }) {
  if (!book) return null;
  const coverColor = getCoverColor(book.code);
  const prefix     = getPrefix(book.code);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 520, padding: 0, overflow: 'hidden' }} onClick={e => e.stopPropagation()}>

        {/* Hero cover band */}
        <div style={{
          background: `linear-gradient(160deg, ${coverColor} 0%, ${coverColor}bb 100%)`,
          padding: '28px 28px 24px',
          display: 'flex', gap: 20, alignItems: 'flex-end', position: 'relative',
        }}>
          {/* rings */}
          <div style={{ position: 'absolute', right: -40, bottom: -40, width: 180, height: 180, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.07)' }} />
          <div style={{ position: 'absolute', right: -10, bottom: -10, width: 110, height: 110, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.07)' }} />

          {/* Spine block */}
          <div style={{
            width: 72, height: 96, borderRadius: 6, flexShrink: 0,
            background: 'rgba(255,255,255,0.12)',
            border: '1px solid rgba(255,255,255,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'rgba(255,255,255,0.9)', fontFamily: "'Playfair Display', serif",
            fontSize: 15, fontWeight: 900, letterSpacing: 2,
            boxShadow: '4px 4px 16px rgba(0,0,0,0.25)',
          }}>
            {prefix}
          </div>

          <div style={{ flex: 1 }}>
            <div style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: 20, fontWeight: 700, color: 'white',
              lineHeight: 1.25, marginBottom: 6,
            }}>
              {book.title}
            </div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', marginBottom: 12 }}>
              {book.author}
            </div>
            <StatusBadge available={book.available} size="lg" />
          </div>

          {/* Close */}
          <button
            onClick={onClose}
            style={{
              position: 'absolute', top: 16, right: 16,
              background: 'rgba(255,255,255,0.12)', border: 'none', borderRadius: '50%',
              width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: 'white',
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: 24 }}>
          {/* Stats row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 20 }}>
            {[
              { label: 'Total Stok', value: book.stock, color: 'var(--navy)' },
              { label: 'Tersedia', value: book.available, color: book.available === 0 ? 'var(--danger)' : 'var(--success)' },
              { label: 'Dipinjam', value: book.stock - book.available, color: 'var(--warning)' },
            ].map(s => (
              <div key={s.label} style={{
                background: 'var(--off-white)', borderRadius: 8,
                padding: '12px 14px', textAlign: 'center',
              }}>
                <div style={{ fontSize: 22, fontWeight: 700, color: s.color }}>{s.value}</div>
                <div style={{ fontSize: 10, color: 'var(--gray-text)', textTransform: 'uppercase', letterSpacing: 1, marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Detail grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
            {[
              ['Kode Buku', <code key="c" style={{ background: 'var(--gray-light)', padding: '2px 6px', borderRadius: 4, fontSize: 11 }}>{book.code}</code>],
              ['Disiplin', (() => {
                const meta = DISCIPLINE_META[book.discipline] || {};
                return <span key="d" style={{ fontSize: 11, fontWeight: 700, color: meta.color, background: meta.bg, padding: '2px 8px', borderRadius: 4, letterSpacing: 0.5, textTransform: 'uppercase' }}>{book.discipline}</span>;
              })()],
              ['Tahun Terbit', book.year],
              ['ISBN', book.isbn || '—'],
              ['Penerbit', book.publisher || '—'],
            ].map(([label, val]) => (
              <div key={label} style={{ background: 'var(--off-white)', borderRadius: 7, padding: '10px 12px' }}>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: 'var(--gray-text)', marginBottom: 4 }}>{label}</div>
                <div style={{ fontSize: 13, color: 'var(--navy)' }}>{val}</div>
              </div>
            ))}
          </div>

          {/* Deskripsi */}
          {book.description && (
            <div style={{ background: 'var(--off-white)', borderRadius: 7, padding: '12px 14px', marginBottom: 16 }}>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: 'var(--gray-text)', marginBottom: 6 }}>Deskripsi</div>
              <p style={{ fontSize: 13, color: 'var(--navy)', lineHeight: 1.65, margin: 0 }}>{book.description}</p>
            </div>
          )}

          {/* Alert tidak tersedia */}
          {book.available === 0 && (
            <div style={{
              background: 'rgba(183,28,28,0.06)', border: '1px solid rgba(183,28,28,0.18)',
              borderRadius: 8, padding: '10px 14px', fontSize: 13, color: 'var(--danger)',
              display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16,
            }}>
              <XCircle size={15} style={{ flexShrink: 0 }} />
              Buku ini sedang tidak tersedia. Hubungi petugas perpustakaan untuk informasi lebih lanjut.
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button className="btn btn-ghost" onClick={onClose}>Tutup</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── MahasiswaPage ────────────────────────────────────────────────────────────
export default function MahasiswaPage() {
  const { books = [] } = useApp() || {};
  const { user } = useAuth();

  const [search, setSearch]             = useState('');
  const [discipline, setDiscipline]     = useState('Semua Disiplin');
  const [statusFilter, setStatusFilter] = useState('Semua');
  const [rowsPerPage, setRowsPerPage]   = useState(20);
  const [selectedBook, setSelectedBook] = useState(null);
  const [viewMode, setViewMode]         = useState('grid'); // 'grid' | 'list'

  const filtered = useMemo(() => (books || []).filter(b => {
    const q = search.toLowerCase();
    const matchSearch = !q
      || b.title.toLowerCase().includes(q)
      || b.author.toLowerCase().includes(q)
      || b.code.toLowerCase().includes(q);
    const matchDis    = discipline === 'Semua Disiplin' || b.discipline === discipline;
    const matchStatus = statusFilter === 'Semua'
      || (statusFilter === 'Tersedia'       && b.available > 0)
      || (statusFilter === 'Tidak Tersedia' && b.available === 0);
    return matchSearch && matchDis && matchStatus;
  }), [books, search, discipline, statusFilter]);

  const displayed        = filtered.slice(0, rowsPerPage);
  const totalAvailable   = (books || []).filter(b => b.available > 0).length;
  const totalUnavailable = (books || []).filter(b => b.available === 0).length;
  const totalBorrowed    = (books || []).reduce((s, b) => s + (b.stock - b.available), 0);

  return (
    <div>
      {selectedBook && (
        <BookDetailModal book={selectedBook} onClose={() => setSelectedBook(null)} />
      )}

      {/* ── Page Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div className="page-header" style={{ margin: 0 }}>
          <div className="page-breadcrumb">Portal Mahasiswa</div>
          <h1 className="page-title">Katalog Koleksi Buku</h1>
          <p className="page-subtitle">
            Selamat datang, <strong>{user?.name}</strong>! Cek ketersediaan buku sebelum berkunjung ke perpustakaan.
          </p>
        </div>

        {/* Discipline pills */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end', maxWidth: 340 }}>
          {Object.entries(DISCIPLINE_META).map(([key, meta]) => {
            const count = (books || []).filter(b => b.discipline === key).length;
            return (
              <button
                key={key}
                onClick={() => setDiscipline(discipline === key ? 'Semua Disiplin' : key)}
                style={{
                  padding: '5px 13px', borderRadius: 20, fontSize: 11, fontWeight: 700,
                  letterSpacing: 0.5, cursor: 'pointer', transition: 'all 0.15s',
                  border: `1.5px solid ${discipline === key ? meta.color : 'var(--gray-mid)'}`,
                  background: discipline === key ? meta.color : 'transparent',
                  color: discipline === key ? 'white' : meta.color,
                }}
              >
                {meta.label} · {count}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid-4 mb-24">
        <div className="stat-card">
          <div className="stat-icon maroon"><Layers size={18} /></div>
          <div>
            <div className="stat-value">{(books || []).length}</div>
            <div className="stat-label">Total Judul</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green"><CheckCircle size={18} /></div>
          <div>
            <div className="stat-value">{totalAvailable}</div>
            <div className="stat-label">Judul Tersedia</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon orange"><BookOpen size={18} /></div>
          <div>
            <div className="stat-value">{totalBorrowed}</div>
            <div className="stat-label">Eksemplar Dipinjam</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon navy"><BookX size={18} /></div>
          <div>
            <div className="stat-value">{totalUnavailable}</div>
            <div className="stat-label">Judul Habis</div>
          </div>
        </div>
      </div>

      {/* ── Info Banner ── */}
      <div style={{
        background: 'linear-gradient(135deg, var(--maroon) 0%, var(--maroon-dark) 100%)',
        borderRadius: 10, padding: '14px 20px',
        display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20,
      }}>
        <div style={{
          width: 36, height: 36, borderRadius: 8,
          background: 'rgba(255,255,255,0.15)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <GraduationCap size={18} color="white" />
        </div>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.9)', lineHeight: 1.55, margin: 0 }}>
          <strong style={{ color: 'white' }}>Cara Meminjam:</strong> Temukan buku yang dibutuhkan di katalog ini, lalu kunjungi ruang perpustakaan FMIPA dan sampaikan kepada petugas.
          Peminjaman mahasiswa maksimal <strong style={{ color: 'white' }}>14 hari</strong>.
        </p>
      </div>

      {/* ── Toolbar + Table/Grid ── */}
      <div className="card">

        {/* Toolbar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginBottom: 16 }}>
          {/* Left: filter icon + count */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Filter size={14} style={{ color: 'var(--gray-text)' }} />
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--navy)' }}>
              {filtered.length} buku ditemukan
            </span>
            {(search || discipline !== 'Semua Disiplin' || statusFilter !== 'Semua') && (
              <button
                className="btn btn-ghost btn-sm"
                style={{ fontSize: 11, padding: '3px 10px' }}
                onClick={() => { setSearch(''); setDiscipline('Semua Disiplin'); setStatusFilter('Semua'); }}
              >
                × Reset filter
              </button>
            )}
          </div>

          {/* Right: controls */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            {/* Search */}
            <div style={{ position: 'relative' }}>
              <Search size={13} style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-text)' }} />
              <input
                className="form-control"
                style={{ paddingLeft: 30, width: 210 }}
                placeholder="Judul, penulis, kode..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>

            {/* Discipline */}
            <select className="form-control" style={{ width: 170 }} value={discipline} onChange={e => setDiscipline(e.target.value)}>
              {DISCIPLINES.map(d => <option key={d}>{d}</option>)}
            </select>

            {/* Status */}
            <select className="form-control" style={{ width: 155 }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option>Semua</option>
              <option>Tersedia</option>
              <option>Tidak Tersedia</option>
            </select>

            {/* Rows per page (list only) */}
            {viewMode === 'list' && (
              <select className="form-control" style={{ width: 130 }} value={rowsPerPage} onChange={e => setRowsPerPage(Number(e.target.value))}>
                <option value={10}>10 / halaman</option>
                <option value={20}>20 / halaman</option>
                <option value={50}>50 / halaman</option>
              </select>
            )}

            {/* View toggle */}
            <div style={{ display: 'flex', border: '1.5px solid var(--gray-mid)', borderRadius: 7, overflow: 'hidden' }}>
              {[['grid', <LayoutGrid size={14} />], ['list', <List size={14} />]].map(([mode, icon]) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  style={{
                    width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: 'none', cursor: 'pointer', transition: 'all 0.15s',
                    background: viewMode === mode ? 'var(--navy)' : 'transparent',
                    color: viewMode === mode ? 'white' : 'var(--gray-text)',
                  }}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── GRID VIEW ── */}
        {viewMode === 'grid' && (
          <>
            {displayed.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '56px 0', color: 'var(--gray-text)' }}>
                <BookX size={40} style={{ opacity: 0.25, marginBottom: 12 }} />
                <div style={{ fontWeight: 600 }}>Tidak ada buku yang sesuai</div>
                <div style={{ fontSize: 12, marginTop: 4 }}>Coba ubah kata kunci atau filter pencarian</div>
              </div>
            ) : (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))',
                gap: 16,
              }}>
                {displayed.map(b => (
                  <BookCard key={b.id} book={b} onClick={() => setSelectedBook(b)} />
                ))}
              </div>
            )}
          </>
        )}

        {/* ── LIST VIEW ── */}
        {viewMode === 'list' && (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Cover</th>
                  <th>Kode</th>
                  <th>Judul Buku</th>
                  <th>Penulis</th>
                  <th>Kategori</th>
                  <th>Tahun</th>
                  <th>Stok</th>
                  <th>Tersedia</th>
                  <th>Status</th>
                  <th>Detail</th>
                </tr>
              </thead>
              <tbody>
                {displayed.length === 0 ? (
                  <tr>
                    <td colSpan={10} style={{ textAlign: 'center', padding: 48, color: 'var(--gray-text)' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                        <BookX size={32} style={{ opacity: 0.25 }} />
                        <span>Tidak ada buku yang sesuai pencarian</span>
                      </div>
                    </td>
                  </tr>
                ) : displayed.map(b => (
                  <BookRow key={b.id} book={b} onClick={() => setSelectedBook(b)} />
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer info */}
        <div style={{
          marginTop: 16, paddingTop: 12, borderTop: '1px solid var(--gray-light)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          fontSize: 12, color: 'var(--gray-text)', flexWrap: 'wrap', gap: 8,
        }}>
          <span>
            Menampilkan <strong style={{ color: 'var(--navy)' }}>{displayed.length}</strong> dari{' '}
            <strong style={{ color: 'var(--navy)' }}>{filtered.length}</strong> buku
            {filtered.length !== (books || []).length && ` (total koleksi: ${(books || []).length})`}
          </span>
          {viewMode === 'grid' && filtered.length > rowsPerPage && (
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => setRowsPerPage(r => r + 20)}
            >
              Tampilkan lebih banyak
            </button>
          )}
        </div>
      </div>
    </div>
  );
}