import { Routes, Route } from "react-router-dom";

import LoginPage from "./pages/login";
import DashboardPage from "./pages/Dashboardpage";
import BukuPage from "./pages/Bukupage";
import AnggotaPage from "./pages/Anggotapage";
import PeminjamanPage from "./pages/Peminjamanpage";
import PengembalianPage from "./pages/Pengembalianpage";
import DendaPage from "./pages/Dendapage";
import MahasiswaPage from "./pages/Mahasiswapage";

import Layout from "./components/Layout";

function App() {
  return (
    <Routes>
      {/* LOGIN */}
      <Route path="/" element={<LoginPage />} />

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
        path="/anggota"
        element={
          <Layout>
            <AnggotaPage />
          </Layout>
        }
      />

      <Route
        path="/peminjaman"
        element={
          <Layout>
            <PeminjamanPage />
          </Layout>
        }
      />

      <Route
        path="/pengembalian"
        element={
          <Layout>
            <PengembalianPage />
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