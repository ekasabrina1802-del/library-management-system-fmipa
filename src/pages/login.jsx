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
    filter: drop-shadow(0 4px 16px rgba(0,0,0,0.3));
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
      background: linear-gradient(160deg, #7B1C1C 0%, #4a0f0f 45%, #0d1b2a 100%);
      height: 100dvh;
      max-height: 100dvh;
      overflow: hidden;
    }

    .login-left {
      flex: 0 0 auto;
      min-height: auto;
      padding: 28px 24px 12px;
      background: transparent;
      justify-content: flex-start;
    }

    .login-left::before,
    .login-left::after { display: none; }

    .login-logo-wrap {
      margin-bottom: 12px;
      display: flex;
      justify-content: center;
    }

    .login-logo-wrap img {
      width: 80px;
      height: 80px;
    }

    .login-tag {
      font-size: 10px;
      text-align: center;
    }

    .login-sub-tag {
      font-size: 10px;
      text-align: center;
      margin-bottom: 10px;
    }

    .login-headline {
      font-size: clamp(28px, 7vw, 36px);
      text-align: center;
      line-height: 1.12;
      margin-bottom: 10px;
    }

    .login-desc {
      font-size: 12px;
      text-align: center;
      max-width: 100%;
      line-height: 1.55;
      margin: 0;
    }

    .login-faculty { display: none; }

    /* RIGHT: transparent, no white card */
    .login-right {
      width: 100%;
      background: transparent;
      padding: 20px 24px 28px;
      flex: 1 1 0;
      display: flex;
      flex-direction: column;
      justify-content: flex-end;
      min-height: 0;
    }

    .login-right-inner {
      background: transparent;
      border-radius: 0;
      padding: 0;
      box-shadow: none;
    }

    /* Divider pengganti transisi dari hero ke form */
    .login-right-inner::before {
      content: '';
      display: block;
      width: 100%;
      height: 1px;
      background: rgba(255,255,255,0.1);
      margin-bottom: 24px;
    }

    .login-right-inner h2 {
      font-family: 'Georgia', serif;
      font-size: 20px;
      font-weight: 800;
      color: #ffffff;
      margin-bottom: 6px;
      text-align: center;
    }

    .login-right-inner p {
      font-size: 12px;
      color: rgba(255,255,255,0.45);
      line-height: 1.55;
      margin-bottom: 20px;
      text-align: center;
    }

    .login-error {
      background: rgba(255,80,80,0.15);
      border: 1px solid rgba(255,100,100,0.35);
      color: #ffb3b3;
    }

    .login-google-wrap {
      margin-bottom: 14px;
      display: flex;
      justify-content: center;
    }

    /* Tombol Google tetap putih, pill shape */
    .login-google-wrap > div {
      width: 100% !important;
      display: flex !important;
      justify-content: center !important;
    }

    /* Wrapper shadow agar tombol google menonjol di atas maroon */
    .login-google-wrap > div > div,
    .login-google-wrap iframe {
      border-radius: 50px !important;
      box-shadow: 0 4px 24px rgba(0,0,0,0.35), 0 1px 6px rgba(0,0,0,0.2) !important;
      width: 100% !important;
      max-width: 320px !important;
    }

    .btn-loading {
      max-width: 320px;
      margin: 0 auto;
      display: block;
    }

    .login-note {
      color: rgba(255,255,255,0.25);
      margin-top: 4px;
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
      padding: 22px 20px 10px;
    }

    .login-logo-wrap img {
      width: 68px;
      height: 68px;
    }

    .login-headline {
      font-size: clamp(24px, 7vw, 30px);
      margin-bottom: 8px;
    }

    .login-desc {
      font-size: 11.5px;
    }

    .login-right {
      padding: 16px 20px 24px;
    }

    .login-right-inner h2 {
      font-size: 18px;
    }

    .login-right-inner p {
      font-size: 11.5px;
      margin-bottom: 16px;
    }

    .login-google-wrap { margin-bottom: 12px; }
  }

  /* Layar sangat kecil (iPhone SE, 375×667) */
  @media (max-width: 390px) and (max-height: 700px) {
    .login-logo-wrap img {
      width: 56px;
      height: 56px;
    }

    .login-headline {
      font-size: 22px;
      margin-bottom: 6px;
    }

    .login-desc { display: none; }

    .login-right-inner p { display: none; }

    .login-right {
      padding: 12px 18px 20px;
    }
  }
`;

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
          width: 320,
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
