import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import QuickActions from '../pages/QuickActions';

const PAGE_TITLES = {
  '/dashboard':       { title: 'Dashboard',             subtitle: 'Overview of your recruitment activity' },
  '/candidates':      { title: 'Candidates',            subtitle: 'Manage your talent pool' },
  '/pipeline':        { title: 'Recruitment Pipeline',  subtitle: 'Kanban view of candidate stages' },
  '/jobs':            { title: 'Jobs',                  subtitle: 'Open positions and job listings' },
  '/clients':         { title: 'Clients',               subtitle: 'Client companies and contacts' },
  '/interviews':      { title: 'Interviews',            subtitle: 'Schedule and track interviews' },
  '/resume-scanner':  { title: 'Resume Scanner',        subtitle: 'AI-powered ATS scoring & job matching' },
  '/users':           { title: 'User Management',       subtitle: 'Manage team members and roles' },
};

export default function Layout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const page = PAGE_TITLES[location.pathname] || { title: 'ATS Pro', subtitle: '' };

  return (
    <div className="app-layout">
      <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
      <div className="main-content">
        <header style={{
          height: 'var(--header-height)',
          background: 'var(--bg-surface)',
          borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center',
          padding: '0 32px', gap: 16,
          position: 'sticky', top: 0, zIndex: 50
        }}>
          {/* Mobile menu */}
          <button className="btn btn-ghost btn-icon" id="mobile-menu-btn" onClick={() => setMobileOpen(true)}>☰</button>

          {/* Page title */}
          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: 20, fontFamily: 'var(--font-display)', fontWeight: 700 }}>{page.title}</h1>
            {page.subtitle && <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 1 }}>{page.subtitle}</p>}
          </div>

          {/* Date */}
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            {new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
          </div>

          {/* Global Quick Actions + button */}
          <QuickActions />
        </header>

        <div className="page-content"><Outlet /></div>
      </div>

      <style>{`
        #mobile-menu-btn { display: none; }
        @media (max-width: 768px) {
          #mobile-menu-btn { display: flex !important; }
          .page-content { padding: 16px !important; }
        }
      `}</style>
    </div>
  );
}