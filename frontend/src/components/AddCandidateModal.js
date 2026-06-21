// FILE: frontend/src/components/AddCandidateModal.js
// ACTION: New file — create in frontend/src/components/
// Replaces: separate ResumeScanner page logic + BulkResumeUpload page logic
// Used by: Candidates.js (single "+ Add Candidate" button opens this modal)

import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { candidateAPI, jobAPI } from '../hooks/useApi';

const MAX_BULK_FILES = 10;
const ALLOWED_TYPES = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
const SOURCES = ['LinkedIn', 'Naukri', 'Indeed', 'Referral', 'Walk-in', 'Resume Upload', 'Manual', 'Adzuna', 'Jooble'];

const BULK_STATUS = { WAITING: 'waiting', SCANNING: 'scanning', DONE: 'done', ERROR: 'error' };
const bulkStatusConfig = {
  waiting:  { label: 'Waiting',  color: '#64748b', bg: 'rgba(100,116,139,0.1)' },
  scanning: { label: 'Scanning', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
  done:     { label: 'Created',  color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
  error:    { label: 'Failed',   color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
};

export default function AddCandidateModal({ onClose, onSaved }) {
  const [tab, setTab] = useState('manual'); // manual | single | bulk
  const [jobs, setJobs] = useState([]);

  useEffect(() => {
    jobAPI.getAll({ status: 'open' }).then(r => setJobs(r.data.jobs || r.data || [])).catch(() => {});
  }, []);

  return (
    <div className="modal-overlay">
      <div className="modal modal-lg" style={{ maxWidth: 640 }}>
        <div className="modal-header">
          <div className="modal-title">➕ Add Candidate</div>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>✕</button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, padding: '0 24px', marginBottom: 4 }}>
          {[
            { key: 'manual', label: '✍️ Manual Entry' },
            { key: 'single', label: '🎯 Resume + ATS Score' },
            { key: 'bulk',   label: '📂 Bulk Upload' },
          ].map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              style={{
                flex: 1, padding: '10px 8px', borderRadius: 8, border: 'none', cursor: 'pointer',
                fontSize: 13, fontWeight: 600, fontFamily: 'var(--font-body)',
                background: tab === t.key ? 'var(--accent)' : 'var(--bg-elevated)',
                color: tab === t.key ? '#fff' : 'var(--text-secondary)',
                transition: 'all 0.15s'
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'manual' && <ManualTab jobs={jobs} onClose={onClose} onSaved={onSaved} />}
        {tab === 'single' && <SingleResumeTab jobs={jobs} onClose={onClose} onSaved={onSaved} />}
        {tab === 'bulk' && <BulkTab jobs={jobs} onClose={onClose} onSaved={onSaved} />}
      </div>
    </div>
  );
}

// ── TAB 1: Manual Entry ─────────────────────────────────────────────────────
function ManualTab({ jobs, onClose, onSaved }) {
  const [form, setForm] = useState({
    name: '', email: '', phone: '', skills: '', experience: '',
    expectedCTC: '', currentLocation: '', source: 'Manual', jobId: ''
  });
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const handle = (e) => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const submit = async () => {
    if (!form.name) return toast.error('Name required');
    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => { if (v) fd.append(k, v); });
      if (file) fd.append('resume', file);
      await candidateAPI.create(fd);
      toast.success(`${form.name} added successfully!`);
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="modal-body">
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
            <label className="form-label">Skills (comma separated)</label>
            <input className="form-input" name="skills" value={form.skills} onChange={handle} placeholder="React, Node.js..." />
          </div>
          <div className="form-group">
            <label className="form-label">Experience (yrs)</label>
            <input className="form-input" type="number" step="0.5" name="experience" value={form.experience} onChange={handle} placeholder="2.5" />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Location</label>
            <input className="form-input" name="currentLocation" value={form.currentLocation} onChange={handle} placeholder="City" />
          </div>
          <div className="form-group">
            <label className="form-label">Source</label>
            <select className="form-input form-select" name="source" value={form.source} onChange={handle}>
              {SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Apply for Job (optional)</label>
          <select className="form-input form-select" name="jobId" value={form.jobId} onChange={handle}>
            <option value="">-- Select Job --</option>
            {jobs.map(j => <option key={j.id} value={j.id}>{j.title}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Resume (optional)</label>
          <div
            onClick={() => document.getElementById('manual-resume').click()}
            style={{ border: `2px dashed ${file ? 'var(--green)' : 'var(--border-light)'}`, borderRadius: 8, padding: 14, textAlign: 'center', cursor: 'pointer', background: file ? 'var(--green-dim)' : 'transparent', fontSize: 13 }}
          >
            <input id="manual-resume" type="file" accept=".pdf,.doc,.docx" style={{ display: 'none' }} onChange={e => setFile(e.target.files[0])} />
            {file ? <span style={{ color: 'var(--green)' }}>📄 {file.name}</span> : <span style={{ color: 'var(--text-muted)' }}>📁 Click to attach resume</span>}
          </div>
        </div>
      </div>
      <div className="modal-footer">
        <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
        <button className="btn btn-primary" onClick={submit} disabled={saving}>
          {saving ? 'Saving...' : '✅ Add Candidate'}
        </button>
      </div>
    </>
  );
}

// ── TAB 2: Single Resume + ATS Score ────────────────────────────────────────
function ScoreRing({ score }) {
  const color = score >= 75 ? '#10b981' : score >= 50 ? '#f59e0b' : score >= 30 ? '#6366f1' : '#ef4444';
  const label = score >= 75 ? 'Strong Match' : score >= 50 ? 'Good Match' : score >= 30 ? 'Partial Match' : 'Not Suitable';
  const r = 50, circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
      <svg width="120" height="120" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r={r} fill="none" stroke="var(--border)" strokeWidth="9" />
        <circle cx="60" cy="60" r={r} fill="none" stroke={color} strokeWidth="9"
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
          transform="rotate(-90 60 60)" style={{ transition: 'stroke-dasharray 1s ease' }} />
        <text x="60" y="56" textAnchor="middle" fill={color} fontSize="24" fontWeight="700" fontFamily="var(--font-display)">{score}</text>
        <text x="60" y="74" textAnchor="middle" fill="var(--text-secondary)" fontSize="10">/100</text>
      </svg>
      <span style={{ background: color + '20', color, padding: '3px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600 }}>{label}</span>
    </div>
  );
}

function SingleResumeTab({ jobs, onClose, onSaved }) {
  const [file, setFile] = useState(null);
  const [jobId, setJobId] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [adding, setAdding] = useState(false);

  const handleFile = (f) => {
    if (!f) return;
    if (!f.name.match(/\.(pdf|doc|docx)$/i)) return toast.error('Only PDF or DOC files allowed');
    setFile(f);
    setResult(null);
  };

  const scan = async () => {
    if (!file) return toast.error('Please upload a resume first');
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('resume', file);
      if (jobId) fd.append('jobId', jobId);
      const r = await axios.post('/api/resume-scanner/scan', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setResult(r.data);
      toast.success('Resume scanned!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Scan failed');
    } finally {
      setLoading(false);
    }
  };

  const addToCandidate = async () => {
    if (!file) return toast.error('Upload a resume first');
    setAdding(true);
    try {
      const fd = new FormData();
      fd.append('resume', file);
      if (jobId) fd.append('jobId', jobId);
      const r = await axios.post('/api/resume-scanner/scan-and-create', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success(`✅ ${r.data.candidate.name} added to Candidates!`);
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add candidate');
    } finally {
      setAdding(false);
    }
  };

  return (
    <>
      <div className="modal-body">
        <div
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={e => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]); }}
          onClick={() => document.getElementById('single-resume-input').click()}
          style={{
            border: `2px dashed ${dragOver ? 'var(--accent)' : file ? 'var(--green)' : 'var(--border-light)'}`,
            background: dragOver ? 'var(--accent-dim)' : file ? 'var(--green-dim)' : 'var(--bg-elevated)',
            textAlign: 'center', padding: 24, cursor: 'pointer', borderRadius: 10, marginBottom: 16
          }}
        >
          <input id="single-resume-input" type="file" accept=".pdf,.doc,.docx" style={{ display: 'none' }} onChange={e => handleFile(e.target.files[0])} />
          {file ? (
            <>
              <div style={{ fontSize: 32, marginBottom: 6 }}>📄</div>
              <div style={{ fontWeight: 600, color: 'var(--green)', fontSize: 14 }}>{file.name}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{(file.size / 1024).toFixed(0)} KB — Click to change</div>
            </>
          ) : (
            <>
              <div style={{ fontSize: 32, marginBottom: 6 }}>📁</div>
              <div style={{ fontWeight: 600, fontSize: 14 }}>Drop resume here or click to upload</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>PDF, DOC, DOCX — Max 5MB</div>
            </>
          )}
        </div>

        <div className="form-group">
          <label className="form-label">Score against a job (optional)</label>
          <select className="form-input form-select" value={jobId} onChange={e => setJobId(e.target.value)}>
            <option value="">-- No specific job (general scan) --</option>
            {jobs.map(j => <option key={j.id} value={j.id}>{j.title} — {j.client?.companyName || 'N/A'}</option>)}
          </select>
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <button className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center' }} onClick={scan} disabled={loading || !file}>
            {loading ? '🔍 Scanning...' : '🎯 Preview ATS Score'}
          </button>
          <button className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }} onClick={addToCandidate} disabled={adding || !file}>
            {adding ? 'Adding...' : '👤 Add to Candidates'}
          </button>
        </div>

        {result && (
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16 }}>
            {result.atsScore != null && (
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
                <ScoreRing score={result.atsScore} />
              </div>
            )}
            {result.summary && (
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', background: 'var(--bg-elevated)', padding: '10px 14px', borderRadius: 8, marginBottom: 12, lineHeight: 1.6 }}>
                {result.summary}
              </div>
            )}
            {result.skills?.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                {result.skills.map(s => (
                  <span key={s} style={{ background: 'var(--accent-dim)', color: 'var(--accent-light)', borderRadius: 4, padding: '3px 8px', fontSize: 12 }}>{s}</span>
                ))}
              </div>
            )}
            {result.jobMatch && (
              <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--green)', marginBottom: 6 }}>✅ Matched</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {result.jobMatch.matched?.length > 0
                      ? result.jobMatch.matched.map(s => <span key={s} style={{ background: 'var(--green-dim)', color: 'var(--green)', borderRadius: 4, padding: '2px 7px', fontSize: 11 }}>{s}</span>)
                      : <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>None</span>}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--red)', marginBottom: 6 }}>❌ Missing</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {result.jobMatch.missing?.length > 0
                      ? result.jobMatch.missing.map(s => <span key={s} style={{ background: 'var(--red-dim)', color: 'var(--red)', borderRadius: 4, padding: '2px 7px', fontSize: 11 }}>{s}</span>)
                      : <span style={{ fontSize: 12, color: 'var(--green)' }}>All present!</span>}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      <div className="modal-footer">
        <button className="btn btn-secondary" onClick={onClose}>Close</button>
      </div>
    </>
  );
}

// ── TAB 3: Bulk Upload ───────────────────────────────────────────────────────
function BulkTab({ jobs, onClose, onSaved }) {
  const [files, setFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [jobId, setJobId] = useState('');
  const fileInputRef = useRef(null);

  const addFiles = useCallback((incoming) => {
    const valid = Array.from(incoming).filter(f => ALLOWED_TYPES.includes(f.type));
    const invalid = Array.from(incoming).length - valid.length;
    if (invalid > 0) toast.error(`${invalid} file(s) skipped — only PDF/DOC/DOCX`);
    setFiles(prev => {
      const combined = [...prev];
      for (const f of valid) {
        if (combined.length >= MAX_BULK_FILES) { toast.error(`Max ${MAX_BULK_FILES} resumes`); break; }
        if (combined.find(x => x.file.name === f.name)) continue;
        combined.push({ id: crypto.randomUUID(), file: f, status: BULK_STATUS.WAITING, result: null, error: null });
      }
      return combined;
    });
  }, []);

  const onDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    addFiles(e.dataTransfer.files);
  }, [addFiles]);

  const removeFile = (id) => { if (!isRunning) setFiles(prev => prev.filter(f => f.id !== id)); };
  const updateFile = (id, patch) => setFiles(prev => prev.map(f => f.id === id ? { ...f, ...patch } : f));

  const processOne = async (item) => {
    updateFile(item.id, { status: BULK_STATUS.SCANNING });
    try {
      const fd = new FormData();
      fd.append('resume', item.file);
      if (jobId) fd.append('jobId', jobId);
      const { data } = await axios.post('/api/resume-scanner/scan-and-create', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      updateFile(item.id, { status: BULK_STATUS.DONE, result: data });
    } catch (err) {
      updateFile(item.id, { status: BULK_STATUS.ERROR, error: err.response?.data?.message || 'Failed' });
    }
  };

  const runAll = async () => {
    const waiting = files.filter(f => f.status === BULK_STATUS.WAITING || f.status === BULK_STATUS.ERROR);
    if (!waiting.length) return toast.error('No files to process');
    setIsRunning(true);
    for (const item of waiting) await processOne(item);
    setIsRunning(false);
    toast.success('Bulk upload complete!');
    onSaved();
  };

  const counts = {
    total: files.length,
    waiting: files.filter(f => f.status === BULK_STATUS.WAITING).length,
    done: files.filter(f => f.status === BULK_STATUS.DONE).length,
    error: files.filter(f => f.status === BULK_STATUS.ERROR).length,
  };

  return (
    <>
      <div className="modal-body">
        <div className="form-group">
          <label className="form-label">Link all to job (optional)</label>
          <select className="form-input form-select" value={jobId} onChange={e => setJobId(e.target.value)} disabled={isRunning}>
            <option value="">— No specific job —</option>
            {jobs.map(j => <option key={j.id} value={j.id}>{j.title}</option>)}
          </select>
        </div>

        <div
          onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={onDrop}
          onClick={() => !isRunning && fileInputRef.current?.click()}
          style={{
            border: `2px dashed ${isDragging ? 'var(--accent)' : 'var(--border)'}`,
            borderRadius: 10, padding: '24px', textAlign: 'center',
            cursor: isRunning ? 'not-allowed' : 'pointer',
            background: isDragging ? 'var(--accent-dim)' : 'var(--bg-elevated)',
            marginBottom: 16, opacity: isRunning ? 0.6 : 1
          }}
        >
          <div style={{ fontSize: 32, marginBottom: 6 }}>{isDragging ? '📂' : '📁'}</div>
          <div style={{ fontWeight: 600, fontSize: 14 }}>Drag & drop up to {MAX_BULK_FILES} resumes</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>or click to browse</div>
          <input ref={fileInputRef} type="file" multiple accept=".pdf,.doc,.docx" style={{ display: 'none' }}
            onChange={e => { addFiles(e.target.files); e.target.value = ''; }} />
        </div>

        {files.length > 0 && (
          <>
            <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
              {[
                { label: 'Total', value: counts.total },
                { label: 'Waiting', value: counts.waiting },
                { label: 'Created', value: counts.done },
                { label: 'Failed', value: counts.error },
              ].map(s => (
                <span key={s.label} style={{ fontSize: 12, padding: '3px 10px', background: 'var(--bg-elevated)', borderRadius: 20 }}>
                  <strong>{s.value}</strong> {s.label}
                </span>
              ))}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 240, overflowY: 'auto', marginBottom: 16 }}>
              {files.map((item, idx) => {
                const cfg = bulkStatusConfig[item.status];
                return (
                  <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: 'var(--bg-elevated)', borderRadius: 8, fontSize: 12 }}>
                    <span style={{ color: 'var(--text-muted)', flexShrink: 0 }}>{idx + 1}.</span>
                    <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item.file.name}
                      {item.result?.candidate?.name && <span style={{ color: '#10b981' }}> → {item.result.candidate.name}</span>}
                      {item.error && <span style={{ color: '#ef4444' }}> {item.error}</span>}
                    </span>
                    <span style={{ padding: '2px 8px', borderRadius: 20, background: cfg.bg, color: cfg.color, fontWeight: 600, flexShrink: 0 }}>{cfg.label}</span>
                    {!isRunning && item.status !== BULK_STATUS.SCANNING && (
                      <button onClick={() => removeFile(item.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>✕</button>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
      <div className="modal-footer">
        <button className="btn btn-secondary" onClick={onClose}>Close</button>
        {files.length > 0 && (
          <button className="btn btn-primary" onClick={runAll} disabled={isRunning || counts.waiting === 0}>
            {isRunning ? '⏳ Processing...' : `🚀 Process ${counts.waiting} Resume${counts.waiting !== 1 ? 's' : ''}`}
          </button>
        )}
      </div>
    </>
  );
}