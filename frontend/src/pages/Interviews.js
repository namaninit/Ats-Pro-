import React, { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { interviewAPI, candidateAPI, jobAPI, userAPI } from '../hooks/useApi';
import { format } from 'date-fns';
import { useAuth } from '../context/AuthContext';

function InterviewModal({ interview, candidates, jobs, users, onClose, onSave }) {
  const [form, setForm] = useState(interview || { candidateId: '', jobId: '', interviewerId: '', scheduledAt: '', mode: 'video', round: 1, status: 'scheduled', outcome: 'pending', notes: '', feedback: '' });
  const [saving, setSaving] = useState(false);
  const handle = (e) => setForm(p => ({ ...p, [e.target.name]: e.target.value }));
  const submit = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      if (interview?.id) await interviewAPI.update(interview.id, form); else await interviewAPI.create(form);
      toast.success(interview?.id ? 'Interview updated' : 'Interview scheduled'); onSave();
    } catch (err) { toast.error(err.response?.data?.message || 'Error'); } finally { setSaving(false); }
  };
  return (
    <div className="modal-overlay">
      <div className="modal modal-lg">
        <div className="modal-header"><h2 className="modal-title">{interview?.id ? '✏️ Edit Interview' : '📅 Schedule Interview'}</h2><button className="btn btn-ghost btn-icon" onClick={onClose}>✕</button></div>
        <form onSubmit={submit}>
          <div className="modal-body">
            <div className="form-row">
              <div className="form-group"><label className="form-label">Candidate *</label>
                <select className="form-input form-select" name="candidateId" value={form.candidateId} onChange={handle} required>
                  <option value="">-- Select Candidate --</option>
                  {candidates.map(c => <option key={c.id} value={c.id}>{c.name} ({c.email})</option>)}
                </select>
              </div>
              <div className="form-group"><label className="form-label">Job *</label>
                <select className="form-input form-select" name="jobId" value={form.jobId} onChange={handle} required>
                  <option value="">-- Select Job --</option>
                  {jobs.map(j => <option key={j.id} value={j.id}>{j.title} - {j.client?.companyName}</option>)}
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group"><label className="form-label">Date & Time *</label><input className="form-input" type="datetime-local" name="scheduledAt" value={form.scheduledAt} onChange={handle} required /></div>
              <div className="form-group"><label className="form-label">Interviewer</label>
                <select className="form-input form-select" name="interviewerId" value={form.interviewerId} onChange={handle}>
                  <option value="">-- Assign Interviewer --</option>
                  {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              </div>
            </div>
            <div className="form-row-3">
              <div className="form-group"><label className="form-label">Mode</label>
                <select className="form-input form-select" name="mode" value={form.mode} onChange={handle}>
                  <option value="video">Video</option><option value="in_person">In Person</option><option value="phone">Phone</option>
                </select>
              </div>
              <div className="form-group"><label className="form-label">Round</label><input className="form-input" type="number" min="1" name="round" value={form.round} onChange={handle} /></div>
              <div className="form-group"><label className="form-label">Status</label>
                <select className="form-input form-select" name="status" value={form.status} onChange={handle}>
                  <option value="scheduled">Scheduled</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option><option value="no_show">No Show</option>
                </select>
              </div>
            </div>
            {form.status === 'completed' && (
              <div className="form-group"><label className="form-label">Outcome</label>
                <select className="form-input form-select" name="outcome" value={form.outcome} onChange={handle}>
                  <option value="pending">Pending</option><option value="pass">Pass</option><option value="fail">Fail</option><option value="hold">Hold</option>
                </select>
              </div>
            )}
            <div className="form-group"><label className="form-label">Notes</label><textarea className="form-input" name="notes" value={form.notes} onChange={handle} rows={2} /></div>
            <div className="form-group"><label className="form-label">Feedback</label><textarea className="form-input" name="feedback" value={form.feedback} onChange={handle} rows={2} /></div>
          </div>
          <div className="modal-footer"><button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button><button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save Interview'}</button></div>
        </form>
      </div>
    </div>
  );
}

export default function Interviews() {
  const { user } = useAuth();
  const [interviews, setInterviews] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [filterStatus, setFilterStatus] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [ir, cr, jr] = await Promise.all([
        interviewAPI.getAll({ status: filterStatus }),
        candidateAPI.getAll({ limit: 500 }),
        jobAPI.getAll()
      ]);
      setInterviews(ir.data);
      setCandidates(cr.data.candidates);
      setJobs(jr.data);
      if (user?.role === 'super_admin') {
        const ur = await userAPI.getAll();
        setUsers(ur.data);
      }
    } catch { toast.error('Failed to load'); } finally { setLoading(false); }
  }, [filterStatus, user]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this interview?')) return;
    try { await interviewAPI.delete(id); toast.success('Deleted'); load(); } catch { toast.error('Delete failed'); }
  };

  const OUTCOME_COLORS = { pass: 'var(--green)', fail: 'var(--red)', hold: 'var(--amber)', pending: 'var(--text-muted)' };

  return (
    <div>
      <div className="page-header">
        <div><h2 className="page-title">Interviews</h2><p className="page-subtitle">{interviews.length} total</p></div>
        <button className="btn btn-primary" onClick={() => setModal({})}>📅 Schedule Interview</button>
      </div>
      <div className="search-bar">
        <select className="form-input form-select" style={{ width: 160 }} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="">All Status</option><option value="scheduled">Scheduled</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option>
        </select>
      </div>
      {loading ? <div className="loading"><div className="spinner" /></div> : interviews.length === 0 ? (
        <div className="empty-state"><div className="empty-state-icon">📅</div><h3>No interviews scheduled</h3></div>
      ) : (
        <div className="table-wrapper">
          <table className="table">
            <thead><tr><th>Candidate</th><th>Job / Client</th><th>Date & Time</th><th>Mode</th><th>Round</th><th>Interviewer</th><th>Status</th><th>Outcome</th><th>Actions</th></tr></thead>
            <tbody>
              {interviews.map(i => (
                <tr key={i.id}>
                  <td><div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><div className="avatar" style={{ width: 28, height: 28, fontSize: 11 }}>{i.candidate?.name?.[0]}</div><div style={{ fontWeight: 500 }}>{i.candidate?.name}</div></div></td>
                  <td><div style={{ fontWeight: 500, fontSize: 13 }}>{i.job?.title}</div><div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{i.job?.client?.companyName}</div></td>
                  <td>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{format(new Date(i.scheduledAt), 'dd MMM yyyy')}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{format(new Date(i.scheduledAt), 'h:mm a')}</div>
                  </td>
                  <td><span style={{ fontSize: 13 }}>{i.mode === 'video' ? '📹' : i.mode === 'phone' ? '📞' : '🏢'} {i.mode.replace('_', ' ')}</span></td>
                  <td><span style={{ background: 'var(--accent-dim)', color: 'var(--accent-light)', borderRadius: 20, padding: '2px 8px', fontSize: 12, fontWeight: 600 }}>R{i.round}</span></td>
                  <td>{i.interviewer?.name || <span style={{ color: 'var(--text-muted)' }}>—</span>}</td>
                  <td><span className={`badge badge-${i.status}`}>{i.status}</span></td>
                  <td><span style={{ fontSize: 12, fontWeight: 600, color: OUTCOME_COLORS[i.outcome] }}>{i.outcome}</span></td>
                  <td><div className="table-actions"><button className="btn btn-ghost btn-sm btn-icon" onClick={() => setModal(i)}>✏️</button><button className="btn btn-danger btn-sm btn-icon" onClick={() => handleDelete(i.id)}>🗑️</button></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {modal !== null && <InterviewModal interview={modal?.id ? modal : undefined} candidates={candidates} jobs={jobs} users={users} onClose={() => setModal(null)} onSave={() => { setModal(null); load(); }} />}
    </div>
  );
}
