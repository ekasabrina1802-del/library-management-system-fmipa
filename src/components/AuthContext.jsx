import { createContext, useContext, useState } from 'react';


const AuthContext = createContext(null);


export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);


  // LOGIN: Mengambil data dari Database (SQL Server via Backend)
  const login = async (email, password) => {
    try {
      const response = await fetch('http://localhost:5000/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });


      const data = await response.json();


      if (response.ok && data.success) {
        setUser(data.user); // Simpan data user (email, nama, role) ke state
        return { success: true, role: data.user.role };
      } else {
        return { success: false, message: data.message || 'Email atau password salah' };
      }
    } catch (error) {
      console.error("Auth Error:", error);
      return { success: false, message: 'Gagal terhubung ke server backend!' };
    }
  };


  // REGISTER: (sudah bisa ya sambung ke database)
  const register = async (email, password, name) => {
  try {
    const response = await fetch('http://localhost:5000/api/register', {
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
  };


  return (
    <AuthContext.Provider value={{ user, login, logout, register }}>
      {children}
    </AuthContext.Provider>
  );
}


export const useAuth = () => useContext(AuthContext);

