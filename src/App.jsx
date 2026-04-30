import { Routes, Route } from "react-router-dom";

import LoginPage from "./pages/login";
import DashboardPage from "./pages/Dashboardpage";
import BukuPage from "./pages/Bukupage";
import PetugasAnggotaPage from "./pages/PetugasAnggotapage";
import UserAnggotaPage from "./pages/UserAnggotaPage";
import AdminAnggotaPage from "./pages/AdminAnggotaPage";
import PetugasPeminjamanPage from "./pages/PetugasPeminjamanPage";
import PetugasPengembalianPage from "./pages/PetugasPengembalianPage";
import AdminPeminjamanPage from './pages/AdminPeminjamanPage';
import AdminPengembalianPage from './pages/AdminPengembalianPage';
import UserPeminjamanPage from './pages/UserPeminjamanPage';
import UserPengembalianPage from './pages/UserPengembalianPage';
import DendaPage from "./pages/Dendapage";
import MahasiswaPage from "./pages/Mahasiswapage";
import RegisterPage from "./pages/Register";


import Layout from "./components/Layout";

function App() {
  return (
    <Routes>
      {/* LOGIN */}
      <Route path="/" element={<LoginPage />} />

      {/* REGISTER */}
      <Route path="/register" element={<RegisterPage />} />

      {/* DASHBOARD */}
      <Route
        path="/dashboard"
        element={
          <Layout>
            <DashboardPage />
          </Layout>
        }
      />

      {/* MENU */}
      <Route
        path="/buku"
        element={
          <Layout>
            <BukuPage />
          </Layout>
        }
      />

      <Route
        path="/petugas/anggota"
        element={
          <Layout>
            <PetugasAnggotaPage />
          </Layout>
        }
      />

      <Route
        path="/admin/anggota"
        element={
          <Layout>
            <AdminAnggotaPage />
          </Layout>
        }
      />

      <Route
        path="/user/anggota"
        element={
          <Layout>
            <UserAnggotaPage />
          </Layout>
        }
      />

      <Route
        path="/peminjaman"
        element={
          <Layout>
            <PetugasPeminjamanPage />
          </Layout>
        }
      />

      <Route
        path="/pengembalian"
        element={
          <Layout>
            <PetugasPengembalianPage />
          </Layout>
        }
      />

      <Route 
        path="/admin/peminjaman" 
        element={
          <Layout>
            <AdminPeminjamanPage />
          </Layout>
        } 
      />

     <Route 
        path="/admin/pengembalian" 
        element={
          <Layout>
            <AdminPengembalianPage />
          </Layout>
        } 
      />

      <Route
        path="/user/peminjaman"
        element={
          <Layout>
            <UserPeminjamanPage />
          </Layout>
        }
      />

      <Route
        path="/user/pengembalian"
        element={
          <Layout>
            <UserPengembalianPage />
          </Layout>
        }
      />

      <Route
        path="/denda"
        element={
          <Layout>
            <DendaPage />
          </Layout>
        }
      />

      <Route
        path="/mahasiswa"
        element={
          <Layout showSidebar={false}>
            <MahasiswaPage />
          </Layout>
        }
      />

      <Route path="*" element={<div>404 - Halaman tidak ditemukan</div>} />
    </Routes>
  );
}

export default App;