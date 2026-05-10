import React, { useEffect, useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useLocation } from 'react-router-dom';

export default function GmailImport() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(null);
  const [results, setResults] = useState(null);
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('connected') === 'true') toast.success(`Gmail connected: ${params.get('email')}`);
    if (params.get('error') === 'true') toast.error('Gmail connection failed. Try again.');
    loadAccounts();
  }, []);

  const loadAccounts = async () => {
    setLoading(true);
    try { const r = await axios.get('/api/gmail/accounts'); setAccounts(r.data); }
    catch { toast.error('Failed to load accounts'); }
    finally { setLoading(false); }
  };

  const connectGmail = async () => {
    try {
      const r = await axios.get('/api/gmail/auth-url');
      window.location.href = r.data.url;
    } catch { toast.error('Failed to get auth URL'); }
  };

  const disconnect = async (id) => {
    if (!window.confirm('Disconnect this Gmail account?')) return;
    try { await axios.delete(`/api/gmail/disconnect/${id}`); toast.success('Disconnected'); loadAccounts(); }
    catch { toast.error('Failed'); }
  };

  const scanGmail = async (tokenId) => {
    setScanning(tokenId);
    setResults(null);
    const toastId = toast.loading('📧 Scanning Gmail for resumes...');
    try {
      const r = await axios.post(`/api/gmail/scan/${tokenId}`);
      setResults(r.data);
      toast.success(r.data.message, { id: toastId, duration: 5000 });
      loadAccounts();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Scan failed', { id: toastId });
    } finally { setScanning(null); }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-title">Gmail Integration</h2>
          <p className="page-subtitle">Auto-import resumes from Gmail inbox directly to Candidates</p>
        </div>
        <button className="btn btn-primary" onClick={connectGmail}>
          <img src="https://www.google.com/favicon.ico" alt="" style={{ width: 16, height: 16 }} />
          Connect Gmail Account
        </button>
      </div>

      {/* How it works */}
      <div className="card" style={{ marginBottom: 24, background: 'var(--accent-dim)', border: '1px solid rgba(99,102,241,0.2)' }}>
        <div style={{ fontWeight: 600, marginBottom: 12, fontSize: 14 }}>🔄 How it works</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          {[
            { icon: '🔗', step: '1', text: 'Connect your Gmail account' },
            { icon: '📧', step: '2', text: 'ATS scans last 30 days of emails' },
            { icon: '🤖', step: '3', text: 'AI extracts candidate data from attachments' },
            { icon: '👤', step: '4', text: 'Candidates auto-added to your system' },
          ].map(s => (
            <div key={s.step} style={{ textAlign: 'center', padding: 12 }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>{s.icon}</div>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent-light)', marginBottom: 4 }}>STEP {s.step}</div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{s.text}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Connected Accounts */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Connected Gmail Accounts ({accounts.length})</div>
        {loading ? <div className="loading"><div className="spinner" /></div> : accounts.length === 0 ? (
          <div className="empty-state" style={{ padding: 40 }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📧</div>
            <h3 style={{ marginBottom: 8 }}>No Gmail accounts connected</h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: 20 }}>Connect your Gmail to start importing resumes automatically</p>
            <button className="btn btn-primary" onClick={connectGmail}>Connect Gmail Account</button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {accounts.map(acc => (
              <div key={acc.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#ea4335', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>✉️</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 15 }}>{acc.email}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2, display: 'flex', gap: 16 }}>
                    <span>✅ Connected</span>
                    <span>📥 {acc.totalImported} candidates imported</span>
                    {acc.lastSyncAt && <span>🕐 Last sync: {new Date(acc.lastSyncAt).toLocaleDateString('en-IN')}</span>}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn btn-primary" onClick={() => scanGmail(acc.id)} disabled={scanning === acc.id} style={{ minWidth: 140 }}>
                    {scanning === acc.id ? <><div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> Scanning...</> : '📥 Scan Now'}
                  </button>
                  <button className="btn btn-danger" onClick={() => disconnect(acc.id)}>Disconnect</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Scan Results */}
      {results && (
        <div className="card">
          <div style={{ fontWeight: 600, marginBottom: 16, fontSize: 14 }}>📊 Scan Results</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
            <div style={{ textAlign: 'center', padding: 16, background: 'var(--green-dim)', borderRadius: 10 }}>
              <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--green)' }}>{results.imported}</div>
              <div style={{ fontSize: 12, color: 'var(--green)' }}>Imported</div>
            </div>
            <div style={{ textAlign: 'center', padding: 16, background: 'var(--amber-dim)', borderRadius: 10 }}>
              <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--amber)' }}>{results.skipped}</div>
              <div style={{ fontSize: 12, color: 'var(--amber)' }}>Skipped</div>
            </div>
            <div style={{ textAlign: 'center', padding: 16, background: 'var(--red-dim)', borderRadius: 10 }}>
              <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--red)' }}>{results.errors}</div>
              <div style={{ fontSize: 12, color: 'var(--red)' }}>Errors</div>
            </div>
          </div>
          {results.results?.length > 0 && (
            <div className="table-wrapper">
              <table className="table">
                <thead><tr><th>Name</th><th>Email</th><th>Status</th><th>Reason</th></tr></thead>
                <tbody>
                  {results.results.map((r, i) => (
                    <tr key={i}>
                      <td style={{ fontWeight: 500 }}>{r.name || '—'}</td>
                      <td style={{ color: 'var(--text-secondary)' }}>{r.email || '—'}</td>
                      <td><span className={`badge badge-${r.status === 'imported' ? 'hired' : 'rejected'}`}>{r.status}</span></td>
                      <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>{r.reason || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Security note */}
      <div style={{ marginTop: 20, padding: '14px 18px', background: 'var(--bg-elevated)', borderRadius: 10, border: '1px solid var(--border)', fontSize: 13, color: 'var(--text-secondary)' }}>
        🔒 <strong>Privacy & Security:</strong> ATS Pro only reads emails with PDF/DOC attachments. We never store your email content — only the candidate data extracted from resume attachments. You can disconnect anytime.
      </div>
    </div>
  );
}