import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../components/AuthContext';
import logo from '../assets/LOGO3.png';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const IS_DEV = import.meta.env.DEV;

const loginStyles = `
  html, body {
    margin: 0;
    padding: 0;
    overflow: hidden;
    height: 100%;
  }

  #root {
    height: 100%;
    overflow: hidden;
  }

  .login-page {
    display: flex;
    min-height: 100vh;
    overflow: hidden;
  }

  /* ── STAR DECORATIONS ── */
  .stars-layer {
    position: absolute;
    inset: 0;
    pointer-events: none;
    z-index: 0;
    overflow: hidden;
  }
  .star {
    position: absolute;
    background: white;
    border-radius: 50%;
    animation: twinkle var(--dur, 3s) ease-in-out infinite var(--delay, 0s);
    opacity: 0;
  }
  @keyframes twinkle {
    0%, 100% { opacity: 0; transform: scale(0.6); }
    50% { opacity: var(--max-opacity, 0.7); transform: scale(1); }
  }
  .star-cross {
    position: absolute;
    pointer-events: none;
    animation: twinkleCross var(--dur, 4s) ease-in-out infinite var(--delay, 0s);
    opacity: 0;
  }
  @keyframes twinkleCross {
    0%, 100% { opacity: 0; transform: scale(0.5) rotate(0deg); }
    50% { opacity: var(--max-opacity, 0.6); transform: scale(1) rotate(20deg); }
  }

  @keyframes logoFloat {
      0%, 100% { transform: translateY(0px); }
      50% { transform: translateY(-6px); }
    }


  .star-cross::before,
  .star-cross::after {
    content: '';
    position: absolute;
    background: white;
    border-radius: 2px;
  }
  .star-cross::before {
    width: var(--size, 12px);
    height: 2px;
    top: 50%; left: 50%;
    transform: translate(-50%, -50%);
  }
  .star-cross::after {
    width: 2px;
    height: var(--size, 12px);
    top: 50%; left: 50%;
    transform: translate(-50%, -50%);
  }

  /* ── LEFT (maroon hero) ── */
  .login-left {
    flex: 1;
    background: linear-gradient(160deg, #7B1C1C 0%, #4a0f0f 40%, #0d1b2a 100%);
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: 32px 52px;
    position: relative;
    overflow: hidden;
    min-height: 100vh;
  }
  .login-left::before {
    content: '';
    position: absolute;
    top: -120px; right: -120px;
    width: 420px; height: 420px;
    border-radius: 50%;
    border: 1px solid rgba(255,255,255,0.05);
    box-shadow:
      0 0 0 60px rgba(255,255,255,0.02),
      0 0 0 120px rgba(255,255,255,0.015);
    pointer-events: none;
  }
  .login-left::after {
    content: '';
    position: absolute;
    bottom: 80px; left: -60px;
    width: 200px; height: 200px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(180,30,30,0.3) 0%, transparent 70%);
    pointer-events: none;
  }

  .login-left-content { position: relative; z-index: 1; }

  .login-logo-wrap {
    margin-bottom: 32px;
  }
  .login-logo-wrap img {
    width: 135px;
    height: 135px;
    object-fit: contain;
    filter:
      drop-shadow(0 0 20px rgba(246,185,59,0.35))
      drop-shadow(0 4px 20px rgba(0,0,0,0.5));
    animation: logoFloat 4s ease-in-out infinite;
  }

  .login-tag {
    font-size: 11px;
    font-weight: 700;
    color: rgba(255,200,100,0.9);
    text-transform: uppercase;
    letter-spacing: 0.15em;
    margin-bottom: 4px;
  }
  .login-sub-tag {
    font-size: 11px;
    color: rgba(255,255,255,0.45);
    text-transform: uppercase;
    letter-spacing: 0.1em;
    margin-bottom: 20px;
  }

  .login-headline {
    font-family: 'Georgia', serif;
    font-size: clamp(32px, 4vw, 52px);
    font-weight: 800;
    color: white;
    line-height: 1.15;
    margin: 0 0 20px;
    text-shadow: 0 4px 20px rgba(0,0,0,0.3);
  }
  .headline-accent {
    color: #f6b93b;
  }

  .login-desc {
    font-size: 14px;
    color: rgba(255,255,255,0.6);
    line-height: 1.65;
    max-width: 320px;
    margin: 0;
  }

  .login-faculty {
    font-size: 11px;
    color: rgba(255,255,255,0.35);
    line-height: 1.6;
    text-align: center;
    position: relative;
    z-index: 1;
  }

  /* ── RIGHT (white form) ── */
  .login-right {
    width: 420px;
    flex-shrink: 0;
    background: white;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: 0;
  }
  .login-right-inner {
    flex: 1;
    padding: 52px 48px 32px;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }
  .login-right-inner h2 {
    font-family: 'Georgia', serif;
    font-size: 26px;
    font-weight: 800;
    color: #1a0a0a;
    line-height: 1.25;
    margin: 0 0 14px;
  }
  .login-right-inner p {
    font-size: 13.5px;
    color: #6b5b5b;
    line-height: 1.65;
    margin: 0 0 32px;
  }

  .login-error {
    background: rgba(255,255,255,0.12);
    border: 1px solid rgba(255,100,100,0.4);
    color: #ffaaaa;
    border-radius: 10px;
    padding: 11px 16px;
    font-size: 13px;
    margin-bottom: 20px;
  }

  .login-google-wrap {
    margin-bottom: 20px;
  }
  .btn-loading {
    width: 100%;
    padding: 14px;
    border-radius: 50px;
    border: 1px solid rgba(255,255,255,0.2);
    background: rgba(255,255,255,0.1);
    color: rgba(255,255,255,0.5);
    font-size: 14px;
    cursor: not-allowed;
  }

  /* Dev mode */
  .dev-mode-label {
    font-size: 10px;
    color: rgba(255,255,255,0.3);
    text-transform: uppercase;
    letter-spacing: 0.1em;
    text-align: center;
    margin-bottom: 10px;
  }
  .dev-buttons {
    display: flex;
    gap: 8px;
    margin-bottom: 20px;
  }
  .dev-btn {
    flex: 1;
    padding: 8px;
    border-radius: 8px;
    border: 1.5px solid rgba(255,255,255,0.2);
    background: rgba(255,255,255,0.08);
    color: rgba(255,200,100,0.9);
    font-size: 12px;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.15s;
  }
  .dev-btn:hover {
    background: rgba(255,255,255,0.15);
    border-color: rgba(255,200,100,0.5);
  }
  .dev-btn:disabled { opacity: 0.5; cursor: not-allowed; }

  .login-note {
    font-size: 11.5px;
    color: rgba(255,255,255,0.28);
    text-align: center;
    line-height: 1.5;
  }

  .login-footer {
    padding: 16px 48px;
    font-size: 10.5px;
    color: rgba(255,255,255,0.2);
    text-align: center;
    border-top: 1px solid rgba(255,255,255,0.08);
    letter-spacing: 0.03em;
  }

  /* ── GOOGLE BUTTON OVERRIDE untuk desktop ── */
  .login-google-wrap > div {
    display: flex;
    justify-content: center;
  }

  /* ════════════════════════════════
     MOBILE — full maroon seamless
     ════════════════════════════════ */
  @media (max-width: 768px) {
    .login-page {
      flex-direction: column;
      background: linear-gradient(175deg, #8B1F1F 0%, #5a1212 35%, #2d0d0d 65%, #0d1b2a 100%);
      height: 100dvh;
      max-height: 100dvh;
      overflow: hidden;
    }

    /* Ambient glow effects on mobile */
    .login-page::before {
      content: '';
      position: fixed;
      top: -80px;
      left: 50%;
      transform: translateX(-50%);
      width: 340px;
      height: 340px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(180,40,40,0.35) 0%, transparent 70%);
      pointer-events: none;
      z-index: 0;
    }
    .login-page::after {
      content: '';
      position: fixed;
      bottom: 60px;
      left: 50%;
      transform: translateX(-50%);
      width: 280px;
      height: 280px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(13,27,42,0.8) 0%, transparent 70%);
      pointer-events: none;
      z-index: 0;
    }

    .login-left {
      flex: 0 0 auto;
      min-height: auto;
      padding: 50px 28px 16px;
      background: transparent;
      justify-content: flex-start;
      z-index: 1;
    }

    .login-left::before,
    .login-left::after { display: none; }

    .login-logo-wrap {
      margin-bottom: 18px;
      display: flex;
      justify-content: center;
    }

    /* Larger logo on mobile with glowing ring */
    .login-logo-wrap img {
      width: 100px;
      height: 100px;
      filter:
        drop-shadow(0 0 20px rgba(246,185,59,0.35))
        drop-shadow(0 4px 20px rgba(0,0,0,0.5));
      animation: logoFloat 4s ease-in-out infinite;
    }

    /* Decorative ring around logo */
    .login-logo-wrap {
      position: relative;
    }
    .login-logo-wrap::before {
      content: '';
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 128px;
      height: 128px;
      border-radius: 50%;
      border: 1px solid rgba(246,185,59,0.25);
      box-shadow:
        0 0 0 8px rgba(246,185,59,0.06),
        0 0 0 16px rgba(246,185,59,0.03),
        inset 0 0 20px rgba(246,185,59,0.05);
    }
    .login-logo-wrap::after {
      content: '';
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 148px;
      height: 148px;
      border-radius: 50%;
      border: 1px dashed rgba(255,255,255,0.08);
      animation: rotateDash 20s linear infinite;
    }
    @keyframes rotateDash {
      from { transform: translate(-50%, -50%) rotate(0deg); }
      to { transform: translate(-50%, -50%) rotate(360deg); }
    }

    .login-tag {
      font-size: 11px;
      font-weight: 800;
      text-align: center;
      letter-spacing: 0.2em;
      color: rgba(246,185,59,0.95);
      text-shadow: 0 0 20px rgba(246,185,59,0.4);
    }

    .login-sub-tag {
      font-size: 10px;
      text-align: center;
      margin-bottom: 14px;
      letter-spacing: 0.15em;
      color: rgba(255,255,255,0.4);
    }

    /* Decorative line separator */
    .login-sub-tag::after {
      content: '';
      display: block;
      width: 48px;
      height: 1px;
      background: linear-gradient(90deg, transparent, rgba(246,185,59,0.5), transparent);
      margin: 10px auto 0;
    }

    .login-headline {
      font-size: clamp(34px, 9vw, 44px);
      text-align: center;
      line-height: 1.1;
      margin-bottom: 12px;
      letter-spacing: -0.01em;
    }

    .login-desc {
      font-size: 12.5px;
      text-align: center;
      max-width: 100%;
      line-height: 1.6;
      margin: 0;
      color: rgba(255,255,255,0.5);
    }

    .login-faculty { display: none; }

    /* RIGHT: transparent, no white card */
    .login-right {
      width: 100%;
      background: transparent;
      padding: 20px 28px 36px;
      flex: 1 1 0;
      display: flex;
      flex-direction: column;
      justify-content: flex-end;
      min-height: 0;
      z-index: 1;
    }

    .login-right-inner {
      background: transparent;
      border-radius: 0;
      padding: 0;
      box-shadow: none;
    }

    /* Glowing divider */
    .login-right-inner::before {
      content: '';
      display: block;
      width: 100%;
      height: 1px;
      background: linear-gradient(90deg, transparent, rgba(255,255,255,0.15), rgba(246,185,59,0.2), rgba(255,255,255,0.15), transparent);
      margin-bottom: 28px;
    }

    .login-right-inner h2 {
      font-family: 'Georgia', serif;
      font-size: 22px;
      font-weight: 800;
      color: #ffffff;
      margin-bottom: 8px;
      text-align: center;
      line-height: 1.3;
      text-shadow: 0 2px 12px rgba(0,0,0,0.4);
    }

    .login-right-inner p {
      font-size: 12px;
      color: rgba(255,255,255,0.4);
      line-height: 1.6;
      margin-bottom: 24px;
      text-align: center;
    }

    .login-error {
      background: rgba(255,80,80,0.15);
      border: 1px solid rgba(255,100,100,0.35);
      color: #ffb3b3;
      border-radius: 12px;
      margin-bottom: 16px;
    }

    .login-google-wrap {
      margin-bottom: 16px;
      display: flex;
      justify-content: center;
    }

    /* Google button wrapper */
    .login-google-wrap > div {
      width: 100% !important;
      display: flex !important;
      justify-content: center !important;
    }

    .login-google-wrap > div > div,
    .login-google-wrap iframe {
      border-radius: 50px !important;
      box-shadow:
        0 4px 28px rgba(0,0,0,0.45),
        0 1px 6px rgba(0,0,0,0.25),
        0 0 0 1px rgba(255,255,255,0.08) !important;
      width: 100% !important;
      max-width: 340px !important;
    }

    .btn-loading {
      max-width: 340px;
      margin: 0 auto;
      display: block;
      background: rgba(255,255,255,0.08);
      border: 1px solid rgba(255,255,255,0.15);
      color: rgba(255,255,255,0.4);
    }

    .login-note {
      color: rgba(255,255,255,0.22);
      margin-top: 6px;
      font-size: 11px;
    }

    .login-footer { display: none; }

    .dev-mode-label {
      color: rgba(255,255,255,0.25);
    }

    .dev-btn {
      border-color: rgba(255,255,255,0.15);
      background: rgba(255,255,255,0.07);
      color: rgba(255,200,100,0.85);
    }
    .dev-btn:hover {
      background: rgba(255,255,255,0.13);
    }
  }

  @media (max-width: 420px) {
    .login-left {
      padding: 50px 22px 14px;
    }

    .login-logo-wrap img {
      width: 90px;
      height: 90px;
    }

    .login-headline {
      font-size: clamp(30px, 8vw, 38px);
      margin-bottom: 10px;
    }

    .login-desc {
      font-size: 12px;
    }

    .login-right {
      padding: 16px 22px 30px;
    }

    .login-right-inner h2 {
      font-size: 20px;
    }

    .login-right-inner p {
      font-size: 11.5px;
      margin-bottom: 18px;
    }

    .login-google-wrap { margin-bottom: 12px; }
  }

  /* Layar sangat kecil (iPhone SE, 375×667) */
  @media (max-width: 390px) and (max-height: 700px) {
    .login-logo-wrap img {
      width: 90px;
      height: 90px;
    }

    .login-headline {
      font-size: 28px;
      margin-bottom: 8px;
    }

    .login-desc { display: none; }

    .login-right-inner p { display: none; }

    .login-right {
      padding: 12px 20px 24px;
    }
  }
`;

// Star configuration for decorative twinkling stars
const STARS_CONFIG = [
  // dot stars
  { type: 'dot', top: '8%',  left: '7%',  size: 2, dur: '3.2s', delay: '0s',    opacity: 0.7 },
  { type: 'dot', top: '12%', left: '88%', size: 2, dur: '2.8s', delay: '0.5s',  opacity: 0.6 },
  { type: 'dot', top: '22%', left: '15%', size: 1.5, dur: '4s', delay: '1s',    opacity: 0.5 },
  { type: 'dot', top: '18%', left: '75%', size: 3,   dur: '3.5s', delay: '0.3s', opacity: 0.65 },
  { type: 'dot', top: '35%', left: '92%', size: 1.5, dur: '2.5s', delay: '1.2s', opacity: 0.5 },
  { type: 'dot', top: '5%',  left: '55%', size: 2,   dur: '3.8s', delay: '0.8s', opacity: 0.55 },
  { type: 'dot', top: '45%', left: '5%',  size: 1.5, dur: '4.2s', delay: '1.5s', opacity: 0.4 },
  { type: 'dot', top: '55%', left: '95%', size: 2,   dur: '3.1s', delay: '0.7s', opacity: 0.5 },
  { type: 'dot', top: '28%', left: '45%', size: 1.5, dur: '5s',   delay: '2s',   opacity: 0.3 },
  { type: 'dot', top: '70%', left: '8%',  size: 2,   dur: '3.6s', delay: '0.4s', opacity: 0.45 },
  { type: 'dot', top: '75%', left: '88%', size: 1.5, dur: '4.5s', delay: '1.8s', opacity: 0.4 },
  { type: 'dot', top: '88%', left: '22%', size: 2,   dur: '2.9s', delay: '0.9s', opacity: 0.5 },
  { type: 'dot', top: '92%', left: '70%', size: 1.5, dur: '3.3s', delay: '1.4s', opacity: 0.45 },
  // cross/sparkle stars
  { type: 'cross', top: '6%',  left: '30%', size: 10, dur: '4.5s', delay: '0.6s', opacity: 0.5 },
  { type: 'cross', top: '15%', left: '62%', size: 14, dur: '3.8s', delay: '1.3s', opacity: 0.55 },
  { type: 'cross', top: '32%', left: '82%', size: 10, dur: '5.2s', delay: '0.2s', opacity: 0.4 },
  { type: 'cross', top: '48%', left: '18%', size: 12, dur: '4.0s', delay: '2.1s', opacity: 0.45 },
  { type: 'cross', top: '62%', left: '78%', size: 10, dur: '3.5s', delay: '1.0s', opacity: 0.4 },
  { type: 'cross', top: '78%', left: '42%', size: 14, dur: '4.8s', delay: '0.5s', opacity: 0.5 },
  { type: 'cross', top: '85%', left: '85%', size: 10, dur: '3.2s', delay: '1.7s', opacity: 0.35 },
  { type: 'cross', top: '3%',  left: '78%', size: 12, dur: '4.2s', delay: '2.5s', opacity: 0.45 },
  { type: 'cross', top: '95%', left: '12%', size: 10, dur: '5.0s', delay: '0.8s', opacity: 0.35 },
];

export default function LoginPage() {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const googleButtonRef = useRef(null);
  const { loginWithGoogle, devLogin } = useAuth();
  const navigate = useNavigate();

  const redirectByRole = (role) => {
    const redirectMap = {
      admin: '/dashboard',
      petugas: '/dashboard',
      mahasiswa: '/user/dashboard',
      dosen: '/user/dashboard'
    };
    navigate(redirectMap[role] || '/');
  };

  const handleDevLogin = async (role) => {
    setLoading(true);
    setError('');
    const result = await devLogin(role);
    if (result.success) {
      redirectByRole(result.role);
    } else {
      setError(result.message || 'Dev login gagal');
    }
    setLoading(false);
  };

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) {
      setError('Google Client ID belum diatur di .env frontend');
      return;
    }

    const renderGoogleButton = () => {
      if (!window.google || !googleButtonRef.current) return;

      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: async (response) => {
          setLoading(true);
          setError('');
          const result = await loginWithGoogle(response.credential);
          if (result.success) {
            redirectByRole(result.role);
          } else {
            setError(result.message || 'Login gagal');
          }
          setLoading(false);
        }
      });

      window.google.accounts.id.renderButton(
        googleButtonRef.current,
        {
          theme: 'outline',
          size: 'large',
          width: 340,
          text: 'signin_with',
          shape: 'pill'
        }
      );
    };

    const timer = setInterval(() => {
      if (window.google) {
        clearInterval(timer);
        renderGoogleButton();
      }
    }, 300);

    return () => clearInterval(timer);
  }, [loginWithGoogle, navigate]);

  return (
    <>
      <style>{loginStyles}</style>
      <div className="login-page">

        {/* ── STARS LAYER (mobile only via CSS visibility) ── */}
        <div className="stars-layer">
          {STARS_CONFIG.map((s, i) =>
            s.type === 'dot' ? (
              <div
                key={i}
                className="star"
                style={{
                  top: s.top,
                  left: s.left,
                  width: s.size + 'px',
                  height: s.size + 'px',
                  '--dur': s.dur,
                  '--delay': s.delay,
                  '--max-opacity': s.opacity,
                }}
              />
            ) : (
              <div
                key={i}
                className="star-cross"
                style={{
                  top: s.top,
                  left: s.left,
                  '--size': s.size + 'px',
                  '--dur': s.dur,
                  '--delay': s.delay,
                  '--max-opacity': s.opacity,
                  width: s.size + 'px',
                  height: s.size + 'px',
                }}
              />
            )
          )}
        </div>

        {/* ── LEFT ── */}
        <div className="login-left">
          <div className="login-left-content">
            <div className="login-logo-wrap">
              <img src={logo} alt="Logo FMIPA" />
            </div>

            <div className="login-tag">FMIPA Library</div>
            <div className="login-sub-tag">Perpustakaan Digital</div>

            <h1 className="login-headline">
              Menjelajahi
              <br />
              <span className="headline-accent">Ilmu</span> dengan
              <br />
              Baca Buku.
            </h1>

            <p className="login-desc">
              Selamat datang di Sistem Informasi Perpustakaan FMIPA.
              Setiap rumus besar lahir dari buku yang dibaca berulang kali.
            </p>
          </div>

          <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
            <div className="login-faculty">
              Fakultas Matematika dan Ilmu Pengetahuan Alam
              <br />
              Universitas Negeri Surabaya
            </div>
          </div>
        </div>

        {/* ── RIGHT ── */}
        <div className="login-right">
          <div className="login-right-inner">
            <h2>
              Masuk ke Sistem
              <br />
              Perpustakaan FMIPA
            </h2>

            <p>
              Login menggunakan akun resmi UNESA untuk mengakses
              layanan perpustakaan digital.
            </p>

            {error && (
              <div className="login-error">{error}</div>
            )}

            <div className="login-google-wrap">
              {loading ? (
                <button className="btn-loading" disabled>
                  Memproses...
                </button>
              ) : (
                <div ref={googleButtonRef} />
              )}
            </div>

            {IS_DEV && (
              <div>
                <div className="dev-mode-label">Mode Testing</div>
                <div className="dev-buttons">
                  <button type="button" className="dev-btn" onClick={() => handleDevLogin('admin')} disabled={loading}>Admin</button>
                  <button type="button" className="dev-btn" onClick={() => handleDevLogin('petugas')} disabled={loading}>Petugas</button>
                  <button type="button" className="dev-btn" onClick={() => handleDevLogin('dosen')} disabled={loading}>Dosen</button>
                </div>
              </div>
            )}

            <div className="login-note">
              Hanya email resmi UNESA yang dapat mengakses sistem
            </div>
          </div>

          <div className="login-footer">
            © 2026 FMIPA UNESA — Library Management System
          </div>
        </div>
      </div>
    </>
  );
}
