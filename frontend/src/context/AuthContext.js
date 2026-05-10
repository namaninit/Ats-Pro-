import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const setAuthHeader = (token) => {
    if (token) axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    else delete axios.defaults.headers.common['Authorization'];
  };

  useEffect(() => {
    const token = localStorage.getItem('ats_token');
    if (token) {
      setAuthHeader(token);
      axios.get('/api/auth/me').then(r => {
        setUser(r.data.user);
      }).catch(() => {
        localStorage.removeItem('ats_token');
        setAuthHeader(null);
      }).finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const r = await axios.post('/api/auth/login', { email, password });
    localStorage.setItem('ats_token', r.data.token);
    setAuthHeader(r.data.token);
    setUser(r.data.user);
    return r.data;
  };

  const logout = useCallback(() => {
    localStorage.removeItem('ats_token');
    setAuthHeader(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
