import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { FileDown, FileText, ChevronLeft, ChevronRight } from 'lucide-react';
import XLSX from 'xlsx-js-style';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useApp } from '../components/AppContext';

const COLORS = ['#7B1C1C', '#0D1B2A', '#2E7D32', '#E65100'];
const PAGE_SIZE = 25;

export default function DendaPage() {
  const { loans } = useApp();
  const [filter, setFilter] = useState('semua');
  const currentYear = new Date().getFullYear();
  const [filterYear, setFilterYear] = useState('');
  const [filterMonth, setFilterMonth] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
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
  }).sort((a, b) => {
    const dateA = new Date(a.returnDate || a.loanDate || a.dueDate || 0);
    const dateB = new Date(b.returnDate || b.loanDate || b.dueDate || 0);
    return dateB - dateA;
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

    const COL = 11;

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

    const rows = [
      [cell('LAPORAN PEMINJAMAN PERPUSTAKAAN FMIPA', sTitleFont, sTitleBg, sCenter),
       ...Array(COL - 1).fill(empty(sTitleBg))],
      [cell(`Periode: ${periodLabel}`, sSubFont, sTitleBg, sCenter),
       ...Array(COL - 1).fill(empty(sTitleBg))],
      [cell(`Dicetak: ${new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`,
        { sz: 9, italic: true, color: { rgb: '718096' }, name: 'Calibri' }, null, sCenter),
       ...Array(COL - 1).fill(empty(null))],
      Array(COL).fill(empty(null)),
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
      ...dataRows,
      Array(COL).fill(empty(null)),
      [
        ...Array(COL - 2).fill(empty(sTotalBg)),
        cell('TOTAL DENDA', sTotalFont, sTotalBg, sRight),
        cell(totalDendaFiltered, sTotalFont, sTotalBg, sRight, '"Rp "#,##0'),
      ],
    ];

    const ws = XLSX.utils.aoa_to_sheet(rows);

    ws['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: COL - 1 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: COL - 1 } },
      { s: { r: 2, c: 0 }, e: { r: 2, c: COL - 1 } },
    ];

    ws['!cols'] = [
      { wch: 4  },
      { wch: 6  },
      { wch: 20 },
      { wch: 36 },
      { wch: 22 },
      { wch: 11 },
      { wch: 13 },
      { wch: 14 },
      { wch: 13 },
      { wch: 16 },
      { wch: 15 },
    ];

    ws['!rows'] = [{ hpt: 28 }, { hpt: 18 }, { hpt: 14 }];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Laporan Peminjaman');
    XLSX.writeFile(wb, `laporan-peminjaman-${periodLabel.replace(/\s+/g, '-')}.xlsx`);
  };

  const exportPDF = () => {
    const periodLabel = [
      filterMonth ? monthOptions.find(m => m.value === filterMonth)?.label : null,
      filterYear || null
    ].filter(Boolean).join(' ') || 'Semua Periode';

    const totalDendaFiltered = filteredLoans.reduce((s, l) => s + Number(l.denda || 0), 0);

    const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();

    // ── Header banner merah ──────────────────────────────────────
    doc.setFillColor(123, 28, 28);
    doc.rect(0, 0, pageWidth, 58, 'F');

    // Accent strip tipis
    doc.setFillColor(13, 27, 42);
    doc.rect(0, 58, pageWidth, 3, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(255, 255, 255);
    doc.text('LAPORAN PEMINJAMAN PERPUSTAKAAN FMIPA', pageWidth / 2, 24, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(255, 220, 220);
    doc.text(`Periode: ${periodLabel}`, pageWidth / 2, 40, { align: 'center' });

    // Tanggal cetak (di bawah strip)
    const printDate = new Date().toLocaleDateString('id-ID', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
    doc.setFontSize(7.5);
    doc.setTextColor(150, 150, 150);
    doc.text(`Dicetak: ${printDate}`, pageWidth / 2, 72, { align: 'center' });

    // ── Tabel ────────────────────────────────────────────────────
    const rows = filteredLoans.map((l, i) => {
      const denda = Number(l.denda || 0);
      const statusLabel =
        l.status === 'dikembalikan' ? 'Dikembalikan' :
        l.status === 'terlambat'   ? 'Terlambat'    :
        l.status === 'diperpanjang'? 'Dipinjam'     : 'Dipinjam';
      return [
        i + 1,
        String(l.id),
        l.bookCode || '-',
        l.bookTitle || '-',
        l.memberName || '-',
        l.memberType === 'mahasiswa' ? 'Mahasiswa'
          : l.memberType === 'dosen' ? 'Dosen'
          : (l.memberType || '-'),
        l.loanDate   || '-',
        l.dueDate    || '-',
        l.returnDate || '-',
        statusLabel,
        denda > 0 ? `Rp ${denda.toLocaleString('id-ID')}` : '-',
      ];
    });

    // A4 landscape = 841.89pt, margin 22 kiri+kanan = 797.89pt usable
    const usableWidth = pageWidth - 44;
    // Proporsi kolom (total = 100)
    const colWidths = [3.5, 4, 11, 20, 11, 6.5, 8.5, 9, 8.5, 9, 9].map(p => usableWidth * p / 100);

    autoTable(doc, {
      startY: 82,
      head: [[
        'No', 'ID', 'Kode Buku', 'Judul Buku', 'Peminjam',
        'Tipe', 'Tgl Pinjam', 'Batas Kembali', 'Tgl Kembali', 'Status', 'Denda'
      ]],
      body: rows,
      foot: [[
        { content: '', colSpan: 9, styles: { fillColor: [238, 242, 255], lineWidth: 0 } },
        { content: 'TOTAL DENDA', styles: { halign: 'right', fontStyle: 'bold', textColor: [55, 48, 163], fillColor: [238, 242, 255] } },
        { content: `Rp ${totalDendaFiltered.toLocaleString('id-ID')}`, styles: { halign: 'right', fontStyle: 'bold', textColor: [197, 48, 48], fillColor: [238, 242, 255] } },
      ]],
      theme: 'grid',
      tableWidth: usableWidth,
      headStyles: {
        fillColor: [13, 27, 42],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 8,
        halign: 'center',
        valign: 'middle',
        cellPadding: { top: 5, bottom: 5, left: 3, right: 3 },
        lineColor: [30, 50, 70],
        lineWidth: 0.5,
      },
      bodyStyles: {
        fontSize: 8,
        cellPadding: { top: 4, bottom: 4, left: 4, right: 4 },
        valign: 'middle',
        lineColor: [226, 232, 240],
        lineWidth: 0.3,
        textColor: [30, 30, 30],
      },
      alternateRowStyles: {
        fillColor: [248, 244, 240],
      },
      footStyles: {
        fillColor: [238, 242, 255],
        lineColor: [200, 200, 230],
        lineWidth: 0.5,
        fontSize: 8,
      },
      columnStyles: {
        0:  { halign: 'center', cellWidth: colWidths[0]  },
        1:  { halign: 'center', cellWidth: colWidths[1]  },
        2:  { halign: 'center', cellWidth: colWidths[2]  },
        3:  { halign: 'left',   cellWidth: colWidths[3]  },
        4:  { halign: 'left',   cellWidth: colWidths[4]  },
        5:  { halign: 'center', cellWidth: colWidths[5]  },
        6:  { halign: 'center', cellWidth: colWidths[6]  },
        7:  { halign: 'center', cellWidth: colWidths[7]  },
        8:  { halign: 'center', cellWidth: colWidths[8]  },
        9:  { halign: 'center', cellWidth: colWidths[9]  },
        10: { halign: 'right',  cellWidth: colWidths[10] },
      },
      didParseCell: (data) => {
        if (data.section === 'body') {
          const row = filteredLoans[data.row.index];
          if (!row) return;
          const isLate = row.status === 'terlambat';
          const isDone = row.status === 'dikembalikan';
          const hasDenda = Number(row.denda || 0) > 0;

          // Baris terlambat — background merah muda
          if (isLate) {
            data.cell.styles.fillColor = [255, 245, 245];
          }

          // Kolom Status — warna sesuai kondisi
          if (data.column.index === 9) {
            data.cell.styles.fontStyle = 'bold';
            if (isDone)      data.cell.styles.textColor = [39, 103, 73];
            else if (isLate) data.cell.styles.textColor = [197, 48, 48];
            else             data.cell.styles.textColor = [183, 121, 31];
          }

          // Kolom Denda — merah jika ada denda
          if (data.column.index === 10 && hasDenda) {
            data.cell.styles.textColor = [197, 48, 48];
            data.cell.styles.fontStyle = 'bold';
          }
        }
      },
      // Nomor halaman di footer
      didDrawPage: (data) => {
        const pageCount = doc.internal.getNumberOfPages();
        const currentPage = doc.internal.getCurrentPageInfo().pageNumber;
        doc.setFontSize(7);
        doc.setTextColor(160, 160, 160);
        doc.text(
          `Halaman ${currentPage} dari ${pageCount}`,
          pageWidth / 2,
          doc.internal.pageSize.getHeight() - 10,
          { align: 'center' }
        );
      },
      margin: { left: 22, right: 22, top: 82, bottom: 24 },
      showFoot: 'lastPage',
    });

    doc.save(`laporan-peminjaman-${periodLabel.replace(/\s+/g, '-')}.pdf`);
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-breadcrumb">DATA LAPORAN BULANAN</div>
        <h1 className="page-title">Denda & Laporan Peminjaman</h1>
        <p className="page-subtitle">Rekap data peminjaman, pengembalian, dan denda dari database.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid-4 mb-24">
        {/* Total Denda */}
        <div style={{ 
          background: 'linear-gradient(135deg, #fff5f5, #ffffff)',
          border: '1.5px solid #FED7D7', borderRadius: 14, padding: '20px 22px',
          boxShadow: '0 2px 8px rgba(229,62,62,0.08)'
        }}>
          <div style={{ fontSize: 11, color: '#e53e3e', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600, marginBottom: 6 }}>Total Denda</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#e53e3e', lineHeight: 1 }}>Rp {totalDenda.toLocaleString('id-ID')}</div>
          <div style={{ fontSize: 12, color: '#4f5661', marginTop: 13 }}>Rp {totalDenda.toLocaleString('id-ID')}</div>
        </div>

        {/* Terlambat */}
        <div style={{
          background: 'linear-gradient(135deg, #fffaf0, #ffffff)',
          border: '1.5px solid #feebc8', borderRadius: 14, padding: '20px 22px',
          boxShadow: '0 2px 8px rgba(214,158,46,0.08)'
        }}>
          <div style={{ fontSize: 11, color: '#d69e2e', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600, marginBottom: 6 }}>Terlambat / Denda</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#d69e2e', lineHeight: 1 }}>{totalLate}</div>
          <div style={{ fontSize: 12, color: '#4f5661', marginTop: 10 }}>transaksi bermasalah</div>
        </div>

        {/* Sudah Dikembalikan */}
        <div style={{
          background: 'linear-gradient(135deg, #f0fff4, #ffffff)',
          border: '1.5px solid #c6f6d5', borderRadius: 14, padding: '20px 22px',
          boxShadow: '0 2px 8px rgba(56,161,105,0.08)'
        }}>
          <div style={{ fontSize: 11, color: '#38a169', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600, marginBottom: 6 }}>Dikembalikan</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#38a169', lineHeight: 1 }}>{totalSelesai}</div>
          <div style={{ fontSize: 12, color: '#4f5661', marginTop: 10 }}>dari {loans.length} total transaksi</div>
        </div>

        {/* Belum Dikembalikan */}
        <div style={{
          background: 'linear-gradient(135deg, #eff6ff, #ffffff)',
          border: '1.5px solid #bfdbfe', borderRadius: 14, padding: '20px 22px',
          boxShadow: '0 2px 8px rgba(37,99,235,0.08)'
        }}>
          <div style={{ fontSize: 11, color: '#2563eb', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600, marginBottom: 6 }}>Belum Dikembalikan</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#2563eb', lineHeight: 1 }}>{totalBelumKembali}</div>
          <div style={{ fontSize: 12, color: '#4f5661', marginTop: 10 }}>{loans.filter(l => l.status === 'terlambat').length} di antaranya terlambat</div>
        </div>
      </div>

      <div className="grid-2 mb-24">
        <div className="card">
          <div className="flex-between mb-16">
            <div style={{ fontWeight: 700, fontSize: 15 }}>Grafik Denda Bulanan</div>
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
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                outerRadius={70}
                dataKey="value"
                label={false}
              >
                {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={(value, name) => [value, name]} />
              <Legend
                layout="vertical"
                align="right"
                verticalAlign="middle"
                formatter={(value, entry) => `${value}: ${entry.payload.value}`}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card">
        <div className="flex-between mb-16" style={{ flexWrap: 'wrap', gap: 12, alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15 }}>Laporan Peminjaman</div>
            <div style={{ fontSize: 12, color: 'var(--gray-text)' }}>Rekapitulasi data perpustakaan</div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'flex-start', width: '100%' }}>
  
            {/* Baris 1: Filter status */}
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {[
                { key: 'semua', label: 'Semua' },
                { key: 'aktif', label: 'Dipinjam' },
                { key: 'terlambat', label: 'Terlambat' },
                { key: 'selesai', label: 'Selesai' },
              ].map(f => (
                <button key={f.key} className={`chart-tab ${filter === f.key ? 'active' : ''}`} onClick={() => { setFilter(f.key); setCurrentPage(1); }}>
                  {f.label}
                </button>
              ))}
            </div>

            {/* Baris 2: Filter periode + export */}
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <span style={{ fontSize: 12, color: 'var(--gray-text)', whiteSpace: 'nowrap' }}>Periode:</span>
              <select className="form-control" style={{ width: 120, fontSize: 12, padding: '4px 8px', height: 32 }}
                value={filterMonth} onChange={e => { setFilterMonth(e.target.value); setCurrentPage(1); }}>
                <option value="">Semua Bulan</option>
                {monthOptions.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
              <select className="form-control" style={{ width: 100, fontSize: 12, padding: '4px 8px', height: 32 }}
                value={filterYear} onChange={e => { setFilterYear(e.target.value); setCurrentPage(1); }}>
                <option value="">Semua Thn</option>
                {yearOptions.map(y => <option key={y} value={String(y)}>{y}</option>)}
              </select>
              {(filterYear || filterMonth) && (
                <button className="btn btn-ghost btn-sm" style={{ height: 32, fontSize: 11 }}
                  onClick={() => { setFilterYear(''); setFilterMonth(''); setCurrentPage(1); }}>
                  ✕ Reset
                </button>
              )}
              <div style={{ width: 1, height: 24, background: '#e2e8f0', display: 'none' }}
                className="divider-desktop" />
              <button className="btn btn-outline btn-sm" onClick={exportXLSX}><FileDown size={13} /> Export Excel</button>
              <button className="btn btn-ghost btn-sm" onClick={exportPDF}><FileText size={13} /> Export PDF</button>
            </div>
          </div>
        </div>

        {(() => {
          const totalPages = Math.ceil(filteredLoans.length / PAGE_SIZE);
          const startIdx = (currentPage - 1) * PAGE_SIZE;
          const pagedLoans = filteredLoans.slice(startIdx, startIdx + PAGE_SIZE);

          return (
            <>
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
                    {pagedLoans.length === 0 ? (
                      <tr><td colSpan={10} style={{ textAlign: 'center', padding: 30, color: 'var(--gray-text)' }}>Tidak ada data</td></tr>
                    ) : pagedLoans.map(l => (
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
                            {l.status === 'dipinjam' ? 'Dipinjam' : l.status === 'diperpanjang' ? 'Dipinjam' : l.status === 'terlambat' ? 'Terlambat' : 'Dikembalikan'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div style={{ marginTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, fontSize: 12, color: 'var(--gray-text)' }}>
                <span>
                  Menampilkan {filteredLoans.length === 0 ? 0 : startIdx + 1}–{Math.min(startIdx + PAGE_SIZE, filteredLoans.length)} dari {filteredLoans.length} entri
                  &nbsp;·&nbsp; Total Denda: <b style={{ color: 'var(--danger)' }}>Rp {filteredLoans.reduce((s, l) => s + Number(l.denda || 0), 0).toLocaleString('id-ID')}</b>
                </span>

                {totalPages > 1 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <button
                      className="btn btn-ghost btn-sm"
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage(p => p - 1)}
                      style={{ opacity: currentPage === 1 ? 0.4 : 1, display: 'flex', alignItems: 'center', gap: 4 }}
                    >
                      <ChevronLeft size={14} /> Sebelumnya
                    </button>
                    <span style={{ fontSize: 12, color: '#555', padding: '0 4px' }}>
                      Hal {currentPage} / {totalPages}
                    </span>
                    <button
                      className="btn btn-primary btn-sm"
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage(p => p + 1)}
                      style={{ opacity: currentPage === totalPages ? 0.4 : 1, display: 'flex', alignItems: 'center', gap: 4 }}
                    >
                      Selanjutnya <ChevronRight size={14} />
                    </button>
                  </div>
                )}
              </div>
            </>
          );
        })()}
      </div>
    </div>
  );
}