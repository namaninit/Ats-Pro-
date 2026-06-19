import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';

export default function ResetPassword() {
  const [params] = useSearchParams();
  const token = params.get('token');
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (password !== confirm) return toast.error('Passwords do not match');
    if (password.length < 6) return toast.error('Minimum 6 characters');
    setLoading(true);
    try {
      await axios.post('/api/auth/reset-password', { token, password });
      toast.success('Password reset! Please log in.');
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Reset failed');
    } finally { setLoading(false); }
  };

  if (!token) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="card" style={{ padding: 32 }}>❌ Invalid reset link. <a href="/forgot-password">Request a new one</a></div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-base)' }}>
      <div className="card" style={{ width: '100%', maxWidth: 400, padding: 32 }}>
        <h2 style={{ marginBottom: 8 }}>🔒 Reset Password</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: 24, fontSize: 14 }}>Enter your new password below.</p>
        <form onSubmit={submit}>
          <div className="form-group">
            <label className="form-label">New Password</label>
            <input className="form-input" type="password" value={password}
              onChange={e => setPassword(e.target.value)} placeholder="Min 6 characters" required />
          </div>
          <div className="form-group">
            <label className="form-label">Confirm Password</label>
            <input className="form-input" type="password" value={confirm}
              onChange={e => setConfirm(e.target.value)} placeholder="Same as above" required />
          </div>
          <button className="btn btn-primary" type="submit"
            disabled={loading} style={{ width: '100%', marginTop: 8 }}>
            {loading ? '⏳ Resetting...' : '✅ Reset Password'}
          </button>
        </form>
      </div>
    </div>
  );
}