import { Routes, Route } from "react-router-dom";

import LoginPage from "./pages/login";

import AdminDashboardPage from "./pages/AdminDashboardPage";
import PetugasBukuPage from "./pages/PetugasBukupage";
import PetugasAnggotaPage from "./pages/PetugasAnggotapage";
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
import MahasiswaPage from "./pages/Mahasiswapage";
import RegisterPage from "./pages/Register";


import Layout from "./components/Layout";
import { useAuth } from "./components/AuthContext";


function App() {
  const { user } = useAuth();
  return (
    <Routes>
  {/* LOGIN */}
  <Route path="/" element={<LoginPage />} />

  {/* REGISTER */}
  <Route path="/register" element={<RegisterPage />} />

  {/* ADMIN DASHBOARD */}
  <Route
    path="/dashboard"
    element={
      <Layout>
        <DashboardPage />
      </Layout>
    }
  />

  {/* USER DASHBOARD */}
  <Route
    path="/user/dashboard"
    element={
      <Layout>
        <UserDashboard />
      </Layout>
    }
  />

  <Route path="/mahasiswa" element={<UserDashboard />} />


      {/* MENU */}
      <Route
        path="/petugas/buku"
        element={
          <Layout>
            <PetugasBukuPage />
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
        path="/anggota"
        element={
          <Layout>
            {user.role === "admin" && <AdminAnggotaPage />}
            {user.role === "petugas" && <PetugasAnggotaPage />}
          </Layout>
        }
      />

      <Route
        path="/petugas/peminjaman"
        element={
          <Layout>
            <PetugasPeminjamanPage />
          </Layout>
        }
      />

      <Route
        path="/petugas/pengembalian"
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
        path="/petugas/denda"
        element={
          <Layout>
            <PetugasDendaPage />
          </Layout>
        }
      />

      <Route
        path="/user/denda"
        element={
          <Layout>
            <UserDendaPage />
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