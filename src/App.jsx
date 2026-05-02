import { Routes, Route, Navigate } from "react-router-dom";
import Login from './pages/Login';

// Auth & Layout
import Layout from "./components/Layout";
import { useAuth } from "./components/AuthContext";

// Pages
import LoginPage from "./pages/login";
import RegisterPage from "./pages/Register";
import DashboardPage from "./pages/DashboardPage";
import UserDashboard from "./pages/UserDashboardPage";
import BukuPage from "./pages/BukuPage";
import PetugasAnggotaPage from "./pages/PetugasAnggotaPage";
import UserAnggotaPage from "./pages/UserAnggotaPage";
import AdminAnggotaPage from "./pages/AdminAnggotaPage";
import PetugasPeminjamanPage from "./pages/PetugasPeminjamanPage";
import PetugasPengembalianPage from "./pages/PetugasPengembalianPage";
import AdminPeminjamanPage from './pages/AdminPeminjamanPage';
import AdminPengembalianPage from './pages/AdminPengembalianPage';
import UserPeminjamanPage from './pages/UserPeminjamanPage';
import UserPengembalianPage from './pages/UserPengembalianPage';
import PetugasDendaPage from "./pages/PetugasDendaPage";
import UserDendaPage from "./pages/UserDendaPage";
import MahasiswaPage from "./pages/MahasiswaPage";

function App() {
  const { user } = useAuth();

  return (
    <Routes>
      {/* PUBLIC ROUTES */}
      <Route path="/" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* GLOBAL REDIRECT UNTUK /DASHBOARD */}
      {/* Jika ada yang akses /dashboard saja, arahkan ke rute spesifik role */}
      <Route 
        path="/dashboard" 
        element={
          user?.role === 'admin' ? <Navigate to="/admin/dashboard" /> :
          user?.role === 'user' || user?.role === 'mahasiswa' ? <Navigate to="/user/dashboard" /> :
          <Navigate to="/petugas/dashboard" />
        } 
      />

      {/* --- ADMIN ROUTES --- */}
      <Route path="/admin/dashboard" element={<Layout><DashboardPage /></Layout>} />
      <Route path="/admin/buku" element={<Layout><BukuPage /></Layout>} />
      <Route path="/admin/anggota" element={<Layout><AdminAnggotaPage /></Layout>} />
      <Route path="/admin/peminjaman" element={<Layout><AdminPeminjamanPage /></Layout>} />
      <Route path="/admin/pengembalian" element={<Layout><AdminPengembalianPage /></Layout>} />
      <Route path="/admin/denda" element={<Layout><PetugasDendaPage /></Layout>} />

      {/* --- PETUGAS ROUTES --- */}
      <Route path="/petugas/dashboard" element={<Layout><DashboardPage /></Layout>} />
      <Route path="/petugas/buku" element={<Layout><BukuPage /></Layout>} />
      <Route path="/petugas/anggota" element={<Layout><PetugasAnggotaPage /></Layout>} />
      <Route path="/petugas/peminjaman" element={<Layout><PetugasPeminjamanPage /></Layout>} />
      <Route path="/petugas/pengembalian" element={<Layout><PetugasPengembalianPage /></Layout>} />
      <Route path="/petugas/denda" element={<Layout><PetugasDendaPage /></Layout>} />

      {/* --- USER / MAHASISWA ROUTES --- */}
      <Route path="/user/dashboard" element={<Layout><UserDashboard /></Layout>} />
<Route path="/user/buku" element={<Layout><BukuPage /></Layout>} />
<Route path="/user/anggota" element={<Layout><UserAnggotaPage /></Layout>} />
<Route path="/user/peminjaman" element={<Layout><UserPeminjamanPage /></Layout>} />
<Route path="/user/pengembalian" element={<Layout><UserPengembalianPage /></Layout>} />
<Route path="/user/denda" element={<Layout><UserDendaPage /></Layout>} />

      {/* 404 NOT FOUND */}
      <Route path="*" element={<div style={{ padding: "20px", textAlign: "center" }}><h1>404</h1><p>Halaman tidak ditemukan</p></div>} />
    </Routes>
  );
}

export default App;