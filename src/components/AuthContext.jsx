import { createContext, useContext, useState } from 'react';
import { USERS } from '../data/db';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  const login = (email, password) => {
    const found = USERS.find(u => u.email === email && u.password === password);
    if (found) {
      setUser(found);
      return { success: true, role: found.role };
    }
    return { success: false, message: 'Email atau kata sandi salah.' };
  };

  const logout = () => setUser(null);

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);