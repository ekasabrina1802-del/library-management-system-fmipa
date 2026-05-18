import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../components/AuthContext';
import logo from '../assets/LOGO3.png';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const IS_DEV = import.meta.env.DEV;

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
      <style>{`
        .login-page {
          display: flex;
          min-height: 100vh;
          font-family: 'Georgia', serif;
        }

        /* ── LEFT PANEL ── */
        .login-left {
          flex: 0 0 55%;
          background: #7a1c1c;
          background-image:
            radial-gradient(ellipse at 30% 20%, rgba(180,50,50,0.45) 0%, transparent 55%),
            radial-gradient(ellipse at 80% 80%, rgba(40,0,0,0.6) 0%, transparent 60%);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: space-between;
          padding: 48px 40px 36px;
          position: relative;
          overflow: hidden;
        }

        .login-left::before {
          content: '';
          position: absolute;
          inset: 0;
          background-image: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
          pointer-events: none;
        }

        .login-left-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          gap: 0;
          width: 100%;
        }

        /* Logo circle */
        .login-logo-wrap {
          width: 190px;
          height: 190px;
          border-radius: 50%;
          border: 1.5px solid rgba(255,255,255,0.25);
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255,255,255,0.07);
          margin-bottom: 18px;
        }

        .login-logo-wrap img {
          width: 155px;
          height: 155px;
          object-fit: contain;
        }

        .login-tag {
          font-family: 'Georgia', serif;
          font-size: 11px;
          letter-spacing: 3px;
          text-transform: uppercase;
          color: rgba(255,255,255,0.65);
          margin-bottom: 8px;
        }

        /* Sub-tag above headline */
        .login-sub-tag {
          font-size: 10px;
          letter-spacing: 3.5px;
          text-transform: uppercase;
          color: rgba(255,255,255,0.4);
          margin-bottom: 20px;
          font-family: 'Georgia', serif;
        }

        .login-headline {
          font-size: clamp(2.4rem, 4vw, 3.4rem);
          font-weight: 800;
          line-height: 1.1;
          color: #fff;
          margin: 0 0 28px;
          font-family: 'Georgia', serif;
        }

        .headline-accent {
          color: #c9a751;
          font-style: normal;
          font-weight: 800;
        }

        .login-desc {
          font-size: 14px;
          color: rgba(255,255,255,0.65);
          line-height: 1.7;
          max-width: 360px;
          margin-top: -15px;
        }

        .login-faculty {
          font-size: 12px;
          color: rgba(255,255,255,0.4);
          text-align: center;
          line-height: 1.6;
        }

        .login-faculty::before {
  display: none;
}

        /* Divider line */
        .login-left-divider {
          width: 100%;
          height: 1px;
          background: rgba(255,255,255,0.12);
          margin: 20px 0;
        }

        /* ── RIGHT PANEL ── */
        .login-right {
          flex: 0 0 45%;
          background: #fff;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 56px 48px 36px;
        }

        .login-right-inner {
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }

        .login-right h2 {
          font-size: clamp(2rem, 3vw, 2.8rem);
          font-weight: 800;
          color: #1a1a1a;
          line-height: 1.2;
          margin: 0 0 18px;
          font-family: 'Georgia', serif;
        }

        .login-right p {
          font-size: 16px;
          color: #555;
          line-height: 1.7;
          margin: 0;
        }

        .login-error {
          background: rgba(183,28,28,0.08);
          color: #b71c1c;
          padding: 10px 14px;
          border-radius: 8px;
          font-size: 13px;
          margin-top: 18px;
          border-left: 3px solid #b71c1c;
        }

        .login-google-wrap {
          margin-top: 28px;
          display: flex;
          justify-content: center;
        }

        .btn-loading {
          width: 100%;
          padding: 14px;
          background: #7a1c1c;
          color: #fff;
          border: none;
          border-radius: 50px;
          font-size: 15px;
          cursor: not-allowed;
          opacity: 0.7;
          font-family: inherit;
        }

        /* Dev mode */
        .dev-mode-label {
          font-size: 11px;
          color: #aaa;
          text-align: center;
          letter-spacing: 2px;
          text-transform: uppercase;
          margin-bottom: 10px;
          margin-top: 20px;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .dev-mode-label::before,
        .dev-mode-label::after {
          content: '';
          flex: 1;
          height: 1px;
          background: #e0e0e0;
        }

        .dev-buttons {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 8px;
        }

        .dev-btn {
          padding: 10px 0;
          border: 1.5px solid #ddd;
          background: #fff;
          border-radius: 8px;
          font-size: 13px;
          color: #444;
          cursor: pointer;
          font-family: inherit;
          transition: border-color 0.2s, background 0.2s;
        }

        .dev-btn:hover:not(:disabled) {
          border-color: #7a1c1c;
          color: #7a1c1c;
          background: rgba(122,28,28,0.04);
        }

        .dev-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .login-note {
          text-align: center;
          margin-top: 22px;
          font-size: 12px;
          color: #aaa;
        }

        .login-footer {
          text-align: center;
          font-size: 11px;
          color: #bbb;
          letter-spacing: 0.5px;
          text-transform: uppercase;
          padding-top: 16px;
          border-top: 1px solid #f0f0f0;
        }

        @media (max-width: 768px) {
          .login-page { flex-direction: column; }
          .login-left, .login-right { flex: none; width: 100%; }
          .login-left { padding: 40px 24px 32px; }
          .login-right { padding: 40px 24px 32px; }
        }
      `}</style>

      <div className="login-page">

        {/* ── LEFT ── */}
        <div className="login-left">
          <div className="login-left-content">

            {/* Logo — large, centered */}
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

         <div
            style={{
              width: '100%',
              display: 'flex',
              justifyContent: 'center'
            }}
          >
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
                  <button
                    type="button"
                    className="dev-btn"
                    onClick={() => handleDevLogin('admin')}
                    disabled={loading}
                  >
                    Admin
                  </button>
                  <button
                    type="button"
                    className="dev-btn"
                    onClick={() => handleDevLogin('petugas')}
                    disabled={loading}
                  >
                    Petugas
                  </button>
                  <button
                    type="button"
                    className="dev-btn"
                    onClick={() => handleDevLogin('dosen')}
                    disabled={loading}
                  >
                    Dosen
                  </button>
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