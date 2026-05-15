import { useState } from 'react';
import { Search, Plus, AlertCircle, BookOpen, RefreshCw, CheckCircle, X, Clock, User, Hash, ChevronRight, TrendingDown } from 'lucide-react';
import { useApp } from '../components/AppContext';
import ApiImage from '../components/ApiImage';

const COVER_COLORS = { MTK: '#7B1C1C', FIS: '#0D1B2A', KIM: '#1B5E20', BIO: '#1A237E' };

const RULES = {
  mahasiswa: { maxBuku: 3, hariPinjam: 7, maxPerpanjangan: 2, labelDurasi: '7 hari' },
  dosen:     { maxBuku: 10, hariPinjam: 30, maxPerpanjangan: 2, labelDurasi: '30 hari' },
};

const DENDA_PER_HARI = 500;

function daysUntilDue(dueDate) {
  const today = new Date(); today.setHours(0,0,0,0);
  const due   = new Date(dueDate);  due.setHours(0,0,0,0);
  return Math.ceil((due - today) / 86400000);
}

function daysLate(dueDate) {
  return Math.max(0, -daysUntilDue(dueDate));
}

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('id-ID', { day:'2-digit', month:'short', year:'numeric' });
}

function StatusBadge({ dueDate, status }) {
  if (status === 'dikembalikan')
    return <span className="badge badge-success">Selesai</span>;
  const days = daysUntilDue(dueDate);
  if (days < 0)  return <span className="badge badge-danger">Terlambat {Math.abs(days)}h</span>;
  if (days === 0) return <span className="badge badge-warning">Hari ini!</span>;
  if (days <= 3)  return <span className="badge badge-warning">Jatuh tempo {days}h</span>;
  return <span className="badge badge-success">Sisa {days}h</span>;
}

function BookCoverSmall({ bookCode, imageUrl, title }) {
  const prefix = bookCode?.split('/')[0] || 'BK';
  return (
    <div style={{ width:44, height:58, borderRadius:4, overflow:'hidden', flexShrink:0, background:'#eee' }}>
      {imageUrl
        ? <ApiImage src={imageUrl} alt={title} style={{ width:'100%', height:'100%', objectFit:'cover' }}
            fallback={<div style={{ width:'100%', height:'100%', background: COVER_COLORS[prefix]||'#555', display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontSize:9, fontWeight:700 }}>{prefix}</div>} />
        : <div style={{ width:'100%', height:'100%', background: COVER_COLORS[prefix]||'#555', display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontSize:9, fontWeight:700 }}>{prefix}</div>
      }
    </div>
  );
}

/* ─── Modal Detail Pinjaman ─────────────────────────────────── */
function LoanDetailModal({ loan, book, onClose, onReturn, onExtend, extendLoading }) {
  const tipe   = loan.memberType?.toLowerCase() || 'mahasiswa';
  const rule   = RULES[tipe] || RULES.mahasiswa;
  const late   = daysLate(loan.dueDate);
  const denda  = late * DENDA_PER_HARI;
  const jumlahExt   = loan.jumlahPerpanjangan || 0;
  const bisaExt     = daysUntilDue(loan.dueDate) >= 0 && jumlahExt < rule.maxPerpanjangan;

  return (
    <div className="modal-overlay">
      <div className="modal" style={{ maxWidth:760, width:'95%' }}>
        {/* Header */}
        <div className="modal-header">
          <h3 className="modal-title" style={{ display:'flex', alignItems:'center', gap:8 }}>
            <BookOpen size={17} /> Detail Peminjaman
          </h3>
          <button className="modal-close" onClick={onClose}><X size={20}/></button>
        </div>

        <div style={{ padding:'0 0 4px' }}>
          {/* Book Info */}
          <div style={{ display:'flex', gap:14, padding:'16px 0 14px', borderBottom:'1px solid #f0ebe6' }}>
            <BookCoverSmall bookCode={loan.bookCode} imageUrl={book?.image_url} title={loan.bookTitle} />
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontWeight:700, fontSize:14, color:'#1a1a1a', marginBottom:3 }}>{loan.bookTitle}</div>
              <code style={{ background:'#f0ebe6', padding:'2px 7px', borderRadius:4, fontSize:10, color:'#7B1C1C', fontWeight:600 }}>{loan.bookCode}</code>
            </div>
          </div>

          {/* Detail Grid */}
          <div style={{ display:'grid', gap:10, padding:'14px 0', fontSize:13 }}>
            {[
              ['Peminjam',      <span style={{ fontWeight:600 }}>{loan.memberName} <span className="badge badge-info" style={{ marginLeft:4 }}>{loan.memberType}</span></span>],
              ['Tanggal Pinjam', formatDate(loan.loanDate)],
              ['Batas Kembali',  formatDate(loan.dueDate)],
              ['Status',         <StatusBadge dueDate={loan.dueDate} status={loan.status} />],
              ['Perpanjangan',   `${jumlahExt}/${rule.maxPerpanjangan}×`],
            ].map(([label, val]) => (
              <div key={label} style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <span style={{ color:'#9ca3af' }}>{label}</span>
                <span style={{ fontWeight:600 }}>{val}</span>
              </div>
            ))}
          </div>

          {/* Denda Info */}
          {late > 0 ? (
            <div style={{ padding:'12px 14px', background:'rgba(183,28,28,0.06)', borderRadius:10, border:'1px solid rgba(183,28,28,0.18)', marginBottom:16 }}>
              <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:6 }}>
                <TrendingDown size={13} style={{ color:'#B71C1C' }} />
                <span style={{ color:'#7B1C1C', fontWeight:700, fontSize:13 }}>Terlambat {late} hari</span>
              </div>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <span style={{ fontSize:11, color:'#9ca3af' }}>{late} hari × Rp {DENDA_PER_HARI.toLocaleString('id-ID')}</span>
                <span style={{ fontSize:16, fontWeight:800, color:'#B71C1C' }}>Rp {denda.toLocaleString('id-ID')}</span>
              </div>
            </div>
          ) : (
            <div style={{ padding:'10px 14px', background:'rgba(46,125,50,0.06)', borderRadius:10, border:'1px solid rgba(46,125,50,0.18)', marginBottom:16 }}>
              <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                <CheckCircle size={13} style={{ color:'#2E7D32' }} />
                <span style={{ color:'#2E7D32', fontWeight:700, fontSize:12 }}>Tepat waktu — Tidak ada denda</span>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div style={{ display:'flex', gap:10 }}>
            <button
              onClick={() => onExtend(loan)}
              disabled={!bisaExt || extendLoading}
              className="btn btn-ghost btn-sm"
              style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:6,
                opacity: bisaExt ? 1 : 0.45, cursor: bisaExt ? 'pointer' : 'not-allowed' }}
            >
              <RefreshCw size={13} style={{ animation: extendLoading ? 'spin 1s linear infinite' : 'none' }} />
              {extendLoading ? 'Memproses...' : `Perpanjang (${jumlahExt}/${rule.maxPerpanjangan})`}
            </button>
            <button
              onClick={() => onReturn(loan)}
              className="btn btn-primary"
              style={{ flex:2, display:'flex', alignItems:'center', justifyContent:'center', gap:6,
                background:'linear-gradient(135deg,#2D6A4F,#40916C)' }}
            >
              <CheckCircle size={14} /> Selesaikan Pengembalian
            </button>
          </div>
        </div>
      </div>
      <style>{`@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>
    </div>
  );
}

/* ─── Main Page ─────────────────────────────────────────────── */
export default function PetugasPeminjamanPage() {
  const { books, members, loans, addLoan, extendLoan, returnBook } = useApp();

  // Form state
  const [nimInput,      setNimInput]      = useState('');
  const [bookCodeInput, setBookCodeInput] = useState('');
  const [formError,     setFormError]     = useState('');
  const [formSuccess,   setFormSuccess]   = useState(null);

  // Table state
  const [search,        setSearch]        = useState('');
  const [selectedLoan,  setSelectedLoan]  = useState(null);
  const [extendLoading, setExtendLoading] = useState(false);

  // Feedback after modal action
  const [actionMsg, setActionMsg] = useState(null); // {type:'success'|'error', text}

  /* helpers */
  const findMember = (nim) => members.find(m => m.nim===nim || m.nip===nim || String(m.id)===nim);

  const getActiveLoanCount = (id) =>
    loans.filter(l => l.memberId===id && ['dipinjam','terlambat','diperpanjang'].includes(l.status)).length;

  const hasSameBook = (id, code) =>
    loans.some(l => l.memberId===id && l.bookCode===code && ['dipinjam','terlambat','diperpanjang'].includes(l.status));

  const hasUnpaidFine = (id) =>
    loans.some(l => l.memberId===id && l.status==='dikembalikan' && (l.denda||0)>0 && !l.dendaBayar);

  const validate = (member, bookCode) => {
    const tipe = member.type?.toLowerCase();
    if (!['mahasiswa','dosen'].includes(tipe))
      return { valid:false, msg:`${member.name} tidak memiliki hak peminjaman.` };
    const book = books.find(b => b.title?.toLowerCase().includes(bookCode.toLowerCase()));
    if (!book) return { valid:false, msg:'Kode buku tidak ditemukan.' };
    if ((book.available||0) <= 0) return { valid:false, msg:`Stok "${book.title}" habis.` };
    if (hasUnpaidFine(member.id)) return { valid:false, msg:`${member.name} masih punya denda belum dibayar.` };
    if (hasSameBook(member.id, bookCode)) return { valid:false, msg:`${member.name} sudah meminjam buku ini.` };
    const rule = RULES[tipe];
    if (getActiveLoanCount(member.id) >= rule.maxBuku)
      return { valid:false, msg:`Sudah mencapai batas maksimal ${rule.maxBuku} buku.` };
    return { valid:true, book, rule };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(''); setFormSuccess(null);
    const member = findMember(nimInput.trim());
    if (!member) { setFormError('Anggota tidak ditemukan.'); return; }
    const v = validate(member, bookCodeInput.trim());
    if (!v.valid) { setFormError(v.msg); return; }
    const res = await addLoan(v.book.no_induk, member.id);
    if (res.success) {
      setFormSuccess(`Peminjaman "${v.book.title}" oleh ${member.name} berhasil!`);
      setNimInput(''); setBookCodeInput('');
    } else {
      setFormError(res.message);
    }
  };

  const handleExtend = async (loan) => {
    setExtendLoading(true);
    const tipe = loan.memberType?.toLowerCase() || 'mahasiswa';
    const rule = RULES[tipe] || RULES.mahasiswa;
    const res = await extendLoan(loan.id, rule.hariPinjam);
    setExtendLoading(false);
    if (res.success) {
      setActionMsg({ type:'success', text:`Diperpanjang ${rule.hariPinjam} hari. Batas kembali diperbarui.` });
      setSelectedLoan(null);
    } else {
      setActionMsg({ type:'error', text: res.message });
    }
  };

  const handleReturn = async (loan) => {
    const res = await returnBook(loan.bookCode, loan.id);
    if (res.success) {
      const txt = res.denda > 0
        ? `Pengembalian berhasil. Denda: Rp ${Number(res.denda).toLocaleString('id-ID')}`
        : 'Pengembalian berhasil. Tepat waktu, tidak ada denda.';
      setActionMsg({ type:'success', text: txt });
      setSelectedLoan(null);
    } else {
      setActionMsg({ type:'error', text: res.message });
    }
  };

  /* processed loans */
  const processedLoans = loans.map(l =>
    (['dipinjam','diperpanjang'].includes(l.status) && daysUntilDue(l.dueDate) < 0)
      ? { ...l, status:'terlambat' } : l
  );

  const activeLoans = processedLoans
    .filter(l => ['dipinjam','terlambat','diperpanjang'].includes(l.status))
    .filter(l => !search || [l.bookTitle, l.memberName, l.bookCode].some(v => v?.toLowerCase().includes(search.toLowerCase())));

  const lateCount = processedLoans.filter(l => l.status==='terlambat').length;

  const previewMember = nimInput ? findMember(nimInput.trim()) : null;

  const previewBook = bookCodeInput
    ? books.find(
        b => b.title?.toLowerCase().includes(
          bookCodeInput.trim().toLowerCase()
        )
      )
    : null;

  const stats = [
    { label:'Total Aktif',     value: processedLoans.filter(l => ['dipinjam','terlambat','diperpanjang'].includes(l.status)).length, color:'#7B1C1C', bg:'rgba(123,28,28,0.07)', border:'rgba(123,28,28,0.18)' },
    { label:'Terlambat',       value: lateCount,                            color:'#991B1B', bg:'rgba(153,27,27,0.07)', border:'rgba(153,27,27,0.18)' },
    { label:'Buku Tersedia',   value: books.filter(b=>(b.available||0)>0).length, color:'#2E7D32', bg:'rgba(46,125,50,0.07)',  border:'rgba(46,125,50,0.18)'  },
    { label:'Total Anggota',   value: members.length,                       color:'#B45309', bg:'rgba(180,83,9,0.07)',  border:'rgba(180,83,9,0.18)'  },
  ];

  return (
    <div>
      {/* Modal */}
      {selectedLoan && (
        <LoanDetailModal
          loan={selectedLoan}
          book={books.find(b => b.no_induk === selectedLoan.bookCode)}
          onClose={() => setSelectedLoan(null)}
          onReturn={handleReturn}
          onExtend={handleExtend}
          extendLoading={extendLoading}
        />
      )}

      {/* Page Header */}
      <div className="page-header">
        <div className="page-breadcrumb">PETUGAS · TRANSAKSI</div>
        <h1 className="page-title">Peminjaman Buku</h1>
        <p className="page-subtitle">
          Catat peminjaman buku baru dan kelola pinjaman aktif — klik baris pinjaman untuk proses pengembalian atau perpanjangan.
        </p>
      </div>

      {/* Stats */}
      <div className="grid-4 mb-24" style={{ gap:16 }}>
        {stats.map((s,i) => (
          <div key={i} style={{ background:s.bg, border:`1px solid ${s.border}`, borderRadius:14, padding:'20px 22px', boxShadow:'0 2px 8px rgba(0,0,0,0.04)' }}>
            <div style={{ fontSize:11, color:s.color, textTransform:'uppercase', letterSpacing:'0.5px', fontWeight:600, marginBottom:6 }}>{s.label}</div>
            <div style={{ fontSize:28, fontWeight:800, color:s.color, lineHeight:1, fontFamily:"'DM Mono',monospace" }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Action Feedback */}
      {actionMsg && (
        <div style={{
          padding:'11px 16px', borderRadius:10, marginBottom:16, fontSize:13, fontWeight:600,
          display:'flex', justifyContent:'space-between', alignItems:'center',
          background: actionMsg.type==='success' ? 'rgba(46,125,50,0.08)' : 'rgba(183,28,28,0.08)',
          border: `1px solid ${actionMsg.type==='success' ? 'rgba(46,125,50,0.25)' : 'rgba(183,28,28,0.25)'}`,
          color: actionMsg.type==='success' ? '#2E7D32' : '#7B1C1C'
        }}>
          <span>{actionMsg.type==='success' ? '✓' : '✗'} {actionMsg.text}</span>
          <button onClick={() => setActionMsg(null)} style={{ background:'none', border:'none', cursor:'pointer', opacity:0.5, padding:0 }}><X size={14}/></button>
        </div>
      )}

      {/* Main Grid */}
      <div style={{ display:'grid', gridTemplateColumns:'340px 1fr', gap:20 }}>

        {/* ── Form Peminjaman ── */}
        <div className="card" style={{ padding:20, alignSelf:'start' }}>
          <div style={{ fontWeight:700, fontSize:15, marginBottom:3, color:'#1a1a1a' }}>Form Peminjaman</div>
          <div style={{ fontSize:12, color:'#9ca3af', marginBottom:18 }}>Masukkan NIM/NIP dan No. Induk buku.</div>

          <form onSubmit={handleSubmit}>
            {/* NIM */}
            <div style={{ marginBottom:14 }}>
              <label className="form-label" style={{ display:'flex', alignItems:'center', gap:5 }}>
                <User size={12}/> Nomor Identitas (NIM / NIP)
              </label>
              <div style={{ position:'relative' }}>
                <Search size={13} style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color:'#9ca3af' }}/>
                <input
                  className="form-control"
                  style={{ paddingLeft:32 }}
                  placeholder="Contoh: 20264"
                  value={nimInput}
                  onChange={e => { setNimInput(e.target.value); setFormError(''); setFormSuccess(null); }}
                  required
                />
              </div>
              {nimInput && (previewMember
                ? <div style={{ fontSize:11, marginTop:5, padding:'6px 10px', background:'rgba(46,125,50,0.07)', border:'1px solid rgba(46,125,50,0.2)', borderRadius:6, color:'#2E7D32' }}>
                    <div style={{ fontWeight:700 }}>✓ {previewMember.name}</div>
                    <div style={{ marginTop:2, color:'#4b7c5a' }}>
                      {previewMember.type} · Aktif {getActiveLoanCount(previewMember.id)}/{RULES[previewMember.type?.toLowerCase()]?.maxBuku||'?'} buku
                    </div>
                  </div>
                : <div style={{ fontSize:11, color:'#B71C1C', marginTop:5, padding:'5px 10px', background:'rgba(183,28,28,0.06)', borderRadius:6 }}>✗ Anggota tidak ditemukan</div>
              )}
            </div>

            {/* Book Code */}
            <div style={{ marginBottom:14 }}>
              <label className="form-label" style={{ display:'flex', alignItems:'center', gap:5 }}>
                <BookOpen size={12}/> Nama Buku
              </label>
              <div style={{ position:'relative' }}>
                <Search size={13} style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color:'#9ca3af' }}/>
                <input
                  className="form-control"
                  style={{ paddingLeft:32 }}
                  placeholder="Contoh: Fisika Kuantum"
                  value={bookCodeInput}
                  onChange={e => { setBookCodeInput(e.target.value); setFormError(''); setFormSuccess(null); }}
                  required
                />
              </div>

                  {bookCodeInput && (previewBook
                  ? <div
                      onClick={() => setBookCodeInput(previewBook.title)}
                      style={{
                        fontSize:11,
                        marginTop:5,
                        padding:'6px 10px',
                        background: previewBook.available > 0
                          ? 'rgba(46,125,50,0.07)'
                          : 'rgba(183,28,28,0.07)',
                        border:`1px solid ${
                          previewBook.available > 0
                            ? 'rgba(46,125,50,0.2)'
                            : 'rgba(183,28,28,0.2)'
                        }`,
                        borderRadius:6,
                        color: previewBook.available > 0
                          ? '#2E7D32'
                          : '#B71C1C',
                        cursor:'pointer'
                      }}
                    >
                      <div style={{ fontWeight:700 }}>
                        ✓ {previewBook.title}
                      </div>

                      <div style={{ marginTop:2 }}>
                        Klik untuk memilih
                      </div>
                    </div>
                : <div style={{ fontSize:11, color:'#B45309', marginTop:5, padding:'5px 10px', background:'rgba(180,83,9,0.06)', borderRadius:6 }}>✗ Buku tidak ditemukan</div>
              )}
            </div>

            {/* Error / Success */}
            {formError && (
              <div style={{ background:'rgba(183,28,28,0.08)', color:'#7B1C1C', padding:'10px 12px', borderRadius:8, fontSize:12, marginBottom:12, display:'flex', gap:8, alignItems:'flex-start', border:'1px solid rgba(183,28,28,0.2)' }}>
                <AlertCircle size={14} style={{ flexShrink:0, marginTop:1 }}/> {formError}
              </div>
            )}
            {formSuccess && (
              <div style={{ background:'rgba(46,125,50,0.08)', color:'#2E7D32', padding:'10px 12px', borderRadius:8, fontSize:12, marginBottom:12, border:'1px solid rgba(46,125,50,0.2)', fontWeight:600 }}>
                ✓ {formSuccess}
              </div>
            )}

            <button type="submit" className="btn btn-primary" style={{ width:'100%', justifyContent:'center', gap:8 }}>
              <Plus size={14}/> Proses Peminjaman
            </button>
          </form>
        </div>

        {/* ── Tabel Pinjaman Aktif ── */}
        <div className="card" style={{ padding:0, overflow:'hidden' }}>
          {/* Header */}
          <div style={{ padding:'14px 18px', borderBottom:'1px solid #f0ebe6', display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:10, background:'linear-gradient(to right,#fafafa,#fff5f5)' }}>
            <div style={{ fontWeight:700, fontSize:15, color:'#1a1a1a', display:'flex', alignItems:'center', gap:8 }}>
              Pinjaman Aktif
              <span className="badge badge-warning" style={{ fontSize:11 }}>{activeLoans.length} aktif</span>
              {lateCount > 0 && <span className="badge badge-danger" style={{ fontSize:11 }}>{lateCount} terlambat</span>}
            </div>
            <div style={{ position:'relative' }}>
              <Search size={12} style={{ position:'absolute', left:9, top:'50%', transform:'translateY(-50%)', color:'#9ca3af' }}/>
              <input
                className="form-control"
                style={{ paddingLeft:28, width:200 }}
                placeholder="Cari nama / buku / kode..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>

          {/* Hint */}
          <div style={{ padding:'8px 18px', background:'rgba(123,28,28,0.03)', borderBottom:'1px solid #f0ebe6', fontSize:11, color:'#9ca3af', display:'flex', alignItems:'center', gap:5 }}>
            <ChevronRight size={11}/> Klik baris untuk proses pengembalian atau perpanjangan
          </div>

          {/* Table */}
          <div className="table-container" style={{ maxHeight:480, overflowY:'auto' }}>
            <table>
              <thead>
                <tr>
                  <th>Cover</th>
                  <th>Judul Buku</th>
                  <th>Peminjam</th>
                  <th>Tgl Pinjam</th>
                  <th>Batas Kembali</th>
                  <th>Perpanjangan</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {activeLoans.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign:'center', padding:48, color:'#9ca3af', fontSize:13 }}>
                      <BookOpen size={32} style={{ opacity:0.2, display:'block', margin:'0 auto 10px' }}/>
                      Tidak ada pinjaman aktif
                    </td>
                  </tr>
                ) : activeLoans.map(l => {
                  const book    = books.find(b => b.no_induk === l.bookCode);
                  const isLate  = l.status === 'terlambat';
                  const tipe    = l.memberType?.toLowerCase() || 'mahasiswa';
                  const rule    = RULES[tipe] || RULES.mahasiswa;
                  const jumlahExt = l.jumlahPerpanjangan || 0;
                  return (
                    <tr
                      key={l.id}
                      onClick={() => setSelectedLoan(l)}
                      style={{ cursor:'pointer', background: isLate ? 'rgba(183,28,28,0.03)' : undefined }}
                    >
                      <td>
                        <BookCoverSmall bookCode={l.bookCode} imageUrl={book?.image_url} title={l.bookTitle}/>
                      </td>
                      <td>
                        <div style={{ fontWeight:600, fontSize:13 }}>{l.bookTitle}</div>
                        <code style={{ fontSize:10, background:'#f0ebe6', padding:'1px 5px', borderRadius:3, color:'#7B1C1C' }}>{l.bookCode}</code>
                      </td>
                      <td>
                        <div style={{ fontWeight:600 }}>{l.memberName}</div>
                        {l.memberType && <div style={{ fontSize:10, color:'#9ca3af', marginTop:1 }}>{l.memberType}</div>}
                      </td>
                      <td style={{ fontSize:12, color:'#6b7280' }}>{formatDate(l.loanDate)}</td>
                      <td style={{ fontSize:12, color: isLate ? '#B71C1C' : '#374151', fontWeight: isLate ? 700 : 400 }}>{formatDate(l.dueDate)}</td>
                      <td style={{ fontSize:12, color: jumlahExt > 0 ? '#B45309' : '#9ca3af', fontWeight: jumlahExt > 0 ? 700 : 400 }}>
                        {jumlahExt}/{rule.maxPerpanjangan}×
                      </td>
                      <td><StatusBadge dueDate={l.dueDate} status={l.status}/></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}