import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Sidebar({ mobileOpen, onClose }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const role = user?.role;

  const handleLogout = () => { logout(); navigate('/login'); };

  // Nav items filtered by role
  const NAV = [
    { to: '/dashboard',      icon: '⬛', label: 'Dashboard',      roles: ['super_admin','recruiter','client'] },
    { to: '/candidates',     icon: '👤', label: 'Candidates',     roles: ['super_admin','recruiter'] },
    // { to: '/bulk-upload',    icon: '📄', label: 'Bulk Upload',    roles: ['super_admin','recruiter'] },
    { to: '/pipeline',       icon: '🔀', label: 'Pipeline',       roles: ['super_admin','recruiter'] },
    { to: '/jobs',           icon: '💼', label: 'Jobs',           roles: ['super_admin','recruiter','client'] },
    { to: '/job-boards',     icon: '🌐', label: 'Job Boards',     roles: ['super_admin','recruiter'] },
    { to: '/clients',        icon: '🏢', label: 'Clients',        roles: ['super_admin'] },
    { to: '/interviews',     icon: '📅', label: 'Interviews',     roles: ['super_admin','recruiter'] },
    // { to: '/resume-scanner', icon: '🎯', label: 'Resume Scanner', roles: ['super_admin','recruiter'] },
    { to: '/gmail-import',   icon: '📧', label: 'Gmail Import',   roles: ['super_admin'] },
  ].filter(item => item.roles.includes(role));

  const navStyle = (isActive) => ({
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '9px 12px', borderRadius: 8, marginBottom: 2,
    fontWeight: 500, fontSize: 14, transition: 'all 0.15s ease',
    background: isActive ? 'var(--accent-dim)' : 'transparent',
    color: isActive ? 'var(--accent-light)' : 'var(--text-secondary)',
    borderLeft: isActive ? '3px solid var(--accent)' : '3px solid transparent',
    textDecoration: 'none'
  });

  return (
    <>
      {mobileOpen && (
        <div onClick={onClose} style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.6)', zIndex: 99
        }} />
      )}
      <aside className={`sidebar${mobileOpen ? ' open' : ''}`} style={{
        position: 'fixed', left: 0, top: 0,
        width: 'var(--sidebar-width)', height: '100vh',
        background: 'var(--bg-surface)', borderRight: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column', zIndex: 100, overflowY: 'auto'
      }}>

        {/* Logo */}
        <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: 'var(--accent)', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              fontSize: 18, fontWeight: 800,
              fontFamily: 'var(--font-display)', color: '#fff'
            }}>A</div>
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 16, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>ATS Pro</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Applicant Tracker</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '12px 10px' }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase', padding: '8px 10px', marginBottom: 4 }}>
            Main
          </div>

          {NAV.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onClose}
              style={({ isActive }) => navStyle(isActive)}
            >
              <span style={{ fontSize: 16 }}>{item.icon}</span>
              {item.label}
            </NavLink>
          ))}

          {/* Admin section — super_admin only */}
          {role === 'super_admin' && (
            <>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase', padding: '16px 10px 4px' }}>
                Admin
              </div>
              <NavLink to="/users" onClick={onClose} style={({ isActive }) => navStyle(isActive)}>
                <span style={{ fontSize: 16 }}>👥</span> Users
              </NavLink>
            </>
          )}

          {/* Client section */}
          {role === 'client' && (
            <>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase', padding: '16px 10px 4px' }}>
                My Portal
              </div>
              <NavLink to="/dashboard" onClick={onClose} style={({ isActive }) => navStyle(isActive)}>
                <span style={{ fontSize: 16 }}>📊</span> Overview
              </NavLink>
            </>
          )}
        </nav>

        {/* User info + logout */}
        <div style={{ padding: '14px 16px', borderTop: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <div className="avatar">{user?.name?.[0]}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user?.name}
              </div>
              <span className={`badge badge-${user?.role}`} style={{ fontSize: 10, padding: '1px 6px' }}>
                {user?.role?.replace('_', ' ')}
              </span>
            </div>
          </div>
          <button
            className="btn btn-secondary"
            style={{ width: '100%', justifyContent: 'center', fontSize: 13 }}
            onClick={handleLogout}
          >
            🚪 Sign Out
          </button>
        </div>
      </aside>
    </>
  );
}