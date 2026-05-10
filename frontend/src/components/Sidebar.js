import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const NAV = [
  { to: '/dashboard', icon: '⬛', label: 'Dashboard' },
  { to: '/candidates', icon: '👤', label: 'Candidates' },
  { to: '/pipeline', icon: '🔀', label: 'Pipeline' },
  { to: '/jobs', icon: '💼', label: 'Jobs' },
  { to: '/clients', icon: '🏢', label: 'Clients' },
  { to: '/interviews', icon: '📅', label: 'Interviews' },
  { to: '/resume-scanner', icon: '🎯', label: 'Resume Scanner' },
  { to: '/gmail-import', icon: '📧', label: 'Gmail Import' },
];

export default function Sidebar({ mobileOpen, onClose }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <>
      {mobileOpen && <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 99 }} />}
      <aside className={`sidebar${mobileOpen ? ' open' : ''}`} style={{
        position: 'fixed', left: 0, top: 0, width: 'var(--sidebar-width)', height: '100vh',
        background: 'var(--bg-surface)', borderRight: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column', zIndex: 100, overflowY: 'auto'
      }}>
        {/* Logo */}
        <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 800, fontFamily: 'var(--font-display)', color: '#fff' }}>A</div>
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 16, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>ATS Pro</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Applicant Tracker</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '12px 10px' }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase', padding: '8px 10px', marginBottom: 4 }}>Main</div>
          {NAV.map(item => (
            <NavLink key={item.to} to={item.to} onClick={onClose}
              style={({ isActive }) => ({
                display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 8,
                marginBottom: 2, fontWeight: 500, fontSize: 14, transition: 'all 0.15s ease',
                background: isActive ? 'var(--accent-dim)' : 'transparent',
                color: isActive ? 'var(--accent-light)' : 'var(--text-secondary)',
                borderLeft: isActive ? '3px solid var(--accent)' : '3px solid transparent'
              })}>
              <span style={{ fontSize: 16 }}>{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
          {user?.role === 'super_admin' && (
            <>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase', padding: '16px 10px 4px' }}>Admin</div>
              <NavLink to="/users" onClick={onClose}
                style={({ isActive }) => ({
                  display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 8,
                  marginBottom: 2, fontWeight: 500, fontSize: 14, transition: 'all 0.15s ease',
                  background: isActive ? 'var(--accent-dim)' : 'transparent',
                  color: isActive ? 'var(--accent-light)' : 'var(--text-secondary)',
                  borderLeft: isActive ? '3px solid var(--accent)' : '3px solid transparent'
                })}>
                <span style={{ fontSize: 16 }}>👥</span> Users
              </NavLink>
            </>
          )}
        </nav>

        {/* User */}
        <div style={{ padding: '14px 16px', borderTop: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <div className="avatar">{user?.name?.[0]}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name}</div>
              <span className={`badge badge-${user?.role}`} style={{ fontSize: 10, padding: '1px 6px' }}>{user?.role?.replace('_', ' ')}</span>
            </div>
          </div>
          <button className="btn btn-secondary" style={{ width: '100%', justifyContent: 'center', fontSize: 13 }} onClick={handleLogout}>
            🚪 Sign Out
          </button>
        </div>
      </aside>
    </>
  );
}
