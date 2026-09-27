import React, { createContext, useContext, useState, useEffect } from 'react';
import { api, getToken, setToken, getUser, setUser } from '../api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setCurrentUser] = useState(() => getUser());
  const [token, setCurrentToken] = useState(() => getToken());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Validate token on mount if present
    if (token) {
      api.getMe()
        .then(res => {
          if (res.success && res.user) {
            setCurrentUser(res.user);
            setUser(res.user);
          }
        })
        .catch(() => {
          // Token invalid
          logout();
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }

    const handleExpired = () => {
      logout();
    };

    window.addEventListener('auth_expired', handleExpired);
    return () => window.removeEventListener('auth_expired', handleExpired);
  }, []);

  const login = async (email, password) => {
    const res = await api.login(email, password);
    if (res.success && res.token) {
      setToken(res.token);
      setUser(res.user);
      setCurrentToken(res.token);
      setCurrentUser(res.user);
      return res;
    }
    throw new Error(res.message || 'Login failed.');
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    setCurrentToken(null);
    setCurrentUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, role: user?.role, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
