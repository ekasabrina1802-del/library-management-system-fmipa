import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen } from 'lucide-react';
import { useAuth } from '../components/AuthContext';

export default function LoginPage() {

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { loginWithGoogle } = useAuth();

  const navigate = useNavigate();

  const handleGoogleLogin = async () => {

    setLoading(true);

    setError('');

    // SIMULASI LOGIN GOOGLE
    // nanti diganti OAuth asli

    const googleUser = {

      name: "Admin Perpustakaan",

      email: "admin.perpus@unesa.ac.id"

    };

    const result =
      await loginWithGoogle(googleUser);

    if (result.success) {

      const redirectMap = {

        admin: '/dashboard',

        petugas: '/dashboard',

        mahasiswa: '/user/dashboard',

        dosen: '/user/dashboard'

      };

      navigate(
        redirectMap[result.role] || '/'
      );

    } else {

      setError(result.message);

    }

    setLoading(false);

  };

  return (

    <div className="login-page">

      {/* LEFT PANEL */}
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

            Selamat datang di Sistem
            Informasi Perpustakaan FMIPA.

            Akses koleksi literatur
            sains terlengkap dalam
            lingkungan digital yang
            terstruktur.

          </p>

          <div className="login-faculty">

            Fakultas Matematika
            dan Ilmu Pengetahuan Alam

          </div>

        </div>

      </div>

      {/* RIGHT PANEL */}
      <div className="login-right">

        <div>

          <h2>
            Masuk ke Sistem
            <br />
            Perpustakaan FMIPA
          </h2>

          <p>

            Login menggunakan akun
            resmi UNESA untuk
            mengakses layanan
            perpustakaan digital.

          </p>

          {error && (

            <div
              style={{
                background:'rgba(183,28,28,0.1)',
                color:'var(--danger)',
                padding:'10px 12px',
                borderRadius:6,
                fontSize:13,
                marginTop:16
              }}
            >
              {error}
            </div>

          )}

          <div style={{ marginTop:24 }}>

            <button
              onClick={handleGoogleLogin}
              className="btn btn-primary btn-lg"
              style={{
                width:'100%',
                justifyContent:'center'
              }}
            >

              {loading
                ? 'Memproses...'
                : 'Login dengan Akun UNESA'}

            </button>

          </div>

          <div
            style={{
              textAlign:'center',
              marginTop:24,
              fontSize:12,
              color:'var(--gray-text)'
            }}
          >

            Hanya email resmi UNESA
            yang dapat mengakses sistem

          </div>

        </div>

        <div>

          <div
            style={{
              textAlign:'center',
              marginTop:24,
              fontSize:11,
              color:'var(--gray-text)',
              letterSpacing:'0.5px',
              textTransform:'uppercase'
            }}
          >

            © 2026 FMIPA UNESA —
            Library Management System

          </div>

        </div>

      </div>

    </div>

  );

}