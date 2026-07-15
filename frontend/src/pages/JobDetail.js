import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { jobAPI, candidateAPI, interviewAPI } from '../hooks/useApi';
import JobBoardPanel from '../components/JobBoardPanel';

const STATUS_COLORS = {
  open: { bg: '#fef9c3', color: '#854d0e', border: '#fde047' },
  closed: { bg: '#fee2e2', color: '#991b1b', border: '#fca5a5' },
  on_hold: { bg: '#fff7ed', color: '#9a3412', border: '#fdba74' },
  filled: { bg: '#dcfce7', color: '#166534', border: '#86efac' },
};

export default function JobDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [interviews, setInterviews] = useState([]);
  const [tab, setTab] = useState('description');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      jobAPI.getOne(id),
      candidateAPI.getAll({ jobId: id }),
      interviewAPI.getAll({ jobId: id })
    ]).then(([jr, cr, ir]) => {
      setJob(jr.data);
      setCandidates(cr.data.candidates || cr.data || []);
      setInterviews(ir.data || []);
    }).catch(() => toast.error('Failed to load job'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="loading"><div className="spinner" /></div>;
  if (!job) return <div className="empty-state"><h3>Job not found</h3></div>;

  const sc = STATUS_COLORS[job.status] || STATUS_COLORS.open;

  return (
    <div>
      <button className="btn btn-ghost btn-sm" onClick={() => navigate('/jobs')} style={{ marginBottom: 12 }}>← Back to Jobs</button>

      {/* Header card */}
      <div className="card" style={{ padding: 24, marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <h2 style={{ margin: 0 }}>{job.title}</h2>
              <span style={{ background: sc.bg, color: sc.color, border: `1px solid ${sc.border}`, borderRadius: 6, padding: '3px 10px', fontSize: 12, fontWeight: 600 }}>
                {job.status.replace('_', ' ')}
              </span>
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              #{job.id} · 📍 {job.location || 'Remote'} · 🏢 {job.client?.companyName || '—'} · 👥 {job.openings} openings
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Salary</div>
            <div style={{ fontWeight: 700, fontSize: 16 }}>{job.minSalary ? `₹${job.minSalary}–${job.maxSalary}L` : 'N/A'}</div>
          </div>
        </div>
        <div style={{ marginTop: 14 }}>
          <JobBoardPanel job={job} />
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, borderBottom: '1px solid var(--border)', marginBottom: 20 }}>
        {[
          { key: 'description', label: '📄 Description' },
          { key: 'candidates', label: `👤 Candidates (${candidates.length})` },
          { key: 'interviews', label: `📅 Interviews (${interviews.length})` },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            padding: '10px 16px', border: 'none', background: 'none', cursor: 'pointer',
            fontSize: 13, fontWeight: 600, color: tab === t.key ? 'var(--accent-light)' : 'var(--text-muted)',
            borderBottom: tab === t.key ? '2px solid var(--accent)' : '2px solid transparent'
          }}>{t.label}</button>
        ))}
      </div>

      {tab === 'description' && (
        <div className="card" style={{ padding: 24 }}>
          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', marginBottom: 20, fontSize: 13 }}>
            <div><strong>Experience:</strong> {job.minExperience || 0}–{job.maxExperience || job.minExperience || 0} yrs</div>
            <div><strong>Job Type:</strong> {(job.jobType || '').replace('_', ' ')}</div>
            <div><strong>Deadline:</strong> {job.deadline || 'Not set'}</div>
          </div>
          {job.requiredSkills?.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6 }}>SKILLS</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {job.requiredSkills.map(s => (
                  <span key={s} style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-light)', borderRadius: 6, padding: '3px 10px', fontSize: 12 }}>{s}</span>
                ))}
              </div>
            </div>
          )}
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 8 }}>JOB DESCRIPTION</div>
          <div style={{ whiteSpace: 'pre-line', fontSize: 14, lineHeight: 1.7 }}>{job.description || 'No description provided.'}</div>
        </div>
      )}

      {tab === 'candidates' && (
        <div className="card" style={{ padding: 0 }}>
          {candidates.length === 0 ? (
            <div className="empty-state"><div className="empty-state-icon">👤</div><h3>No candidates yet</h3></div>
          ) : (
            <table className="table">
              <thead><tr><th>Name</th><th>Email</th><th>Status</th></tr></thead>
              <tbody>
                {candidates.map(c => (
                  <tr key={c.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/candidates/${c.id}`)}>
                    <td>{c.name}</td>
                    <td>{c.email}</td>
                    <td><span className={`badge badge-${c.status}`}>{c.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {tab === 'interviews' && (
        <div className="card" style={{ padding: 0 }}>
          {interviews.length === 0 ? (
            <div className="empty-state"><div className="empty-state-icon">📅</div><h3>No interviews scheduled</h3></div>
          ) : (
            <table className="table">
              <thead><tr><th>Candidate</th><th>Date</th><th>Status</th></tr></thead>
              <tbody>
                {interviews.map(i => (
                  <tr key={i.id}>
                    <td>{i.candidate?.name}</td>
                    <td>{new Date(i.scheduledAt).toLocaleString()}</td>
                    <td><span className={`badge badge-${i.status}`}>{i.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}