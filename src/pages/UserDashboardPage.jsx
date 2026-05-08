import { useState, useEffect, useRef } from 'react';
import { BookOpen, Clock, AlertCircle, DollarSign, Info, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { useApp } from '../components/AppContext';
import { useAuth } from '../components/AuthContext';

const API_URL = import.meta.env.VITE_API_URL;

// ── Foto slideshow (Unsplash – perpustakaan/buku) ────────────────────────────
const SLIDES = [
  {
    url: 'https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=1600&q=80',
    caption: 'Koleksi Buku Lengkap',
  },
  {
    url: 'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?w=1600&q=80',
    caption: 'Ruang Baca Nyaman',
  },
  {
    url: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=1600&q=80',
    caption: 'Temukan Ilmu Baru',
  },
];

// ── Live Clock ──────────────────────────────────────────────────────────────
function LiveClock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return (
    <div style={{ textAlign: 'right' }}>
      <div style={{
        fontSize: 32,
        fontWeight: 700,
        letterSpacing: '-1px',
        fontVariantNumeric: 'tabular-nums',
        color: 'white',
        fontFamily: "'DM Mono', monospace",
        textShadow: '0 2px 12px rgba(0,0,0,0.5)',
      }}>
        {now.toLocaleTimeString('id-ID')}
      </div>
      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)', letterSpacing: '0.04em', textShadow: '0 1px 4px rgba(0,0,0,0.5)' }}>
        {now.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
      </div>
    </div>
  );
}

// ── Photo Background Slider ──────────────────────────────────────────────────
function PhotoSlider({ current, onPrev, onNext, onDot }) {
  return (
    <>
      {SLIDES.map((slide, i) => (
        <div key={i} style={{
          position: 'absolute', inset: 0,
          backgroundImage: `url(${slide.url})`,
          backgroundSize: 'cover', backgroundPosition: 'center',
          opacity: i === current ? 1 : 0,
          transition: 'opacity 1s ease',
          zIndex: 0,
        }} />
      ))}
      {/* Dark overlay */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 1,
        background: 'linear-gradient(to bottom, rgba(10,15,30,0.55) 0%, rgba(10,15,30,0.72) 60%, rgba(10,15,30,0.88) 100%)',
      }} />
      {/* Prev/Next arrows */}
      <button onClick={onPrev} style={arrowBtn('left')}>
        <ChevronLeft size={22} color="white" />
      </button>
      <button onClick={onNext} style={arrowBtn('right')}>
        <ChevronRight size={22} color="white" />
      </button>
      {/* Dot indicators */}
      <div style={{
        position: 'absolute', bottom: 56, left: '50%', transform: 'translateX(-50%)',
        display: 'flex', gap: 8, zIndex: 10,
      }}>
        {SLIDES.map((_, i) => (
          <button key={i} onClick={() => onDot(i)} style={{
            width: i === current ? 24 : 8, height: 8, borderRadius: 100,
            background: i === current ? 'white' : 'rgba(255,255,255,0.4)',
            border: 'none', cursor: 'pointer', padding: 0,
            transition: 'all 0.4s ease',
          }} />
        ))}
      </div>
    </>
  );
}

const arrowBtn = (side) => ({
  position: 'absolute', [side]: 24, top: '50%', transform: 'translateY(-50%)',
  zIndex: 10, background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)',
  border: '1px solid rgba(255,255,255,0.2)', borderRadius: '50%',
  width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center',
  cursor: 'pointer', transition: 'background 0.2s',
});

// ── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ icon, value, label, bg, border, textColor, labelColor, delay = 0, visible }) {
  return (
    <div style={{
      background: bg,
      border: `1px solid ${border}`,
      borderRadius: 14,
      padding: '20px 22px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
      transform: visible ? 'translateY(0)' : 'translateY(32px)',
      opacity: visible ? 1 : 0,
      transition: `transform 0.6s cubic-bezier(.22,1,.36,1) ${delay}ms, opacity 0.6s ease ${delay}ms`,
    }}>
      <div style={{ fontSize: 11, color: labelColor, textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600, marginBottom: 6 }}>
        {label}
      </div>
      <div style={{ fontSize: 28, fontWeight: 800, color: textColor, lineHeight: 1, fontFamily: "'DM Mono', monospace" }}>
        {value}
      </div>
      {icon && <div style={{ marginTop: 6, opacity: 0.5 }}>{icon}</div>}
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────────────────
export default function UserDashboardPage() {
  const { loans, members, getDendaTotal, getUserNotifications } = useApp();
  const { user } = useAuth();

const currentMember = members.find(
  m =>
    String(m.id) === String(user?.anggotaId || user?.memberId) ||
    m.nim === user?.nim ||
    m.email === user?.email
);

const profilePhoto = currentMember?.photo_url || user?.photo_url;

  const notifications = getUserNotifications();

  const isDosen = user?.role === 'dosen';
  const rules = isDosen
    ? { max: 10, durasi: '1 Bulan', perpanjang: 'N/A' }
    : { max: 3, durasi: '1 Minggu', perpanjang: '2 Kali' };

  const myLoans = loans.filter(
    l =>
      l.user_id === user?.id ||
      l.memberId === user?.id ||
      l.memberNim === user?.nim
  );

  const activeLoans = myLoans.filter(l =>
    ['dipinjam', 'Dipinjam'].includes(l.status)
  );
  const overdueLoans = myLoans.filter(l =>
    ['terlambat', 'Terlambat'].includes(l.status)
  );

  // ✅ FIX: kirim user.id agar denda hanya milik user yang login
  const dendaSaya = getDendaTotal(user?.id);

  // Slideshow state
  const [slide, setSlide] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setSlide(s => (s + 1) % SLIDES.length), 5000);
    return () => clearInterval(t);
  }, []);
  const prevSlide = () => setSlide(s => (s - 1 + SLIDES.length) % SLIDES.length);
  const nextSlide = () => setSlide(s => (s + 1) % SLIDES.length);

  // Scroll reveal
  const dashRef = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.1 }
    );
    if (dashRef.current) observer.observe(dashRef.current);
    return () => observer.disconnect();
  }, []);

  const scrollDown = () => dashRef.current?.scrollIntoView({ behavior: 'smooth' });

  const initials = user?.name?.split(' ').map(w => w[0]).slice(0, 2).join('') || 'U';
  const [showNotif, setShowNotif] = useState(false);

  return (
    <div style={{ fontFamily: "'Nunito', 'Segoe UI', sans-serif", margin: 0, padding: 0 }}>

      {/* ── HERO SECTION ─────────────────────────────────────────────────── */}
      <div style={{
        height: '100vh',
        display: 'flex', flexDirection: 'column',
        justifyContent: 'center', alignItems: 'stretch',
        position: 'relative', overflow: 'hidden',
        margin: '-24px -24px 0 -24px',
      }}>
        <PhotoSlider current={slide} onPrev={prevSlide} onNext={nextSlide} onDot={setSlide} />

        {/* Clock — pojok kanan atas */}
        <div style={{ position: 'absolute', top: 24, right: 32, zIndex: 20 }}>
          <LiveClock />
        </div>

        {/* Konten utama hero */}
        <div style={{
          position: 'relative', zIndex: 5,
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          padding: '0 40px',
          // sedikit geser ke atas agar "Lihat Statistik" tidak menumpuk
          marginTop: '-40px',
        }}>

          {/* Avatar */}
          <div style={{
            width: 90, height: 90, borderRadius: '50%',
            background: 'linear-gradient(135deg, #7B1C1C, #C53030)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 30, fontWeight: 800, color: 'white',
            boxShadow: '0 0 0 4px rgba(255,255,255,0.15), 0 0 0 8px rgba(255,255,255,0.06), 0 8px 32px rgba(0,0,0,0.4)',
            marginBottom: 16,
            animation: 'fadeInDown 0.8s cubic-bezier(.22,1,.36,1)',
            fontFamily: "'DM Mono', monospace",
            overflow: 'hidden', padding: 0, flexShrink: 0,
          }}>
           {profilePhoto ? (
  <img
    src={`${API_URL}${profilePhoto}`}
    alt={user.name}
    style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
  />
) : initials}
          </div>

          {/* Nama */}
          <h1 style={{
            fontSize: 'clamp(28px, 4vw, 52px)', fontWeight: 700,
            color: 'white', margin: '0 0 12px', textAlign: 'center',
            fontFamily: "'Playfair Display', Georgia, serif",
            letterSpacing: '-0.5px', lineHeight: 1.1,
            textShadow: '0 4px 24px rgba(0,0,0,0.5)',
            animation: 'fadeInUp 0.9s cubic-bezier(.22,1,.36,1)',
          }}>
            {user?.name}
          </h1>

          {/* Role badges */}
          <div style={{
            display: 'flex', gap: 10, alignItems: 'center', marginBottom: 20,
            animation: 'fadeInUp 1s cubic-bezier(.22,1,.36,1)',
          }}>
            <span style={{
              padding: '5px 16px', borderRadius: 100,
              background: 'rgba(255,255,255,0.14)', backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255,255,255,0.25)',
              color: 'white', fontSize: 11, fontWeight: 700,
              letterSpacing: '0.12em', textTransform: 'uppercase',
              textShadow: '0 1px 4px rgba(0,0,0,0.3)',
            }}>
              {user?.role}
            </span>
            <span style={{
              padding: '5px 16px', borderRadius: 100,
              background: 'rgba(123,28,28,0.5)', backdropFilter: 'blur(8px)',
              border: '1px solid rgba(220,80,80,0.4)',
              color: '#FFB3B3', fontSize: 11, fontWeight: 600,
            }}>
              Perpustakaan FMIPA
            </span>
          </div>

          {/* NOTIFIKASI */}
          {notifications.length > 0 && (() => {
          const availableCount = notifications.filter(n => n.available).length;
          const unavailableCount = notifications.length - availableCount;

          return (
            <div style={{
              width: '100%',
              maxWidth: 460,
              marginBottom: 16,
            }}>
              {/* 🔔 SUMMARY */}
              <div
                onClick={() => setShowNotif(!showNotif)}
                style={{
                  background: 'rgba(255,255,255,0.12)',
                  border: '1px solid rgba(255,255,255,0.25)',
                  borderRadius: 12,
                  padding: '10px 14px',
                  backdropFilter: 'blur(10px)',
                  cursor: 'pointer',
                }}
              >
                <div style={{ fontWeight: 700, fontSize: 13, color: 'white' }}>
                  🔔 {notifications.length} Notifikasi
                </div>

                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)' }}>
                  {availableCount > 0 && `✅ ${availableCount} tersedia`}
                  {availableCount > 0 && unavailableCount > 0 && ' • '}
                  {unavailableCount > 0 && `⏳ ${unavailableCount} buku belum tersedia`}
                </div>
              </div>

              {/* ⬇️ DETAIL */}
              {showNotif && (
                <div style={{
                  marginTop: 8,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                }}>
                  {notifications.map(n => {
                    const isAvailable = n.available === true;

                    return (
                      <div key={n.id} style={{
                        background: isAvailable
                          ? 'rgba(209,250,229,0.95)'
                          : 'rgba(254,243,199,0.95)',
                        border: `1px solid ${isAvailable ? '#6EE7B7' : '#FCD34D'}`,
                        borderRadius: 10,
                        padding: '8px 12px',
                        fontSize: 12,
                      }}>
                        <strong>"{n.title}"</strong><br />
                        {isAvailable
                          ? ' Kini dapat dipinjam. Segera kunjungi perpustakaan!'
                           : ' Masih sedang dipinjam oleh anggota lain.'}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })()}

          {/* Rules glass card */}
          <div style={{
            background: 'rgba(255,255,255,0.08)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(255,255,255,0.14)',
            borderRadius: 16,
            padding: '16px 32px',
            display: 'flex',
            alignItems: 'center',
          }}>
            {[
              { label: 'Maks. Buku', val: rules.max },
              { label: 'Durasi', val: rules.durasi },
              { label: 'Perpanjangan', val: rules.perpanjang },
            ].map((r, i) => (
              <div key={i} style={{
                textAlign: 'center',
                padding: '0 22px',
                borderRight: i < 2 ? '1px solid rgba(255,255,255,0.15)' : 'none',
              }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: 'white' }}>
                  {r.val}
                </div>
                <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)' }}>
                  {r.label}
                </div>
              </div>
            ))}
          </div>

          {/* ⬇️ BUTTON HARUS DI DALAM CONTAINER YANG SAMA */}
          <div style={{ marginTop: 12 }}>
            <button
              onClick={scrollDown}
              style={{
                fontSize: 11,
                color: 'rgba(255,255,255,0.7)',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              Lihat Statistik &nbsp;
              <ChevronDown size={14} />
            </button>
          </div>
          </div>
          </div>

      {/* ── DASHBOARD SECTION ────────────────────────────────────────────── */}
      <div ref={dashRef} style={{
        minHeight: '100vh',
        background: '#F8FAFC',
        padding: '80px 48px',
      }}>
        {/* Section header */}
        <div style={{
          marginBottom: 48,
          transform: visible ? 'translateY(0)' : 'translateY(24px)',
          opacity: visible ? 1 : 0,
          transition: 'transform 0.6s ease, opacity 0.6s ease',
        }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: '#FEE2E2', color: '#7B1C1C',
            borderRadius: 100, padding: '6px 16px',
            fontSize: 12, fontWeight: 700, letterSpacing: '0.08em',
            textTransform: 'uppercase', marginBottom: 12,
          }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#7B1C1C' }} />
            Dashboard Layanan
          </div>
          <h2 style={{
            fontSize: 40, fontWeight: 800, color: '#0D1B2A',
            margin: 0, letterSpacing: '-1px',
          }}>
            Statistik Peminjaman
          </h2>
          <p style={{ color: '#94A3B8', marginTop: 8, fontSize: 15 }}>
            Pantau aktivitas peminjaman buku kamu secara real-time
          </p>
        </div>

        {/* ✅ FIX NOTIFIKASI dashboard section — kalimat diperjelas */}
        {notifications.length > 0 && (
          <div style={{ marginBottom: 32, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {notifications.map(n => {
              const isAvailable = n.available === true;
              return (
                <div key={n.id} style={{
                  width: '100%',
                  background: isAvailable ? 'rgba(209,250,229,0.92)' : 'rgba(254,243,199,0.92)',
                  border: `1px solid ${isAvailable ? '#6EE7B7' : '#FCD34D'}`,
                  borderRadius: 16, padding: '16px 20px',
                  display: 'flex', alignItems: 'flex-start', gap: 12,
                }}>
                  <span style={{ fontSize: 20, flexShrink: 0 }}>
                    {isAvailable ? '✅' : '⏳'}
                  </span>
                  <div>
                    <div style={{
                      fontWeight: 700, fontSize: 14,
                      color: isAvailable ? '#065F46' : '#92400E',
                    }}>
                      {isAvailable
                        ? 'Buku yang Anda pantau sudah tersedia!'
                        : 'Buku yang Anda pantau belum tersedia'}
                    </div>
                    <div style={{
                      fontSize: 14, marginTop: 2,
                      color: isAvailable ? '#047857' : '#B45309',
                    }}>
                      <strong>"{n.title}"</strong> (ID: {n.bookId})
                      {isAvailable
                        ? ' kini dapat dipinjam. Segera kunjungi perpustakaan dan tunjukkan kode buku ke petugas.'
                        : ' masih sedang dipinjam oleh anggota lain. Kami akan terus memantaukan untuk Anda.'}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Info banner */}
        <div style={{
          background: 'linear-gradient(135deg, #EBF8FF, #DBEAFE)',
          border: '1px solid #BFDBFE',
          borderRadius: 16, padding: '20px 28px',
          display: 'flex', gap: 16, alignItems: 'center',
          marginBottom: 40,
          transform: visible ? 'translateY(0)' : 'translateY(24px)',
          opacity: visible ? 1 : 0,
          transition: 'transform 0.6s ease 100ms, opacity 0.6s ease 100ms',
        }}>
          <div style={{
            width: 40, height: 40, borderRadius: 10,
            background: '#3B82F6', display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <Info size={20} color="white" />
          </div>
          <div>
            <div style={{ fontWeight: 700, color: '#1E40AF', fontSize: 15 }}>
              Aturan Peminjaman {isDosen ? 'Dosen' : 'Mahasiswa'}
            </div>
            <div style={{ fontSize: 14, color: '#3730A3', marginTop: 2 }}>
              Maksimal <strong>{rules.max} buku</strong> &nbsp;·&nbsp;
              Durasi <strong>{rules.durasi}</strong> &nbsp;·&nbsp;
              Perpanjangan: <strong>{rules.perpanjang}</strong>
            </div>
          </div>
        </div>

        {/* Stat cards grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 16,
        }}>
          <StatCard
            icon={<BookOpen size={16} color="#7B1C1C" />}
            value={`${activeLoans.length} / ${rules.max}`}
            label="Kuota Pinjam"
            bg="linear-gradient(135deg, #7B1C1C, #a83232)"
            border="transparent"
            textColor="white"
            labelColor="rgba(255,255,255,0.75)"
            delay={0} visible={visible}
          />
          <StatCard
            icon={<Clock size={16} color="#D97706" />}
            value={activeLoans.length}
            label="Buku Aktif"
            bg="linear-gradient(135deg, #fffaf0, #fff)"
            border="#feebc8"
            textColor="#d69e2e"
            labelColor="#d69e2e"
            delay={100} visible={visible}
          />
          <StatCard
            icon={<AlertCircle size={16} color="#e53e3e" />}
            value={overdueLoans.length}
            label="Terlambat"
            bg="linear-gradient(135deg, #fff5f5, #fff)"
            border="#fed7d7"
            textColor="#e53e3e"
            labelColor="#e53e3e"
            delay={200} visible={visible}
          />
          <StatCard
            icon={<DollarSign size={16} color="#38a169" />}
            value={`Rp ${((dendaSaya ?? 0) / 1000).toFixed(0)}K`}
            label="Total Denda Saya"
            bg="linear-gradient(135deg, #f0fff4, #fff)"
            border="#c6f6d5"
            textColor="#38a169"
            labelColor="#38a169"
            delay={300} visible={visible}
          />
        </div>

        {/* Progress bar for quota */}
        <div style={{
          marginTop: 40, background: 'white', borderRadius: 20,
          padding: '28px 32px', boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
          transform: visible ? 'translateY(0)' : 'translateY(24px)',
          opacity: visible ? 1 : 0,
          transition: 'transform 0.6s ease 400ms, opacity 0.6s ease 400ms',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ fontWeight: 700, color: '#0D1B2A', fontSize: 15 }}>Penggunaan Kuota</span>
            <span style={{ fontWeight: 800, color: '#7B1C1C', fontSize: 15 }}>
              {activeLoans.length}/{rules.max} buku
            </span>
          </div>
          <div style={{ height: 10, background: '#F1F5F9', borderRadius: 100, overflow: 'hidden' }}>
            <div style={{
              height: '100%', borderRadius: 100,
              background: activeLoans.length / rules.max > 0.8
                ? 'linear-gradient(90deg, #DC2626, #EF4444)'
                : 'linear-gradient(90deg, #7B1C1C, #C53030)',
              width: visible ? `${(activeLoans.length / rules.max) * 100}%` : '0%',
              transition: 'width 1s cubic-bezier(.22,1,.36,1) 500ms',
            }} />
          </div>
          <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 8 }}>
            {rules.max - activeLoans.length} slot tersisa
          </div>
        </div>
      </div>

      {/* CSS Animations */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&family=Nunito:wght@400;600;700;800&family=DM+Mono:wght@400;500&display=swap');
        @keyframes fadeInDown {
          from { opacity: 0; transform: translateY(-20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes bounce {
          0%, 100% { transform: translateX(-50%) translateY(0); }
          50%       { transform: translateX(-50%) translateY(-6px); }
        }
      `}</style>
    </div>
  );
}