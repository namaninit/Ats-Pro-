import React, { useEffect, useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

const PERMISSION_DEFS = [
  { key: 'canDelete', label: 'Delete records', desc: 'Delete candidates, jobs, or clients', icon: '🗑️' },
  { key: 'canEdit', label: 'Edit / Update', desc: 'Edit candidate, job, client details', icon: '✏️' },
  { key: 'canGmailImport', label: 'Gmail Import', desc: 'Connect Gmail and import resumes', icon: '📧' },
  { key: 'canBulkUpload', label: 'Bulk Upload', desc: 'Upload multiple resumes at once', icon: '📂' },
  { key: 'canViewCTC', label: 'View Salary/CTC', desc: 'See current and expected CTC fields', icon: '💰' },
  { key: 'canScheduleInterview', label: 'Schedule Interviews', desc: 'Create and manage interview schedules', icon: '📅' },
];

const DEFAULT_PERMISSIONS = {
  canDelete: false,
  canEdit: true,
  canGmailImport: false,
  canBulkUpload: true,
  canViewCTC: true,
  canScheduleInterview: true,
};

const ROLE_META = {
  super_admin: { label: 'Super Admin', icon: '👑', color: '#6366f1' },
  recruiter:   { label: 'Recruiter',   icon: '🎯', color: '#10b981' },
  client:      { label: 'Client',      icon: '🏢', color: '#f59e0b' },
};

function InviteModal({ onClose, onSaved }) {
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'recruiter' });
  const [saving, setSaving] = useState(false);
  const handle = (e) => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const submit = async () => {
    if (!form.name || !form.email || !form.password) return toast.error('All fields required');
    setSaving(true);
    try {
      await axios.post('/api/users', { ...form, permissions: DEFAULT_PERMISSIONS });
      toast.success(`${form.name} added!`);
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add member');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal" style={{ maxWidth: 440 }}>
        <div className="modal-header">
          <div className="modal-title">➕ Add Team Member</div>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input className="form-input" name="name" value={form.name} onChange={handle} placeholder="Jane Doe" autoFocus />
          </div>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input className="form-input" type="email" name="email" value={form.email} onChange={handle} placeholder="jane@company.com" />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input className="form-input" type="password" name="password" value={form.password} onChange={handle} placeholder="Min 6 characters" />
          </div>
          <div className="form-group">
            <label className="form-label">Role</label>
            <select className="form-input form-select" name="role" value={form.role} onChange={handle}>
              <option value="recruiter">Recruiter</option>
              <option value="client">Client</option>
              <option value="super_admin">Super Admin</option>
            </select>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={submit} disabled={saving}>
            {saving ? 'Adding...' : '✅ Add Member'}
          </button>
        </div>
      </div>
    </div>
  );
}

function PermissionToggle({ def, checked, onChange, disabled }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '10px 12px', background: 'var(--bg-elevated)', borderRadius: 8,
      opacity: disabled ? 0.5 : 1,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
        <span style={{ fontSize: 16, flexShrink: 0 }}>{def.icon}</span>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600 }}>{def.label}</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{def.desc}</div>
        </div>
      </div>
      <label style={{ position: 'relative', display: 'inline-block', width: 40, height: 22, flexShrink: 0, cursor: disabled ? 'not-allowed' : 'pointer' }}>
        <input
          type="checkbox"
          checked={checked}
          disabled={disabled}
          onChange={onChange}
          style={{ opacity: 0, width: 0, height: 0 }}
        />
        <span style={{
          position: 'absolute', inset: 0, borderRadius: 22,
          background: checked ? 'var(--accent)' : 'var(--border-light)',
          transition: 'background 0.2s',
        }}>
          <span style={{
            position: 'absolute', height: 16, width: 16, left: checked ? 21 : 3, top: 3,
            background: '#fff', borderRadius: '50%', transition: 'left 0.2s',
          }} />
        </span>
      </label>
    </div>
  );
}

function MemberCard({ user, isYou, onToggleActive, onUpdatePermissions, onDelete }) {
  const [expanded, setExpanded] = useState(false);
  const [perms, setPerms] = useState(user.permissions || DEFAULT_PERMISSIONS);
  const [saving, setSaving] = useState(false);
  const meta = ROLE_META[user.role] || { label: user.role, icon: '👤', color: '#64748b' };
  const isSuperAdmin = user.role === 'super_admin';

  const togglePerm = async (key) => {
    const updated = { ...perms, [key]: !perms[key] };
    setPerms(updated);
    setSaving(true);
    try {
      await onUpdatePermissions(user.id, updated);
    } catch {
      setPerms(perms); // revert on failure
      toast.error('Failed to update permission');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="card" style={{ opacity: user.isActive ? 1 : 0.6 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div className="avatar" style={{ width: 40, height: 40, fontSize: 16, background: meta.color + '20', color: meta.color }}>
          {user.name?.[0]}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 600, fontSize: 14 }}>{user.name}</span>
            {isYou && <span style={{ fontSize: 10, background: 'var(--accent-dim)', color: 'var(--accent-light)', padding: '1px 8px', borderRadius: 20 }}>You</span>}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{user.email}</div>
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0 }}>
          <span style={{ fontSize: 11, background: meta.color + '20', color: meta.color, padding: '3px 10px', borderRadius: 20, fontWeight: 600 }}>
            {meta.icon} {meta.label}
          </span>
          <span style={{ fontSize: 11, background: user.isActive ? 'var(--green-dim)' : 'var(--red-dim)', color: user.isActive ? 'var(--green)' : 'var(--red)', padding: '3px 10px', borderRadius: 20, fontWeight: 600 }}>
            {user.isActive ? '● Active' : '● Inactive'}
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
        {!isSuperAdmin && (
          <button className="btn btn-secondary btn-sm" onClick={() => setExpanded(!expanded)}>
            {expanded ? '▲ Hide Permissions' : '🔐 Manage Permissions'}
          </button>
        )}
        {!isYou && (
          <>
            <button className="btn btn-secondary btn-sm" onClick={() => onToggleActive(user)}>
              {user.isActive ? '🔒 Deactivate' : '✅ Activate'}
            </button>
            <button className="btn btn-danger btn-sm" onClick={() => onDelete(user)}>
              🗑️ Remove
            </button>
          </>
        )}
      </div>

      {isSuperAdmin && (
        <div style={{ marginTop: 10, fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic' }}>
          Super Admins have full access — permissions cannot be restricted.
        </div>
      )}

      {expanded && !isSuperAdmin && (
        <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {PERMISSION_DEFS.map(def => (
            <PermissionToggle
              key={def.key}
              def={def}
              checked={!!perms[def.key]}
              disabled={saving}
              onChange={() => togglePerm(def.key)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showInvite, setShowInvite] = useState(false);
  const [search, setSearch] = useState('');
  const currentUserId = JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user') || '{}')?.id;

  const load = async () => {
    setLoading(true);
    try {
      const r = await axios.get('/api/users');
      setUsers(r.data);
    } catch {
      toast.error('Failed to load team members');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const onToggleActive = async (user) => {
    try {
      await axios.put(`/api/users/${user.id}`, { isActive: !user.isActive });
      toast.success(user.isActive ? `${user.name} deactivated` : `${user.name} activated`);
      load();
    } catch {
      toast.error('Failed to update');
    }
  };

  const onUpdatePermissions = async (userId, permissions) => {
    await axios.put(`/api/users/${userId}`, { permissions });
  };

  const onDelete = async (user) => {
    if (!window.confirm(`Remove ${user.name} from the team? This cannot be undone.`)) return;
    try {
      await axios.delete(`/api/users/${user.id}`);
      toast.success(`${user.name} removed`);
      load();
    } catch {
      toast.error('Failed to remove');
    }
  };

  const filtered = users.filter(u =>
    !search || u.name?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase())
  );

  const counts = {
    super_admin: users.filter(u => u.role === 'super_admin').length,
    recruiter: users.filter(u => u.role === 'recruiter').length,
    client: users.filter(u => u.role === 'client').length,
  };

  if (loading) return <div className="loading"><div className="spinner" /></div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-title">User Management</h2>
          <p className="page-subtitle">Manage team members and permissions</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowInvite(true)}>
          ＋ Add Member
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { key: 'super_admin', value: counts.super_admin, label: 'Super Admins' },
          { key: 'recruiter', value: counts.recruiter, label: 'Recruiters' },
          { key: 'client', value: counts.client, label: 'Clients' },
        ].map(s => {
          const meta = ROLE_META[s.key];
          return (
            <div key={s.key} className="card" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: meta.color + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
                {meta.icon}
              </div>
              <div>
                <div style={{ fontSize: 20, fontWeight: 700, color: meta.color }}>{s.value}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{s.label}</div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="search-bar" style={{ marginBottom: 16 }}>
        <div className="search-input-wrap">
          <span className="search-icon">🔍</span>
          <input className="form-input search-input" placeholder="Search members..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">👥</div>
            <h3>No team members found</h3>
          </div>
        ) : filtered.map(u => (
          <MemberCard
            key={u.id}
            user={u}
            isYou={u.id === currentUserId}
            onToggleActive={onToggleActive}
            onUpdatePermissions={onUpdatePermissions}
            onDelete={onDelete}
          />
        ))}
      </div>

      {showInvite && <InviteModal onClose={() => setShowInvite(false)} onSaved={load} />}
    </div>
  );
}