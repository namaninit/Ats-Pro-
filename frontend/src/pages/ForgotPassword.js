import React, { useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

 const submit = async (e) => {
  e.preventDefault();
  setLoading(true);
  try {
    await axios.post('/api/auth/forgot-password', { email });
    setSent(true);  // only reaches here if email EXISTS and mail was sent
  } catch (err) {
    // 404 = email not found, 500 = mail failed
    const msg = err.response?.data?.message || 'Something went wrong';
    toast.error(msg);
  } finally {
    setLoading(false);
  }
};
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-base)' }}>
      <div className="card" style={{ width: '100%', maxWidth: 400, padding: 32 }}>
        <h2 style={{ marginBottom: 8 }}>🔑 Forgot Password</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: 24, fontSize: 14 }}>
          Enter your email and we'll send a reset link.
        </p>
        {sent ? (
          <div style={{ background: 'var(--green-dim)', color: 'var(--green)', padding: '14px 16px', borderRadius: 10, fontSize: 14 }}>
            ✅ Reset link sent! Check your email inbox.
          </div>
        ) : (
          <form onSubmit={submit}>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input className="form-input" type="email" value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@company.com" required />
            </div>
            <button className="btn btn-primary" type="submit"
              disabled={loading} style={{ width: '100%', marginTop: 8 }}>
              {loading ? '⏳ Sending...' : '📧 Send Reset Link'}
            </button>
            <div style={{ textAlign: 'center', marginTop: 16 }}>
              <a href="/login" style={{ fontSize: 13, color: 'var(--accent-light)' }}>← Back to login</a>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}