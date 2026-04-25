import { createContext, useContext, useState } from 'react';
import { USERS } from '../data/db';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  const login = (email, password) => {
  const users = JSON.parse(localStorage.getItem('users')) || [];

  const user = users.find(
    u => u.email === email && u.password === password
  );

  if (user) {
    return { success: true, role: user.role };
  }

  return { success: false, message: 'Login gagal' };
};

  // ✅ Tambah fungsi register
const register = (email, password, name) => {
  const users = JSON.parse(localStorage.getItem('users')) || [];

  const exist = users.find(u => u.email === email);
  if (exist) {
    return { success: false, message: 'Email sudah terdaftar' };
  }

  const newUser = {
    email,
    password,
    name,
    role: 'mahasiswa'
  };

  users.push(newUser);
  localStorage.setItem('users', JSON.stringify(users));

  return { success: true };
};

  const logout = () => setUser(null);

  return (
    <AuthContext.Provider value={{ user, login, logout, register }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);