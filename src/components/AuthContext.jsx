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

  // LOGIN GOOGLE
  const loginWithGoogle = async (googleUser) => {

    try {

      const email = googleUser.email;

      // VALIDASI EMAIL
      const allowed =

        email.endsWith("@mhs.unesa.ac.id") ||

        email.endsWith("@unesa.ac.id");

      if (!allowed) {

        return {
          success: false,
          message:
            "Hanya email UNESA yang diperbolehkan"
        };

      }

      // DEFAULT ROLE
      let role = "dosen";

      // MAHASISWA
      if (
        email.endsWith("@mhs.unesa.ac.id")
      ) {

        role = "mahasiswa";

      }

      // ADMIN TETAP
      if (
        email === "admin.perpus@unesa.ac.id"
      ) {

        role = "admin";

      }

      // LOGIN BACKEND
      const response = await fetch(

        `${API_URL}/api/login-google`,

        {

          method: "POST",

          headers: {
            "Content-Type":
              "application/json"
          },

          body: JSON.stringify({

            email,

            name: googleUser.name,

            role

          })

        }
      );

      const data =
        await response.json();

      if (data.success) {

        setUser(data.user);

        return {

          success: true,

          role: data.user.role

        };

      }

      return data;

    } catch (error) {

      console.error(error);

      return {

        success: false,

        message:
          "Gagal login Google"

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

        loginWithGoogle

      }}
    >

      {children}

    </AuthContext.Provider>

  );

}

export const useAuth = () =>
  useContext(AuthContext);