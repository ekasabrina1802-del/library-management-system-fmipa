//PetugasAnggotaPage.jsx — UI improved & aligned with PetugasPeminjamanPage
import { useState } from 'react';
import { X, Check, Search, BookOpen, History, RefreshCw, CheckCircle, TrendingDown, Clock, ChevronRight, AlertCircle, Users, GraduationCap, UserCheck } from 'lucide-react';
import { useApp } from '../components/AppContext';
import { useAuth } from '../components/AuthContext';
import ApiImage from '../components/ApiImage';

const departmentData = {
  "Matematika": [
    "S1 Pendidikan Matematika", "S1 Matematika", "S2 Matematika",
    "S2 Pendidikan Matematika", "S3 Pendidikan Matematika"
  ],
  "Fisika": [
    "S1 Pendidikan Fisika", "S1 Fisika", "S2 Pendidikan Fisika", "S2 Fisika"
  ],
  "Kimia": ["S1 Pendidikan Kimia", "S1 Kimia", "S2 Kimia"],
  "Biologi": ["S1 Pendidikan Biologi", "S1 Biologi", "S2 Pendidikan Biologi"],
  "Pendidikan Sains": [
    "S1 Pendidikan Ilmu Pengetahuan Alam", "S2 Pendidikan Sains", "S3 Pendidikan Sains"
  ],
  "Sains Data": ["S1 Sains Data"],
  "Sains Aktuaria": ["S1 Sains Aktuaria"],
  "Kecerdasan Artifisial": ["S1 Kecerdasan Artifisial"]
};

const RULES = {
  mahasiswa: { maxBuku: 3, hariPinjam: 7, maxPerpanjangan: 2 },
  dosen:     { maxBuku: 10, hariPinjam: 30, maxPerpanjangan: 2 },
};

const DENDA_PER_HARI = 500;

function daysUntilDue(dueDate) {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const due   = new Date(dueDate); due.setHours(0, 0, 0, 0);
  return Math.ceil((due - today) / 86400000);
}
function daysLate(dueDate) { return Math.max(0, -daysUntilDue(dueDate)); }
function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
}

function StatusBadge({ dueDate, status }) {
  if (status === 'dikembalikan')
    return <span className="badge badge-success">Selesai</span>;
  const days = daysUntilDue(dueDate);
  if (days < 0)   return <span className="badge badge-danger">Terlambat {Math.abs(days)}h</span>;
  if (days === 0) return <span className="badge badge-warning">Hari ini!</span>;
  if (days <= 3)  return <span className="badge badge-warning">Jatuh tempo {days}h</span>;
  return <span className="badge badge-success">Sisa {days}h</span>;
}

/* ─── Avatar Component ──────────────────────────────────────── */
function MemberAvatar({ member, size = 36, fontSize = 12 }) {
  const initials = member.name?.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() || '??';
  const fallback = (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: 'var(--maroon)', color: 'white',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize, fontWeight: 700, flexShrink: 0
    }}>{initials}</div>
  );
  if (!member.photo_url) return fallback;
  return (
    <ApiImage
      src={member.photo_url}
      alt={member.name}
      style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
      fallback={fallback}
    />
  );
}

/* ─── Loan Action Row ───────────────────────────────────────── */
function LoanActionRow({ loan, onReturn, onExtend, extendLoading, actionResult }) {
  const tipe      = loan.memberType?.toLowerCase() || 'mahasiswa';
  const rule      = RULES[tipe] || RULES.mahasiswa;
  const late      = daysLate(loan.dueDate);
  const denda     = late * DENDA_PER_HARI;
  const jumlahExt = loan.jumlahPerpanjangan || 0;
  const bisaExt   = daysUntilDue(loan.dueDate) >= 0 && jumlahExt < rule.maxPerpanjangan;
  const isLate    = late > 0;

  return (
    <tr style={{ background: isLate ? 'rgba(183,28,28,0.02)' : 'rgba(46,125,50,0.02)' }}>
      <td colSpan={6} style={{ padding: '0 12px 12px', borderTop: 'none' }}>
        <div style={{
          display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap',
          padding: '12px 16px', borderRadius: 10,
          background: isLate ? 'rgba(183,28,28,0.05)' : 'rgba(46,125,50,0.05)',
          border: `1px solid ${isLate ? 'rgba(183,28,28,0.15)' : 'rgba(46,125,50,0.15)'}`,
        }}>
          {isLate ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1, minWidth: 160 }}>
              <TrendingDown size={13} style={{ color: '#B71C1C', flexShrink: 0 }} />
              <span style={{ fontSize: 12, color: '#7B1C1C', fontWeight: 700 }}>
                Terlambat {late} hari · Denda:{' '}
                <span style={{ fontSize: 13 }}>Rp {denda.toLocaleString('id-ID')}</span>
              </span>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1, minWidth: 160 }}>
              <CheckCircle size={13} style={{ color: '#2E7D32', flexShrink: 0 }} />
              <span style={{ fontSize: 12, color: '#2E7D32', fontWeight: 600 }}>
                Tepat waktu — tidak ada denda
              </span>
            </div>
          )}

          {actionResult && (
            <span style={{
              fontSize: 11, fontWeight: 600, flex: 1,
              color: actionResult.type === 'success' ? '#2E7D32' : '#B71C1C'
            }}>
              {actionResult.type === 'success' ? '✓' : '✗'} {actionResult.text}
            </span>
          )}

          <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
            <button
              onClick={() => onExtend(loan)}
              disabled={!bisaExt || extendLoading}
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '7px 13px', borderRadius: 7,
                border: '1px solid rgba(123,28,28,0.2)',
                background: bisaExt ? 'white' : 'rgba(0,0,0,0.03)',
                color: bisaExt ? '#7B1C1C' : '#9ca3af',
                fontSize: 12, fontWeight: 600,
                cursor: bisaExt ? 'pointer' : 'not-allowed',
                opacity: bisaExt ? 1 : 0.5,
              }}
              title={!bisaExt ? `Perpanjangan sudah ${jumlahExt}/${rule.maxPerpanjangan}×` : ''}
            >
              <RefreshCw size={12} style={{ animation: extendLoading ? 'spin 1s linear infinite' : 'none' }} />
              Perpanjang ({jumlahExt}/{rule.maxPerpanjangan})
            </button>

            <button
              onClick={() => onReturn(loan)}
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '7px 14px', borderRadius: 7, border: 'none',
                background: 'linear-gradient(135deg, #2D6A4F, #40916C)',
                color: 'white', fontSize: 12, fontWeight: 700, cursor: 'pointer',
                boxShadow: '0 2px 6px rgba(45,106,79,0.3)',
              }}
            >
              <CheckCircle size={12} /> Selesaikan Pengembalian
            </button>
          </div>
        </div>
      </td>
    </tr>
  );
}

/* ─── Member Detail Modal ───────────────────────────────────── */
function MemberDetailModal({ member, loans, books, onClose, onEdit, extendLoan, returnBook }) {
  const [expandedLoan,  setExpandedLoan]  = useState(null);
  const [extendLoading, setExtendLoading] = useState(false);
  const [actionResults, setActionResults] = useState({});

  const memberLoans    = loans.filter(l => l.memberId === member.id);
  const initials       = member.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();

  const processedLoans = memberLoans.map(l =>
    (['dipinjam', 'diperpanjang'].includes(l.status) && daysUntilDue(l.dueDate) < 0)
      ? { ...l, status: 'terlambat' } : l
  );

  const activeLoans   = processedLoans.filter(l => ['dipinjam', 'terlambat', 'diperpanjang'].includes(l.status));
  const returnedLoans = processedLoans.filter(l => l.status === 'dikembalikan');
  const lateCount     = processedLoans.filter(l => l.status === 'terlambat').length;
  const tipe          = member.type?.toLowerCase() || 'mahasiswa';
  const rule          = RULES[tipe] || RULES.mahasiswa;

  const handleExtend = async (loan) => {
    setExtendLoading(true);
    const res = await extendLoan(loan.id, rule.hariPinjam);
    setExtendLoading(false);
    if (res.success) {
      setActionResults(p => ({ ...p, [loan.id]: { type: 'success', text: `Diperpanjang ${rule.hariPinjam} hari.` } }));
      setExpandedLoan(null);
    } else {
      setActionResults(p => ({ ...p, [loan.id]: { type: 'error', text: res.message } }));
    }
  };

  const handleReturn = async (loan) => {
    const res = await returnBook(loan.bookCode, loan.id);
    if (res.success) {
      const txt = res.denda > 0
        ? `Dikembalikan. Denda: Rp ${Number(res.denda).toLocaleString('id-ID')}`
        : 'Dikembalikan tepat waktu, tidak ada denda.';
      setActionResults(p => ({ ...p, [loan.id]: { type: 'success', text: txt } }));
      setExpandedLoan(null);
    } else {
      setActionResults(p => ({ ...p, [loan.id]: { type: 'error', text: res.message } }));
    }
  };

  const toggleExpand = (loanId) =>
    setExpandedLoan(prev => prev === loanId ? null : loanId);

  return (
    <div className="modal-overlay">
      <div className="modal" style={{
        maxWidth: 740, width: '95%', padding: 0,
        overflow: 'hidden', borderRadius: 16,
        boxShadow: '0 24px 60px rgba(0,0,0,0.18)',
      }}>

        {/* ── Header ── */}
        <div style={{
          background: 'linear-gradient(135deg, #6B1515 0%, #8B1E30 50%, #7B1C1C 100%)',
          padding: '22px 24px 20px', position: 'relative',
        }}>
          <button
            onClick={onClose}
            style={{
              position: 'absolute', top: 18, right: 18,
              color: 'rgba(255,255,255,0.7)', background: 'rgba(255,255,255,0.12)',
              border: 'none', borderRadius: '50%', width: 30, height: 30,
              display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
            }}
          >
            <X size={15} />
          </button>

          <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
            {/* Avatar */}
            {member.photo_url ? (
              <ApiImage
                src={member.photo_url} alt={member.name}
                style={{ width: 64, height: 64, borderRadius: '50%', objectFit: 'cover', flexShrink: 0, border: '2.5px solid rgba(255,255,255,0.35)', boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }}
                fallback={
                  <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 800, flexShrink: 0, border: '2.5px solid rgba(255,255,255,0.3)', letterSpacing: '-0.5px' }}>
                    {initials}
                  </div>
                }
              />
            ) : (
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 800, flexShrink: 0, border: '2.5px solid rgba(255,255,255,0.3)' }}>
                {initials}
              </div>
            )}

            {/* Info */}
            <div style={{ flex: 1, color: 'white' }}>
              <div style={{ fontSize: 18, fontWeight: 800, lineHeight: 1.2, letterSpacing: '-0.3px' }}>
                {member.name}
              </div>
              <div style={{ fontSize: 12, opacity: 0.7, marginTop: 4, fontFamily: 'monospace' }}>
                {member.nim} · {member.prodi || member.departemen}
              </div>
              <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
                <span style={{
                  fontSize: 11, background: 'rgba(255,255,255,0.2)', padding: '3px 10px',
                  borderRadius: 20, fontWeight: 700, border: '1px solid rgba(255,255,255,0.2)',
                  textTransform: 'capitalize',
                }}>{member.type}</span>
                <span style={{
                  fontSize: 11, background: 'rgba(255,255,255,0.1)', padding: '3px 10px',
                  borderRadius: 20, border: '1px solid rgba(255,255,255,0.15)',
                }}>{member.departemen}</span>
              </div>
            </div>

            <button
              onClick={() => onEdit(member)}
              style={{
                fontSize: 12, padding: '7px 14px', borderRadius: 8, marginRight: 44, marginTop: 2,
                background: 'rgba(255,255,255,0.15)', color: 'white',
                border: '1px solid rgba(255,255,255,0.25)', cursor: 'pointer', fontWeight: 600,
                flexShrink: 0, backdropFilter: 'blur(4px)',
                transition: 'background 0.15s',
              }}
            >
              Edit Data
            </button>
          </div>

          {/* Stats row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginTop: 18 }}>
            {[
              { label: 'Sedang Dipinjam', val: activeLoans.length,  color: '#fde68a' },
              { label: 'Sudah Kembali',   val: returnedLoans.length, color: '#a7f3d0' },
              { label: 'Terlambat',       val: lateCount, color: lateCount > 0 ? '#fca5a5' : '#a7f3d0' },
            ].map(s => (
              <div key={s.label} style={{
                textAlign: 'center', padding: '10px 0',
                background: 'rgba(255,255,255,0.1)', borderRadius: 10,
                border: '1px solid rgba(255,255,255,0.1)',
              }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: s.color, fontFamily: "'DM Mono', monospace", lineHeight: 1 }}>
                  {s.val}
                </div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)', marginTop: 4, fontWeight: 500 }}>
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Body ── */}
        <div style={{ padding: '20px 24px 24px', maxHeight: '60vh', overflowY: 'auto' }}>

          {/* Active Loans */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <Clock size={14} style={{ color: '#7B1C1C' }} />
              <span style={{ fontWeight: 700, fontSize: 13, color: '#1a1a1a' }}>Pinjaman Aktif</span>
              {activeLoans.length > 0 && (
                <span style={{
                  fontSize: 10, background: '#fef2f2', color: '#7B1C1C',
                  padding: '2px 8px', borderRadius: 20, fontWeight: 700,
                  border: '1px solid rgba(123,28,28,0.2)',
                }}>
                  {activeLoans.length} buku
                </span>
              )}
            </div>

            {activeLoans.length === 0 ? (
              <div style={{
                textAlign: 'center', padding: '28px 16px',
                background: '#fafafa', borderRadius: 12,
                border: '1.5px dashed #e5e7eb', color: '#9ca3af', fontSize: 12,
              }}>
                <BookOpen size={26} style={{ opacity: 0.15, display: 'block', margin: '0 auto 10px' }} />
                Tidak ada pinjaman aktif saat ini
              </div>
            ) : (
              <div style={{ border: '1px solid #f0ebe6', borderRadius: 12, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead>
                    <tr style={{ background: '#fafafa', borderBottom: '1px solid #f0ebe6' }}>
                      {['Judul Buku', 'Tgl Pinjam', 'Batas Kembali', 'Perpanjangan', 'Status', ''].map(h => (
                        <th key={h} style={{
                          padding: '10px 12px', textAlign: 'left',
                          fontSize: 11, fontWeight: 600, color: '#9ca3af',
                          whiteSpace: 'nowrap', letterSpacing: '0.3px',
                          textTransform: 'uppercase',
                        }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {activeLoans.map((l, idx) => {
                      const isExpanded = expandedLoan === l.id;
                      const isLate     = l.status === 'terlambat';
                      const jumlahExt  = l.jumlahPerpanjangan || 0;
                      return (
                        <>
                          <tr
                            key={l.id}
                            onClick={() => toggleExpand(l.id)}
                            style={{
                              cursor: 'pointer',
                              background: isExpanded
                                ? 'rgba(123,28,28,0.04)'
                                : isLate
                                  ? 'rgba(183,28,28,0.025)'
                                  : idx % 2 === 0 ? 'white' : '#fafafa',
                              borderBottom: isExpanded ? 'none' : '1px solid #f5f0ee',
                              transition: 'background 0.12s',
                            }}
                          >
                            <td style={{ padding: '11px 12px', maxWidth: 180 }}>
                              <div style={{ fontWeight: 600, fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {l.bookTitle}
                              </div>
                              <code style={{ fontSize: 10, background: '#f0ebe6', padding: '1px 5px', borderRadius: 3, color: '#7B1C1C', marginTop: 2, display: 'inline-block' }}>
                                {l.bookCode}
                              </code>
                            </td>
                            <td style={{ padding: '11px 12px', fontSize: 12, color: '#6b7280', whiteSpace: 'nowrap' }}>
                              {formatDate(l.loanDate)}
                            </td>
                            <td style={{ padding: '11px 12px', fontSize: 12, whiteSpace: 'nowrap', color: isLate ? '#B71C1C' : '#374151', fontWeight: isLate ? 700 : 400 }}>
                              {formatDate(l.dueDate)}
                            </td>
                            <td style={{ padding: '11px 12px', fontSize: 12, color: jumlahExt > 0 ? '#B45309' : '#9ca3af', fontWeight: jumlahExt > 0 ? 700 : 400 }}>
                              {jumlahExt}/{rule.maxPerpanjangan}×
                            </td>
                            <td style={{ padding: '11px 12px' }}>
                              <StatusBadge dueDate={l.dueDate} status={l.status} />
                            </td>
                            <td style={{ padding: '11px 12px' }}>
                              <div style={{
                                width: 24, height: 24, borderRadius: 6,
                                background: isExpanded ? 'rgba(123,28,28,0.1)' : '#f3f4f6',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                              }}>
                                <ChevronRight
                                  size={13}
                                  style={{
                                    color: isExpanded ? '#7B1C1C' : '#9ca3af',
                                    transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                                    transition: 'transform 0.2s',
                                  }}
                                />
                              </div>
                            </td>
                          </tr>
                          {isExpanded && (
                            <LoanActionRow
                              key={`action-${l.id}`}
                              loan={l}
                              onReturn={handleReturn}
                              onExtend={handleExtend}
                              extendLoading={extendLoading}
                              actionResult={actionResults[l.id]}
                            />
                          )}
                        </>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <div style={{ height: 1, flex: 1, background: '#f0ebe6' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600, fontSize: 11, color: '#b0aaa6', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              <History size={11} /> Riwayat Selesai
            </div>
            <div style={{ height: 1, flex: 1, background: '#f0ebe6' }} />
          </div>

          {/* Returned Loans */}
          {returnedLoans.length === 0 ? (
            <div style={{
              textAlign: 'center', padding: '20px 16px',
              background: '#fafafa', borderRadius: 12,
              border: '1.5px dashed #e5e7eb', color: '#9ca3af', fontSize: 12,
            }}>
              Belum ada riwayat pengembalian
            </div>
          ) : (
            <div style={{ border: '1px solid #f0ebe6', borderRadius: 12, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: '#fafafa', borderBottom: '1px solid #f0ebe6' }}>
                    {['Judul Buku', 'Tgl Pinjam', 'Tgl Kembali', 'Perpanjangan', 'Denda', 'Status'].map(h => (
                      <th key={h} style={{
                        padding: '10px 12px', textAlign: 'left',
                        fontSize: 11, fontWeight: 600, color: '#9ca3af',
                        whiteSpace: 'nowrap', letterSpacing: '0.3px',
                        textTransform: 'uppercase',
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {returnedLoans.map((l, idx) => {
                    const isLate    = (l.denda || 0) > 0;
                    const jumlahExt = l.jumlahPerpanjangan || 0;
                    return (
                      <tr key={l.id} style={{
                        background: idx % 2 === 0 ? 'white' : '#fafafa',
                        borderBottom: '1px solid #f5f0ee',
                      }}>
                        <td style={{ padding: '10px 12px', maxWidth: 160 }}>
                          <div style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {l.bookTitle}
                          </div>
                          <code style={{ fontSize: 10, background: '#f0ebe6', padding: '1px 4px', borderRadius: 3, color: '#7B1C1C' }}>
                            {l.bookCode}
                          </code>
                        </td>
                        <td style={{ padding: '10px 12px', color: '#6b7280', whiteSpace: 'nowrap' }}>{formatDate(l.loanDate)}</td>
                        <td style={{ padding: '10px 12px', color: '#6b7280', whiteSpace: 'nowrap' }}>{formatDate(l.returnDate)}</td>
                        <td style={{ padding: '10px 12px', color: jumlahExt > 0 ? '#B45309' : '#9ca3af', fontWeight: jumlahExt > 0 ? 700 : 400 }}>
                          {jumlahExt > 0 ? `${jumlahExt}×` : '—'}
                        </td>
                        <td style={{ padding: '10px 12px', fontWeight: isLate ? 700 : 400, color: isLate ? '#991B1B' : '#9ca3af', whiteSpace: 'nowrap' }}>
                          {isLate ? `Rp ${Number(l.denda).toLocaleString('id-ID')}` : '—'}
                        </td>
                        <td style={{ padding: '10px 12px' }}>
                          <span className={`badge ${isLate ? 'badge-warning' : 'badge-success'}`} style={{ fontSize: 10 }}>
                            {isLate ? 'Terlambat' : 'Tepat Waktu'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      <style>{`@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>
    </div>
  );
}

/* ─── Member Edit Modal ─────────────────────────────────────── */
function MemberModal({ member = null, onSave, onClose }) {
  const [form, setForm] = useState({
    name:      member?.name      || '',
    nim:       member?.nim       || '',
    departemen:member?.departemen|| '',
    prodi:     member?.prodi     || '',
    type:      member?.type      || 'mahasiswa',
    email:     member?.email     || '',
    phone:     member?.phone     || '',
    address:   member?.address   || ''
  });
  const f = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    const allowedEmail = form.email.endsWith('@unesa.ac.id') || form.email.endsWith('@mhs.unesa.ac.id');
    if (!allowedEmail) { alert('Gunakan email resmi UNESA'); return; }
    onSave(form);
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h3 className="modal-title">Edit Data Anggota</h3>
          <button className="modal-close" onClick={onClose}><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Nama Lengkap *</label>
              <input className="form-control" value={form.name} onChange={f('name')} required />
            </div>
            <div className="form-group">
              <label className="form-label">NIM / NIP *</label>
              <input className="form-control" value={form.nim} onChange={f('nim')} required />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Tipe Anggota</label>
            <select className="form-control" value={form.type} onChange={f('type')}>
              <option value="mahasiswa">Mahasiswa</option>
              <option value="dosen">Dosen</option>
            </select>
          </div>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Departemen</label>
              <select
                className="form-control"
                value={form.departemen}
                onChange={(e) => setForm({ ...form, departemen: e.target.value, prodi: '' })}
              >
                <option value="">Pilih Departemen</option>
                {Object.keys(departmentData).map(dep => (
                  <option key={dep} value={dep}>{dep}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Program Studi</label>
              <select className="form-control" value={form.prodi} onChange={f('prodi')}>
                <option value="">Pilih Prodi</option>
                {(departmentData[form.departemen] || []).map(prodi => (
                  <option key={prodi} value={prodi}>{prodi}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input className="form-control" type="email" value={form.email} onChange={f('email')} required />
          </div>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">No. Telp</label>
              <input className="form-control" value={form.phone} onChange={f('phone')} required />
            </div>
            <div className="form-group">
              <label className="form-label">Alamat</label>
              <input className="form-control" value={form.address} onChange={f('address')} required />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-ghost" onClick={onClose}>Batal</button>
            <button type="submit" className="btn btn-primary">
              <Check size={14} /> Simpan Perubahan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─── Main Page ─────────────────────────────────────────────── */
export default function AnggotaPage() {
  const { members, loans, books, updateMember, extendLoan, returnBook } = useApp();
  const { user } = useAuth();
  const [search,       setSearch]       = useState('');
  const [typeFilter,   setTypeFilter]   = useState('semua');
  const [detailMember, setDetailMember] = useState(null);
  const [editMember,   setEditMember]   = useState(null);

  const filtered = members.filter(m =>
    (typeFilter === 'semua' || m.type === typeFilter) &&
    (!search ||
      m.name?.toLowerCase().includes(search.toLowerCase()) ||
      m.nim?.includes(search) ||
      m.departemen?.toLowerCase().includes(search.toLowerCase()))
  );

  const mahasiswaCount = members.filter(m => m.type === 'mahasiswa' && m.status === 'aktif').length;
  const dosenCount     = members.filter(m => m.type === 'dosen'     && m.status === 'aktif').length;
  const totalCount     = members.length;

  const typeBadge = (member) => {
    if (member.role === 'petugas') return <span className="badge badge-warning">Petugas</span>;
    if (member.role === 'admin')   return <span className="badge badge-danger">Admin</span>;
    if (member.type === 'mahasiswa') return <span className="badge badge-info">Mahasiswa</span>;
    return <span className="badge badge-success">Dosen</span>;
  };

  /* Stat card style identical to PeminjamanPage */
  const statCards = [
    {
      label: 'Mahasiswa Aktif',
      value: mahasiswaCount,
      color: '#7B1C1C',
      bg: 'rgba(123,28,28,0.07)',
      border: 'rgba(123,28,28,0.18)',
      icon: <GraduationCap size={16} />,
    },
    {
      label: 'Dosen Aktif',
      value: dosenCount,
      color: '#0D1B2A',
      bg: 'rgba(13,27,42,0.07)',
      border: 'rgba(13,27,42,0.18)',
      icon: <UserCheck size={16} />,
    },
    {
      label: 'Total Anggota',
      value: totalCount,
      color: '#B45309',
      bg: 'rgba(180,83,9,0.07)',
      border: 'rgba(180,83,9,0.18)',
      icon: <Users size={16} />,
    },
  ];

  const filterButtons = [
    { key: 'semua',      label: 'Semua',     activeColor: '#7B1C1C', activeBg: 'rgba(123,28,28,0.09)' },
    { key: 'mahasiswa',  label: 'Mahasiswa', activeColor: '#2563eb', activeBg: '#dbeafe' },
    { key: 'dosen',      label: 'Dosen',     activeColor: '#16a34a', activeBg: '#dcfce7' },
  ];

  return (
    <div>
      {detailMember && (
        <MemberDetailModal
          member={detailMember}
          loans={loans}
          books={books}
          onClose={() => setDetailMember(null)}
          onEdit={(m) => { setDetailMember(null); setEditMember(m); }}
          extendLoan={extendLoan}
          returnBook={returnBook}
        />
      )}
      {editMember && (
        <MemberModal
          member={editMember}
          onSave={async (m) => {
            const success = await updateMember(editMember.id, m);
            if (success) setEditMember(null);
          }}
          onClose={() => setEditMember(null)}
        />
      )}

      {/* Page Header */}
      <div className="page-header">
        <div className="page-breadcrumb">DATA ANGGOTA</div>
        <h1 className="page-title">Manajemen Anggota</h1>
        <p className="page-subtitle">Kelola data anggota perpustakaan — Mahasiswa dan Dosen</p>
      </div>

      {/* ── Stat Cards — same pattern as PeminjamanPage ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginBottom: 24 }}>
        {statCards.map((s, i) => (
          <div key={i} style={{
            background: s.bg,
            border: `1px solid ${s.border}`,
            borderRadius: 14,
            padding: '20px 22px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            display: 'flex', alignItems: 'center', gap: 16,
          }}>
            <div style={{
              width: 40, height: 40, borderRadius: 10,
              background: s.bg, border: `1px solid ${s.border}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: s.color, flexShrink: 0,
            }}>
              {s.icon}
            </div>
            <div>
              <div style={{ fontSize: 11, color: s.color, textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600, marginBottom: 4 }}>
                {s.label}
              </div>
              <div style={{ fontSize: 28, fontWeight: 800, color: s.color, lineHeight: 1, fontFamily: "'DM Mono', monospace" }}>
                {s.value}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Table Card ── */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>

        {/* Card header with filters + search */}
        <div style={{
          padding: '14px 18px', borderBottom: '1px solid #f0ebe6',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          flexWrap: 'wrap', gap: 10,
          background: 'linear-gradient(to right, #fafafa, #fff5f5)',
        }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: '#1a1a1a', display: 'flex', alignItems: 'center', gap: 8 }}>
            Daftar Anggota
            <span style={{
              fontSize: 11, background: 'rgba(123,28,28,0.08)', color: '#7B1C1C',
              padding: '2px 8px', borderRadius: 20, fontWeight: 700,
              border: '1px solid rgba(123,28,28,0.15)',
            }}>{filtered.length} anggota</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            {/* Filter buttons */}
            <div style={{ display: 'flex', gap: 6, background: '#f3f4f6', borderRadius: 9, padding: 3 }}>
              {filterButtons.map(btn => {
                const isActive = typeFilter === btn.key;
                return (
                  <button
                    key={btn.key}
                    onClick={() => setTypeFilter(btn.key)}
                    style={{
                      padding: '5px 13px', borderRadius: 7, border: 'none', cursor: 'pointer',
                      fontSize: 12, fontWeight: 600, transition: 'all 0.15s',
                      background: isActive ? btn.activeBg : 'transparent',
                      color: isActive ? btn.activeColor : '#6b7280',
                      boxShadow: isActive ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
                    }}
                  >
                    {btn.label}
                  </button>
                );
              })}
            </div>

            {/* Search */}
            <div style={{ position: 'relative' }}>
              <Search size={13} style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
              <input
                className="form-control"
                style={{ paddingLeft: 30, width: 240 }}
                placeholder="Cari nama, NIM/NIP, departemen..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Hint */}
        <div style={{
          padding: '8px 18px', background: 'rgba(123,28,28,0.03)',
          borderBottom: '1px solid #f0ebe6', fontSize: 11, color: '#9ca3af',
          display: 'flex', alignItems: 'center', gap: 5,
        }}>
          <ChevronRight size={11} /> Klik baris untuk melihat detail pinjaman anggota
        </div>

        {/* Table */}
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Nama</th>
                <th>NIM/NIP</th>
                <th>Departemen</th>
                <th>Tipe</th>
                <th>Tgl Bergabung</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: 48, color: '#9ca3af', fontSize: 13 }}>
                    <Users size={32} style={{ opacity: 0.15, display: 'block', margin: '0 auto 10px' }} />
                    Tidak ada anggota ditemukan
                  </td>
                </tr>
              ) : filtered.map(m => (
                <tr key={m.id} style={{ cursor: 'pointer' }} onClick={() => setDetailMember(m)}>
                  <td>
                    <code style={{ background: 'var(--gray-light)', padding: '2px 6px', borderRadius: 4, fontSize: 11 }}>
                      {m.custom_id || m.id}
                    </code>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <MemberAvatar member={m} size={34} fontSize={12} />
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 13 }}>{m.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--gray-text)' }}>{m.email}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{m.nim}</td>
                  <td style={{ fontSize: 13 }}>{m.departemen}</td>
                  <td>{typeBadge(m)}</td>
                  <td style={{ color: 'var(--gray-text)', fontSize: 12 }}>{m.joinDate}</td>
                  <td>
                    <button
                      className="btn btn-outline btn-sm"
                      onClick={(e) => { e.stopPropagation(); setEditMember(m); }}
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ padding: '10px 18px', fontSize: 12, color: 'var(--gray-text)', borderTop: '1px solid #f5f0ee' }}>
          {filtered.length} anggota ditampilkan
        </div>
      </div>
    </div>
  );
}