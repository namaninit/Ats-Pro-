// FILE: frontend/src/pages/MasterLogin.jsx
// ROUTE: /master
// ACTION: REPLACE your existing MasterLogin.js with this file

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';

export default function MasterLogin() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  // If already logged in as master, redirect
  useEffect(() => {
    const token = localStorage.getItem('master_token');
    const user = localStorage.getItem('master_user');
    if (token && user) {
      try {
        const u = JSON.parse(user);
        if (u.role === 'master_admin') navigate('/master/dashboard');
      } catch { /* ignore */ }
    }
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const r = await axios.post(
        `${process.env.REACT_APP_API_URL || ''}/api/auth/login`,
        form
      );

      if (r.data.user.role !== 'master_admin') {
        toast.error('Access denied. Master Admin only.');
        return;
      }

      // Save with SEPARATE keys — never mix with regular user session
      localStorage.setItem('master_token', r.data.token);
      localStorage.setItem('master_user', JSON.stringify(r.data.user));

      // Set axios header for this session
      axios.defaults.headers.common['Authorization'] = `Bearer ${r.data.token}`;

      toast.success('Welcome, Master Admin!');
      navigate('/master/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#080c18',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 16,
      fontFamily: "'Inter', sans-serif"
    }}>
      {/* Background glow */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none', overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute', top: '15%', left: '50%', transform: 'translateX(-50%)',
          width: 500, height: 500,
          background: 'radial-gradient(circle, rgba(220,38,38,0.12) 0%, transparent 65%)'
        }} />
        <div style={{
          position: 'absolute', bottom: '20%', right: '20%',
          width: 300, height: 300,
          background: 'radial-gradient(circle, rgba(99,102,241,0.07) 0%, transparent 70%)'
        }} />
      </div>

      <div style={{ width: '100%', maxWidth: 400, position: 'relative' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 68, height: 68, borderRadius: 20,
            background: 'linear-gradient(135deg, #ef4444 0%, #991b1b 100%)',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 32, marginBottom: 18,
            boxShadow: '0 8px 40px rgba(239,68,68,0.35), 0 0 0 1px rgba(239,68,68,0.2)'
          }}>🔱</div>
          <h1 style={{
            fontSize: 26, fontWeight: 800, color: '#f1f5f9',
            margin: '0 0 6px', letterSpacing: '-0.03em'
          }}>Master Control</h1>
          <p style={{ color: '#475569', fontSize: 13, margin: 0 }}>
            ATS Pro · Platform Administration
          </p>
        </div>

        {/* Card */}
        <div style={{
          background: '#0f1629',
          border: '1px solid #1e2d4a',
          borderRadius: 16,
          padding: 28,
          boxShadow: '0 24px 64px rgba(0,0,0,0.5)'
        }}>
          {/* Warning badge */}
          <div style={{
            background: 'rgba(239,68,68,0.08)',
            border: '1px solid rgba(239,68,68,0.18)',
            borderRadius: 8, padding: '9px 14px', marginBottom: 24,
            fontSize: 12, color: '#fca5a5',
            display: 'flex', alignItems: 'center', gap: 8
          }}>
            <span>🔒</span>
            <span>Restricted access — Authorized personnel only</span>
          </div>

          <form onSubmit={submit}>
            <div style={{ marginBottom: 16 }}>
              <label style={{
                display: 'block', fontSize: 12, fontWeight: 600,
                color: '#94a3b8', marginBottom: 6, letterSpacing: '0.04em',
                textTransform: 'uppercase'
              }}>
                Master Email
              </label>
              <input
                type="email"
                value={form.email}
                onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                placeholder="master@atspro.com"
                required
                style={{
                  width: '100%', padding: '11px 14px', borderRadius: 10,
                  background: '#1a2540', border: '1px solid #1e2d4a',
                  color: '#f1f5f9', fontSize: 14, outline: 'none',
                  boxSizing: 'border-box', fontFamily: 'inherit',
                  transition: 'border-color 0.2s'
                }}
                onFocus={e => e.target.style.borderColor = '#ef4444'}
                onBlur={e => e.target.style.borderColor = '#1e2d4a'}
              />
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={{
                display: 'block', fontSize: 12, fontWeight: 600,
                color: '#94a3b8', marginBottom: 6, letterSpacing: '0.04em',
                textTransform: 'uppercase'
              }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPass ? 'text' : 'password'}
                  value={form.password}
                  onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                  placeholder="••••••••"
                  required
                  style={{
                    width: '100%', padding: '11px 42px 11px 14px', borderRadius: 10,
                    background: '#1a2540', border: '1px solid #1e2d4a',
                    color: '#f1f5f9', fontSize: 14, outline: 'none',
                    boxSizing: 'border-box', fontFamily: 'inherit',
                    transition: 'border-color 0.2s'
                  }}
                  onFocus={e => e.target.style.borderColor = '#ef4444'}
                  onBlur={e => e.target.style.borderColor = '#1e2d4a'}
                />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  style={{
                    position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: '#475569', fontSize: 16, padding: 0, lineHeight: 1
                  }}>
                  {showPass ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%', padding: '13px',
                background: loading
                  ? '#7f1d1d'
                  : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                color: '#fff', border: 'none', borderRadius: 10,
                fontSize: 15, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
                fontFamily: 'inherit', letterSpacing: '-0.01em',
                boxShadow: loading ? 'none' : '0 4px 20px rgba(239,68,68,0.3)',
                transition: 'all 0.2s'
              }}>
              {loading ? '⏳ Authenticating...' : '🔱 Access Master Panel'}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 12, color: '#334155' }}>
          Regular user?{' '}
          <a href="/login" style={{ color: '#6366f1', textDecoration: 'none' }}>
            Go to ATS login →
          </a>
        </p>
      </div>
    </div>
  );
}