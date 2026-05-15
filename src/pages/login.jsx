import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../components/AuthContext';

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

      <div className="login-left">
        <div>
          <div className="login-tag">
            The Precise Curator
          </div>

          <h1 className="login-headline">
            Menjelajahi
            <br />
            Ilmu
            <br />
            dengan
            <br />
            Presisi.
          </h1>

          <p className="login-desc">
            Selamat datang di Sistem Informasi Perpustakaan FMIPA.
            Akses koleksi literatur sains terlengkap dalam lingkungan digital yang terstruktur.
          </p>

          <div className="login-faculty">
            Fakultas Matematika dan Ilmu Pengetahuan Alam
          </div>
        </div>
      </div>

      <div className="login-right">
        <div>
          <h2>
            Masuk ke Sistem
            <br />
            Perpustakaan FMIPA
          </h2>

          <p>
            Login menggunakan akun resmi UNESA untuk mengakses layanan perpustakaan digital.
          </p>

          {error && (
            <div
              style={{
                background: 'rgba(183,28,28,0.1)',
                color: 'var(--danger)',
                padding: '10px 12px',
                borderRadius: 6,
                fontSize: 13,
                marginTop: 16
              }}
            >
              {error}
            </div>
          )}

          <div
            style={{
              marginTop: 24,
              display: 'flex',
              justifyContent: 'center'
            }}
          >
            {loading ? (
              <button
                className="btn btn-primary btn-lg"
                disabled
                style={{
                  width: '100%',
                  justifyContent: 'center'
                }}
              >
                Memproses...
              </button>
            ) : (
              <div ref={googleButtonRef}></div>
            )}
          </div>

          {IS_DEV && (
          <div style={{ marginTop: 18 }}>

            <div
              style={{
                fontSize: 12,
                color: 'var(--gray-text)',
                textAlign: 'center',
                marginBottom: 8
              }}
            >
              Mode testing sementara
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr',
                gap: 8
              }}
            >
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => handleDevLogin('admin')}
                disabled={loading}
              >
                Testing Admin
              </button>

              <button
                type="button"
                className="btn btn-outline"
                onClick={() => handleDevLogin('petugas')}
                disabled={loading}
              >
                Testing Petugas
              </button>

              <button
                type="button"
                className="btn btn-outline"
                onClick={() => handleDevLogin('dosen')}
                disabled={loading}
              >
                Testing Dosen
              </button>
            </div>
          </div>
        )}

          <div
            style={{
              textAlign: 'center',
              marginTop: 24,
              fontSize: 12,
              color: 'var(--gray-text)'
            }}
          >
            Hanya email resmi UNESA yang dapat mengakses sistem
          </div>
        </div>

        <div>
          <div
            style={{
              textAlign: 'center',
              marginTop: 24,
              fontSize: 11,
              color: 'var(--gray-text)',
              letterSpacing: '0.5px',
              textTransform: 'uppercase'
            }}
          >
            © 2026 FMIPA UNESA — Library Management System
          </div>
        </div>
      </div>
    </div>
  );
}