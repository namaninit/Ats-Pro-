import React, { useEffect, useState } from 'react';
import { Bar, Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend } from 'chart.js';
import { dashboardAPI } from '../hooks/useApi';
import { format } from 'date-fns';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend);

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const STATUS_COLORS = { new: '#3b82f6', screening: '#f59e0b', interview: '#8b5cf6', offered: '#34d399', hired: '#10b981', rejected: '#ef4444' };

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardAPI.getStats().then(r => { setData(r.data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading"><div className="spinner" /></div>;
  if (!data) return <p style={{ color: 'var(--text-muted)' }}>Could not load dashboard.</p>;

  const { stats, candidatesByStatus, jobsByStatus, monthlyHired, recentCandidates, upcomingInterviews } = data;

  const statusLabels = candidatesByStatus.map(s => s.status);
  const statusCounts = candidatesByStatus.map(s => parseInt(s.count));

  const barData = {
    labels: monthlyHired.map(m => MONTHS[m.month - 1]),
    datasets: [{ label: 'Hired', data: monthlyHired.map(m => parseInt(m.count)), backgroundColor: 'rgba(99,102,241,0.7)', borderRadius: 6, hoverBackgroundColor: '#6366f1' }]
  };
  const barOpts = {
    responsive: true, plugins: { legend: { display: false } },
    scales: {
      x: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#94a3b8' } },
      y: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#94a3b8', stepSize: 1 } }
    }
  };

  const doughnutData = {
    labels: statusLabels,
    datasets: [{ data: statusCounts, backgroundColor: statusLabels.map(s => STATUS_COLORS[s] || '#6366f1'), borderWidth: 0, spacing: 3 }]
  };
  const doughnutOpts = { responsive: true, cutout: '70%', plugins: { legend: { position: 'bottom', labels: { color: '#94a3b8', padding: 12, font: { size: 12 } } } } };

  return (
    <div>
      {/* Stats */}
      <div className="stats-grid">
        {[
          { icon: '👤', label: 'Total Candidates', value: stats.totalCandidates, color: 'var(--blue-dim)', textColor: 'var(--blue)' },
          { icon: '💼', label: 'Open Jobs', value: stats.totalJobs, color: 'var(--accent-dim)', textColor: 'var(--accent-light)' },
          { icon: '🏢', label: 'Active Clients', value: stats.totalClients, color: 'var(--green-dim)', textColor: 'var(--green)' },
          { icon: '📅', label: 'Upcoming Interviews', value: stats.totalInterviews, color: 'var(--amber-dim)', textColor: 'var(--amber)' },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <div className="stat-icon" style={{ background: s.color }}><span>{s.icon}</span></div>
            <div>
              <div className="stat-label">{s.label}</div>
              <div className="stat-value" style={{ color: s.textColor }}>{s.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20, marginBottom: 24 }}>
        <div className="card">
          <h3 style={{ marginBottom: 20, fontSize: 15 }}>Monthly Hires (Last 6 Months)</h3>
          <Bar data={barData} options={barOpts} />
        </div>
        <div className="card">
          <h3 style={{ marginBottom: 20, fontSize: 15 }}>Candidates by Status</h3>
          {statusCounts.length > 0 ? <Doughnut data={doughnutData} options={doughnutOpts} /> : <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 40 }}>No data yet</p>}
        </div>
      </div>

      {/* Bottom row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Recent Candidates */}
        <div className="card">
          <h3 style={{ marginBottom: 16, fontSize: 15 }}>Recent Candidates</h3>
          {recentCandidates.length === 0 ? <p style={{ color: 'var(--text-muted)' }}>No candidates yet</p> : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {recentCandidates.map(c => (
                <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div className="avatar">{c.name[0]}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{c.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{c.email}</div>
                  </div>
                  <span className={`badge badge-${c.status}`}>{c.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming Interviews */}
        <div className="card">
          <h3 style={{ marginBottom: 16, fontSize: 15 }}>Upcoming Interviews</h3>
          {upcomingInterviews.length === 0 ? <p style={{ color: 'var(--text-muted)' }}>No interviews scheduled</p> : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {upcomingInterviews.map(i => (
                <div key={i.id} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 10, background: 'var(--accent-dim)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span style={{ fontSize: 16, fontWeight: 800, fontFamily: 'var(--font-display)', color: 'var(--accent-light)', lineHeight: 1 }}>{format(new Date(i.scheduledAt), 'd')}</span>
                    <span style={{ fontSize: 9, color: 'var(--accent)', textTransform: 'uppercase' }}>{format(new Date(i.scheduledAt), 'MMM')}</span>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{i.candidate?.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{i.job?.title} · {format(new Date(i.scheduledAt), 'h:mm a')}</div>
                  </div>
                  <span className={`badge badge-${i.mode}`} style={{ fontSize: 11 }}>{i.mode}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <style>{`
        @media (max-width: 1024px) {
          .charts-row { grid-template-columns: 1fr !important; }
          .bottom-row { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
