// FILE: frontend/src/context/AuthContext.js
// ACTION: REPLACE your existing AuthContext.js with this file
// NOTE: This context handles ONLY regular ATS users (super_admin, recruiter, client)
//       Master admin has its own completely separate localStorage keys and flow.

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
    // ONLY look at ats_token — never touch master_token here
    const token = localStorage.getItem('ats_token');
    if (token) {
      setAuthHeader(token);
      axios.get('/api/auth/me')
        .then(r => {
          // Safety: if somehow a master_admin token ends up in ats_token, reject it
          if (r.data.user.role === 'master_admin') {
            localStorage.removeItem('ats_token');
            setAuthHeader(null);
            return;
          }
          setUser(r.data.user);
        })
        .catch(() => {
          localStorage.removeItem('ats_token');
          setAuthHeader(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const r = await axios.post('/api/auth/login', { email, password });

    // Block master_admin from using the regular login page
    if (r.data.user.role === 'master_admin') {
      throw new Error('Use the Master Admin login panel at /master');
    }

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