import { Routes, Route, Navigate } from "react-router-dom";

// Auth & Layout
import Layout from "./components/Layout";
import { useAuth } from "./components/AuthContext";

// Pages
import LoginPage from "./pages/login";
import DashboardPage from "./pages/DashboardPage";
import UserDashboard from "./pages/UserDashboardPage";
import BukuPage from "./pages/BukuPage";
import PetugasAnggotaPage from "./pages/PetugasAnggotaPage";
import UserAnggotaPage from "./pages/UserAnggotaPage";
import AdminAnggotaPage from "./pages/AdminAnggotaPage";
import PetugasPeminjamanPage from "./pages/PetugasPeminjamanPage";
import PetugasPengembalianPage from "./pages/PetugasPengembalianPage";
import AdminPeminjamanPage from "./pages/AdminPeminjamanPage";
import AdminPengembalianPage from "./pages/AdminPengembalianPage";
import UserPeminjamanPage from "./pages/UserPeminjamanPage";
import UserPengembalianPage from "./pages/UserPengembalianPage";
import PetugasDendaPage from "./pages/PetugasDendaPage";
import UserDendaPage from "./pages/UserDendaPage";

// PROTEKSI ROUTE BERDASARKAN ROLE
function ProtectedRoute({ children, allowedRoles }) {
  const { user } = useAuth();

  // Kalau belum login, balik ke halaman login
  if (!user) {
    return <Navigate to="/" replace />;
  }

  // Kalau role tidak sesuai, arahkan ke dashboard sesuai role
  if (!allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

function App() {
  const { user } = useAuth();

  return (
    <Routes>
      {/* PUBLIC ROUTES */}
      <Route
        path="/"
        element={
          user ? <Navigate to="/dashboard" replace /> : <LoginPage />
        }
      />

      {/* GLOBAL REDIRECT UNTUK /DASHBOARD */}
      <Route
        path="/dashboard"
        element={
          !user ? (
            <Navigate to="/" replace />
          ) : user.role === "admin" ? (
            <Navigate to="/admin/dashboard" replace />
          ) : user.role === "petugas" ? (
            <Navigate to="/petugas/dashboard" replace />
          ) : user.role === "user" ||
            user.role === "mahasiswa" ||
            user.role === "dosen" ? (
            <Navigate to="/user/dashboard" replace />
          ) : (
            <Navigate to="/" replace />
          )
        }
      />

      {/* ADMIN ROUTES */}
      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <Layout>
              <DashboardPage />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/buku"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <Layout>
              <BukuPage />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/anggota"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <Layout>
              <AdminAnggotaPage />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/peminjaman"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <Layout>
              <AdminPeminjamanPage />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/pengembalian"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <Layout>
              <AdminPengembalianPage />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/denda"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <Layout>
              <PetugasDendaPage />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* PETUGAS ROUTES */}
      <Route
        path="/petugas/dashboard"
        element={
          <ProtectedRoute allowedRoles={["petugas"]}>
            <Layout>
              <DashboardPage />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/petugas/buku"
        element={
          <ProtectedRoute allowedRoles={["petugas"]}>
            <Layout>
              <BukuPage />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/petugas/anggota"
        element={
          <ProtectedRoute allowedRoles={["petugas"]}>
            <Layout>
              <PetugasAnggotaPage />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/petugas/peminjaman"
        element={
          <ProtectedRoute allowedRoles={["petugas"]}>
            <Layout>
              <PetugasPeminjamanPage />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/petugas/pengembalian"
        element={
          <ProtectedRoute allowedRoles={["petugas"]}>
            <Layout>
              <PetugasPengembalianPage />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/petugas/denda"
        element={
          <ProtectedRoute allowedRoles={["petugas"]}>
            <Layout>
              <PetugasDendaPage />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* USER / MAHASISWA / DOSEN ROUTES */}
      <Route
        path="/user/dashboard"
        element={
          <ProtectedRoute allowedRoles={["user", "mahasiswa", "dosen"]}>
            <Layout>
              <UserDashboard />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/user/buku"
        element={
          <ProtectedRoute allowedRoles={["user", "mahasiswa", "dosen"]}>
            <Layout>
              <BukuPage />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/user/anggota"
        element={
          <ProtectedRoute allowedRoles={["user", "mahasiswa", "dosen"]}>
            <Layout>
              <UserAnggotaPage />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/user/peminjaman"
        element={
          <ProtectedRoute allowedRoles={["user", "mahasiswa", "dosen"]}>
            <Layout>
              <UserPeminjamanPage />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/user/pengembalian"
        element={
          <ProtectedRoute allowedRoles={["user", "mahasiswa", "dosen"]}>
            <Layout>
              <UserPengembalianPage />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/user/denda"
        element={
          <ProtectedRoute allowedRoles={["user", "mahasiswa", "dosen"]}>
            <Layout>
              <UserDendaPage />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* 404 NOT FOUND */}
      <Route
        path="*"
        element={
          <div style={{ padding: "20px", textAlign: "center" }}>
            <h1>404</h1>
            <p>Halaman tidak ditemukan</p>
          </div>
        }
      />
    </Routes>
  );
}

export default App;