import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, User, BookOpen, FlaskConical, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../components/AuthContext';

export default function RegisterPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

 const handleSubmit = (e) => {
  e.preventDefault();
  setError('');

  if (form.password !== form.confirm) {
    setError('Konfirmasi kata sandi tidak cocok.');
    return;
  }

  if (form.password.length < 6) {
    setError('Kata sandi minimal 6 karakter.');
    return;
  }

  setLoading(true);

  setTimeout(() => {
    const result = register(form.email, form.password, form.name);

    if (result.success) {
      navigate('/');
    } else {
      setError(result.message);
    }

    setLoading(false);
  }, 600);
};

  return (
    <div className="login-page">
      {/* Left Panel — sama persis dengan LoginPage */}
      <div className="login-left">
        <div>
          <div className="login-tag">The Precise Curator</div>
          <h1 className="login-headline">
            Bergabung<br />dengan<br />Komunitas<br />Sains.
          </h1>
          <p className="login-desc">
            Daftarkan dirimu sebagai Mahasiswa FMIPA dan mulai menjelajahi
            ribuan koleksi literatur ilmiah yang tersedia secara digital.
          </p>
          <div className="login-faculty">
            Fakultas Matematika dan Ilmu Pengetahuan Alam
          </div>
        </div>
      </div>

      {/* Right Panel */}
      <div className="login-right">
        <div>
          <h2>Buat Akun<br />Mahasiswa</h2>
          <p>Isi data di bawah untuk mendaftarkan akun mahasiswa FMIPA kamu.</p>

          <form onSubmit={handleSubmit}>
            {/* Nama Lengkap */}
            <div style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.5px', marginBottom: 6, textTransform: 'uppercase', color: 'var(--navy)' }}>
                Nama Lengkap
              </div>
              <div className="login-input-wrap">
                <User size={15} />
                <input
                  type="text"
                  className="login-input"
                  placeholder="Nama lengkap kamu"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  required
                />
              </div>
            </div>

            {/* Email */}
            <div style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.5px', marginBottom: 6, textTransform: 'uppercase', color: 'var(--navy)' }}>
                Email
              </div>
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

            {/* Password */}
            <div style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.5px', marginBottom: 6, textTransform: 'uppercase', color: 'var(--navy)' }}>
                Kata Sandi
              </div>
              <div className="login-input-wrap">
                <Lock size={15} />
                <input
                  type={showPass ? 'text' : 'password'}
                  className="login-input"
                  placeholder="Minimal 6 karakter"
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPass(s => !s)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--gray-text)', padding: 0, display: 'flex', alignItems: 'center' }}
                >
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Konfirmasi Password */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.5px', marginBottom: 6, textTransform: 'uppercase', color: 'var(--navy)' }}>
                Konfirmasi Kata Sandi
              </div>
              <div className="login-input-wrap">
                <Lock size={15} />
                <input
                  type={showPass ? 'text' : 'password'}
                  className="login-input"
                  placeholder="Ulangi kata sandi"
                  value={form.confirm}
                  onChange={e => setForm(f => ({ ...f, confirm: e.target.value }))}
                  required
                />
              </div>
            </div>

            {error && (
              <div style={{ background: 'rgba(183,28,28,0.1)', color: 'var(--danger)', padding: '10px 12px', borderRadius: 6, fontSize: 13, marginBottom: 16 }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary btn-lg"
              style={{ width: '100%', justifyContent: 'center' }}
              disabled={loading}
            >
              {loading ? 'Mendaftarkan...' : 'Buat Akun'}
            </button>
          </form>

          {/* Link balik ke login */}
          <div style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: 'var(--gray-text)' }}>
            Sudah punya akun?{' '}
            <a
            href="#"
            onClick={(e) => {
                e.preventDefault();
                navigate('/');
            }}
            style={{
                color: 'var(--maroon)',
                fontWeight: 600,
                textDecoration: 'none'
            }}
            >
            Masuk di sini
            </a>
          </div>
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
