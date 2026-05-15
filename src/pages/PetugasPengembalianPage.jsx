import { useState } from 'react';
import { Search, Filter, Calendar, BookOpen, CheckCircle, Clock, TrendingDown } from 'lucide-react';
import { useApp } from '../components/AppContext';

const PERIOD_OPTIONS = [
  { value:'all',     label:'Semua Waktu' },
  { value:'daily',   label:'Hari Ini'    },
  { value:'weekly',  label:'Minggu Ini'  },
  { value:'monthly', label:'Bulan Ini'   },
  { value:'yearly',  label:'Tahun Ini'   },
];

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('id-ID', { day:'2-digit', month:'short', year:'numeric' });
}

export default function PetugasPengembalianPage() {
  const { loans } = useApp();
  const [search, setSearch]   = useState('');
  const [period, setPeriod]   = useState('all');

  const filterByPeriod = (items) => {
    if (period === 'all') return items;
    const now = new Date();
    return items.filter(item => {
      const d = new Date(item.returnDate || item.loanDate);
      if (period === 'daily')   return d.toDateString() === now.toDateString();
      if (period === 'weekly')  return (now - d) / 86400000 <= 7;
      if (period === 'monthly') return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      if (period === 'yearly')  return d.getFullYear() === now.getFullYear();
      return true;
    });
  };

  const completed = loans
    .filter(l => l.status === 'dikembalikan')
    .sort((a,b) => (b.returnDate||'').localeCompare(a.returnDate||''));

  const filtered = filterByPeriod(completed).filter(l =>
    !search || [l.bookTitle, l.memberName, l.bookCode].some(v => v?.toLowerCase().includes(search.toLowerCase()))
  );

  const totalDenda     = completed.reduce((s,l) => s + (l.denda||0), 0);
  const totalTerlambat = completed.filter(l => (l.denda||0) > 0).length;

  const stats = [
    { label:'Total Pengembalian', value: completed.length,                              color:'#2E7D32', bg:'rgba(46,125,50,0.07)',  border:'rgba(46,125,50,0.18)',  icon: <CheckCircle size={16} /> },
    { label:'Kasus Terlambat',    value: totalTerlambat,                                color:'#991B1B', bg:'rgba(153,27,27,0.07)',  border:'rgba(153,27,27,0.18)',  icon: <TrendingDown size={16}/> },
    { label:'Denda Terkumpul',    value:`Rp ${totalDenda.toLocaleString('id-ID')}`,     color:'#B45309', bg:'rgba(180,83,9,0.07)',   border:'rgba(180,83,9,0.18)',   icon: <Clock size={16}/>        },
  ];

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div className="page-breadcrumb">PETUGAS · RIWAYAT</div>
        <h1 className="page-title">Riwayat Pengembalian</h1>
        <p className="page-subtitle">
          Rekap seluruh pengembalian buku beserta denda keterlambatan anggota perpustakaan FMIPA.
        </p>
      </div>

      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:16, marginBottom:24 }}>
        {stats.map((s,i) => (
          <div key={i} style={{ background:s.bg, border:`1px solid ${s.border}`, borderRadius:14, padding:'20px 22px', boxShadow:'0 2px 8px rgba(0,0,0,0.04)' }}>
            <div style={{ fontSize:11, color:s.color, textTransform:'uppercase', letterSpacing:'0.5px', fontWeight:600, marginBottom:6 }}>{s.label}</div>
            <div style={{ fontSize:28, fontWeight:800, color:s.color, lineHeight:1, fontFamily:"'DM Mono',monospace" }}>{s.value}</div>
            <div style={{ marginTop:6, opacity:0.45, color:s.color }}>{s.icon}</div>
          </div>
        ))}
      </div>

      {/* Table Card */}
      <div className="card" style={{ padding:0, overflow:'hidden' }}>
        {/* Card Header */}
        <div style={{ padding:'14px 18px', borderBottom:'1px solid #f0ebe6', display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:10, background:'linear-gradient(to right,#fafafa,#fff5f5)' }}>
          <div style={{ fontWeight:700, fontSize:15, color:'#1a1a1a', display:'flex', alignItems:'center', gap:8 }}>
            Data Pengembalian
            <span className="badge badge-success" style={{ fontSize:11 }}>{filtered.length} entri</span>
          </div>

          <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
            {/* Period filter */}
            <div style={{ position:'relative' }}>
              <Calendar size={13} style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color:'#7B1C1C' }}/>
              <select
                value={period}
                onChange={e => setPeriod(e.target.value)}
                className="form-control"
                style={{ paddingLeft:30, paddingRight:28, appearance:'none', color:'#7B1C1C', fontWeight:600, fontSize:12, borderColor:'rgba(123,28,28,0.3)', width:'auto', cursor:'pointer' }}
              >
                {PERIOD_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              <Filter size={11} style={{ position:'absolute', right:9, top:'50%', transform:'translateY(-50%)', color:'#7B1C1C', pointerEvents:'none' }}/>
            </div>

            {/* Search */}
            <div style={{ position:'relative' }}>
              <Search size={12} style={{ position:'absolute', left:9, top:'50%', transform:'translateY(-50%)', color:'#9ca3af' }}/>
              <input
                className="form-control"
                style={{ paddingLeft:28, width:210 }}
                placeholder="Cari nama / judul / kode..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="table-container" style={{ overflowX:'auto', maxHeight:560, overflowY:'auto' }}>
          <table>
            <thead>
              <tr>
                {['Tgl Kembali','Kode Buku','Judul Buku','Peminjam','Tipe','Durasi','Perpanjangan','Denda','Status'].map(h => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign:'center', padding:52, color:'#9ca3af', fontSize:13 }}>
                    <BookOpen size={32} style={{ opacity:0.2, display:'block', margin:'0 auto 10px' }}/>
                    Belum ada pengembalian pada periode ini
                  </td>
                </tr>
              ) : filtered.map((l,idx) => {
                const isLate  = (l.denda||0) > 0;
                const loanD   = l.loanDate   ? new Date(l.loanDate)   : null;
                const returnD = l.returnDate ? new Date(l.returnDate) : null;
                const durasi  = loanD && returnD ? Math.ceil((returnD-loanD)/86400000) : null;
                return (
                  <tr key={l.id} style={{ background: idx%2===0 ? 'white' : '#fafafa' }}>
                    <td style={{ fontSize:12, color:'#6b7280', whiteSpace:'nowrap' }}>{formatDate(l.returnDate)}</td>
                    <td>
                      <code style={{ fontSize:10, background:'#f0ebe6', padding:'2px 6px', borderRadius:4, color:'#7B1C1C', fontWeight:600 }}>{l.bookCode}</code>
                    </td>
                    <td style={{ maxWidth:160 }}>
                      <div style={{ fontWeight:600, fontSize:13, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{l.bookTitle}</div>
                    </td>
                    <td>
                      <div style={{ fontWeight:600, fontSize:13 }}>{l.memberName}</div>
                    </td>
                    <td>
                      {l.memberType && <span className="badge badge-info">{l.memberType}</span>}
                    </td>
                    <td style={{ fontSize:12, color:'#6b7280', whiteSpace:'nowrap' }}>
                      {durasi !== null ? `${durasi} hari` : '—'}
                    </td>
                    <td style={{ fontSize:12, color:(l.jumlahPerpanjangan||0)>0 ? '#B45309' : '#9ca3af', fontWeight:(l.jumlahPerpanjangan||0)>0 ? 700 : 400 }}>
                      {(l.jumlahPerpanjangan||0) > 0 ? `${l.jumlahPerpanjangan}× diperpanjang` : '—'}
                    </td>
                    <td style={{ fontWeight: isLate ? 700 : 400, color: isLate ? '#991B1B' : '#9ca3af', whiteSpace:'nowrap' }}>
                      {isLate ? `Rp ${Number(l.denda).toLocaleString('id-ID')}` : '—'}
                    </td>
                    <td>
                      <span className={`badge ${isLate ? 'badge-warning' : 'badge-success'}`}>
                        {isLate ? 'Terlambat' : 'Tepat Waktu'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}