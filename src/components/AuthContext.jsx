import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

// 🔥 ambil dari .env (Vite)
const API_URL = import.meta.env.VITE_API_URL;

export function AuthProvider({ children }) {

  // ✅ ambil dari localStorage
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  // ✅ simpan ke localStorage setiap login
  useEffect(() => {
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    }
  }, [user]);

// upload foto 
  const updateUserPhoto = (photo_url) => {
  setUser(prev => {
    const updated = { ...prev, photo_url };
    localStorage.setItem('user', JSON.stringify(updated));
    return updated;
  });
};

  // LOGIN
  const login = async (email, password) => {
    try {
      const response = await fetch(`${API_URL}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setUser(data.user); // 🔥 ini sekarang persistent
        return { success: true, role: data.user.role };
      } else {
        return { success: false, message: data.message || 'Email atau password salah' };
      }
    } catch (error) {
      console.error("Auth Error:", error);
      return { success: false, message: 'Gagal terhubung ke server backend!' };
    }
  };

  // REGISTER (biarin dulu)
  const register = async (email, password, name) => {
    try {
      const response = await fetch(`${API_URL}/api/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
      });

      const data = await response.json();
      return data;

    } catch (error) {
      console.error(error);
      return { success: false, message: 'Gagal koneksi ke server' };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user'); // optional aman
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, register , updateUserPhoto }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);