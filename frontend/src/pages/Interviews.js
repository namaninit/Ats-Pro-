import React, { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { interviewAPI, candidateAPI, jobAPI, userAPI } from '../hooks/useApi';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns';
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

const STATUS_DOT = {
  scheduled: '#6366f1',
  completed: '#10b981',
  cancelled: '#ef4444',
  no_show: '#f59e0b',
};

function CalendarView({ interviews, onSelectInterview, onAddOnDay }) {
  const [cursor, setCursor] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(null);

  const monthStart = startOfMonth(cursor);
  const monthEnd = endOfMonth(cursor);
  const gridStart = startOfWeek(monthStart);
  const gridEnd = endOfWeek(monthEnd);

  const days = [];
  let day = gridStart;
  while (day <= gridEnd) { days.push(day); day = addDays(day, 1); }

  const interviewsByDay = {};
  interviews.forEach(i => {
    const key = format(new Date(i.scheduledAt), 'yyyy-MM-dd');
    if (!interviewsByDay[key]) interviewsByDay[key] = [];
    interviewsByDay[key].push(i);
  });

  const selectedKey = selectedDay ? format(selectedDay, 'yyyy-MM-dd') : null;
  const selectedInterviews = selectedKey ? (interviewsByDay[selectedKey] || []) : [];

  return (
    <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start', flexWrap: 'wrap' }}>
      {/* Calendar grid */}
      <div style={{ flex: 2, minWidth: 420 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <button className="btn btn-secondary btn-sm" onClick={() => setCursor(subMonths(cursor, 1))}>‹</button>
          <div style={{ fontWeight: 700, fontSize: 16 }}>{format(cursor, 'MMMM yyyy')}</div>
          <button className="btn btn-secondary btn-sm" onClick={() => setCursor(addMonths(cursor, 1))}>›</button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 6 }}>
          {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => (
            <div key={d} style={{ textAlign: 'center', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', padding: '4px 0' }}>{d}</div>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
          {days.map(d => {
            const key = format(d, 'yyyy-MM-dd');
            const dayInterviews = interviewsByDay[key] || [];
            const inMonth = isSameMonth(d, cursor);
            const isToday = isSameDay(d, new Date());
            const isSelected = selectedDay && isSameDay(d, selectedDay);
            return (
              <div
                key={key}
                onClick={() => setSelectedDay(d)}
                style={{
                  minHeight: 70, borderRadius: 8, padding: 6, cursor: 'pointer',
                  background: isSelected ? 'var(--accent-dim)' : 'var(--bg-elevated)',
                  border: isToday ? '1px solid var(--accent)' : '1px solid transparent',
                  opacity: inMonth ? 1 : 0.35,
                  transition: 'background 0.15s'
                }}
              >
                <div style={{ fontSize: 12, fontWeight: isToday ? 700 : 500, color: isToday ? 'var(--accent-light)' : 'var(--text-secondary)', marginBottom: 4 }}>
                  {format(d, 'd')}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                  {dayInterviews.slice(0, 4).map(iv => (
                    <span key={iv.id} title={iv.candidate?.name} style={{ width: 6, height: 6, borderRadius: '50%', background: STATUS_DOT[iv.status] || '#999', display: 'inline-block' }} />
                  ))}
                  {dayInterviews.length > 4 && <span style={{ fontSize: 9, color: 'var(--text-muted)' }}>+{dayInterviews.length - 4}</span>}
                </div>
              </div>
            );
          })}
        </div>
        {/* Legend */}
        <div style={{ display: 'flex', gap: 14, marginTop: 14, fontSize: 11, color: 'var(--text-muted)' }}>
          {Object.entries(STATUS_DOT).map(([status, color]) => (
            <div key={status} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, display: 'inline-block' }} />
              {status.replace('_', ' ')}
            </div>
          ))}
        </div>
      </div>

      {/* Day detail panel */}
      <div style={{ flex: 1, minWidth: 280 }}>
        <div className="card" style={{ padding: 16 }}>
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12 }}>
            {selectedDay ? format(selectedDay, 'EEEE, MMM d, yyyy') : 'Select a day'}
          </div>
          {!selectedDay ? (
            <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Click a date on the calendar to see interviews.</p>
          ) : selectedInterviews.length === 0 ? (
            <>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12 }}>No interviews scheduled.</p>
              <button className="btn btn-secondary btn-sm" onClick={() => onAddOnDay(selectedDay)}>+ Schedule Interview</button>
            </>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {selectedInterviews.map(iv => (
                <div key={iv.id} onClick={() => onSelectInterview(iv)} style={{
                  padding: '10px 12px', borderRadius: 8, background: 'var(--bg-elevated)',
                  border: '1px solid var(--border-light)', cursor: 'pointer'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{iv.candidate?.name}</div>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: STATUS_DOT[iv.status] }} />
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{iv.job?.title}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                    {format(new Date(iv.scheduledAt), 'h:mm a')} · {iv.mode === 'video' ? '📹' : iv.mode === 'phone' ? '📞' : '🏢'} R{iv.round}
                  </div>
                </div>
              ))}
              <button className="btn btn-secondary btn-sm" style={{ marginTop: 4 }} onClick={() => onAddOnDay(selectedDay)}>+ Schedule Another</button>
            </div>
          )}
        </div>
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
  const [viewMode, setViewMode] = useState('list');

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

  const openOnDay = (day) => {
    const iso = new Date(day.getTime() - day.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    setModal({ scheduledAt: iso });
  };

  const OUTCOME_COLORS = { pass: 'var(--green)', fail: 'var(--red)', hold: 'var(--amber)', pending: 'var(--text-muted)' };

  return (
    <div>
      <div className="page-header">
        <div><h2 className="page-title">Interviews</h2><p className="page-subtitle">{interviews.length} total</p></div>
        <button className="btn btn-primary" onClick={() => setModal({})}>📅 Schedule Interview</button>
      </div>

      <div className="search-bar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
        <select className="form-input form-select" style={{ width: 160 }} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="">All Status</option><option value="scheduled">Scheduled</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option>
        </select>
        <div style={{ display: 'flex', background: 'var(--bg-elevated)', borderRadius: 8, padding: 3, gap: 2 }}>
          <button onClick={() => setViewMode('list')} style={{ padding: '6px 14px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500, background: viewMode === 'list' ? 'var(--accent)' : 'transparent', color: viewMode === 'list' ? '#fff' : 'var(--text-secondary)' }}>☰ List</button>
          <button onClick={() => setViewMode('calendar')} style={{ padding: '6px 14px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500, background: viewMode === 'calendar' ? 'var(--accent)' : 'transparent', color: viewMode === 'calendar' ? '#fff' : 'var(--text-secondary)' }}>📅 Calendar</button>
        </div>
      </div>

      {loading ? <div className="loading"><div className="spinner" /></div> : interviews.length === 0 ? (
        <div className="empty-state"><div className="empty-state-icon">📅</div><h3>No interviews scheduled</h3></div>
      ) : viewMode === 'calendar' ? (
        <CalendarView interviews={interviews} onSelectInterview={setModal} onAddOnDay={openOnDay} />
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