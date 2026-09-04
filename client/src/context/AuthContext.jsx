import React, { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext(null);

const TOKEN_KEY = "prep_with_pro_token";
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

async function request(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(data.message || "Something went wrong.");

    // Preserve useful backend information
    error.emailVerificationRequired =
      data.emailVerificationRequired || false;

    throw error;
  }

  return data;
}

function AuthProvider({ children }) {
  const [token, setToken] = useState(() =>
    localStorage.getItem(TOKEN_KEY),
  );

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  async function refreshMe(activeToken = token) {
    if (!activeToken) {
      setUser(null);
      setLoading(false);
      return null;
    }

    try {
      const data = await request("/api/auth/me", {
        headers: {
          Authorization: `Bearer ${activeToken}`,
        },
      });

      setUser(data.user);

      return data.user;
    } catch (error) {
      localStorage.removeItem(TOKEN_KEY);
      setToken(null);
      setUser(null);
      return null;
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refreshMe();
  }, []);

  async function login(credentials) {
    const data = await request("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    });

    localStorage.setItem(TOKEN_KEY, data.token);

    setToken(data.token);
    setUser(data.user);

    return data.user;
  }

  async function register(details) {
    // Registration no longer automatically logs the user in.
    const data = await request("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(details),
    });

    return data;
  }

  async function resendVerificationEmail(email) {
    const data = await request("/api/auth/resend-verification", {
      method: "POST",
      body: JSON.stringify({ email }),
    });

    return data;
  }

  function logout() {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        resendVerificationEmail,
        logout,
        refreshMe,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside an AuthProvider.");
  }

  return context;
}

export { AuthProvider, useAuth };