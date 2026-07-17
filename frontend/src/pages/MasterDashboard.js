// FILE: frontend/src/pages/MasterDashboard.jsx
// ROUTE: /master/dashboard
// ACTION: REPLACE your existing MasterDashboard.js with this file
// NOTE: This page is 100% standalone — does NOT use AuthContext at all.
//       It manages its own token from localStorage('master_token')

import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';

const API = process.env.REACT_APP_API_URL || '';

const PLAN_COLORS = { free: '#64748b', starter: '#3b82f6', pro: '#10b981' };
const PLAN_LIMITS = {
  free:    { maxJobs: 3,    maxCandidates: 25,     maxUsers: 2  },
  starter: { maxJobs: 20,   maxCandidates: 200,    maxUsers: 5  },
  pro:     { maxJobs: 9999, maxCandidates: 999999, maxUsers: 99 },
};

// Standalone axios instance for master — separate from regular app axios
const masterAxios = axios.create({ baseURL: API });

export default function MasterDashboard() {
  const navigate = useNavigate();
  const [masterUser, setMasterUser] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [pending, setPending] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending');
  const [search, setSearch] = useState('');
  const [expandedCompany, setExpandedCompany] = useState(null);

  // Auth check on mount
  useEffect(() => {
    const token = localStorage.getItem('master_token');
    const userRaw = localStorage.getItem('master_user');

    if (!token || !userRaw) {
      navigate('/master');
      return;
    }

    try {
      const u = JSON.parse(userRaw);
      if (u.role !== 'master_admin') {
        navigate('/master');
        return;
      }
      setMasterUser(u);
      // Set auth header on our standalone instance
      masterAxios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      loadData();
    } catch {
      navigate('/master');
    }
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [cr, sr, ur, pr] = await Promise.all([
        masterAxios.get('/api/master/companies'),
        masterAxios.get('/api/master/stats'),
        masterAxios.get('/api/master/users'),
        masterAxios.get('/api/master/pending'),
      ]);
      setCompanies(cr.data);
      setStats(sr.data);
      setAllUsers(ur.data);
      setPending(pr.data);
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        toast.error('Session expired. Please log in again.');
        logout();
      } else {
        toast.error('Failed to load data');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = () => {
    localStorage.removeItem('master_token');
    localStorage.removeItem('master_user');
    delete masterAxios.defaults.headers.common['Authorization'];
    navigate('/master');
  };

  const updatePlan = async (company, plan) => {
    try {
      await masterAxios.put(`/api/master/companies/${company.id}/plan`, {
        plan, ...PLAN_LIMITS[plan], isActive: company.isActive
      });
      toast.success(`${company.name} → ${plan.toUpperCase()} plan`);
      loadData();
    } catch {
      toast.error('Plan update failed');
    }
  };

  const toggleCompany = async (company) => {
    try {
      await masterAxios.put(`/api/master/companies/${company.id}/plan`, {
        plan: company.plan,
        maxJobs: company.maxJobs,
        maxCandidates: company.maxCandidates,
        maxUsers: company.maxUsers,
        isActive: !company.isActive
      });
      toast.success(company.isActive ? `${company.name} suspended` : `${company.name} activated`);
      loadData();
    } catch {
      toast.error('Action failed');
    }
  };

  const deleteCompany = async (id, name) => {
    if (!window.confirm(`Permanently DELETE "${name}" and ALL its data?\n\nThis cannot be undone!`)) return;
    try {
      await masterAxios.delete(`/api/master/companies/${id}`);
      toast.success(`${name} deleted`);
      loadData();
    } catch {
      toast.error('Delete failed');
    }
  };

  const approveCompany = async (company) => {
    try {
      await masterAxios.patch(`/api/master/companies/${company.id}/approve`);
      toast.success(`${company.name} approved ✅`);
      loadData();
    } catch {
      toast.error('Approve failed');
    }
  };

  const rejectCompany = async (company) => {
    if (!window.confirm(`Reject signup for "${company.name}"? They will not be able to log in.`)) return;
    try {
      await masterAxios.patch(`/api/master/companies/${company.id}/reject`);
      toast.success(`${company.name} rejected`);
      loadData();
    } catch {
      toast.error('Reject failed');
    }
  };

  const toggleUser = async (user) => {
    try {
      await masterAxios.put(`/api/master/users/${user.id}`, {
        ...user, isActive: !user.isActive
      });
      toast.success(user.isActive ? `${user.name} deactivated` : `${user.name} activated`);
      loadData();
    } catch {
      toast.error('Action failed');
    }
  };

  const filteredCompanies = companies.filter(c =>
    !search ||
    c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase())
  );

  const filteredPending = pending.filter(c =>
    !search ||
    c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase())
  );

  const filteredUsers = allUsers.filter(u =>
    !search ||
    u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  // ─── Styles ───────────────────────────────────────────────
  const s = {
    page: {
      minHeight: '100vh',
      background: '#080c18',
      color: '#e2e8f0',
      fontFamily: "'Inter', sans-serif"
    },
    header: {
      background: '#0d1322',
      borderBottom: '1px solid #1a2540',
      padding: '0 28px',
      height: 60,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      boxShadow: '0 1px 20px rgba(0,0,0,0.4)'
    },
    body: { padding: '24px 28px', maxWidth: 1400, margin: '0 auto' },
    card: {
      background: '#0d1322',
      border: '1px solid #1a2540',
      borderRadius: 12,
      padding: '18px 20px'
    },
    statCard: (color) => ({
      background: '#0d1322',
      border: `1px solid #1a2540`,
      borderRadius: 12,
      padding: '18px 20px',
      display: 'flex',
      alignItems: 'center',
      gap: 14,
      borderLeft: `3px solid ${color}`
    }),
    tab: (active) => ({
      padding: '8px 18px',
      borderRadius: 8,
      border: 'none',
      cursor: 'pointer',
      fontSize: 13,
      fontFamily: 'inherit',
      fontWeight: active ? 600 : 500,
      background: active ? '#dc2626' : 'transparent',
      color: active ? '#fff' : '#475569',
      transition: 'all 0.15s'
    }),
    btn: (bg, color, border) => ({
      padding: '6px 12px',
      background: bg,
      color,
      border: `1px solid ${border}`,
      borderRadius: 7,
      fontSize: 12,
      cursor: 'pointer',
      fontFamily: 'inherit',
      fontWeight: 500,
      transition: 'opacity 0.15s',
      whiteSpace: 'nowrap'
    }),
    badge: (color, bg) => ({
      display: 'inline-block',
      background: bg,
      color,
      borderRadius: 20,
      padding: '2px 10px',
      fontSize: 11,
      fontWeight: 600
    }),
    th: {
      padding: '11px 14px',
      textAlign: 'left',
      fontSize: 11,
      fontWeight: 600,
      color: '#475569',
      textTransform: 'uppercase',
      letterSpacing: '0.06em',
      borderBottom: '1px solid #1a2540',
      background: '#0a1120'
    },
    td: { padding: '11px 14px', borderBottom: '1px solid #111c33', fontSize: 13 }
  };

  if (loading) return (
    <div style={{ ...s.page, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div>
        <div style={{
          width: 40, height: 40, borderRadius: '50%',
          border: '3px solid #1a2540', borderTopColor: '#ef4444',
          animation: 'spin 0.8s linear infinite', margin: '0 auto 12px'
        }} />
        <p style={{ color: '#475569', fontSize: 13, textAlign: 'center' }}>Loading master data...</p>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  );

  return (
    <div style={s.page}>
      {/* ── Header ── */}
      <div style={s.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 34, height: 34, borderRadius: 9,
            background: 'linear-gradient(135deg, #ef4444, #b91c1c)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16
          }}>🔱</div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 14, letterSpacing: '-0.02em' }}>
              ATS Pro — Master Control
            </div>
            <div style={{ fontSize: 10, color: '#334155', marginTop: 1 }}>
              Platform Administration Panel
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            background: '#1a2540', border: '1px solid #1e3050',
            borderRadius: 8, padding: '5px 12px',
            fontSize: 12, color: '#94a3b8',
            display: 'flex', alignItems: 'center', gap: 6
          }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#ef4444' }} />
            {masterUser?.name || 'Master Admin'}
          </div>
          <button onClick={loadData} style={s.btn('rgba(99,102,241,0.1)', '#818cf8', 'rgba(99,102,241,0.2)')}>
            🔄 Refresh
          </button>
          <button onClick={logout} style={s.btn('rgba(239,68,68,0.1)', '#fca5a5', 'rgba(239,68,68,0.2)')}>
            🚪 Logout
          </button>
        </div>
      </div>

      <div style={s.body}>
        {/* ── Stats Row ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 24 }}>
          {[
            { label: 'Companies', value: stats.totalCompanies || 0, icon: '🏢', color: '#6366f1' },
            { label: 'Total Users', value: stats.totalUsers || 0, icon: '👥', color: '#10b981' },
            { label: 'Candidates', value: stats.totalCandidates || 0, icon: '👤', color: '#3b82f6' },
            { label: 'Active Jobs', value: stats.totalJobs || 0, icon: '💼', color: '#f59e0b' },
          ].map(s2 => (
            <div key={s2.label} style={s.statCard(s2.color)}>
              <div style={{
                width: 42, height: 42, borderRadius: 10,
                background: s2.color + '18',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 19
              }}>{s2.icon}</div>
              <div>
                <div style={{ fontSize: 10, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  {s2.label}
                </div>
                <div style={{ fontSize: 24, fontWeight: 800, color: s2.color, lineHeight: 1.2 }}>
                  {s2.value}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ── Search + Tabs ── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18, flexWrap: 'wrap', gap: 12 }}>
          <div style={{
            display: 'flex', gap: 4,
            background: '#0d1322', border: '1px solid #1a2540',
            borderRadius: 10, padding: 4
          }}>
            {[
              { key: 'pending',    label: `⏳ Pending Approvals (${pending.length})` },
              { key: 'overview',   label: `🏢 Companies (${companies.length})` },
              { key: 'users',      label: `👥 All Users (${allUsers.length})` },
            ].map(t => (
              <button key={t.key} onClick={() => setActiveTab(t.key)}
                style={{
                  ...s.tab(activeTab === t.key),
                  ...(t.key === 'pending' && pending.length > 0 && activeTab !== t.key
                    ? { color: '#f59e0b' } : {})
                }}>
                {t.label}
              </button>
            ))}
          </div>

          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#334155', fontSize: 14 }}>🔍</span>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={activeTab === 'users' ? 'Search users...' : 'Search companies...'}
              style={{
                paddingLeft: 34, padding: '9px 14px 9px 34px',
                background: '#0d1322', border: '1px solid #1a2540',
                borderRadius: 9, color: '#e2e8f0', fontSize: 13,
                outline: 'none', width: 240, fontFamily: 'inherit'
              }}
            />
          </div>
        </div>

        {/* ── Pending Approvals Tab ── */}
        {activeTab === 'pending' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {filteredPending.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 60, color: '#334155' }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>✅</div>
                <div>No pending signups — all caught up</div>
              </div>
            ) : filteredPending.map(c => (
              <div key={c.id} style={{
                ...s.card,
                border: '1px solid rgba(245,158,11,0.3)'
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                  <div style={{
                    width: 46, height: 46, borderRadius: 12, flexShrink: 0,
                    background: 'linear-gradient(135deg, #78350f, #92400e)',
                    border: '1px solid #b45309',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 20, fontWeight: 800, color: '#fbbf24'
                  }}>
                    {c.name?.[0]?.toUpperCase()}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5, flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 700, fontSize: 15 }}>{c.name}</span>
                      <span style={s.badge('#f59e0b', 'rgba(245,158,11,0.1)')}>⏳ Pending</span>
                    </div>
                    <div style={{ fontSize: 12, color: '#475569', marginBottom: 10 }}>{c.email}</div>

                    {c.users?.map(u => (
                      <div key={u.id} style={{ fontSize: 12, color: '#94a3b8', marginBottom: 3 }}>
                        Signed up by <strong style={{ color: '#e2e8f0' }}>{u.name}</strong> ({u.email})
                        {' · '}{new Date(u.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                      </div>
                    ))}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 7, flexShrink: 0, minWidth: 130 }}>
                    <button onClick={() => approveCompany(c)}
                      style={s.btn('rgba(16,185,129,0.12)', '#10b981', 'rgba(16,185,129,0.25)')}>
                      ✅ Approve
                    </button>
                    <button onClick={() => rejectCompany(c)}
                      style={s.btn('rgba(239,68,68,0.1)', '#ef4444', 'rgba(239,68,68,0.2)')}>
                      ❌ Reject
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Companies Tab ── */}
        {activeTab === 'overview' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {filteredCompanies.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 60, color: '#334155' }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>🏢</div>
                <div>No companies found</div>
              </div>
            ) : filteredCompanies.map(c => (
              <div key={c.id} style={{
                ...s.card,
                opacity: c.isActive ? 1 : 0.65,
                border: `1px solid ${c.isActive ? '#1a2540' : 'rgba(239,68,68,0.25)'}`
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                  {/* Avatar */}
                  <div style={{
                    width: 46, height: 46, borderRadius: 12, flexShrink: 0,
                    background: 'linear-gradient(135deg, #1e3460, #0d1f42)',
                    border: '1px solid #1a2d50',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 20, fontWeight: 800, color: '#818cf8'
                  }}>
                    {c.name?.[0]?.toUpperCase()}
                  </div>

                  {/* Main info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5, flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 700, fontSize: 15 }}>{c.name}</span>
                      <span style={s.badge(
                        PLAN_COLORS[c.plan],
                        PLAN_COLORS[c.plan] + '18'
                      )}>{c.plan?.toUpperCase()}</span>
                      <span style={s.badge(
                        c.isActive ? '#10b981' : '#ef4444',
                        c.isActive ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)'
                      )}>
                        {c.isActive ? '● Active' : '● Suspended'}
                      </span>
                      {c.approvalStatus === 'pending' && (
                        <span style={s.badge('#f59e0b', 'rgba(245,158,11,0.1)')}>⏳ Pending Approval</span>
                      )}
                      {c.approvalStatus === 'rejected' && (
                        <span style={s.badge('#ef4444', 'rgba(239,68,68,0.1)')}>❌ Rejected</span>
                      )}
                    </div>
                    <div style={{ fontSize: 12, color: '#475569', marginBottom: 10 }}>{c.email}</div>

                    {/* Mini stats */}
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 8 }}>
                      {[
                        { label: 'Users', value: c.users?.length || 0, icon: '👥' },
                        { label: 'Candidates', value: c.stats?.candidates || 0, icon: '👤' },
                        { label: 'Jobs', value: c.stats?.jobs || 0, icon: '💼' },
                        { label: 'Clients', value: c.stats?.clients || 0, icon: '🏢' },
                      ].map(st => (
                        <div key={st.label} style={{
                          padding: '5px 12px',
                          background: '#111c33', border: '1px solid #1a2540',
                          borderRadius: 7, textAlign: 'center'
                        }}>
                          <div style={{ fontWeight: 700, fontSize: 14, color: '#818cf8' }}>{st.value}</div>
                          <div style={{ fontSize: 10, color: '#475569' }}>{st.label}</div>
                        </div>
                      ))}
                    </div>

                    <div style={{ fontSize: 11, color: '#334155' }}>
                      Limits: {c.maxJobs} jobs · {c.maxCandidates} candidates · {c.maxUsers} users
                      {' · '}ID #{c.id}
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 7, flexShrink: 0, minWidth: 130 }}>
                    <select value={c.plan} onChange={e => updatePlan(c, e.target.value)}
                      style={{
                        padding: '7px 10px', background: '#111c33',
                        border: '1px solid #1a2540', borderRadius: 8,
                        color: '#e2e8f0', fontSize: 12, cursor: 'pointer',
                        fontFamily: 'inherit', outline: 'none'
                      }}>
                      <option value="free">Free Plan</option>
                      <option value="starter">Starter Plan</option>
                      <option value="pro">Pro Plan</option>
                    </select>

                    <button onClick={() => toggleCompany(c)} style={s.btn(
                      c.isActive ? 'rgba(245,158,11,0.1)' : 'rgba(16,185,129,0.1)',
                      c.isActive ? '#f59e0b' : '#10b981',
                      c.isActive ? 'rgba(245,158,11,0.2)' : 'rgba(16,185,129,0.2)'
                    )}>
                      {c.isActive ? '🔒 Suspend' : '✅ Activate'}
                    </button>

                    <button
                      onClick={() => setExpandedCompany(expandedCompany === c.id ? null : c.id)}
                      style={s.btn('#111c33', '#64748b', '#1a2540')}>
                      {expandedCompany === c.id ? '▲ Hide Team' : '▼ Show Team'}
                    </button>

                    <button onClick={() => deleteCompany(c.id, c.name)}
                      style={s.btn('rgba(239,68,68,0.08)', '#ef4444', 'rgba(239,68,68,0.2)')}>
                      🗑️ Delete
                    </button>
                  </div>
                </div>

                {/* Expanded team members */}
                {expandedCompany === c.id && c.users?.length > 0 && (
                  <div style={{
                    marginTop: 14, paddingTop: 14,
                    borderTop: '1px solid #1a2540'
                  }}>
                    <div style={{
                      fontSize: 10, color: '#334155', marginBottom: 8,
                      textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600
                    }}>
                      Team Members ({c.users.length})
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {c.users.map(u => (
                        <div key={u.id} style={{
                          display: 'flex', alignItems: 'center', gap: 6,
                          background: '#111c33', border: '1px solid #1a2540',
                          borderRadius: 8, padding: '5px 10px'
                        }}>
                          <div style={{
                            width: 22, height: 22, borderRadius: '50%',
                            background: '#6366f1',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 10, fontWeight: 700, color: '#fff', flexShrink: 0
                          }}>
                            {u.name?.[0]}
                          </div>
                          <span style={{ fontSize: 12, fontWeight: 500 }}>{u.name}</span>
                          <span style={{ fontSize: 10, color: '#475569' }}>
                            {u.role?.replace('_', ' ')}
                          </span>
                          <div style={{
                            width: 6, height: 6, borderRadius: '50%',
                            background: u.isActive ? '#10b981' : '#ef4444'
                          }} />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ── All Users Tab ── */}
        {activeTab === 'users' && (
          <div style={{
            background: '#0d1322', border: '1px solid #1a2540',
            borderRadius: 12, overflow: 'hidden'
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['Name', 'Email', 'Company', 'Role', 'Plan', 'Status', 'Action'].map(h => (
                    <th key={h} style={s.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ ...s.td, textAlign: 'center', padding: 40, color: '#334155' }}>
                      No users found
                    </td>
                  </tr>
                ) : filteredUsers.map((u, i) => (
                  <tr key={u.id} style={{ background: i % 2 === 0 ? 'transparent' : '#090e1c' }}>
                    <td style={s.td}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{
                          width: 28, height: 28, borderRadius: '50%',
                          background: '#1a2d50',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 11, fontWeight: 700, color: '#818cf8', flexShrink: 0
                        }}>
                          {u.name?.[0]}
                        </div>
                        <span style={{ fontWeight: 500 }}>{u.name}</span>
                      </div>
                    </td>
                    <td style={{ ...s.td, color: '#475569' }}>{u.email}</td>
                    <td style={s.td}>
                      {u.company?.name || <span style={{ color: '#1e2d4a' }}>—</span>}
                    </td>
                    <td style={s.td}>
                      <span style={{
                        background: '#111c33', border: '1px solid #1a2540',
                        borderRadius: 6, padding: '2px 8px', fontSize: 11, color: '#818cf8'
                      }}>
                        {u.role?.replace('_', ' ')}
                      </span>
                    </td>
                    <td style={s.td}>
                      {u.company?.plan && (
                        <span style={{ color: PLAN_COLORS[u.company.plan], fontSize: 12, fontWeight: 600 }}>
                          {u.company.plan}
                        </span>
                      )}
                    </td>
                    <td style={s.td}>
                      <span style={s.badge(
                        u.isActive ? '#10b981' : '#ef4444',
                        u.isActive ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)'
                      )}>
                        {u.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td style={s.td}>
                      <button onClick={() => toggleUser(u)}
                        style={s.btn(
                          'transparent',
                          u.isActive ? '#f59e0b' : '#10b981',
                          '#1a2540'
                        )}>
                        {u.isActive ? '🔒 Deactivate' : '✅ Activate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}