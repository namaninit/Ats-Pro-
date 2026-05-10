import React, { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { userAPI } from '../hooks/useApi';
import { useAuth } from '../context/AuthContext';

const ROLE_INFO = {
  super_admin: { label: 'Super Admin', color: '#6366f1', bg: '#eef2ff', desc: 'Full access — can manage everything including users and billing', icon: '👑' },
  recruiter:   { label: 'Recruiter',   color: '#10b981', bg: '#ecfdf5', desc: 'Can manage candidates, jobs, clients and interviews', icon: '🎯' },
  client:      { label: 'Client',      color: '#f59e0b', bg: '#fffbeb', desc: 'Read-only access to assigned jobs and candidates', icon: '🏢' },
};

function UserModal({ user, currentUser, onClose, onSave }) {
  const isEdit = !!user?.id;
  const [form, setForm] = useState(user || { name: '', email: '', password: '', role: 'recruiter', isActive: true });
  const [saving, setSaving] = useState(false);
  const handle = (e) => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      if (isEdit) await userAPI.update(user.id, { name: form.name, role: form.role, isActive: form.isActive });
      else await userAPI.create(form);
      toast.success(isEdit ? 'User updated!' : 'User invited!');
      onSave();
    } catch (err) { toast.error(err.response?.data?.message || 'Error'); }
    finally { setSaving(false); }
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <div className="modal-title">{isEdit ? '✏️ Edit Member' : '➕ Invite Team Member'}</div>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={submit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">Full Name *</label>
              <input className="form-input" name="name" value={form.name} onChange={handle} required autoFocus />
            </div>
            {!isEdit && (
              <>
                <div className="form-group">
                  <label className="form-label">Email *</label>
                  <input className="form-input" type="email" name="email" value={form.email} onChange={handle} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Password *</label>
                  <input className="form-input" type="password" name="password" value={form.password} onChange={handle} required minLength={6} />
                </div>
              </>
            )}
            <div className="form-group">
              <label className="form-label">Role *</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
                {Object.entries(ROLE_INFO).map(([key, info]) => (
                  // Super Admin can only be set by super admin, and only 1 allowed
                  key === 'super_admin' && currentUser?.role !== 'super_admin' ? null : (
                    <label key={key} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 14px', border: `2px solid ${form.role === key ? info.color : 'var(--border)'}`, borderRadius: 10, cursor: 'pointer', background: form.role === key ? info.bg + '40' : 'transparent', transition: 'all 0.2s' }}>
                      <input type="radio" name="role" value={key} checked={form.role === key} onChange={handle} style={{ marginTop: 2, accentColor: info.color }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                          <span>{info.icon}</span>
                          <span style={{ fontWeight: 600, fontSize: 14, color: form.role === key ? info.color : 'var(--text-primary)' }}>{info.label}</span>
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{info.desc}</div>
                      </div>
                    </label>
                  )
                ))}
              </div>
            </div>
            {isEdit && user.id !== currentUser?.id && (
              <div className="form-group">
                <label className="form-label">Status</label>
                <select className="form-input form-select" name="isActive" value={form.isActive} onChange={e => setForm(p => ({ ...p, isActive: e.target.value === 'true' }))}>
                  <option value="true">✅ Active</option>
                  <option value="false">❌ Inactive</option>
                </select>
              </div>
            )}
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : isEdit ? 'Save Changes' : '➕ Add Member'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Users() {
  const { user: me } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try { const r = await userAPI.getAll(); setUsers(r.data); }
    catch { toast.error('Failed to load'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id) => {
    if (id === me.id) return toast.error("You can't delete yourself");
    if (!window.confirm('Remove this team member?')) return;
    try { await userAPI.delete(id); toast.success('Member removed'); load(); }
    catch { toast.error('Failed'); }
  };

  const handleToggleActive = async (user) => {
    try {
      await userAPI.update(user.id, { isActive: !user.isActive });
      toast.success(user.isActive ? 'User deactivated' : 'User activated');
      load();
    } catch { toast.error('Failed'); }
  };

  const filtered = users.filter(u => {
    const s = search.toLowerCase();
    return !s || u.name?.toLowerCase().includes(s) || u.email?.toLowerCase().includes(s);
  });

  const roleGroups = {
    super_admin: filtered.filter(u => u.role === 'super_admin'),
    recruiter: filtered.filter(u => u.role === 'recruiter'),
    client: filtered.filter(u => u.role === 'client'),
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-title">Team Members</h2>
          <p className="page-subtitle">{users.length} members · {users.filter(u => u.isActive).length} active</p>
        </div>
        <button className="btn btn-primary" onClick={() => setModal({})}>➕ Add Member</button>
      </div>

      {/* Role summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 28 }}>
        {Object.entries(ROLE_INFO).map(([key, info]) => (
          <div key={key} style={{ background: 'var(--bg-surface)', border: `1px solid var(--border)`, borderRadius: 12, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: info.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>{info.icon}</div>
            <div>
              <div style={{ fontSize: 22, fontWeight: 700, color: info.color, fontFamily: 'Syne, sans-serif' }}>{roleGroups[key].length}</div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{info.label}s</div>
            </div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: 20, maxWidth: 320 }}>
        <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>🔍</span>
        <input className="form-input" style={{ paddingLeft: 36 }} placeholder="Search members..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {loading ? <div className="loading"><div className="spinner" /></div> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {Object.entries(ROLE_INFO).map(([key, info]) => (
            roleGroups[key].length > 0 && (
              <div key={key}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <span>{info.icon}</span>
                  <span style={{ fontSize: 14, fontWeight: 600, color: info.color }}>{info.label}s</span>
                  <span style={{ background: info.bg, color: info.color, borderRadius: 20, padding: '1px 8px', fontSize: 12 }}>{roleGroups[key].length}</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 12 }}>
                  {roleGroups[key].map(u => (
                    <div key={u.id} style={{ background: 'var(--bg-surface)', border: `1px solid ${u.isActive ? 'var(--border)' : 'var(--border)'}`, borderRadius: 12, padding: '16px 18px', opacity: u.isActive ? 1 : 0.6, transition: 'all 0.2s', position: 'relative' }}
                      onMouseEnter={e => e.currentTarget.style.borderColor = info.color + '60'}
                      onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}>
                      {u.id === me.id && (
                        <span style={{ position: 'absolute', top: 12, right: 12, background: 'var(--accent-dim)', color: 'var(--accent-light)', borderRadius: 20, padding: '2px 8px', fontSize: 11, fontWeight: 600 }}>You</span>
                      )}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                        <div style={{ width: 44, height: 44, borderRadius: '50%', background: info.color + '20', border: `2px solid ${info.color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 18, color: info.color, flexShrink: 0 }}>
                          {u.name?.[0]?.toUpperCase()}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 600, fontSize: 15, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.name}</div>
                          <div style={{ fontSize: 12, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.email}</div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                          <span style={{ background: info.bg, color: info.color, borderRadius: 6, padding: '3px 10px', fontSize: 12, fontWeight: 600 }}>{info.icon} {info.label}</span>
                          <span style={{ background: u.isActive ? 'var(--green-dim)' : 'var(--red-dim)', color: u.isActive ? 'var(--green)' : 'var(--red)', borderRadius: 6, padding: '3px 10px', fontSize: 12, fontWeight: 600 }}>{u.isActive ? '● Active' : '○ Inactive'}</span>
                        </div>
                        {u.id !== me.id && me.role === 'super_admin' && (
                          <div style={{ display: 'flex', gap: 4 }}>
                            <button className="btn btn-ghost btn-sm btn-icon" onClick={() => setModal(u)} title="Edit">✏️</button>
                            <button className="btn btn-ghost btn-sm btn-icon" onClick={() => handleToggleActive(u)} title={u.isActive ? 'Deactivate' : 'Activate'}>{u.isActive ? '🔒' : '🔓'}</button>
                            <button className="btn btn-danger btn-sm btn-icon" onClick={() => handleDelete(u.id)} title="Remove">🗑️</button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          ))}
        </div>
      )}

      {modal !== null && <UserModal user={modal?.id ? modal : undefined} currentUser={me} onClose={() => setModal(null)} onSave={() => { setModal(null); load(); }} />}
    </div>
  );
}