import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const FREE_BOARDS = [
  {
    key: 'jooble',
    name: 'Jooble',
    logo: '🐟',
    color: '#0072ce',
    description: 'International job aggregator, 250M+ candidates across 67 countries.',
    howItWorks: 'Jooble crawls your feed automatically once submitted. No manual reposting needed.',
    submitUrl: 'https://jooble.org/partners/xml',
  },
  {
    key: 'talent',
    name: 'Talent.com',
    logo: '🎯',
    color: '#e91e63',
    description: 'One of the largest job search engines, aggregates from feeds worldwide.',
    howItWorks: 'Submit your feed once — Talent.com re-crawls it automatically to stay updated.',
    submitUrl: 'https://www.talent.com/publishers',
  },
  {
    key: 'careerjet',
    name: 'CareerJet',
    logo: '✈️',
    color: '#ff6d00',
    description: 'Global job search engine active in 90+ countries.',
    howItWorks: 'CareerJet accepts XML feeds directly — free, automatic re-crawling.',
    submitUrl: 'https://www.careerjet.com/partners/',
  },
  {
    key: 'jobsora',
    name: 'Jobsora',
    logo: '🔍',
    color: '#1a1a2e',
    description: 'Job aggregator covering 60+ countries with growing reach in India.',
    howItWorks: 'Feed-based, free, auto-refreshing listings once approved.',
    submitUrl: 'https://www.jobsora.com/info/partners',
  },
];

export default function JobBoards() {
  const { user } = useAuth();
  const [enabled, setEnabled] = useState({});
  const companyId = user?.companyId;

  useEffect(() => {
    const saved = localStorage.getItem('enabled_job_boards');
    if (saved) setEnabled(JSON.parse(saved));
  }, []);

  const feedUrl = companyId
    ? `${window.location.origin.replace('3000', '5000')}/api/public/careers/${companyId}/feed.xml`
    : '';

  const toggle = (key) => {
    const next = { ...enabled, [key]: !enabled[key] };
    setEnabled(next);
    localStorage.setItem('enabled_job_boards', JSON.stringify(next));
  };

  const copyFeedUrl = () => {
    navigator.clipboard.writeText(feedUrl);
    toast.success('Feed URL copied! Paste it when submitting to a job board.');
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-title">Job Boards</h2>
          <p className="page-subtitle">Activate free job boards to promote your open jobs automatically</p>
        </div>
      </div>

      {/* Your feed URL */}
      <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-light)', borderRadius: 12, padding: 20, marginBottom: 24 }}>
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, color: 'var(--text-secondary)' }}>Your Job Feed URL</div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input readOnly value={feedUrl} className="form-input" style={{ flex: 1, fontSize: 12, fontFamily: 'monospace' }} />
          <button className="btn btn-primary btn-sm" onClick={copyFeedUrl}>📋 Copy</button>
        </div>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>
          This feed updates automatically as you post, edit, or close jobs — no manual re-submission needed once a board accepts it.
        </p>
      </div>

      {/* Job board cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
        {FREE_BOARDS.map(board => (
          <div key={board.key} className="card" style={{ padding: 20, position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ fontSize: 28 }}>{board.logo}</div>
                <div style={{ fontWeight: 700, fontSize: 16, color: board.color }}>{board.name}</div>
              </div>
              <label style={{ position: 'relative', display: 'inline-block', width: 44, height: 24, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={!!enabled[board.key]}
                  onChange={() => toggle(board.key)}
                  style={{ opacity: 0, width: 0, height: 0 }}
                />
                <span style={{
                  position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                  background: enabled[board.key] ? '#22c55e' : 'var(--border)',
                  borderRadius: 24, transition: 'background 0.2s'
                }}>
                  <span style={{
                    position: 'absolute', top: 3, left: enabled[board.key] ? 23 : 3,
                    width: 18, height: 18, background: '#fff', borderRadius: '50%', transition: 'left 0.2s'
                  }} />
                </span>
              </label>
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 8, lineHeight: 1.5 }}>{board.description}</p>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 14, lineHeight: 1.5 }}>{board.howItWorks}</p>
            {enabled[board.key] && (
              <a href={board.submitUrl} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm" style={{ width: '100%', justifyContent: 'center', textDecoration: 'none' }}>
                Submit Feed to {board.name} →
              </a>
            )}
          </div>
        ))}
      </div>

      {/* Note about paid-only boards */}
      <div style={{ marginTop: 28, background: 'var(--bg-elevated)', border: '1px solid var(--border-light)', borderRadius: 12, padding: 20 }}>
        <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 6 }}>ℹ️ About LinkedIn, Naukri & FreshersWorld</div>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          These platforms don't offer free automatic posting for any business — job boards require manual posting through their own site, or a paid plan for API access. Use the "Copy for Platform" buttons on each job in your Jobs list to quickly format and paste your listing into these sites.
        </p>
      </div>
    </div>
  );
}