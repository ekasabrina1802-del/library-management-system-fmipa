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

    const finalUser = {
      ...data.user,
      anggotaId: data.user.anggotaId || data.user.memberId,
      memberId: data.user.memberId || data.user.anggotaId,
      profileCompleted: Boolean(data.user.profileCompleted)
    };

    setUser(finalUser);

    return {
      success: true,
      role: finalUser.role
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
  try {
    const response = await fetch(`${API_URL}/api/dev-login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "ngrok-skip-browser-warning": "true"
      },
      body: JSON.stringify({ role })
    });

    const data = await response.json();

    if (data.success) {
      const finalUser = {
        ...data.user,
        anggotaId: data.user.anggotaId || data.user.memberId,
        memberId: data.user.memberId || data.user.anggotaId,
        profileCompleted: Boolean(data.user.profileCompleted)
      };

      setUser(finalUser);

      return {
        success: true,
        role: finalUser.role
      };
    }

    return data;

  } catch (error) {
    console.error(error);

    return {
      success: false,
      message: "Gagal dev login"
    };
  }
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