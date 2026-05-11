import { useState } from 'react';
import { Search, Plus, Clock, AlertCircle, Filter, Calendar, BookOpen, RefreshCw, ChevronRight, User, Hash } from 'lucide-react';
import { useApp } from '../components/AppContext';
import ApiImage from '../components/ApiImage';

const COVER_COLORS = { MTK: '#7B1C1C', FIS: '#0D1B2A', KIM: '#1B5E20', BIO: '#1A237E' };

const PERIOD_OPTIONS = [
  { value: 'all', label: 'Semua Waktu' },
  { value: 'daily', label: 'Hari Ini' },
  { value: 'weekly', label: 'Minggu Ini' },
  { value: 'monthly', label: 'Bulan Ini' },
  { value: 'yearly', label: 'Tahun Ini' },
];

// Aturan per tipe anggota
const RULES = {
  mahasiswa: { maxBuku: 3, hariPinjam: 7, maxPerpanjangan: 2, labelDurasi: '7 hari' },
  dosen: { maxBuku: 10, hariPinjam: 30, maxPerpanjangan: 2, labelDurasi: '30 hari' },
};

function daysUntilDue(dueDate) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);
  return Math.ceil((due - today) / (1000 * 60 * 60 * 24));
}

function formatDate(dateStr) {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
}

function DueBadge({ dueDate, status, jumlahPerpanjangan = 0 }) {
  if (status === 'dikembalikan') return (
    <span style={{ background: 'rgba(46,125,50,0.12)', color: '#2E7D32', padding: '2px 10px', borderRadius: 20, fontSize: 10, fontWeight: 700 }}>Selesai</span>
  );
  const days = daysUntilDue(dueDate);
  if (days < 0) return (
    <span style={{ background: 'rgba(183,28,28,0.15)', color: '#B71C1C', padding: '2px 10px', borderRadius: 20, fontSize: 10, fontWeight: 700 }}>
      Terlambat {Math.abs(days)}h
    </span>
  );
  if (days === 0) return (
    <span style={{ background: 'rgba(245,158,11,0.15)', color: '#92400E', padding: '2px 10px', borderRadius: 20, fontSize: 10, fontWeight: 700 }}>Hari ini!</span>
  );
  if (days <= 3) return (
    <span style={{ background: 'rgba(245,158,11,0.12)', color: '#B45309', padding: '2px 10px', borderRadius: 20, fontSize: 10, fontWeight: 700 }}>Jatuh tempo {days}h</span>
  );
  return (
    <span style={{ background: 'rgba(46,125,50,0.12)', color: '#2E7D32', padding: '2px 10px', borderRadius: 20, fontSize: 10, fontWeight: 700 }}>Sisa {days}h</span>
  );
}

function ExtendBadge({ jumlahPerpanjangan, maxPerpanjangan = 2 }) {
  const color = jumlahPerpanjangan >= maxPerpanjangan ? '#991B1B' : jumlahPerpanjangan > 0 ? '#B45309' : '#6b7280';
  const bg = jumlahPerpanjangan >= maxPerpanjangan ? 'rgba(153,27,27,0.1)' : jumlahPerpanjangan > 0 ? 'rgba(180,83,9,0.1)' : '#f3f4f6';
  return (
    <span style={{ background: bg, color, padding: '2px 8px', borderRadius: 20, fontSize: 10, fontWeight: 700 }}>
      Perpanjangan {jumlahPerpanjangan}/{maxPerpanjangan}
    </span>
  );
}

export default function PetugasPeminjamanPage() {
  const { books, members, loans, addLoan, extendLoan } = useApp();
  const [nimInput, setNimInput] = useState('');
  const [bookCodeInput, setBookCodeInput] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [period, setPeriod] = useState('all');
  const [extendLoading, setExtendLoading] = useState(null);
  const [extendResult, setExtendResult] = useState(null);

  const findMemberByNim = (nim) => members.find(m => m.nim === nim || m.nip === nim || String(m.id) === nim);

  // Hitung pinjaman aktif user
  const getActiveLoanCount = (memberId) =>
    loans.filter(l => l.memberId === memberId && (l.status === 'dipinjam' || l.status === 'terlambat' || l.status === 'diperpanjang')).length;

  // Cek apakah user sudah pinjam buku yang sama
  const hasSameBookLoan = (memberId, bookCode) =>
    loans.some(l => l.memberId === memberId && l.bookCode === bookCode && (l.status === 'dipinjam' || l.status === 'terlambat' || l.status === 'diperpanjang'));

  // Cek denda belum bayar
  const hasUnpaidFine = (memberId) =>
    loans.some(l => l.memberId === memberId && l.status === 'dikembalikan' && (l.denda || 0) > 0 && !l.dendaBayar);

  const validateLoan = (member, bookCode) => {
    const tipe = member.type?.toLowerCase();
    if (!['mahasiswa', 'dosen'].includes(tipe)) {
      return { valid: false, msg: `${member.name} (${member.type}) tidak memiliki hak peminjaman.` };
    }

    const book = books.find(b => b.no_induk === bookCode);
    if (!book) return { valid: false, msg: 'Kode buku tidak ditemukan di sistem.' };
    if ((book.available || 0) <= 0) return { valid: false, msg: `Stok buku "${book.title}" habis, tidak tersedia untuk dipinjam.` };

    if (hasUnpaidFine(member.id)) {
      return { valid: false, msg: `${member.name} masih memiliki denda yang belum dibayar. Selesaikan terlebih dahulu.` };
    }

    if (hasSameBookLoan(member.id, bookCode)) {
      return { valid: false, msg: `${member.name} sudah meminjam buku ini dan belum mengembalikannya.` };
    }

    const rule = RULES[tipe];
    const activeCount = getActiveLoanCount(member.id);
    if (activeCount >= rule.maxBuku) {
      return { valid: false, msg: `${member.name} sudah meminjam ${activeCount} buku (maks. ${rule.maxBuku} untuk ${tipe}). Kembalikan buku terlebih dahulu.` };
    }

    return { valid: true, book, rule };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setResult(null);

    const member = findMemberByNim(nimInput.trim());
    if (!member) {
      setError('Anggota tidak ditemukan. Periksa NIM/NIP yang dimasukkan.');
      return;
    }

    const validation = validateLoan(member, bookCodeInput.trim());
    if (!validation.valid) {
      setError(validation.msg);
      return;
    }

    const res = await addLoan(bookCodeInput.trim(), member.id);
    if (res.success) {
      setResult({ memberFull: member, book: validation.book, rule: validation.rule });
      setNimInput('');
      setBookCodeInput('');
    } else {
      setError(res.message);
    }
  };

  const handleExtend = async (loan) => {
    setExtendLoading(loan.id);
    setExtendResult(null);

    const days = daysUntilDue(loan.dueDate);
    const tipe = loan.memberType?.toLowerCase() || 'mahasiswa';
    const rule = RULES[tipe] || RULES.mahasiswa;
    const maxExt = rule.maxPerpanjangan;
    const jumlahExt = loan.jumlahPerpanjangan || 0;

    if (days < 0) {
      setExtendResult({ id: loan.id, success: false, msg: 'Tidak bisa diperpanjang — buku sudah melewati batas waktu.' });
      setExtendLoading(null);
      return;
    }
    if (jumlahExt >= maxExt) {
      setExtendResult({ id: loan.id, success: false, msg: `Sudah mencapai batas maksimal perpanjangan (${maxExt}x).` });
      setExtendLoading(null);
      return;
    }

    const res = await extendLoan(loan.id, rule.hariPinjam);
    setExtendResult({ id: loan.id, success: res.success, msg: res.success ? `Diperpanjang ${rule.hariPinjam} hari. Perpanjangan ke-${jumlahExt + 1} dari ${maxExt}.` : res.message });
    setExtendLoading(null);
  };

  const filterByPeriod = (items) => {
    if (period === 'all') return items;
    const now = new Date();
    return items.filter(item => {
      const date = new Date(item.loanDate || item.borrowDate);
      if (period === 'daily') return date.toDateString() === now.toDateString();
      if (period === 'weekly') return (now - date) / (1000 * 60 * 60 * 24) <= 7;
      if (period === 'monthly') return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
      if (period === 'yearly') return date.getFullYear() === now.getFullYear();
      return true;
    });
  };

  // Auto-update status terlambat
  const processedLoans = loans.map(l => {
    if ((l.status === 'dipinjam' || l.status === 'diperpanjang') && daysUntilDue(l.dueDate) < 0) {
      return { ...l, status: 'terlambat' };
    }
    return l;
  });

  const activeLoans = processedLoans.filter(l => l.status === 'dipinjam' || l.status === 'terlambat' || l.status === 'diperpanjang');
  const lateCount = processedLoans.filter(l => l.status === 'terlambat').length;

  const filteredActiveLoans = filterByPeriod(activeLoans).filter(l =>
    !search ||
    l.bookTitle?.toLowerCase().includes(search.toLowerCase()) ||
    l.memberName?.toLowerCase().includes(search.toLowerCase()) ||
    l.bookCode?.toLowerCase().includes(search.toLowerCase())
  );

  const stats = [
    { label: 'Total Aktif', value: activeLoans.length, color: '#7B1C1C', bg: 'rgba(123,28,28,0.08)', border: 'rgba(123,28,28,0.2)' },
    { label: 'Terlambat', value: lateCount, color: '#991B1B', bg: 'rgba(153,27,27,0.08)', border: 'rgba(153,27,27,0.2)' },
    { label: 'Buku Tersedia', value: books.filter(b => b.available > 0).length, color: '#2E7D32', bg: 'rgba(46,125,50,0.08)', border: 'rgba(46,125,50,0.2)' },
    { label: 'Total Anggota', value: members.length, color: '#B45309', bg: 'rgba(180,83,9,0.08)', border: 'rgba(180,83,9,0.2)' },
  ];

  const previewMember = nimInput ? findMemberByNim(nimInput.trim()) : null;
  const previewBook = bookCodeInput ? books.find(b => b.no_induk === bookCodeInput.trim()) : null;

  return (
    <div style={{ fontFamily: "'Segoe UI', sans-serif" }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: '#9B2C2C', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: 6 }}>
          Petugas · Transaksi
        </div>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: '#1a1a1a', margin: 0, marginBottom: 5 }}>
          Transaksi Peminjaman
        </h1>
        <p style={{ fontSize: 13, color: '#6b7280', margin: 0 }}>
          Catat peminjaman buku baru dan kelola pinjaman aktif anggota perpustakaan FMIPA.
        </p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 22 }}>
        {stats.map((s, i) => (
          <div key={i} style={{ background: s.bg, border: `1px solid ${s.border}`, borderRadius: 12, padding: '14px 16px' }}>
            <div style={{ fontSize: 26, fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.value}</div>
            <div style={{ fontSize: 11, color: '#6b7280', marginTop: 5, fontWeight: 600 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Main Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: 18, marginBottom: 24 }}>

        {/* ===== FORM PEMINJAMAN ===== */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 14, padding: 20, boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 3, color: '#1a1a1a' }}>Form Peminjaman</div>
            <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 18 }}>Masukkan NIM/NIP dan No. Induk buku yang akan dipinjam.</div>

            <form onSubmit={handleSubmit}>
              {/* NIM Input */}
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><User size={12} /> Nomor Identitas (NIM / NIP)</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                  <input
                    style={{ width: '100%', paddingLeft: 32, paddingRight: 12, paddingTop: 9, paddingBottom: 9, borderRadius: 8, border: '1.5px solid #e5e7eb', fontSize: 13, outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.15s' }}
                    placeholder="Contoh: 20264"
                    value={nimInput}
                    onChange={e => { setNimInput(e.target.value); setError(''); setResult(null); }}
                    required
                    onFocus={e => e.target.style.borderColor = '#9B2C2C'}
                    onBlur={e => e.target.style.borderColor = '#e5e7eb'}
                  />
                </div>
                {nimInput && (
                  previewMember ? (
                    <div style={{ fontSize: 11, marginTop: 5, padding: '6px 10px', background: 'rgba(46,125,50,0.07)', border: '1px solid rgba(46,125,50,0.2)', borderRadius: 6, color: '#2E7D32' }}>
                      <div style={{ fontWeight: 700 }}>✓ {previewMember.name}</div>
                      <div style={{ marginTop: 2, color: '#4b7c5a' }}>
                        {previewMember.type?.toLowerCase() === 'mahasiswa' ? '📚 Mahasiswa' : '🎓 Dosen'} · Maks. {RULES[previewMember.type?.toLowerCase()]?.maxBuku || '?'} buku · {RULES[previewMember.type?.toLowerCase()]?.labelDurasi || '?'}
                        {' · '}Aktif: {getActiveLoanCount(previewMember.id)}/{RULES[previewMember.type?.toLowerCase()]?.maxBuku}
                      </div>
                    </div>
                  ) : (
                    <div style={{ fontSize: 11, color: '#B71C1C', marginTop: 5, padding: '5px 10px', background: 'rgba(183,28,28,0.06)', borderRadius: 6 }}>
                      ✗ Anggota tidak ditemukan
                    </div>
                  )
                )}
              </div>

              {/* Book Code Input */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><Hash size={12} /> No. Induk Buku</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                  <input
                    style={{ width: '100%', paddingLeft: 32, paddingRight: 12, paddingTop: 9, paddingBottom: 9, borderRadius: 8, border: '1.5px solid #e5e7eb', fontSize: 13, outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.15s' }}
                    placeholder="Contoh: 00001/FMIPA/2026"
                    value={bookCodeInput}
                    onChange={e => { setBookCodeInput(e.target.value); setError(''); setResult(null); }}
                    required
                    onFocus={e => e.target.style.borderColor = '#9B2C2C'}
                    onBlur={e => e.target.style.borderColor = '#e5e7eb'}
                  />
                </div>
                {bookCodeInput && (
                  previewBook ? (
                    <div style={{ fontSize: 11, marginTop: 5, padding: '6px 10px', background: previewBook.available > 0 ? 'rgba(46,125,50,0.07)' : 'rgba(183,28,28,0.07)', border: `1px solid ${previewBook.available > 0 ? 'rgba(46,125,50,0.2)' : 'rgba(183,28,28,0.2)'}`, borderRadius: 6, color: previewBook.available > 0 ? '#2E7D32' : '#B71C1C' }}>
                      <div style={{ fontWeight: 700 }}>{previewBook.available > 0 ? '✓' : '✗'} {previewBook.title}</div>
                      <div style={{ marginTop: 2 }}>{previewBook.available > 0 ? `Stok tersedia: ${previewBook.available}` : 'Stok habis — tidak tersedia'}</div>
                    </div>
                  ) : (
                    <div style={{ fontSize: 11, color: '#B45309', marginTop: 5, padding: '5px 10px', background: 'rgba(180,83,9,0.06)', borderRadius: 6 }}>
                      ✗ Buku tidak ditemukan
                    </div>
                  )
                )}
              </div>

              {/* Aturan peminjaman info */}
              {previewMember && ['mahasiswa', 'dosen'].includes(previewMember.type?.toLowerCase()) && (
                <div style={{ marginBottom: 14, padding: '9px 12px', background: 'rgba(123,28,28,0.04)', border: '1px dashed rgba(123,28,28,0.2)', borderRadius: 8 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#7B1C1C', marginBottom: 4 }}>Aturan Peminjaman</div>
                  {(() => {
                    const rule = RULES[previewMember.type?.toLowerCase()];
                    return (
                      <div style={{ fontSize: 11, color: '#6b7280', display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <span>• Maksimal {rule.maxBuku} buku sekaligus</span>
                        <span>• Durasi pinjam: {rule.labelDurasi}</span>
                        <span>• Bisa diperpanjang maks. {rule.maxPerpanjangan}× ({rule.hariPinjam} hari/perpanjangan)</span>
                        <span>• Denda keterlambatan: Rp 500/hari</span>
                      </div>
                    );
                  })()}
                </div>
              )}

              {error && (
                <div style={{ background: 'rgba(183,28,28,0.08)', color: '#7B1C1C', padding: '10px 12px', borderRadius: 8, fontSize: 12, marginBottom: 12, display: 'flex', gap: 8, alignItems: 'flex-start', border: '1px solid rgba(183,28,28,0.2)' }}>
                  <AlertCircle size={14} style={{ flexShrink: 0, marginTop: 1 }} /> {error}
                </div>
              )}

              {result && (
                <div style={{ background: 'rgba(46,125,50,0.08)', color: '#2E7D32', padding: '10px 12px', borderRadius: 8, fontSize: 12, marginBottom: 12, border: '1px solid rgba(46,125,50,0.2)' }}>
                  <div style={{ fontWeight: 700 }}>✓ Peminjaman berhasil!</div>
                  <div style={{ marginTop: 3, color: '#4b7c5a' }}>
                    {result.memberFull?.name} · "{result.book?.title}" · Jatuh tempo: {result.rule?.labelDurasi}
                  </div>
                </div>
              )}

              <button
                type="submit"
                style={{ width: '100%', background: 'linear-gradient(135deg, #7B1C1C, #9B2C2C)', color: 'white', border: 'none', borderRadius: 8, padding: '10px 16px', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
              >
                <Plus size={14} /> Proses Peminjaman
              </button>
            </form>

            {/* Quick Book Codes */}
            <div style={{ marginTop: 18, paddingTop: 14, borderTop: '1px solid #f3f4f6' }}>
              <div style={{ fontSize: 10, fontWeight: 700, marginBottom: 8, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                No. Induk Tersedia (klik untuk isi)
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {books.filter(b => b.available > 0).map(b => (
                  <span
                    key={b.id}
                    onClick={() => setBookCodeInput(b.no_induk)}
                    style={{ fontSize: 10, padding: '3px 8px', background: '#f9fafb', borderRadius: 4, cursor: 'pointer', border: '1px solid #e5e7eb', color: '#374151', fontFamily: 'monospace' }}
                    onMouseOver={e => { e.currentTarget.style.background = 'rgba(123,28,28,0.08)'; e.currentTarget.style.borderColor = 'rgba(123,28,28,0.3)'; e.currentTarget.style.color = '#7B1C1C'; }}
                    onMouseOut={e => { e.currentTarget.style.background = '#f9fafb'; e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.color = '#374151'; }}
                  >
                    {b.no_induk}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ===== DAFTAR PINJAMAN AKTIF ===== */}
        <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 14, overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
          {/* Header */}
          <div style={{ padding: '14px 18px', borderBottom: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, background: 'linear-gradient(to right, #fafafa, #fff5f5)' }}>
            <div style={{ fontWeight: 700, fontSize: 15, color: '#1a1a1a', display: 'flex', alignItems: 'center', gap: 8 }}>
              Daftar Pinjaman Aktif
              <span style={{ background: 'rgba(180,83,9,0.1)', color: '#B45309', padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700 }}>
                {filteredActiveLoans.length} aktif
              </span>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ position: 'relative' }}>
                <Calendar size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#7B1C1C' }} />
                <select value={period} onChange={e => setPeriod(e.target.value)} style={{ paddingLeft: 30, paddingRight: 28, paddingTop: 7, paddingBottom: 7, borderRadius: 8, border: '1.5px solid rgba(123,28,28,0.3)', background: 'white', color: '#7B1C1C', fontSize: 12, fontWeight: 600, cursor: 'pointer', outline: 'none', appearance: 'none' }}>
                  {PERIOD_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                <Filter size={11} style={{ position: 'absolute', right: 9, top: '50%', transform: 'translateY(-50%)', color: '#7B1C1C', pointerEvents: 'none' }} />
              </div>
              <div style={{ position: 'relative' }}>
                <Search size={12} style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                <input
                  style={{ paddingLeft: 30, paddingRight: 12, paddingTop: 7, paddingBottom: 7, borderRadius: 8, border: '1.5px solid #e5e7eb', fontSize: 12, outline: 'none', width: 180 }}
                  placeholder="Cari anggota / buku..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Loan Cards */}
          <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 520, overflowY: 'auto' }}>
            {filteredActiveLoans.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '52px 0', color: '#9ca3af' }}>
                <BookOpen size={36} style={{ opacity: 0.25, display: 'block', margin: '0 auto 12px' }} />
                <div style={{ fontSize: 14, fontWeight: 600 }}>
                  {period !== 'all' ? 'Tidak ada pinjaman pada periode ini' : 'Tidak ada pinjaman aktif'}
                </div>
              </div>
            ) : filteredActiveLoans.map(l => {
              const prefix = l.bookCode?.split('/')[0] || 'BK';
              const book = books.find(b => b.no_induk === l.bookCode);
              const isLate = daysUntilDue(l.dueDate) < 0;
              const tipe = l.memberType?.toLowerCase() || 'mahasiswa';
              const rule = RULES[tipe] || RULES.mahasiswa;
              const jumlahExt = l.jumlahPerpanjangan || 0;
              const bisaDiperpanjang = !isLate && jumlahExt < rule.maxPerpanjangan;
              const isExtending = extendLoading === l.id;
              const thisExtResult = extendResult?.id === l.id ? extendResult : null;

              return (
                <div key={l.id} style={{ background: isLate ? 'rgba(183,28,28,0.03)' : '#fafafa', borderRadius: 10, border: `1px solid ${isLate ? 'rgba(183,28,28,0.18)' : '#f0f0f0'}`, overflow: 'hidden' }}>
                  <div style={{ display: 'flex', gap: 12, padding: '12px 14px', alignItems: 'flex-start' }}>
                    {/* Cover */}
                    <div style={{ width: 42, height: 56, borderRadius: 5, overflow: 'hidden', flexShrink: 0, background: '#e5e7eb' }}>
                      {book?.image_url ? (
  <ApiImage
    src={book.image_url}
    alt={l.bookTitle}
    style={{
      width: '100%',
      height: '100%',
      objectFit: 'cover'
    }}
    fallback={
      <div style={{
        width: '100%',
        height: '100%',
        background: COVER_COLORS[prefix] || '#555',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontSize: 9,
        fontWeight: 700
      }}>
        {prefix}
      </div>
    }
  />
) : (
  <div style={{
    width: '100%',
    height: '100%',
    background: COVER_COLORS[prefix] || '#555',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    fontSize: 9,
    fontWeight: 700
  }}>
    {prefix}
  </div>
)}
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 2, color: '#1a1a1a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.bookTitle}</div>
                      <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 7, display: 'flex', alignItems: 'center', gap: 6 }}>
                        {l.memberName}
                        {l.memberType && <span style={{ background: '#f3f4f6', padding: '1px 6px', borderRadius: 4, fontSize: 10, fontWeight: 600 }}>{l.memberType}</span>}
                      </div>
                      {/* Badges row */}
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 10, color: '#9ca3af', display: 'flex', alignItems: 'center', gap: 3 }}>
                          <Clock size={9} /> {l.loanDate}
                        </span>
                        <ChevronRight size={9} style={{ color: '#d1d5db' }} />
                        <span style={{ fontSize: 10, color: '#6b7280' }}>Jatuh tempo: {formatDate(l.dueDate)}</span>
                        <DueBadge dueDate={l.dueDate} status={l.status} />
                        <ExtendBadge jumlahPerpanjangan={jumlahExt} maxPerpanjangan={rule.maxPerpanjangan} />
                      </div>
                    </div>

                    {/* Tombol Perpanjang */}
                    <div style={{ flexShrink: 0 }}>
                      <button
                        onClick={() => handleExtend(l)}
                        disabled={!bisaDiperpanjang || isExtending}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 5, padding: '6px 10px', borderRadius: 7, fontSize: 11, fontWeight: 700, cursor: bisaDiperpanjang ? 'pointer' : 'not-allowed', border: 'none', transition: 'all 0.15s',
                          background: bisaDiperpanjang ? 'rgba(123,28,28,0.08)' : '#f3f4f6',
                          color: bisaDiperpanjang ? '#7B1C1C' : '#9ca3af',
                        }}
                      >
                        <RefreshCw size={11} style={{ animation: isExtending ? 'spin 1s linear infinite' : 'none' }} />
                        {isExtending ? 'Memproses...' : 'Perpanjang'}
                      </button>
                    </div>
                  </div>

                  {/* Extend result message */}
                  {thisExtResult && (
                    <div style={{ padding: '7px 14px', borderTop: `1px solid ${thisExtResult.success ? 'rgba(46,125,50,0.15)' : 'rgba(183,28,28,0.15)'}`, background: thisExtResult.success ? 'rgba(46,125,50,0.05)' : 'rgba(183,28,28,0.05)', fontSize: 11, color: thisExtResult.success ? '#2E7D32' : '#B71C1C', fontWeight: 600 }}>
                      {thisExtResult.success ? '✓' : '✗'} {thisExtResult.msg}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}