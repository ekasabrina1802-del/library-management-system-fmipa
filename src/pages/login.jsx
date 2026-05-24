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
  );
}
