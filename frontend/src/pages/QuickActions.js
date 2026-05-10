import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const QUICK_ACTIONS = [
  { icon: '📄', label: 'Import Resume', path: '/resume-scanner' },
  { icon: '👤', label: 'Add Candidate', path: '/candidates', action: 'add' },
  { icon: '💼', label: 'Add Job', path: '/jobs', action: 'add' },
  { icon: '🏢', label: 'Add Client', path: '/clients', action: 'add' },
  { icon: '📅', label: 'Schedule Interview', path: '/interviews', action: 'add' },
  { icon: '🔀', label: 'View Pipeline', path: '/pipeline' },
];

export default function QuickActions() {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();

  // Close on outside click
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleAction = (item) => {
    setOpen(false);
    navigate(item.path);
    // Small delay taaki page load ho phir trigger ho
    if (item.action === 'add') {
      setTimeout(() => {
        // Custom event dispatch — har page sunega
        window.dispatchEvent(new CustomEvent('quickaction', { detail: { action: 'add', path: item.path } }));
      }, 300);
    }
  };

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: 42, height: 42, borderRadius: 10,
          background: open ? 'var(--accent-light)' : 'var(--accent)',
          border: 'none', cursor: 'pointer', fontSize: 24, color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 0.2s', boxShadow: open ? '0 4px 16px var(--accent-glow)' : 'none',
          transform: open ? 'rotate(45deg)' : 'none',
          fontFamily: 'var(--font-body)'
        }}
        title="Quick Actions"
      >
        +
      </button>

      {open && (
        <div style={{
          position: 'absolute', right: 0, top: '110%',
          background: 'var(--bg-surface)', border: '1px solid var(--border-light)',
          borderRadius: 14, zIndex: 999, width: 320,
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)', padding: 16,
          animation: 'fadeIn 0.15s ease'
        }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12, fontWeight: 600 }}>
            Quick Actions
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
            {QUICK_ACTIONS.map(item => (
              <button
                key={item.label}
                onClick={() => handleAction(item)}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                  gap: 6, padding: '14px 8px',
                  background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                  borderRadius: 10, cursor: 'pointer', fontSize: 11,
                  color: 'var(--text-primary)', fontFamily: 'var(--font-body)',
                  transition: 'all 0.15s', fontWeight: 500
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = 'var(--accent)';
                  e.currentTarget.style.background = 'var(--accent-dim)';
                  e.currentTarget.style.color = 'var(--accent-light)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = 'var(--border)';
                  e.currentTarget.style.background = 'var(--bg-elevated)';
                  e.currentTarget.style.color = 'var(--text-primary)';
                }}
              >
                <span style={{ fontSize: 22 }}>{item.icon}</span>
                {item.label}
              </button>
            ))}
          </div>

          {/* Keyboard shortcut hint */}
          <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border)', fontSize: 11, color: 'var(--text-muted)', textAlign: 'center' }}>
            Press <kbd style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 4, padding: '1px 6px', fontSize: 11 }}>Ctrl+K</kbd> for quick navigation
          </div>
        </div>
      )}

      <style>{`@keyframes fadeIn { from { opacity:0; transform:translateY(-6px); } to { opacity:1; transform:none; } }`}</style>
    </div>
  );
}