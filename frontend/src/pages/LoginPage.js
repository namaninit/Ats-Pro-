import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const FEATURES = [
  { icon: '🎯', text: 'AI-powered Resume Scanner' },
  { icon: '📊', text: 'Real-time Recruitment Analytics' },
  { icon: '🔀', text: 'Visual Kanban Pipeline' },
  { icon: '📧', text: 'Automated Email Notifications' },
  { icon: '👥', text: 'Multi-user Team Collaboration' },
  { icon: '🏢', text: 'Multi-client Management' },
];

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState('login');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [form, setForm] = useState({ companyName: '', name: '', email: '', password: '', confirmPassword: '' });
  const [errors, setErrors] = useState({});
  const handle = (e) => { setForm(p => ({ ...p, [e.target.name]: e.target.value })); setErrors(p => ({ ...p, [e.target.name]: '' })); };

  const validateLogin = () => {
    const errs = {};
    if (!form.email) errs.email = 'Email required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Invalid email';
    if (!form.password) errs.password = 'Password required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateRegister = () => {
    const errs = {};
    if (!form.companyName) errs.companyName = 'Company name required';
    if (!form.name) errs.name = 'Your name required';
    if (!form.email) errs.email = 'Email required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Invalid email';
    if (!form.password) errs.password = 'Password required';
    else if (form.password.length < 6) errs.password = 'Min 6 characters';
    if (form.password !== form.confirmPassword) errs.confirmPassword = 'Passwords do not match';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const submitLogin = async (e) => {
    e.preventDefault();
    if (!validateLogin()) return;
    setLoading(true);
    try {
      await login(form.email, form.password);
      toast.success('Welcome back! 👋');
      navigate('/dashboard');
    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed';
      toast.error(msg);
      if (msg.includes('credentials')) setErrors({ email: ' ', password: 'Invalid email or password' });
    } finally { setLoading(false); }
  };

  const submitRegister = async (e) => {
    e.preventDefault();
    if (!validateRegister()) return;
    setLoading(true);
    try {
      const r = await axios.post('/api/auth/register', { companyName: form.companyName, name: form.name, email: form.email, password: form.password });
      localStorage.setItem('ats_token', r.data.token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${r.data.token}`;
      toast.success('Account created! Welcome to ATS Pro 🎉');
      navigate('/dashboard');
      window.location.reload();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: 'var(--bg-base)' }}>

      {/* LEFT PANEL — Branding */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center',
        padding: '60px 80px', background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #1e1b4b 100%)',
        position: 'relative', overflow: 'hidden'
      }}>
        {/* Background decoration */}
        <div style={{ position: 'absolute', top: -100, right: -100, width: 400, height: 400, borderRadius: '50%', background: 'rgba(99,102,241,0.15)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -80, left: -80, width: 300, height: 300, borderRadius: '50%', background: 'rgba(139,92,246,0.1)', pointerEvents: 'none' }} />

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 60 }}>
          <div style={{ width: 52, height: 52, borderRadius: 14, background: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, fontWeight: 900, fontFamily: 'Syne, sans-serif', color: '#fff', boxShadow: '0 8px 24px rgba(99,102,241,0.4)' }}>A</div>
          <div>
            <div style={{ fontSize: 24, fontWeight: 800, fontFamily: 'Syne, sans-serif', color: '#fff', letterSpacing: '-0.02em' }}>ATS Pro</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>Recruitment Management Platform</div>
          </div>
        </div>

        {/* Headline */}
        <h1 style={{ fontSize: 42, fontWeight: 800, fontFamily: 'Syne, sans-serif', color: '#fff', lineHeight: 1.15, marginBottom: 20, letterSpacing: '-0.02em' }}>
          Hire Smarter,<br />
          <span style={{ color: '#818cf8' }}>Not Harder</span>
        </h1>
        <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.6)', lineHeight: 1.7, marginBottom: 48, maxWidth: 400 }}>
          The complete recruitment platform for modern HR teams. Track candidates, manage pipelines, and hire the best talent.
        </p>

        {/* Features */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {FEATURES.map(f => (
            <div key={f.text} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(99,102,241,0.2)', border: '1px solid rgba(99,102,241,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, flexShrink: 0 }}>{f.icon}</div>
              <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.75)' }}>{f.text}</span>
            </div>
          ))}
        </div>

        {/* Testimonial */}
        <div style={{ marginTop: 60, padding: '20px 24px', background: 'rgba(255,255,255,0.05)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)' }}>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', fontStyle: 'italic', lineHeight: 1.6, marginBottom: 12 }}>
            "ATS Pro reduced our hiring time by 60% and helped us place 3x more candidates."
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#fff', fontSize: 14 }}>R</div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>Rahul Sharma</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>HR Manager, TechCorp India</div>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT PANEL — Form */}
      <div style={{ width: 480, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '60px 56px', overflowY: 'auto' }}>

        {/* Tab switcher */}
        <div style={{ display: 'flex', background: 'var(--bg-elevated)', borderRadius: 10, padding: 4, marginBottom: 36, gap: 4 }}>
          {[{ key: 'login', label: '🔑 Sign In' }, { key: 'register', label: '🚀 Get Started' }].map(t => (
            <button key={t.key} onClick={() => { setTab(t.key); setErrors({}); }} style={{
              flex: 1, padding: '10px', borderRadius: 7, border: 'none', cursor: 'pointer',
              fontWeight: 600, fontSize: 14, fontFamily: 'DM Sans, sans-serif',
              background: tab === t.key ? 'var(--accent)' : 'transparent',
              color: tab === t.key ? '#fff' : 'var(--text-secondary)',
              transition: 'all 0.2s'
            }}>{t.label}</button>
          ))}
        </div>

        {tab === 'login' ? (
          <>
            <div style={{ marginBottom: 32 }}>
              <h2 style={{ fontSize: 28, fontWeight: 800, fontFamily: 'Syne, sans-serif', marginBottom: 8 }}>Welcome back</h2>
              <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>Sign in to your workspace to continue</p>
            </div>
            <form onSubmit={submitLogin}>
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input className={`form-input ${errors.email ? 'input-error' : ''}`} type="email" name="email" value={form.email} onChange={handle} placeholder="you@company.com" autoFocus />
                {errors.email && <span style={{ fontSize: 12, color: 'var(--red)', marginTop: 4, display: 'block' }}>{errors.email}</span>}
              </div>
              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label className="form-label">Password</label>
                  <a href="/forgot-password" style={{ fontSize: 12, color: 'var(--accent-light)' }}>
                    Forgot password?
                  </a>
                </div>
                <div style={{ position: 'relative' }}>
                  <input className={`form-input ${errors.password ? 'input-error' : ''}`} type={showPass ? 'text' : 'password'} name="password" value={form.password} onChange={handle} placeholder="••••••••" style={{ paddingRight: 44 }} />
                  <button type="button" onClick={() => setShowPass(!showPass)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: 'var(--text-muted)' }}>
                    {showPass ? '🙈' : '👁️'}
                  </button>
                </div>
                {errors.password && <span style={{ fontSize: 12, color: 'var(--red)', marginTop: 4, display: 'block' }}>{errors.password}</span>}
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '13px', fontSize: 15, marginTop: 8, borderRadius: 10 }} disabled={loading}>
                {loading ? <><div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> Signing in...</> : '→ Sign In'}
              </button>
            </form>
          </>
        ) : (
          <>
            <div style={{ marginBottom: 32 }}>
              <h2 style={{ fontSize: 28, fontWeight: 800, fontFamily: 'Syne, sans-serif', marginBottom: 8 }}>Create your workspace</h2>
              <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>Start your free account — no credit card required</p>
            </div>
            <form onSubmit={submitRegister}>
              <div className="form-group">
                <label className="form-label">Company Name *</label>
                <input className={`form-input ${errors.companyName ? 'input-error' : ''}`} name="companyName" value={form.companyName} onChange={handle} placeholder="Your Company Pvt. Ltd." autoFocus />
                {errors.companyName && <span style={{ fontSize: 12, color: 'var(--red)', marginTop: 4, display: 'block' }}>{errors.companyName}</span>}
              </div>
              <div className="form-group">
                <label className="form-label">Your Full Name *</label>
                <input className={`form-input ${errors.name ? 'input-error' : ''}`} name="name" value={form.name} onChange={handle} placeholder="Naman Jain" />
                {errors.name && <span style={{ fontSize: 12, color: 'var(--red)', marginTop: 4, display: 'block' }}>{errors.name}</span>}
              </div>
              <div className="form-group">
                <label className="form-label">Work Email *</label>
                <input className={`form-input ${errors.email ? 'input-error' : ''}`} type="email" name="email" value={form.email} onChange={handle} placeholder="you@company.com" />
                {errors.email && <span style={{ fontSize: 12, color: 'var(--red)', marginTop: 4, display: 'block' }}>{errors.email}</span>}
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Password *</label>
                  <div style={{ position: 'relative' }}>
                    <input className={`form-input ${errors.password ? 'input-error' : ''}`} type={showPass ? 'text' : 'password'} name="password" value={form.password} onChange={handle} placeholder="Min 6 chars" style={{ paddingRight: 40 }} />
                    <button type="button" onClick={() => setShowPass(!showPass)} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: 'var(--text-muted)' }}>{showPass ? '🙈' : '👁️'}</button>
                  </div>
                  {errors.password && <span style={{ fontSize: 12, color: 'var(--red)', marginTop: 4, display: 'block' }}>{errors.password}</span>}
                </div>
                <div className="form-group">
                  <label className="form-label">Confirm Password *</label>
                  <input className={`form-input ${errors.confirmPassword ? 'input-error' : ''}`} type="password" name="confirmPassword" value={form.confirmPassword} onChange={handle} placeholder="Repeat password" />
                  {errors.confirmPassword && <span style={{ fontSize: 12, color: 'var(--red)', marginTop: 4, display: 'block' }}>{errors.confirmPassword}</span>}
                </div>
              </div>

              {/* Password strength */}
              {form.password && (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
                    {[1,2,3,4].map(i => {
                      const strength = form.password.length >= 8 ? (form.password.match(/[A-Z]/) ? (form.password.match(/[0-9]/) ? (form.password.match(/[^A-Za-z0-9]/) ? 4 : 3) : 2) : 2) : 1;
                      return <div key={i} style={{ flex: 1, height: 4, borderRadius: 2, background: i <= strength ? (strength <= 1 ? '#ef4444' : strength <= 2 ? '#f59e0b' : strength <= 3 ? '#6366f1' : '#10b981') : 'var(--border)', transition: 'background 0.3s' }} />;
                    })}
                  </div>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    {form.password.length < 6 ? '⚠️ Too short' : form.password.length < 8 ? '🔶 Weak' : form.password.match(/[A-Z]/) && form.password.match(/[0-9]/) ? '✅ Strong' : '🔵 Medium'}
                  </span>
                </div>
              )}

              <div style={{ background: 'var(--green-dim)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 8, padding: '12px 16px', fontSize: 13, color: 'var(--green)', marginBottom: 20 }}>
                ✅ <strong>Free plan includes:</strong> 3 open jobs · 25 candidates · 2 team members · AI Resume Scanner
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '13px', fontSize: 15, borderRadius: 10 }} disabled={loading}>
                {loading ? <><div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> Creating account...</> : '🚀 Create Free Account'}
              </button>

              <p style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', marginTop: 16 }}>
                By signing up, you agree to our Terms of Service and Privacy Policy
              </p>
            </form>
          </>
        )}
      </div>

      <style>{`
        .input-error { border-color: var(--red) !important; box-shadow: 0 0 0 3px var(--red-dim) !important; }
        @media (max-width: 768px) {
          .login-left { display: none !important; }
        }
      `}</style>
    </div>
  );
}