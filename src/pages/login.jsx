import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, BookOpen, FlaskConical } from 'lucide-react';
import { useAuth } from '../components/AuthContext';


export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '', remember: false });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();


  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await login(form.email, form.password);

    if (result.success) {
      // Menyatukan mahasiswa dan dosen ke satu tujuan
      const redirectMap = {
        admin: '/dashboard',
        petugas: '/dashboard',
        mahasiswa: '/mahasiswa', // Dashboard untuk user
        dosen: '/mahasiswa',     // Dashboard untuk user (disamakan)
      };

      navigate(redirectMap[result.role] || '/');
    } else {
      setError(result.message);
    }

    setLoading(false);
  };


 const fillDemo = (role) => {
  if (role === 'admin') {
    setForm(f => ({
      ...f,
      email: 'admin@fmipa.ac.id',
      password: 'admin123'
    }));
  } else if (role === 'petugas') {
    setForm(f => ({
      ...f,
      email: 'siti@fmipa.ac.id', // 🔥 sesuai DB kamu
      password: 'petugas123'
    }));
  } else if (role === 'mahasiswa') {
    setForm(f => ({
      ...f,
      email: '24050974001@mhs.unesa.ac.id', // 🔥 sesuai DB kamu
      password: 'mhs123'
    }));
  }
};


  return (
    <div className="login-page">
      {/* Left Panel */}
      <div className="login-left">
        <div>
          <div className="login-tag">The Precise Curator</div>
          <h1 className="login-headline">
            Menjelajahi<br />Ilmu<br />dengan<br />Presisi.
          </h1>
          <p className="login-desc">
            Selamat datang di Sistem Informasi Perpustakaan FMIPA.
            Akses koleksi literatur sains terlengkap dalam lingkungan
            digital yang terstruktur.
          </p>
          <div className="login-faculty">
            Fakultas Matematika dan Ilmu Pengetahuan Alam
          </div>
        </div>
      </div>


      {/* Right Panel */}
      <div className="login-right">
        <div>
          <h2>Masuk ke Sistem<br />Admin & Petugas</h2>
          <p>Gunakan akun Administrator atau Petugas Anda untuk mengelola repositori perpustakaan digital.</p>


          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.5px', marginBottom: 6, textTransform: 'uppercase', color: 'var(--navy)' }}>Username / Email</div>
              <div className="login-input-wrap">
                <Mail size={15} />
                <input
                  type="email"
                  className="login-input"
                  placeholder="nama@fmipa.ac.id"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  required
                />
              </div>
            </div>


            <div style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase', color: 'var(--navy)' }}>Kata Sandi</div>
                <a href="#" style={{ fontSize: 12, color: 'var(--maroon)', textDecoration: 'none', fontWeight: 500 }}>Lupa Kata Sandi?</a>
              </div>
              <div className="login-input-wrap">
                <Lock size={15} />
                <input
                  type="password"
                  className="login-input"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  required
                />
              </div>
            </div>


            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
              <input
                type="checkbox"
                id="remember"
                checked={form.remember}
                onChange={e => setForm(f => ({ ...f, remember: e.target.checked }))}
                style={{ accentColor: 'var(--maroon)' }}
              />
              <label htmlFor="remember" style={{ fontSize: 13, color: 'var(--gray-text)', cursor: 'pointer' }}>Ingat info login</label>
            </div>


            {error && (
              <div style={{ background: 'rgba(183,28,28,0.1)', color: 'var(--danger)', padding: '10px 12px', borderRadius: 6, fontSize: 13, marginBottom: 16 }}>
                {error}
              </div>
            )}


            <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%', justifyContent: 'center' }} disabled={loading}>
              {loading ? 'Memproses...' : 'Masuk ke Sistem'}
            </button>
          </form>


          {/* Demo shortcuts */}
          <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
            <button onClick={() => fillDemo('admin')} className="btn btn-ghost btn-sm" style={{ flex: 1, justifyContent: 'center', fontSize: 11 }}>Demo Admin</button>
            <button onClick={() => fillDemo('petugas')} className="btn btn-ghost btn-sm" style={{ flex: 1, justifyContent: 'center', fontSize: 11 }}>Demo Petugas</button>
            <button onClick={() => fillDemo('mahasiswa')} className="btn btn-ghost btn-sm" style={{ flex: 1 }}>Demo Mahasiswa</button>
          </div>
        </div>


        <div style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: 'var(--gray-text)' }}>
          Belum punya akun?{' '}
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              navigate('/register');
            }}
            style={{ color: 'var(--maroon)', fontWeight: 600, textDecoration: 'none' }}
          >
            Daftar di sini
          </a>
        </div>
        <div>
          <div className="login-footer-cards">
            <div className="login-feature-card">
              <BookOpen size={18} />
              <div>
                <div className="card-label">Katalog</div>
                <div className="card-value">24k+ Literatur</div>
              </div>
            </div>
            <div className="login-feature-card">
              <FlaskConical size={18} />
              <div>
                <div className="card-label">Riset</div>
                <div className="card-value">Jurnal FMIPA</div>
              </div>
            </div>
          </div>
          <div style={{ textAlign: 'center', marginTop: 24, fontSize: 11, color: 'var(--gray-text)', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
            © 2026 FMIPA UNESA — Library Management System Developed by Team 10
          </div>
        </div>
      </div>
    </div>
  );
}

