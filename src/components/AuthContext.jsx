import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

const API_URL = import.meta.env.VITE_API_URL;

export function AuthProvider({ children }) {

  // USER LOGIN
  const [user, setUser] = useState(() => {

    const savedUser =
      localStorage.getItem('user');

    return savedUser
      ? JSON.parse(savedUser)
      : null;

  });

  // SIMPAN LOGIN
  useEffect(() => {

    if (user) {

      localStorage.setItem(
        'user',
        JSON.stringify(user)
      );

    }

  }, [user]);

  // UPDATE FOTO
  const updateUserPhoto = (photo_url) => {

    setUser(prev => {

      const updated = {
        ...prev,
        photo_url
      };

      localStorage.setItem(
        'user',
        JSON.stringify(updated)
      );

      return updated;

    });

  };

  // LOGIN GOOGLE SSO
const loginWithGoogle = async (credential) => {
  try {
    const response = await fetch(`${API_URL}/api/login-google`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "ngrok-skip-browser-warning": "true"
      },
      body: JSON.stringify({ credential })
    });

    const data = await response.json();

    if (!data.success) {
      return data;
    }

    const email = data.user.email;

    // VALIDASI EMAIL UNESA
    const allowed =
      email.endsWith("@unesa.ac.id") ||
      email.endsWith("@mhs.unesa.ac.id");

    if (!allowed) {
      return {
        success: false,
        message: "Hanya email resmi UNESA yang dapat mengakses sistem"
      };
    }

    // ROLE OTOMATIS
    let role = "dosen";
    let type = "dosen";

    if (email.endsWith("@mhs.unesa.ac.id")) {
      role = "mahasiswa";
      type = "mahasiswa";
    }

    const finalUser = {
      id: data.user.id || crypto.randomUUID(),

      name: data.user.name,
      email: data.user.email,
      photo_url: data.user.photo_url,

      nim: '',
      departemen: '',
      prodi: '',
      phone: '',
      address: '',

      role,
      type
    };

    setUser(finalUser);

    return {
      success: true,
      role
    };

  } catch (error) {
    console.error(error);

    return {
      success: false,
      message: "Gagal login Google"
    };
  }
};



  //Dev Login
  const devLogin = async (role) => {

  const dummyUsers = {

    admin: {
      id: 'A001',
      name: 'Admin Perpustakaan',
      email: 'admin.perpus.fmipa@unesa.ac.id',
      role: 'admin'
    },

    petugas: {
      id: 'P001',
      name: 'Petugas Perpustakaan',
      email: 'petugas1.perpus@unesa.ac.id',
      role: 'petugas'
    },

    dosen: {
      id: 'D001',
      name: 'Dosen FMIPA',
      email: 'dosen.fmipa@unesa.ac.id',
      role: 'dosen'
    }

  };

  const selectedUser = dummyUsers[role];

  if (!selectedUser) {

    return {
      success: false,
      message: 'Role tidak ditemukan'
    };

  }

  setUser(selectedUser);

  return {
    success: true,
    role: selectedUser.role
  };

};

  // LOGOUT
  const logout = () => {

    setUser(null);

    localStorage.removeItem('user');

  };

  return (

    <AuthContext.Provider

      value={{

        user,

        logout,

        updateUserPhoto,

        devLogin,

        loginWithGoogle

      }}
    >

      {children}

    </AuthContext.Provider>

  );

}

export const useAuth = () =>
  useContext(AuthContext);