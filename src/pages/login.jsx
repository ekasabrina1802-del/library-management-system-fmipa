import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../components/AuthContext';
import logo from '../assets/LOGO3.png';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const IS_DEV = import.meta.env.DEV;

const loginStyles = `
  html,
  body {
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
    background: #fef2f2;
    border: 1px solid #fecaca;
    color: #dc2626;
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
    padding: 12px;
    border-radius: 24px;
    border: 1px solid #e5dada;
    background: #f9f6f6;
    color: #9b8e8e;
    font-size: 14px;
    cursor: not-allowed;
  }

  /* Dev mode */
  .dev-mode-label {
    font-size: 10px;
    color: #b0a8a8;
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
    border: 1.5px solid #e5dada;
    background: white;
    color: #7B1C1C;
    font-size: 12px;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.15s;
  }
  .dev-btn:hover {
    background: #fff5f5;
    border-color: #7B1C1C;
  }
  .dev-btn:disabled { opacity: 0.5; cursor: not-allowed; }

  .login-note {
    font-size: 11.5px;
    color: #b0a8a8;
    text-align: center;
    line-height: 1.5;
  }

  .login-footer {
    padding: 16px 48px;
    font-size: 10.5px;
    color: #c8bfbf;
    text-align: center;
    border-top: 1px solid #f5f0f0;
    letter-spacing: 0.03em;
  }

  /* ════════════════════════════════
     MOBILE — full maroon, menyatu
     ════════════════════════════════ */
  @media (max-width: 768px) {
  .login-page {
    flex-direction: column;
    background: linear-gradient(
      160deg,
      #7B1C1C 0%,
      #4a0f0f 45%,
      #0d1b2a 100%
    );
    height: 100dvh;        /* pakai dvh bukan vh agar lebih akurat di mobile */
    max-height: 100dvh;
    overflow: hidden;
  }

  .login-left {
    flex: 0 0 auto;        /* jangan grow/shrink */
    min-height: auto;
    padding: 20px 22px 8px;
    background: transparent;
    justify-content: flex-start;
  }

  .login-left::before,
  .login-left::after { display: none; }

  .login-logo-wrap {
    margin-bottom: 8px;
    display: flex;
    justify-content: center;
  }

  .login-logo-wrap img {
    width: 72px;
    height: 72px;
  }

  .login-tag {
    font-size: 10px;
    text-align: center;
  }

  .login-sub-tag {
    font-size: 10px;
    text-align: center;
    margin-bottom: 8px;
  }

  .login-headline {
    font-size: clamp(20px, 6.5vw, 30px);
    text-align: center;
    line-height: 1.1;
    margin-bottom: 8px;
  }

  .login-desc {
    font-size: 11.5px;
    text-align: center;
    max-width: 100%;
    line-height: 1.5;
    margin: 0;
  }

  .login-faculty { display: none; }

  .login-right {
    width: 100%;
    background: transparent;
    padding: 12px 14px 14px;
    flex: 1 1 0;           /* ambil sisa ruang persis, tidak lebih */
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    min-height: 0;         /* biar flex child bisa shrink */
  }

  .login-right-inner {
    background: white;
    border-radius: 20px 20px 16px 16px;
    padding: 20px 18px 16px;
    box-shadow:
      0 -4px 30px rgba(0,0,0,0.2),
      0 16px 40px rgba(0,0,0,0.15);
    overflow: hidden;      /* jaga isi tidak meluber */
  }

  .login-right-inner h2 {
    font-size: 18px;
    margin-bottom: 8px;
  }

  .login-right-inner p {
    font-size: 12px;
    margin-bottom: 14px;
    line-height: 1.5;
  }

  .login-google-wrap { margin-bottom: 12px; }

  .login-footer { display: none; }
}

@media (max-width: 420px) {
  .login-left {
    padding: 16px 16px 6px;
  }

  .login-logo-wrap img {
    width: 60px;
    height: 60px;
  }

  .login-headline {
    font-size: clamp(18px, 6vw, 24px);
    margin-bottom: 6px;
  }

  .login-desc {
    font-size: 11px;
    line-height: 1.45;
  }

  .login-right {
    padding: 10px 12px 12px;
  }

  .login-right-inner {
    padding: 16px 14px 14px;
    border-radius: 16px 16px 12px 12px;
  }

  .login-right-inner h2 {
    font-size: 16px;
    margin-bottom: 6px;
  }

  .login-right-inner p {
    font-size: 11px;
    margin-bottom: 12px;
  }

  .login-google-wrap { margin-bottom: 10px; }
}

/* Layar sangat kecil (iPhone SE, 375px × 667px) */
@media (max-width: 390px) and (max-height: 700px) {
  .login-logo-wrap img {
    width: 52px;
    height: 52px;
  }

  .login-headline {
    font-size: 17px;
    margin-bottom: 4px;
  }

  .login-desc { display: none; } /* korbankan deskripsi agar button tetap terlihat */

  .login-right-inner {
    padding: 14px 12px 12px;
  }

  .login-right-inner p {
    display: none;
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