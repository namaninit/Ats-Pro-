import React, { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { jobAPI, clientAPI, jobTemplateAPI } from '../hooks/useApi';
import JobBoardPanel from '../components/JobBoardPanel';

const JOB_STATUSES = ['open', 'closed', 'on_hold', 'filled'];
const JOB_TYPES = ['full_time', 'part_time', 'contract', 'remote'];

const STATUS_COLORS = {
  open: { bg: '#fef9c3', color: '#854d0e', border: '#fde047' },
  closed: { bg: '#fee2e2', color: '#991b1b', border: '#fca5a5' },
  on_hold: { bg: '#fff7ed', color: '#9a3412', border: '#fdba74' },
  filled: { bg: '#dcfce7', color: '#166534', border: '#86efac' },
};

const DEFAULT_TEMPLATES = [
  {
    id: 'default-swe',
    title: 'Software Engineer',
    description: `About the Role
We are looking for a talented Software Engineer to join our team and help design, develop, and maintain high-quality software solutions.

Key Responsibilities
- Design, develop, test, and maintain software applications.
- Write clean, efficient, and well-documented code.
- Collaborate with product managers, designers, and other engineers to define and implement new features.
- Review code and provide constructive feedback to team members.
- Troubleshoot, debug, and resolve software issues.
- Optimize applications for performance, scalability, and reliability.
- Participate in Agile ceremonies, including sprint planning, daily stand-ups, and retrospectives.

Required Qualifications
- Bachelor's degree in Computer Science, Software Engineering, or related field (or equivalent experience).
- Strong proficiency in one or more programming languages such as Java, Python, C#, JavaScript, Go, or C++.
- Experience with Git and version control workflows.
- Knowledge of databases (SQL and/or NoSQL).
- Strong analytical, problem-solving, and communication skills.

Preferred Qualifications
- Experience with cloud platforms (AWS, Azure, or Google Cloud).
- Familiarity with Docker, Kubernetes, or containerization technologies.
- Experience with RESTful APIs, GraphQL, or microservices.
- Knowledge of CI/CD pipelines and DevOps practices.

What We Offer
- Competitive salary and performance bonuses
- Health and wellness benefits
- Flexible work arrangements
- Professional development opportunities`
  }
];

function JobModal({ job, clients, onClose, onSave }) {
  const [form, setForm] = useState(job || {
    title: '', clientId: '', description: '', requiredSkills: '',
    minExperience: '', maxExperience: '', minSalary: '', maxSalary: '',
    location: '', jobType: 'full_time', status: 'open', openings: 1, deadline: ''
  });
  const [saving, setSaving] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [savingTemplate, setSavingTemplate] = useState(false);
  const handle = (e) => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  useEffect(() => {
    jobTemplateAPI.getAll()
      .then(res => setTemplates(res.data || []))
      .catch(() => setTemplates([]));
  }, []);

  const allTemplates = [...DEFAULT_TEMPLATES, ...templates];

  const applyTemplate = (id) => {
    setSelectedTemplateId(id);
    if (!id) return;
    const t = allTemplates.find(t => String(t.id) === String(id));
    if (t) setForm(p => ({ ...p, description: t.description }));
  };

  const saveAsTemplate = async () => {
    if (!form.description?.trim()) { toast.error('Description is empty'); return; }
    const title = window.prompt('Name this template (e.g. "Software Engineer"):', form.title || 'Untitled Template');
    if (!title) return;
    setSavingTemplate(true);
    try {
      await jobTemplateAPI.create({ title, description: form.description });
      toast.success('Template saved!');
      const res = await jobTemplateAPI.getAll();
      setTemplates(res.data || []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save template');
    } finally { setSavingTemplate(false); }
  };

  const submit = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      const data = { ...form };
      if (typeof data.requiredSkills === 'string')
        data.requiredSkills = data.requiredSkills.split(',').map(s => s.trim()).filter(Boolean);
      if (job?.id) await jobAPI.update(job.id, data);
      else await jobAPI.create(data);
      toast.success(job?.id ? 'Job updated!' : 'Job posted!');
      onSave();
    } catch (err) { toast.error(err.response?.data?.message || 'Error'); }
    finally { setSaving(false); }
  };

  return (
    <div className="modal-overlay">
      <div className="modal modal-lg">
        <div className="modal-header">
          <div className="modal-title">{job?.id ? '✏️ Edit Job' : '💼 Post New Job'}</div>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={submit}>
          <div className="modal-body">
            <div className="form-row">
              <div className="form-group"><label className="form-label">Job Title *</label><input className="form-input" name="title" value={form.title} onChange={handle} required autoFocus /></div>
              <div className="form-group"><label className="form-label">Client *</label>
                <select className="form-input form-select" name="clientId" value={form.clientId} onChange={handle} required>
                  <option value="">-- Select Client --</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.companyName}</option>)}
                </select>
              </div>
            </div>
            <div className="form-group"><label className="form-label">Required Skills (comma separated)</label>
              <input className="form-input" name="requiredSkills" value={Array.isArray(form.requiredSkills) ? form.requiredSkills.join(', ') : form.requiredSkills} onChange={handle} placeholder="React, Node.js, MySQL..." />
            </div>
            <div className="form-row-3">
              <div className="form-group"><label className="form-label">Min Exp (yrs)</label><input className="form-input" type="number" step="0.5" name="minExperience" value={form.minExperience} onChange={handle} /></div>
              <div className="form-group"><label className="form-label">Max Exp (yrs)</label><input className="form-input" type="number" step="0.5" name="maxExperience" value={form.maxExperience} onChange={handle} /></div>
              <div className="form-group"><label className="form-label">Openings</label><input className="form-input" type="number" name="openings" value={form.openings} onChange={handle} /></div>
            </div>
            <div className="form-row">
              <div className="form-group"><label className="form-label">Min Salary (LPA)</label><input className="form-input" type="number" step="0.5" name="minSalary" value={form.minSalary} onChange={handle} /></div>
              <div className="form-group"><label className="form-label">Max Salary (LPA)</label><input className="form-input" type="number" step="0.5" name="maxSalary" value={form.maxSalary} onChange={handle} /></div>
            </div>
            <div className="form-row">
              <div className="form-group"><label className="form-label">Location</label><input className="form-input" name="location" value={form.location} onChange={handle} /></div>
              <div className="form-group"><label className="form-label">Job Type</label>
                <select className="form-input form-select" name="jobType" value={form.jobType} onChange={handle}>
                  {JOB_TYPES.map(t => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group"><label className="form-label">Status</label>
                <select className="form-input form-select" name="status" value={form.status} onChange={handle}>
                  {JOB_STATUSES.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                </select>
              </div>
              <div className="form-group"><label className="form-label">Deadline</label><input className="form-input" type="date" name="deadline" value={form.deadline || ''} onChange={handle} /></div>
            </div>

            <div className="form-group">
              <label className="form-label">Description</label>
              <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                <select
                  className="form-input form-select"
                  style={{ flex: 1 }}
                  value={selectedTemplateId}
                  onChange={e => applyTemplate(e.target.value)}
                >
                  <option value="">-- Insert Template --</option>
                  {allTemplates.map(t => (
                    <option key={t.id} value={t.id}>{t.title}</option>
                  ))}
                </select>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={saveAsTemplate}
                  disabled={savingTemplate}
                >
                  {savingTemplate ? 'Saving...' : '💾 Save as Template'}
                </button>
              </div>
              <textarea className="form-input" name="description" value={form.description} onChange={handle} rows={8} />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save Job'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function JobRow({ j, selected, onSelect, onEdit, onDelete, onCloseJob }) {
  const [showMenu, setShowMenu] = useState(false);
  const sc = STATUS_COLORS[j.status] || STATUS_COLORS.open;
  const candidates = j.candidates || [];
  const hired = candidates.filter(c => c.status === 'hired').length;
  const rejected = candidates.filter(c => c.status === 'rejected').length;
  const active = candidates.filter(c => ['new','screening','interview','offered'].includes(c.status)).length;
  const completion = candidates.length > 0 ? Math.round((hired / j.openings) * 100) : 0;

  return (
    <tr style={{ background: selected ? 'var(--accent-dim)' : undefined }}>
      <td><input type="checkbox" checked={selected} onChange={() => onSelect(j.id)} style={{ width: 16, height: 16, accentColor: 'var(--accent)', cursor: 'pointer' }} /></td>
      <td style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>#{j.id}</td>
      <td>
        <div style={{ fontWeight: 600, fontSize: 13 }}>{j.title}</div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>📍 {j.location || '—'}</div>
        <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
          {/* JD Button */}
          <span title="Job Description" style={{ background: '#dbeafe', color: '#1e40af', borderRadius: 4, padding: '1px 6px', fontSize: 10, fontWeight: 700, cursor: 'pointer' }}>JD</span>
          {/* ATS Button */}
          <span title="ATS Score" style={{ background: '#ede9fe', color: '#5b21b6', borderRadius: 4, padding: '1px 6px', fontSize: 10, fontWeight: 700, cursor: 'pointer' }}>ATS</span>
          {/* Pipeline */}
          <span title="Pipeline" style={{ display: 'flex', gap: 2 }}>
            {['#3b82f6','#f59e0b','#10b981'].map((c,i) => <span key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: c, display: 'inline-block' }} />)}
          </span>
        </div>
        <JobBoardPanel job={j} />
      </td>
      <td>
        <span style={{ background: sc.bg, color: sc.color, border: `1px solid ${sc.border}`, borderRadius: 6, padding: '4px 12px', fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap' }}>
          {j.status.replace('_', ' ').charAt(0).toUpperCase() + j.status.replace('_', ' ').slice(1)}
        </span>
      </td>
      <td style={{ fontSize: 13 }}>{j.client?.contactPerson || '—'}</td>
      <td>
        <div style={{ fontWeight: 500, fontSize: 13 }}>{j.client?.companyName || '—'}</div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{j.client?.industry || ''}</div>
      </td>
      <td style={{ fontSize: 13 }}>{j.location || '—'}</td>
      <td style={{ textAlign: 'center', fontSize: 13, fontWeight: 600, color: 'var(--blue)' }}>0</td>
      <td style={{ textAlign: 'center', fontSize: 13, fontWeight: 600, color: 'var(--green)' }}>{active}</td>
      <td style={{ textAlign: 'center', fontSize: 13, fontWeight: 600, color: 'var(--red)' }}>{rejected}</td>
      <td style={{ textAlign: 'center', fontSize: 13, fontWeight: 600, color: 'var(--green)' }}>{hired}</td>
      <td>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ flex: 1, height: 6, background: 'var(--border)', borderRadius: 3, overflow: 'hidden', minWidth: 50 }}>
            <div style={{ height: '100%', width: `${Math.min(completion, 100)}%`, background: completion >= 100 ? 'var(--green)' : 'var(--accent)', borderRadius: 3, transition: 'width 0.5s' }} />
          </div>
          <span style={{ fontSize: 11, color: 'var(--text-secondary)', minWidth: 28 }}>{completion}%</span>
        </div>
      </td>
      <td>
        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          <button className="btn btn-ghost btn-sm btn-icon" onClick={() => onEdit(j)} title="Edit">✏️</button>
          <div style={{ position: 'relative' }}>
            <button className="btn btn-ghost btn-sm btn-icon" onClick={() => setShowMenu(!showMenu)}>⋯</button>
            {showMenu && (
              <div style={{ position: 'absolute', right: 0, top: '100%', background: 'var(--bg-surface)', border: '1px solid var(--border-light)', borderRadius: 8, zIndex: 10, minWidth: 160, boxShadow: 'var(--shadow)', padding: 4 }}
                onMouseLeave={() => setShowMenu(false)}>
                <button className="btn btn-ghost" style={{ width: '100%', justifyContent: 'flex-start', fontSize: 13, padding: '8px 12px' }} onClick={() => { onEdit(j); setShowMenu(false); }}>✏️ Edit</button>
                <button className="btn btn-ghost" style={{ width: '100%', justifyContent: 'flex-start', fontSize: 13, padding: '8px 12px', color: 'var(--amber)' }} onClick={() => { onCloseJob(j.id); setShowMenu(false); }}>🔒 Close Job</button>
                <button className="btn btn-ghost" style={{ width: '100%', justifyContent: 'flex-start', fontSize: 13, padding: '8px 12px', color: 'var(--red)' }} onClick={() => { onDelete(j.id); setShowMenu(false); }}>🗑️ Delete</button>
              </div>
            )}
          </div>
        </div>
      </td>
    </tr>
  );
}

export default function Jobs() {
  const [jobs, setJobs] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [viewMode, setViewMode] = useState('list');
  const [showAll, setShowAll] = useState(false);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterClient, setFilterClient] = useState('');
  const [selected, setSelected] = useState([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [jr, cr] = await Promise.all([
        jobAPI.getAll({ status: showAll ? '' : 'open' }),
        clientAPI.getAll()
      ]);
      setJobs(jr.data);
      setClients(cr.data);
    } catch { toast.error('Failed to load'); }
    finally { setLoading(false); }
  }, [showAll]);

  useEffect(() => { load(); }, [load]);

  const filtered = jobs.filter(j => {
    const s = search.toLowerCase();
    const matchSearch = !s || j.title?.toLowerCase().includes(s) || j.location?.toLowerCase().includes(s);
    const matchStatus = !filterStatus || j.status === filterStatus;
    const matchClient = !filterClient || j.clientId == filterClient;
    return matchSearch && matchStatus && matchClient;
  });

  const totalPages = Math.ceil(filtered.length / pageSize);
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  const handleSelect = (id) => setSelected(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
  const handleSelectAll = () => setSelected(selected.length === paginated.length ? [] : paginated.map(j => j.id));

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this job?')) return;
    try { await jobAPI.delete(id); toast.success('Deleted'); load(); }
    catch { toast.error('Delete failed'); }
  };

  const handleCloseJob = async (id) => {
    try { await jobAPI.update(id, { status: 'closed' }); toast.success('Job closed'); load(); }
    catch { toast.error('Failed'); }
  };

  const handleBulkClose = async () => {
    if (!selected.length) return;
    try {
      await Promise.all(selected.map(id => jobAPI.update(id, { status: 'closed' })));
      toast.success(`${selected.length} jobs closed`); setSelected([]); load();
    } catch { toast.error('Failed'); }
  };

  const handleBulkDelete = async () => {
    if (!selected.length || !window.confirm(`Delete ${selected.length} jobs?`)) return;
    try {
      await Promise.all(selected.map(id => jobAPI.delete(id)));
      toast.success(`${selected.length} jobs deleted`); setSelected([]); load();
    } catch { toast.error('Failed'); }
  };

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <h2 className="page-title">Jobs</h2>
          <p className="page-subtitle">{filtered.length} positions</p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {selected.length > 0 && (
            <>
              <button className="btn btn-secondary btn-sm" onClick={handleBulkClose}>🔒 Close Jobs ({selected.length})</button>
              <button className="btn btn-danger btn-sm" onClick={handleBulkDelete}>🗑️ Delete ({selected.length})</button>
            </>
          )}
          <button className="btn btn-primary" onClick={() => setModal({})}>+ Post Job</button>
        </div>
      </div>

      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {/* Show Active / Show All */}
          <div style={{ display: 'flex', background: 'var(--bg-elevated)', borderRadius: 8, padding: 3, gap: 2 }}>
            <button onClick={() => { setShowAll(false); setPage(1); }} style={{ padding: '6px 14px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 13, fontFamily: 'var(--font-body)', fontWeight: 500, background: !showAll ? 'var(--accent)' : 'transparent', color: !showAll ? '#fff' : 'var(--text-secondary)', transition: 'all 0.2s' }}>Show Active</button>
            <button onClick={() => { setShowAll(true); setPage(1); }} style={{ padding: '6px 14px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 13, fontFamily: 'var(--font-body)', fontWeight: 500, background: showAll ? 'var(--accent)' : 'transparent', color: showAll ? '#fff' : 'var(--text-secondary)', transition: 'all 0.2s' }}>Show All</button>
          </div>
          {/* Search */}
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>🔍</span>
            <input className="form-input" style={{ paddingLeft: 34, width: 220 }} placeholder="Search jobs..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {/* Grid/List toggle */}
          <div style={{ display: 'flex', background: 'var(--bg-elevated)', borderRadius: 8, padding: 3, gap: 2 }}>
            <button onClick={() => setViewMode('list')} style={{ padding: '6px 12px', borderRadius: 6, border: 'none', cursor: 'pointer', background: viewMode === 'list' ? 'var(--accent)' : 'transparent', color: viewMode === 'list' ? '#fff' : 'var(--text-secondary)', fontSize: 16, transition: 'all 0.2s' }}>☰</button>
            <button onClick={() => setViewMode('grid')} style={{ padding: '6px 12px', borderRadius: 6, border: 'none', cursor: 'pointer', background: viewMode === 'grid' ? 'var(--accent)' : 'transparent', color: viewMode === 'grid' ? '#fff' : 'var(--text-secondary)', fontSize: 16, transition: 'all 0.2s' }}>⊞</button>
          </div>
        </div>
      </div>

      {/* Bulk action bar */}
      {selected.length > 0 && (
        <div style={{ background: 'var(--accent-dim)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 8, padding: '10px 16px', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 12, fontSize: 13 }}>
          <span style={{ color: 'var(--accent-light)', fontWeight: 600 }}>{selected.length} selected</span>
          <button className="btn btn-secondary btn-sm" onClick={() => setSelected([])}>Deselect All</button>
          <button className="btn btn-secondary btn-sm" onClick={handleBulkClose}>🔒 Close Selected</button>
          <button className="btn btn-danger btn-sm" onClick={handleBulkDelete}>🗑️ Delete Selected</button>
        </div>
      )}

      {loading ? <div className="loading"><div className="spinner" /></div> : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">💼</div>
          <h3>No jobs found</h3>
          <button className="btn btn-primary" style={{ marginTop: 12 }} onClick={() => setModal({})}>+ Post Job</button>
        </div>
      ) : viewMode === 'list' ? (
        <>
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th style={{ width: 40 }}>
                    <input type="checkbox" checked={selected.length === paginated.length && paginated.length > 0} onChange={handleSelectAll} style={{ width: 16, height: 16, accentColor: 'var(--accent)', cursor: 'pointer' }} />
                  </th>
                  <th>Job ID</th>
                  <th>
                    <div>Job</div>
                    <input className="form-input" style={{ fontSize: 11, padding: '3px 8px', marginTop: 4, width: '100%' }} placeholder="Filter By" value={search} onChange={e => setSearch(e.target.value)} />
                  </th>
                  <th>
                    <div>Job Status</div>
                    <select className="form-input form-select" style={{ fontSize: 11, padding: '3px 8px', marginTop: 4 }} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                      <option value="">All Status</option>
                      {JOB_STATUSES.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                    </select>
                  </th>
                  <th>Contact Person</th>
                  <th>
                    <div>Client</div>
                    <select className="form-input form-select" style={{ fontSize: 11, padding: '3px 8px', marginTop: 4 }} value={filterClient} onChange={e => setFilterClient(e.target.value)}>
                      <option value="">All Clients</option>
                      {clients.map(c => <option key={c.id} value={c.id}>{c.companyName}</option>)}
                    </select>
                  </th>
                  <th>City</th>
                  <th style={{ textAlign: 'center', fontSize: 11 }}>Upcoming<br />Interviews</th>
                  <th style={{ textAlign: 'center', fontSize: 11 }}>Active</th>
                  <th style={{ textAlign: 'center', fontSize: 11 }}>Rejected</th>
                  <th style={{ textAlign: 'center', fontSize: 11 }}>Success</th>
                  <th style={{ fontSize: 11 }}>Completion</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map(j => (
                  <JobRow key={j.id} j={j} selected={selected.includes(j.id)}
                    onSelect={handleSelect} onEdit={setModal}
                    onDelete={handleDelete} onCloseJob={handleCloseJob} />
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 16, fontSize: 13, color: 'var(--text-secondary)' }}>
            <div>{(page - 1) * pageSize + 1}–{Math.min(page * pageSize, filtered.length)} of {filtered.length}</div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <button className="btn btn-secondary btn-sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>‹</button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1).map((p, i, arr) => (
                <React.Fragment key={p}>
                  {i > 0 && arr[i - 1] !== p - 1 && <span>...</span>}
                  <button className={`btn btn-sm ${p === page ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setPage(p)}>{p}</button>
                </React.Fragment>
              ))}
              <button className="btn btn-secondary btn-sm" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>›</button>
              <select className="form-input form-select" style={{ width: 70, padding: '4px 8px', fontSize: 12 }} value={pageSize} onChange={e => { setPageSize(parseInt(e.target.value)); setPage(1); }}>
                {[10, 20, 50, 100].map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
            <div style={{ fontSize: 12 }}>{selected.length} records selected</div>
          </div>
        </>
      ) : (
        // Grid View
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
          {paginated.map(j => {
            const sc = STATUS_COLORS[j.status] || STATUS_COLORS.open;
            const candidates = j.candidates || [];
            const hired = candidates.filter(c => c.status === 'hired').length;
            const completion = j.openings > 0 ? Math.round((hired / j.openings) * 100) : 0;
            return (
              <div key={j.id} className="card" style={{ transition: 'all 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{j.title}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>#{j.id} · {j.location || 'Remote'}</div>
                  </div>
                  <span style={{ background: sc.bg, color: sc.color, border: `1px solid ${sc.border}`, borderRadius: 6, padding: '3px 10px', fontSize: 11, fontWeight: 600, height: 'fit-content' }}>
                    {j.status.replace('_', ' ')}
                  </span>
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8 }}>
                  🏢 {j.client?.companyName || '—'} &nbsp;|&nbsp; 👥 {j.openings} openings
                </div>
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 10 }}>
                  {(Array.isArray(j.requiredSkills) ? j.requiredSkills : []).slice(0, 3).map(s => (
                    <span key={s} style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-light)', borderRadius: 4, padding: '1px 6px', fontSize: 11 }}>{s}</span>
                  ))}
                </div>
                <div style={{ marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>
                    <span>Completion</span><span>{completion}%</span>
                  </div>
                  <div style={{ height: 6, background: 'var(--border)', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${Math.min(completion, 100)}%`, background: completion >= 100 ? 'var(--green)' : 'var(--accent)', borderRadius: 3 }} />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6, justifyContent: 'space-between', paddingTop: 10, borderTop: '1px solid var(--border)' }}>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{j.minSalary ? `₹${j.minSalary}–${j.maxSalary}L` : 'Salary N/A'}</span>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button className="btn btn-ghost btn-sm btn-icon" onClick={() => setModal(j)}>✏️</button>
                    <button className="btn btn-secondary btn-sm" style={{ fontSize: 11 }} onClick={() => handleCloseJob(j.id)}>🔒 Close</button>
                    <button className="btn btn-danger btn-sm btn-icon" onClick={() => handleDelete(j.id)}>🗑️</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Bottom bar like iSmart */}
      {selected.length > 0 && (
        <div style={{ position: 'fixed', bottom: 20, left: '50%', transform: 'translateX(-50%)', background: 'var(--bg-surface)', border: '1px solid var(--border-light)', borderRadius: 12, padding: '10px 24px', display: 'flex', gap: 12, alignItems: 'center', boxShadow: 'var(--shadow)', zIndex: 100 }}>
          <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{selected.length} records selected</span>
          <button className="btn btn-secondary btn-sm" onClick={handleBulkClose}>🔒 Close Job</button>
          <button className="btn btn-danger btn-sm" onClick={handleBulkDelete}>🗑️ Delete</button>
          <button className="btn btn-ghost btn-sm" onClick={() => setSelected([])}>✕</button>
        </div>
      )}

      {modal !== null && <JobModal job={modal?.id ? modal : undefined} clients={clients} onClose={() => setModal(null)} onSave={() => { setModal(null); load(); }} />}
    </div>
  );
}