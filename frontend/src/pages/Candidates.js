import React, { useEffect, useState, useCallback, useRef } from 'react';
import toast from 'react-hot-toast';
import axios from 'axios';
import { candidateAPI, jobAPI } from '../hooks/useApi';
import { useNavigate } from 'react-router-dom';

const STATUSES = ['new','screening','interview','offered','hired','rejected'];
const SOURCES = ['LinkedIn','Naukri','Indeed','Referral','Walk-in','Resume Upload','Manual','Adzuna','Jooble'];
const STATUS_COLORS = { new:'#3b82f6', screening:'#f59e0b', interview:'#8b5cf6', offered:'#34d399', hired:'#10b981', rejected:'#ef4444' };

// Quick Add Modal
function QuickAddModal({ onClose, onSave, jobs }) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ name:'', email:'', phone:'', skills:'', experience:'', expectedCTC:'', currentLocation:'', source:'LinkedIn', status:'new', jobId:'' });
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const handle = (e) => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const submit = async () => {
    if (!form.name) return toast.error('Name required');
    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k,v]) => { if(v) fd.append(k, v); });
      if (file) fd.append('resume', file);
      await candidateAPI.create(fd);
      toast.success(`${form.name} added successfully!`);
      onSave();
    } catch(err) {
      toast.error(err.response?.data?.message || 'Failed to add');
    } finally { setSaving(false); }
  };

  return (
    <div className="modal-overlay">
      <div className="modal" style={{ maxWidth: 520 }}>
        <div className="modal-header">
          <div>
            <div className="modal-title">➕ Add Candidate</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Step {step} of 2</div>
          </div>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>✕</button>
        </div>

        {/* Step indicator */}
        <div style={{ display: 'flex', gap: 0, padding: '0 24px', marginBottom: 4 }}>
          {[1,2].map(s => (
            <div key={s} style={{ flex: 1, height: 3, background: s <= step ? 'var(--accent)' : 'var(--border)', borderRadius: 2, marginRight: s < 2 ? 4 : 0, transition: 'background 0.3s' }} />
          ))}
        </div>

        <div className="modal-body">
          {step === 1 ? (
            <>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 14, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Basic Info</div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Full Name *</label>
                  <input className="form-input" name="name" value={form.name} onChange={handle} placeholder="Candidate name" autoFocus />
                </div>
                <div className="form-group">
                  <label className="form-label">Phone</label>
                  <input className="form-input" name="phone" value={form.phone} onChange={handle} placeholder="+91-9876543210" />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input className="form-input" type="email" name="email" value={form.email} onChange={handle} placeholder="candidate@email.com" />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Source</label>
                  <select className="form-input form-select" name="source" value={form.source} onChange={handle}>
                    {SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select className="form-input form-select" name="status" value={form.status} onChange={handle}>
                    {STATUSES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase()+s.slice(1)}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Upload Resume (optional)</label>
                <div
                  onClick={() => document.getElementById('quick-resume').click()}
                  style={{ border: `2px dashed ${file ? 'var(--green)' : 'var(--border-light)'}`, borderRadius: 8, padding: '14px', textAlign: 'center', cursor: 'pointer', background: file ? 'var(--green-dim)' : 'transparent', fontSize: 13 }}>
                  <input id="quick-resume" type="file" accept=".pdf,.doc,.docx" style={{ display:'none' }} onChange={e => setFile(e.target.files[0])} />
                  {file ? <span style={{ color: 'var(--green)' }}>📄 {file.name}</span> : <span style={{ color: 'var(--text-muted)' }}>📁 Click to upload PDF/DOC</span>}
                </div>
              </div>
            </>
          ) : (
            <>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 14, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Professional Details</div>
              <div className="form-group">
                <label className="form-label">Skills (comma separated)</label>
                <input className="form-input" name="skills" value={form.skills} onChange={handle} placeholder="React, Node.js, MySQL..." />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Experience (years)</label>
                  <input className="form-input" type="number" step="0.5" name="experience" value={form.experience} onChange={handle} placeholder="2.5" />
                </div>
                <div className="form-group">
                  <label className="form-label">Expected CTC (LPA)</label>
                  <input className="form-input" type="number" name="expectedCTC" value={form.expectedCTC} onChange={handle} placeholder="8" />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Location</label>
                  <input className="form-input" name="currentLocation" value={form.currentLocation} onChange={handle} placeholder="City" />
                </div>
                <div className="form-group">
                  <label className="form-label">Apply for Job</label>
                  <select className="form-input form-select" name="jobId" value={form.jobId} onChange={handle}>
                    <option value="">-- Select Job --</option>
                    {jobs.map(j => <option key={j.id} value={j.id}>{j.title}</option>)}
                  </select>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="modal-footer">
          {step === 2 && <button className="btn btn-secondary" onClick={() => setStep(1)}>← Back</button>}
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          {step === 1
            ? <button className="btn btn-primary" onClick={() => { if(!form.name) return toast.error('Name required'); setStep(2); }}>Next →</button>
            : <button className="btn btn-primary" onClick={submit} disabled={saving}>{saving ? 'Saving...' : '✅ Add Candidate'}</button>
          }
        </div>
      </div>
    </div>
  );
}

// Candidate Row — iSmart style
function CandidateRow({ c, jobs, selected, onSelect, onDelete, onStatusChange, onEdit }) {
  const [showMenu, setShowMenu] = useState(false);
  const job = jobs.find(j => j.id === c.jobId);
  const navigate = useNavigate();

  return (
    <tr style={{ background: selected ? 'var(--accent-dim)' : undefined }}>
      <td style={{ width: 40 }}>
        <input type="checkbox" checked={selected} onChange={() => onSelect(c.id)}
          style={{ width: 16, height: 16, cursor: 'pointer', accentColor: 'var(--accent)' }} />
      </td>
      <td>
        <div style={{ fontWeight: 600, fontSize: 14, cursor: 'pointer', color: 'var(--accent-light)' }} 
  onClick={() => navigate(`/candidates/${c.id}`)}>
  {c.name}
</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div className="avatar" style={{ width: 36, height: 36, fontSize: 13, flexShrink: 0 }}>{c.name?.[0]}</div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 14 }}>{c.name}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', gap: 6, alignItems: 'center', marginTop: 2 }}>
              {c.phone && <span>📞 {c.phone}</span>}
            </div>
          </div>
        </div>
      </td>
      <td>
        <div style={{ fontSize: 13 }}>{c.email || '—'}</div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{c.currentLocation || ''}</div>
      </td>
      <td>
        {job ? (
          <>
            <div style={{ fontSize: 13, fontWeight: 500 }}>{job.title}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{job.client?.companyName || ''}</div>
          </>
        ) : <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>—</span>}
      </td>
      <td>
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', maxWidth: 180 }}>
          {(Array.isArray(c.skills) ? c.skills : []).slice(0, 3).map(s => (
            <span key={s} style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-light)', borderRadius: 4, padding: '1px 6px', fontSize: 11 }}>{s}</span>
          ))}
          {(Array.isArray(c.skills) ? c.skills : []).length > 3 && (
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>+{c.skills.length - 3}</span>
          )}
        </div>
      </td>
      <td><span style={{ fontSize: 12 }}>{c.experience ? `${c.experience} yrs` : '—'}</span></td>
      <td>
        <select
          value={c.status}
          onChange={e => onStatusChange(c.id, e.target.value)}
          style={{ background: STATUS_COLORS[c.status] + '20', color: STATUS_COLORS[c.status], border: `1px solid ${STATUS_COLORS[c.status]}40`, borderRadius: 20, padding: '3px 10px', fontSize: 12, fontWeight: 600, cursor: 'pointer', outline: 'none', fontFamily: 'var(--font-body)' }}>
          {STATUSES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase()+s.slice(1)}</option>)}
        </select>
      </td>
      <td>
        {c.source && (
          <span style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-light)', borderRadius: 4, padding: '2px 8px', fontSize: 11, color: 'var(--text-secondary)' }}>{c.source}</span>
        )}
      </td>
      <td>
        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          {c.resumePath && (
            <a href={`/uploads/resumes/${c.resumePath}`} target="_blank" rel="noreferrer"
              style={{ background: 'var(--blue-dim)', color: 'var(--blue)', border: '1px solid rgba(59,130,246,0.3)', borderRadius: 4, padding: '3px 8px', fontSize: 11, fontWeight: 600, textDecoration: 'none' }}>
              CV
            </a>
          )}
          <button className="btn btn-ghost btn-sm btn-icon" onClick={() => onEdit(c)} title="Edit">✏️</button>
          <div style={{ position: 'relative' }}>
            <button className="btn btn-ghost btn-sm btn-icon" onClick={() => setShowMenu(!showMenu)}>⋯</button>
            {showMenu && (
              <div style={{ position: 'absolute', right: 0, top: '100%', background: 'var(--bg-surface)', border: '1px solid var(--border-light)', borderRadius: 8, zIndex: 10, minWidth: 160, boxShadow: 'var(--shadow)', padding: 4 }}
                onMouseLeave={() => setShowMenu(false)}>
                <button className="btn btn-ghost" style={{ width: '100%', justifyContent: 'flex-start', fontSize: 13, padding: '8px 12px' }} onClick={() => { onDelete(c.id); setShowMenu(false); }}>
                  🗑️ Delete
                </button>
                
              </div>
            )}
          </div>
        </div>
      </td>
    </tr>
  );
}

// Edit Modal
function EditModal({ candidate, jobs, onClose, onSave }) {
  const [form, setForm] = useState({ ...candidate, skills: Array.isArray(candidate.skills) ? candidate.skills.join(', ') : '' });
  const [saving, setSaving] = useState(false);
  const handle = (e) => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k,v]) => { if(v !== undefined && v !== null) fd.append(k, v); });
      await candidateAPI.update(candidate.id, fd);
      toast.success('Updated!'); onSave();
    } catch(err) { toast.error('Update failed'); }
    finally { setSaving(false); }
  };

  return (
    <div className="modal-overlay">
      <div className="modal modal-lg">
        <div className="modal-header">
          <div className="modal-title">✏️ Edit — {candidate.name}</div>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={submit}>
          <div className="modal-body">
            <div className="form-row">
              <div className="form-group"><label className="form-label">Name</label><input className="form-input" name="name" value={form.name} onChange={handle} /></div>
              <div className="form-group"><label className="form-label">Email</label><input className="form-input" name="email" value={form.email||''} onChange={handle} /></div>
            
            </div>
            <div className="form-row">
              <div className="form-group"><label className="form-label">Phone</label><input className="form-input" name="phone" value={form.phone||''} onChange={handle} /></div>
              <div className="form-group"><label className="form-label">Location</label><input className="form-input" name="currentLocation" value={form.currentLocation||''} onChange={handle} /></div>
            </div>
            <div className="form-group"><label className="form-label">Skills</label><input className="form-input" name="skills" value={form.skills||''} onChange={handle} placeholder="React, Node.js..." /></div>
            <div className="form-row">
              <div className="form-group"><label className="form-label">Experience (yrs)</label><input className="form-input" type="number" step="0.5" name="experience" value={form.experience||''} onChange={handle} /></div>
              <div className="form-group"><label className="form-label">Expected CTC</label><input className="form-input" type="number" name="expectedCTC" value={form.expectedCTC||''} onChange={handle} /></div>
            </div>
            <div className="form-row">
              <div className="form-group"><label className="form-label">Status</label>
                <select className="form-input form-select" name="status" value={form.status} onChange={handle}>
                  {STATUSES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase()+s.slice(1)}</option>)}
                </select>
              </div>
              <div className="form-group"><label className="form-label">Source</label>
                <select className="form-input form-select" name="source" value={form.source||''} onChange={handle}>
                  {SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div className="form-group"><label className="form-label">Applied Job</label>
              <select className="form-input form-select" name="jobId" value={form.jobId||''} onChange={handle}>
                <option value="">-- None --</option>
                {jobs.map(j => <option key={j.id} value={j.id}>{j.title}</option>)}
              </select>
            </div>
            <div className="form-group"><label className="form-label">Notes</label><textarea className="form-input" name="notes" value={form.notes||''} onChange={handle} rows={2} /></div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Candidates() {
  const [candidates, setCandidates] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showQuickMenu, setShowQuickMenu] = useState(false);
  const [editCandidate, setEditCandidate] = useState(null);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterSource, setFilterSource] = useState('');
  const [selected, setSelected] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const LIMIT = 15;
    const excelInputRef = useRef(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [cr, jr] = await Promise.all([
        candidateAPI.getAll({ search, status: filterStatus, page, limit: LIMIT }),
        jobAPI.getAll()
      ]);
      setCandidates(cr.data.candidates);
      setTotal(cr.data.total);
      setPages(cr.data.pages);
      setJobs(jr.data);
    } catch { toast.error('Failed to load'); }
    finally { setLoading(false); }
  }, [search, filterStatus, page]);

  useEffect(() => { load(); }, [load]);

  const handleSelect = (id) => setSelected(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
  const handleSelectAll = () => setSelected(selected.length === candidates.length ? [] : candidates.map(c => c.id));

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this candidate?')) return;
    try { await candidateAPI.delete(id); toast.success('Deleted'); setSelected(p => p.filter(x => x !== id)); load(); }
    catch { toast.error('Delete failed'); }
  };

  const handleBulkDelete = async () => {
    if (!selected.length) return;
    if (!window.confirm(`Delete ${selected.length} candidates?`)) return;
    try {
      await Promise.all(selected.map(id => candidateAPI.delete(id)));
      toast.success(`${selected.length} candidates deleted`);
      setSelected([]);
      load();
    } catch { toast.error('Bulk delete failed'); }
  };
  const handleDeleteAll = async () => {
  if (!window.confirm('WARNING: This will permanently delete ALL candidates from your company. This cannot be undone. Type "DELETE" to confirm.')) return;
  const confirm2 = window.prompt('Type DELETE to confirm:');
  if (confirm2 !== 'DELETE') return toast.error('Cancelled');
  const toastId = toast.loading('Deleting all candidates...');
  try {
    let pageNum = 1;
    let deleted = 0;
    while (true) {
      const r = await candidateAPI.getAll({ page: pageNum, limit: 100 });
      const batch = r.data.candidates;
      if (!batch.length) break;
      await Promise.all(batch.map(c => candidateAPI.delete(c.id)));
      deleted += batch.length;
      if (r.data.pages <= pageNum) break;
    }
    toast.success(`${deleted} candidates deleted!`, { id: toastId });
    load();
  } catch { toast.error('Failed', { id: toastId }); }
};

  const handleStatusChange = async (id, status) => {
    try { await candidateAPI.updateStatus(id, status); load(); toast.success(`Status → ${status}`); }
    catch { toast.error('Status update failed'); }
  };

  const statusCounts = STATUSES.reduce((acc, s) => ({ ...acc, [s]: candidates.filter(c => c.status === s).length }), {});

  const handleExcelImport = async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const allowed = ['.xlsx', '.xls', '.csv'];
  const ext = '.' + file.name.split('.').pop().toLowerCase();
  if (!allowed.includes(ext)) {
    toast.error('Only .xlsx, .xls, .csv files allowed');
    e.target.value = '';
    return;
  }

  const toastId = toast.loading(`📊 Importing ${file.name}...`);
  try {
    const fd = new FormData();
    fd.append('excel', file);
    const r = await axios.post('/api/candidates/import-excel', fd, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    toast.success(r.data.message, { id: toastId, duration: 4000 });
    if (r.data.failed > 0) {
      toast.error(`⚠️ ${r.data.failed} rows failed to import`, { duration: 4000 });
    }
    load();
  } catch (err) {
    const msg = err.response?.data?.message || 'Import failed';
    toast.error(msg, { id: toastId, duration: 6000 });
  }
  e.target.value = '';
};

  return (
    <div>
       <input
      ref={excelInputRef}
      type="file"
      accept=".xlsx,.xls,.csv"
      style={{ display: 'none' }}
      onChange={handleExcelImport}
    />
      {/* Header */}
      <div className="page-header">

        <button className="btn btn-danger" onClick={handleDeleteAll}>
  🗑️ Delete All Candidates
</button>
        <div>
          <h2 className="page-title">Candidates</h2>
          <p className="page-subtitle">{total} total candidates</p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {selected.length > 0 && (
            <button className="btn btn-danger" onClick={handleBulkDelete}>
              🗑️ Delete ({selected.length})
            </button>
            

            
          )}
          <div style={{ position: 'relative' }}>
            <button className="btn btn-primary" onClick={() => setShowQuickMenu(!showQuickMenu)}>
              ＋ Add Candidate ▾
            </button>
            {showQuickMenu && (
              <div style={{ position: 'absolute', right: 0, top: '110%', background: 'var(--bg-surface)', border: '1px solid var(--border-light)', borderRadius: 12, zIndex: 20, width: 280, boxShadow: 'var(--shadow)', padding: 12 }}
                onMouseLeave={() => setShowQuickMenu(false)}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10, padding: '0 4px' }}>Quick Actions</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {[
                    { icon: '👤', label: 'Add Candidate', action: () => { setShowAddModal(true); setShowQuickMenu(false); } },
                    { icon: '📄', label: 'Import Resume', action: () => { window.location.href = '/resume-scanner'; } },
                 { 
  icon: '📊', 
  label: 'Import Excel', 
  action: () => { 
    setShowQuickMenu(false); 
    setTimeout(() => excelInputRef.current?.click(), 200); 
  } 
},
                  ].map(item => (
                    <button key={item.label} onClick={item.action}
                      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: '12px 8px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 8, cursor: 'pointer', fontSize: 12, color: 'var(--text-primary)', fontFamily: 'var(--font-body)', transition: 'all 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'}
                      onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}>
                      <span style={{ fontSize: 22 }}>{item.icon}</span>
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Status Filter Pills */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        <button onClick={() => { setFilterStatus(''); setPage(1); }}
          style={{ padding: '5px 14px', borderRadius: 20, border: `1px solid ${!filterStatus ? 'var(--accent)' : 'var(--border)'}`, background: !filterStatus ? 'var(--accent-dim)' : 'transparent', color: !filterStatus ? 'var(--accent-light)' : 'var(--text-secondary)', fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
          All ({total})
        </button>
        {STATUSES.map(s => (
          <button key={s} onClick={() => { setFilterStatus(s); setPage(1); }}
            style={{ padding: '5px 14px', borderRadius: 20, border: `1px solid ${filterStatus === s ? STATUS_COLORS[s] : 'var(--border)'}`, background: filterStatus === s ? STATUS_COLORS[s] + '20' : 'transparent', color: filterStatus === s ? STATUS_COLORS[s] : 'var(--text-secondary)', fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font-body)', fontWeight: filterStatus === s ? 600 : 400 }}>
            {s.charAt(0).toUpperCase()+s.slice(1)}
          </button>
        ))}
      </div>

      {/* Search & Filter Bar */}
      <div className="search-bar" style={{ marginBottom: 16 }}>
        <div className="search-input-wrap" style={{ flex: 2 }}>
          <span className="search-icon">🔍</span>
          <input className="form-input search-input" placeholder="Search by name, email..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <select className="form-input form-select" style={{ width: 140 }} value={filterSource} onChange={e => { setFilterSource(e.target.value); setPage(1); }}>
          <option value="">All Sources</option>
          {SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        {(search || filterStatus || filterSource) && (
          <button className="btn btn-secondary" onClick={() => { setSearch(''); setFilterStatus(''); setFilterSource(''); setPage(1); }}>✕ Clear</button>
        )}
      </div>

      {/* Bulk action bar */}
      {selected.length > 0 && (
        <div style={{ background: 'var(--accent-dim)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 8, padding: '10px 16px', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 12, fontSize: 13 }}>
          <span style={{ color: 'var(--accent-light)', fontWeight: 600 }}>{selected.length} selected</span>
          <button className="btn btn-secondary btn-sm" onClick={() => setSelected([])}>Deselect All</button>
          <button className="btn btn-danger btn-sm" onClick={handleBulkDelete}>🗑️ Delete Selected</button>
        {/* <button className="btn btn-danger"
  onClick={async () => {
    if (!window.confirm('DELETE ALL candidates? This cannot be undone!')) return;
    const toastId = toast.loading('Deleting all...');
    try {
      await Promise.all(candidates.map(c => candidateAPI.delete(c.id)));
      toast.success('All deleted!', { id: toastId });
      load();
    } catch { toast.error('Failed', { id: toastId }); }
  }}>
  🗑️ Delete All
</button> */}
        </div>
        
      )}

      {/* Table */}
      {loading ? (
        <div className="loading"><div className="spinner" /></div>
      ) : candidates.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">👤</div>
          <h3>No candidates found</h3>
          <p style={{ marginBottom: 16 }}>Add your first candidate to get started</p>
          <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>➕ Add Candidate</button>
        </div>
      ) : (
        <>
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th style={{ width: 40 }}>
                    <input type="checkbox" checked={selected.length === candidates.length && candidates.length > 0} onChange={handleSelectAll}
                      style={{ width: 16, height: 16, cursor: 'pointer', accentColor: 'var(--accent)' }} />
                  </th>
                  <th>Candidate</th>
                  <th>Contact</th>
                  <th>Job Applied</th>
                  <th>Skills</th>
                  <th>Exp</th>
                  <th>Status</th>
                  <th>Source</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {candidates.map(c => (
                  <CandidateRow
                    key={c.id} c={c} jobs={jobs}
                    selected={selected.includes(c.id)}
                    onSelect={handleSelect}
                    onDelete={handleDelete}
                    onStatusChange={handleStatusChange}
                    onEdit={setEditCandidate}
                  />
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pages > 1 && (
            <div className="pagination" style={{ marginTop: 16 }}>
              <button disabled={page === 1} onClick={() => setPage(p => p-1)}>‹</button>
              {Array.from({ length: pages }, (_, i) => i+1).map(p => (
                <button key={p} className={p === page ? 'active' : ''} onClick={() => setPage(p)}>{p}</button>
              ))}
              <button disabled={page === pages} onClick={() => setPage(p => p+1)}>›</button>
            </div>
          )}
        </>
      )}

      {/* Modals */}
      {showAddModal && <QuickAddModal jobs={jobs} onClose={() => setShowAddModal(false)} onSave={() => { setShowAddModal(false); load(); }} />}
      {editCandidate && <EditModal candidate={editCandidate} jobs={jobs} onClose={() => setEditCandidate(null)} onSave={() => { setEditCandidate(null); load(); }} />}
    </div>
  );
}