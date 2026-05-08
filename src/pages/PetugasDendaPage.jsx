import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { FileDown, FileText } from 'lucide-react';
import XLSX from 'xlsx-js-style';
import { useApp } from '../components/AppContext';

const COLORS = ['#7B1C1C', '#0D1B2A', '#2E7D32', '#E65100'];

export default function DendaPage() {
  const { loans } = useApp();
  const [filter, setFilter] = useState('semua');
  const currentYear = new Date().getFullYear();
  const [filterYear, setFilterYear] = useState('');
  const [filterMonth, setFilterMonth] = useState('');
  const yearOptions = Array.from({ length: 5 }, (_, i) => currentYear - i);
  const monthOptions = [
    { value: '1', label: 'Januari' }, { value: '2', label: 'Februari' },
    { value: '3', label: 'Maret' }, { value: '4', label: 'April' },
    { value: '5', label: 'Mei' }, { value: '6', label: 'Juni' },
    { value: '7', label: 'Juli' }, { value: '8', label: 'Agustus' },
    { value: '9', label: 'September' }, { value: '10', label: 'Oktober' },
    { value: '11', label: 'November' }, { value: '12', label: 'Desember' },
  ];

  const filteredLoans = loans.filter(l => {

    // Filter status
    if (filter === 'selesai' && l.status !== 'dikembalikan') return false;
    if (filter === 'terlambat' && !(l.status === 'terlambat' || (l.status === 'dikembalikan' && Number(l.denda) > 0))) return false;
    if (filter === 'aktif' && l.status !== 'dipinjam') return false;

    // Filter periode — selalu dicek terlepas dari filter status
    if (filterYear || filterMonth) {
      const d = new Date(l.loanDate || l.returnDate || l.dueDate);
      if (isNaN(d)) return false;
      if (filterYear && String(d.getFullYear()) !== filterYear) return false;
      if (filterMonth && String(d.getMonth() + 1) !== filterMonth) return false;
    }

    return true;
  });

  const dendaLoans = filteredLoans.filter(l => Number(l.denda) > 0);
  const totalDenda = dendaLoans.reduce((s, l) => s + Number(l.denda || 0), 0);
  const totalLate = filteredLoans.filter(l => l.status === 'terlambat' || (l.status === 'dikembalikan' && Number(l.denda) > 0)).length;
  const totalSelesai = filteredLoans.filter(l => l.status === 'dikembalikan').length;
  const totalBelumKembali = filteredLoans.filter(l => l.status === 'dipinjam' || l.status === 'terlambat' || l.status === 'diperpanjang').length;

  

  const pieData = [
    { name: 'Dipinjam', value: filteredLoans.filter(l => l.status === 'dipinjam').length },
    { name: 'Terlambat', value: totalLate },
    { name: 'Dikembalikan', value: totalSelesai },
  ];

  const dendaMonthly = Object.values(
    filteredLoans.filter(l => Number(l.denda) > 0).reduce((acc, l) => {
      const date = new Date(l.returnDate || l.dueDate || l.loanDate);
      const month = date.toLocaleDateString('id-ID', { month: 'short' });

      if (!acc[month]) {
        acc[month] = { month, denda: 0 };
      }

      acc[month].denda += Number(l.denda || 0);
      return acc;
    }, {})
  );

  const exportXLSX = () => {
  const periodLabel = [
    filterMonth ? monthOptions.find(m => m.value === filterMonth)?.label : null,
    filterYear || null
  ].filter(Boolean).join(' ') || 'Semua Periode';

  const totalDendaFiltered = filteredLoans.reduce((s, l) => s + Number(l.denda || 0), 0);

  // ── Style definitions ──────────────────────────────────────────
  const sTitleBg   = { fgColor: { rgb: '7B1C1C' } };
  const sTitleFont = { bold: true, color: { rgb: 'FFFFFF' }, sz: 14, name: 'Calibri' };
  const sSubFont   = { bold: false, color: { rgb: 'FFFFFF' }, sz: 10, name: 'Calibri' };
  const sHeaderBg  = { fgColor: { rgb: '0D1B2A' } };
  const sHeaderFont= { bold: true, color: { rgb: 'FFFFFF' }, sz: 10, name: 'Calibri' };
  const sBorderThin = {
    top:    { style: 'thin', color: { rgb: 'E2E8F0' } },
    bottom: { style: 'thin', color: { rgb: 'E2E8F0' } },
    left:   { style: 'thin', color: { rgb: 'E2E8F0' } },
    right:  { style: 'thin', color: { rgb: 'E2E8F0' } },
  };
  const sRowEven  = { fgColor: { rgb: 'F8F4F0' } };
  const sRowOdd   = { fgColor: { rgb: 'FFFFFF' } };
  const sDanger   = { fgColor: { rgb: 'FFF5F5' } };
  const sDangerFont = { color: { rgb: 'C53030' }, bold: true, sz: 10, name: 'Calibri' };
  const sNormalFont = { sz: 10, name: 'Calibri' };
  const sTotalBg  = { fgColor: { rgb: 'EEF2FF' } };
  const sTotalFont = { bold: true, color: { rgb: '3730A3' }, sz: 10, name: 'Calibri' };
  const sCenter   = { horizontal: 'center', vertical: 'center' };
  const sLeft     = { horizontal: 'left',   vertical: 'center' };
  const sRight    = { horizontal: 'right',  vertical: 'center' };

  const cell = (v, font, fill, alignment, numFmt) => ({
    v, t: typeof v === 'number' ? 'n' : 's',
    s: {
      font: font || sNormalFont,
      fill: fill ? { patternType: 'solid', ...fill } : { patternType: 'none' },
      alignment: alignment || sLeft,
      border: sBorderThin,
      ...(numFmt ? { numFmt } : {})
    }
  });

  const empty = (fill) => cell('', sNormalFont, fill, sLeft);

  const COL = 11; // jumlah kolom

  // ── Baris data ──────────────────────────────────────────────────
  const dataRows = filteredLoans.map((l, i) => {
    const isLate   = l.status === 'terlambat';
    const isDone   = l.status === 'dikembalikan';
    const rowFill  = isLate ? sDanger : (i % 2 === 0 ? sRowEven : sRowOdd);
    const rowFont  = isLate ? { ...sNormalFont, color: { rgb: '744210' } } : sNormalFont;
    const statusLabel = isDone ? '✓ Dikembalikan' : isLate ? '⚠ Terlambat' : '● Dipinjam';
    const statusFont  = isDone
      ? { bold: true, color: { rgb: '276749' }, sz: 10, name: 'Calibri' }
      : isLate
        ? sDangerFont
        : { bold: true, color: { rgb: 'B7791F' }, sz: 10, name: 'Calibri' };
    const denda = Number(l.denda || 0);

    return [
      cell(i + 1,       rowFont, rowFill, sCenter),
      cell(String(l.id),rowFont, rowFill, sCenter),
      cell(l.bookCode,  rowFont, rowFill, sCenter),
      cell(l.bookTitle, rowFont, rowFill, sLeft),
      cell(l.memberName,rowFont, rowFill, sLeft),
      cell(l.memberType === 'mahasiswa' ? 'Mahasiswa' : l.memberType === 'dosen' ? 'Dosen' : (l.memberType || '-'), rowFont, rowFill, sCenter),
      cell(l.loanDate,  rowFont, rowFill, sCenter),
      cell(l.dueDate,   rowFont, rowFill, sCenter),
      cell(l.returnDate || '-', rowFont, rowFill, sCenter),
      cell(statusLabel, statusFont, rowFill, sCenter),
      denda > 0
        ? cell(denda, sDangerFont, rowFill, sRight, '"Rp "#,##0')
        : cell('-', rowFont, rowFill, sCenter),
    ];
  });

  // ── Susun sheet ─────────────────────────────────────────────────
  const rows = [
    // Row 1: Judul besar
    [cell('LAPORAN PEMINJAMAN PERPUSTAKAAN FMIPA', sTitleFont, sTitleBg, sCenter),
     ...Array(COL - 1).fill(empty(sTitleBg))],

    // Row 2: Sub judul periode
    [cell(`Periode: ${periodLabel}`, sSubFont, sTitleBg, sCenter),
     ...Array(COL - 1).fill(empty(sTitleBg))],

    // Row 3: Tanggal cetak
    [cell(`Dicetak: ${new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`,
      { sz: 9, italic: true, color: { rgb: '718096' }, name: 'Calibri' }, null, sCenter),
     ...Array(COL - 1).fill(empty(null))],

    // Row 4: Kosong
    Array(COL).fill(empty(null)),

    // Row 5: Header
    [
      cell('No',           sHeaderFont, sHeaderBg, sCenter),
      cell('ID',           sHeaderFont, sHeaderBg, sCenter),
      cell('Kode Buku',    sHeaderFont, sHeaderBg, sCenter),
      cell('Judul Buku',   sHeaderFont, sHeaderBg, sCenter),
      cell('Peminjam',     sHeaderFont, sHeaderBg, sCenter),
      cell('Tipe',         sHeaderFont, sHeaderBg, sCenter),
      cell('Tgl Pinjam',   sHeaderFont, sHeaderBg, sCenter),
      cell('Batas Kembali',sHeaderFont, sHeaderBg, sCenter),
      cell('Tgl Kembali',  sHeaderFont, sHeaderBg, sCenter),
      cell('Status',       sHeaderFont, sHeaderBg, sCenter),
      cell('Denda',        sHeaderFont, sHeaderBg, sCenter),
    ],

    // Data rows
    ...dataRows,

    // Baris kosong
    Array(COL).fill(empty(null)),

    // Baris total
    [
      ...Array(COL - 2).fill(empty(sTotalBg)),
      cell('TOTAL DENDA', sTotalFont, sTotalBg, sRight),
      cell(totalDendaFiltered, sTotalFont, sTotalBg, sRight, '"Rp "#,##0'),
    ],
  ];

  const ws = XLSX.utils.aoa_to_sheet(rows);

  // Merge judul & sub judul (A1:K1, A2:K2)
  ws['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: COL - 1 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: COL - 1 } },
    { s: { r: 2, c: 0 }, e: { r: 2, c: COL - 1 } },
  ];

  // Lebar kolom
  ws['!cols'] = [
    { wch: 4  }, // No
    { wch: 6  }, // ID
    { wch: 20 }, // Kode Buku
    { wch: 36 }, // Judul
    { wch: 22 }, // Peminjam
    { wch: 11 }, // Tipe
    { wch: 13 }, // Tgl Pinjam
    { wch: 14 }, // Batas Kembali
    { wch: 13 }, // Tgl Kembali
    { wch: 16 }, // Status
    { wch: 15 }, // Denda
  ];

  // Tinggi baris judul
  ws['!rows'] = [{ hpt: 28 }, { hpt: 18 }, { hpt: 14 }];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Laporan Peminjaman');
  XLSX.writeFile(wb, `laporan-peminjaman-${periodLabel.replace(/\s+/g, '-')}.xlsx`);
};

  const exportHTML = () => {
    const html = `<!DOCTYPE html>
    <html>
    <head>
      <title>Laporan Peminjaman FMIPA</title>
      <style>
        body{font-family:sans-serif;padding:20px}
        table{width:100%;border-collapse:collapse}
        th{background:#7B1C1C;color:white;padding:8px}
        td{padding:8px;border-bottom:1px solid #eee}
        h1{color:#7B1C1C}
      </style>
    </head>
    <body>
      <h1>Laporan Peminjaman Perpustakaan FMIPA</h1>
      <p>Dicetak: ${new Date().toLocaleDateString('id-ID')}</p>
      <p>Total Denda: Rp ${totalDenda.toLocaleString('id-ID')}</p>
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Buku</th>
            <th>Peminjam</th>
            <th>Status</th>
            <th>Denda</th>
          </tr>
        </thead>
        <tbody>
          ${filteredLoans.map(l => `
            <tr>
              <td>${l.id}</td>
              <td>${l.bookTitle}</td>
              <td>${l.memberName}</td>
              <td>${l.status}</td>
              <td>Rp ${Number(l.denda || 0).toLocaleString('id-ID')}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </body>
    </html>`;

    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');

    a.href = url;
    a.download = 'laporan.html';
    a.click();

    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-breadcrumb">Laporan</div>
        <h1 className="page-title">Denda & Laporan Peminjaman</h1>
        <p className="page-subtitle">Rekap data peminjaman, pengembalian, dan denda dari database.</p>
      </div>

      <div className="grid-4 mb-24">
        {/* Total Denda */}
        <div style={{
          background: 'linear-gradient(135deg, #7B1C1C, #a83232)',
          borderRadius: 14, padding: '20px 22px', color: 'white',
          boxShadow: '0 4px 16px rgba(123,28,28,0.3)'
        }}>
          <div style={{ fontSize: 11, opacity: 0.75, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>Total Denda</div>
          <div style={{ fontSize: 28, fontWeight: 800, lineHeight: 1 }}>Rp {(totalDenda / 1000).toFixed(0)}K</div>
          <div style={{ fontSize: 12, opacity: 0.8, marginTop: 4 }}>Rp {totalDenda.toLocaleString('id-ID')}</div>
        </div>

        {/* Terlambat */}
        <div style={{
          background: 'linear-gradient(135deg, #fff5f5, #fff)',
          border: '1px solid #fed7d7', borderRadius: 14, padding: '20px 22px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
        }}>
          <div style={{ fontSize: 11, color: '#e53e3e', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600, marginBottom: 6 }}>Terlambat / Denda</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#e53e3e', lineHeight: 1 }}>{totalLate}</div>
          <div style={{ fontSize: 12, color: '#718096', marginTop: 4 }}>transaksi bermasalah</div>
        </div>

        {/* Sudah Dikembalikan */}
        <div style={{
          background: 'linear-gradient(135deg, #f0fff4, #fff)',
          border: '1px solid #c6f6d5', borderRadius: 14, padding: '20px 22px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
        }}>
          <div style={{ fontSize: 11, color: '#38a169', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600, marginBottom: 6 }}>Dikembalikan</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#38a169', lineHeight: 1 }}>{totalSelesai}</div>
          <div style={{ fontSize: 12, color: '#718096', marginTop: 4 }}>dari {loans.length} total transaksi</div>
        </div>

        {/* Belum Dikembalikan */}
        <div style={{
          background: 'linear-gradient(135deg, #fffaf0, #fff)',
          border: '1px solid #feebc8', borderRadius: 14, padding: '20px 22px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
        }}>
          <div style={{ fontSize: 11, color: '#d69e2e', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600, marginBottom: 6 }}>Belum Dikembalikan</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#d69e2e', lineHeight: 1 }}>{totalBelumKembali}</div>
          <div style={{ fontSize: 12, color: '#718096', marginTop: 4 }}>{loans.filter(l => l.status === 'terlambat').length} di antaranya terlambat</div>
        </div>
      </div>

      <div className="grid-2 mb-24">
        <div className="card">
          <div className="flex-between mb-16">
            <div style={{ fontWeight: 700, fontSize: 15 }}>Grafik Denda Bulanan</div>
            <button className="btn btn-ghost btn-sm" onClick={exportHTML}><FileDown size={13} /> Unduh Grafik</button>
          </div>

          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={dendaMonthly}>
              <CartesianGrid strokeDasharray="3 3" stroke="#EEE9E4" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={v => `Rp ${Number(v).toLocaleString('id-ID')}`} />
              <Bar dataKey="denda" name="Denda" fill="#7B1C1C" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>Distribusi Status Peminjaman</div>

          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" outerRadius={70} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card">
        <div className="flex-between mb-16" style={{ flexWrap: 'wrap', gap: 10 }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15 }}>Laporan Peminjaman</div>
            <div style={{ fontSize: 12, color: 'var(--gray-text)' }}>Rekapitulasi data perpustakaan</div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'flex-end' }}>
  
            {/* Baris 1: Filter status */}
            <div style={{ display: 'flex', gap: 4 }}>
              {[
                { key: 'semua', label: 'Semua' },
                { key: 'aktif', label: 'Dipinjam' },
                { key: 'terlambat', label: 'Terlambat' },
                { key: 'selesai', label: 'Selesai' },
              ].map(f => (
                <button key={f.key} className={`chart-tab ${filter === f.key ? 'active' : ''}`} onClick={() => setFilter(f.key)}>
                  {f.label}
                </button>
              ))}
            </div>

            {/* Baris 2: Filter periode + export */}
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <span style={{ fontSize: 12, color: 'var(--gray-text)', whiteSpace: 'nowrap' }}>Periode:</span>
              <select className="form-control" style={{ width: 120, fontSize: 12, padding: '4px 8px', height: 32 }}
                value={filterMonth} onChange={e => setFilterMonth(e.target.value)}>
                <option value="">Semua Bulan</option>
                {monthOptions.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
              <select className="form-control" style={{ width: 100, fontSize: 12, padding: '4px 8px', height: 32 }}
                value={filterYear} onChange={e => setFilterYear(e.target.value)}>
                <option value="">Semua Thn</option>
                {yearOptions.map(y => <option key={y} value={String(y)}>{y}</option>)}
              </select>
              {(filterYear || filterMonth) && (
                <button className="btn btn-ghost btn-sm" style={{ height: 32, fontSize: 11 }}
                  onClick={() => { setFilterYear(''); setFilterMonth(''); }}>
                  ✕ Reset
                </button>
              )}
              <div style={{ width: 1, height: 24, background: '#e2e8f0' }} />
              <button className="btn btn-outline btn-sm" onClick={exportXLSX}><FileDown size={13} /> Export Excel</button>
              <button className="btn btn-ghost btn-sm" onClick={exportHTML}><FileText size={13} /> Export HTML</button>
            </div>
          </div>
        </div>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Kode Buku</th>
                <th>Judul Buku</th>
                <th>Peminjam</th>
                <th>Tipe</th>
                <th>Tgl Pinjam</th>
                <th>Batas Kembali</th>
                <th>Tgl Kembali</th>
                <th>Denda</th>
                <th>Status</th>
              </tr>
            </thead>

            <tbody>
              {filteredLoans.length === 0 ? (
                <tr><td colSpan={10} style={{ textAlign: 'center', padding: 30, color: 'var(--gray-text)' }}>Tidak ada data</td></tr>
              ) : filteredLoans.map(l => (
                <tr key={l.id}>
                  <td style={{ fontSize: 11 }}>{l.id}</td>
                  <td><code style={{ fontSize: 11, background: 'var(--gray-light)', padding: '1px 5px', borderRadius: 3 }}>{l.bookCode}</code></td>
                  <td style={{ fontWeight: 600, fontSize: 12, maxWidth: 160 }}>{l.bookTitle}</td>
                  <td style={{ fontSize: 12 }}>{l.memberName}</td>
                  <td><span className={`badge ${l.memberType === 'mahasiswa' ? 'badge-info' : 'badge-success'}`} style={{ fontSize: 10 }}>{l.memberType}</span></td>
                  <td style={{ fontSize: 12 }}>{l.loanDate}</td>
                  <td style={{ fontSize: 12 }}>{l.dueDate}</td>
                  <td style={{ fontSize: 12 }}>{l.returnDate || '-'}</td>
                  <td style={{ fontWeight: Number(l.denda) > 0 ? 700 : 400, color: Number(l.denda) > 0 ? 'var(--danger)' : 'inherit', fontSize: 12 }}>
                    {Number(l.denda) > 0 ? `Rp ${Number(l.denda).toLocaleString('id-ID')}` : '-'}
                  </td>
                  <td>
                    <span className={`badge ${l.status === 'dikembalikan' ? 'badge-success' : l.status === 'terlambat' ? 'badge-danger' : 'badge-warning'}`}>
                      {l.status === 'dipinjam' ? 'Dipinjam' : l.status === 'terlambat' ? 'Terlambat' : 'Dikembalikan'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ marginTop: 12, display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--gray-text)' }}>
          <span>{filteredLoans.length} entri</span>
          <span>Total Denda Terfilter: Rp {filteredLoans.reduce((s, l) => s + Number(l.denda || 0), 0).toLocaleString('id-ID')}</span>
        </div>
      </div>
    </div>
  );
}