import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { FileDown, FileText, Filter } from 'lucide-react';
import { useApp } from '../components/AppContext';
import { useAuth } from '../components/AuthContext';
import { MONTHLY_LOANS } from '../data/db';

const COLORS = ['#7B1C1C', '#0D1B2A', '#2E7D32', '#E65100'];

export default function DendaPage() {
  const { loans } = useApp();
  const { user } = useAuth();
  const [filter, setFilter] = useState('semua');

  const dendaLoans = loans.filter(l => l.denda > 0);
  const totalDenda = dendaLoans.reduce((s, l) => s + l.denda, 0);
  const totalLate = loans.filter(l => l.status === 'terlambat').length;
  const totalSelesai = loans.filter(l => l.status === 'dikembalikan').length;

  const filteredLoans = loans.filter(l => {
    if (filter === 'selesai') return l.status === 'dikembalikan';
    if (filter === 'terlambat') return l.status === 'terlambat' || (l.status === 'dikembalikan' && l.denda > 0);
    if (filter === 'aktif') return l.status === 'dipinjam';
    return true;
  });

  const pieData = [
    { name: 'Dipinjam', value: loans.filter(l => l.status === 'dipinjam').length },
    { name: 'Terlambat', value: totalLate },
    { name: 'Dikembalikan', value: totalSelesai },
  ];

  const dendaMonthly = MONTHLY_LOANS.map(m => ({ ...m, denda: Math.floor(Math.random() * 80 + 20) * 1000 }));

  const exportCSV = () => {
    const headers = ['ID', 'Kode Buku', 'Judul', 'Peminjam', 'Tipe', 'Tgl Pinjam', 'Tgl Kembali', 'Status', 'Denda'];
    const rows = filteredLoans.map(l => [l.id, l.bookCode, `"${l.bookTitle}"`, l.memberName, l.memberType, l.loanDate, l.returnDate || l.dueDate, l.status, l.denda]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'laporan-peminjaman.csv';
    a.click(); URL.revokeObjectURL(url);
  };

  const exportHTML = () => {
    const html = `<!DOCTYPE html><html><head><title>Laporan Peminjaman FMIPA</title>
    <style>body{font-family:sans-serif;padding:20px}table{width:100%;border-collapse:collapse}th{background:#7B1C1C;color:white;padding:8px}td{padding:8px;border-bottom:1px solid #eee}h1{color:#7B1C1C}</style>
    </head><body><h1>Laporan Peminjaman Perpustakaan FMIPA</h1><p>Dicetak: ${new Date().toLocaleDateString('id-ID')}</p>
    <table><thead><tr><th>ID</th><th>Buku</th><th>Peminjam</th><th>Status</th><th>Denda</th></tr></thead><tbody>
    ${filteredLoans.map(l => `<tr><td>${l.id}</td><td>${l.bookTitle}</td><td>${l.memberName}</td><td>${l.status}</td><td>Rp ${l.denda.toLocaleString('id-ID')}</td></tr>`).join('')}
    </tbody></table></body></html>`;
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'laporan.html'; a.click();
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-breadcrumb">Laporan</div>
        <h1 className="page-title">Denda & Laporan Peminjaman</h1>
        <p className="page-subtitle">Sistem dapat menghasilkan laporan bulanan terkait data peminjaman, pengembalian, dan denda dalam format tabel dan grafik.</p>
      </div>

      {/* Summary */}
      <div className="grid-4 mb-24">
        <div className="denda-highlight">
          <div style={{ fontSize: 11, opacity: 0.7, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Denda</div>
          <div className="amount">Rp {(totalDenda / 1000).toFixed(0)}K</div>
          <div style={{ fontSize: 12, opacity: 0.8, marginTop: 4 }}>Rp {totalDenda.toLocaleString('id-ID')}</div>
        </div>
        <div className="stat-card">
          <div>
            <div className="stat-value">{totalLate}</div>
            <div className="stat-label">Sedang Terlambat</div>
          </div>
        </div>
        <div className="stat-card">
          <div>
            <div className="stat-value">{totalSelesai}</div>
            <div className="stat-label">Sudah Dikembalikan</div>
          </div>
        </div>
        <div className="stat-card">
          <div>
            <div className="stat-value">{dendaLoans.length}</div>
            <div className="stat-label">Kena Denda</div>
          </div>
        </div>
      </div>

      <div className="grid-2 mb-24">
        {/* Bar chart denda */}
        <div className="card">
          <div className="flex-between mb-16">
            <div style={{ fontWeight: 700, fontSize: 15 }}>Grafik Denda Bulanan</div>
            {user?.role !== 'admin' ? null : (
              <button className="btn btn-ghost btn-sm" onClick={exportHTML}><FileDown size={13} /> Unduh Grafik</button>
            )}
            {user?.role === 'petugas' && (
              <button className="btn btn-ghost btn-sm" onClick={exportHTML}><FileDown size={13} /> Unduh Grafik</button>
            )}
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={dendaMonthly}>
              <CartesianGrid strokeDasharray="3 3" stroke="#EEE9E4" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
              <Tooltip formatter={v => `Rp ${v.toLocaleString('id-ID')}`} />
              <Bar dataKey="denda" name="Denda" fill="#7B1C1C" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie chart status */}
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

      {/* Table */}
      <div className="card">
        <div className="flex-between mb-16" style={{ flexWrap: 'wrap', gap: 10 }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15 }}>Laporan Peminjaman</div>
            <div style={{ fontSize: 12, color: 'var(--gray-text)' }}>Rekapitulasi data perpustakaan</div>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', gap: 4 }}>
              {[
                { key: 'semua', label: 'Semua' },
                { key: 'aktif', label: 'Dipinjam' },
                { key: 'terlambat', label: 'Terlambat' },
                { key: 'selesai', label: 'Selesai' },
              ].map(f => (
                <button key={f.key} className={`chart-tab ${filter === f.key ? 'active' : ''}`} onClick={() => setFilter(f.key)}>{f.label}</button>
              ))}
            </div>
            <button className="btn btn-outline btn-sm" onClick={exportCSV}><FileDown size={13} /> Export Excel (CSV)</button>
            <button className="btn btn-ghost btn-sm" onClick={exportHTML}><FileText size={13} /> Export PDF/HTML</button>
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
                  <td style={{ fontWeight: l.denda > 0 ? 700 : 400, color: l.denda > 0 ? 'var(--danger)' : 'inherit', fontSize: 12 }}>
                    {l.denda > 0 ? `Rp ${l.denda.toLocaleString('id-ID')}` : '-'}
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
          <span>Total Denda Terfilter: Rp {filteredLoans.reduce((s, l) => s + l.denda, 0).toLocaleString('id-ID')}</span>
        </div>
      </div>
    </div>
  );
}