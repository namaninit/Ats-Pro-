// FILE: frontend/src/pages/BulkResumeUpload.jsx
// ROUTE: Add <Route path="bulk-upload" element={<BulkResumeUpload />} /> in App.js
// ACTION: New file — create it in frontend/src/pages/

import React, { useState, useRef, useCallback } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

const MAX_FILES = 10;
const ALLOWED_TYPES = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
const STATUS = { WAITING: 'waiting', SCANNING: 'scanning', DONE: 'done', ERROR: 'error' };

const statusConfig = {
  waiting:  { label: 'Waiting',  color: '#64748b', bg: 'rgba(100,116,139,0.1)',  icon: '⏳' },
  scanning: { label: 'Scanning', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)',   icon: '🔍' },
  done:     { label: 'Created',  color: '#10b981', bg: 'rgba(16,185,129,0.1)',   icon: '✅' },
  error:    { label: 'Failed',   color: '#ef4444', bg: 'rgba(239,68,68,0.1)',    icon: '❌' },
};

export default function BulkResumeUpload() {
  const [files, setFiles] = useState([]);       // { id, file, status, result, error }
  const [isDragging, setIsDragging] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [jobId, setJobId] = useState('');       // optional: link candidates to a job
  const [jobs, setJobs] = useState([]);
  const fileInputRef = useRef(null);

  // Load jobs for dropdown on mount
  React.useEffect(() => {
    axios.get('/api/jobs?status=open')
      .then(r => setJobs(r.data.jobs || r.data || []))
      .catch(() => {});
  }, []);

  const addFiles = useCallback((incoming) => {
    const valid = Array.from(incoming).filter(f => ALLOWED_TYPES.includes(f.type));
    const invalid = Array.from(incoming).length - valid.length;
    if (invalid > 0) toast.error(`${invalid} file(s) skipped — only PDF/DOC/DOCX allowed`);

    setFiles(prev => {
      const combined = [...prev];
      for (const f of valid) {
        if (combined.length >= MAX_FILES) { toast.error(`Max ${MAX_FILES} resumes at once`); break; }
        if (combined.find(x => x.file.name === f.name)) continue; // skip dupes
        combined.push({ id: crypto.randomUUID(), file: f, status: STATUS.WAITING, result: null, error: null });
      }
      return combined;
    });
  }, []);

  const onDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    addFiles(e.dataTransfer.files);
  }, [addFiles]);

  const removeFile = (id) => {
    if (isRunning) return;
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  const updateFile = (id, patch) => {
    setFiles(prev => prev.map(f => f.id === id ? { ...f, ...patch } : f));
  };

  // Process one resume via AI scanner endpoint
  const processOne = async (item) => {
    updateFile(item.id, { status: STATUS.SCANNING });
    try {
      const formData = new FormData();
      formData.append('resume', item.file);
      if (jobId) formData.append('jobId', jobId);

      // Use existing resume scanner endpoint — it returns extracted data
      const { data } = await axios.post('/api/resume-scanner/scan-and-create', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      updateFile(item.id, { status: STATUS.DONE, result: data });
    } catch (err) {
      const msg = err.response?.data?.message || 'Scan failed';
      updateFile(item.id, { status: STATUS.ERROR, error: msg });
    }
  };

  // Run all sequentially (avoids hammering Groq rate limits)
  const runAll = async () => {
    const waiting = files.filter(f => f.status === STATUS.WAITING || f.status === STATUS.ERROR);
    if (!waiting.length) return toast.error('No files to process');
    setIsRunning(true);
    for (const item of waiting) {
      await processOne(item);
    }
    setIsRunning(false);
    const done = files.filter(f => f.status === STATUS.DONE).length + waiting.filter(f => f.status !== STATUS.ERROR).length;
    toast.success(`Bulk upload complete!`);
  };

  const clearAll = () => {
    if (isRunning) return;
    setFiles([]);
  };

  const retryFailed = async () => {
    const failed = files.filter(f => f.status === STATUS.ERROR);
    if (!failed.length) return;
    setIsRunning(true);
    for (const item of failed) {
      await processOne(item);
    }
    setIsRunning(false);
  };

  const counts = {
    total: files.length,
    waiting: files.filter(f => f.status === STATUS.WAITING).length,
    scanning: files.filter(f => f.status === STATUS.SCANNING).length,
    done: files.filter(f => f.status === STATUS.DONE).length,
    error: files.filter(f => f.status === STATUS.ERROR).length,
  };

  const progress = counts.total ? Math.round(((counts.done + counts.error) / counts.total) * 100) : 0;

  return (
    <div style={{ maxWidth: 860, margin: '0 auto' }}>
      {/* Header */}
      <div className="page-header">
        <div>
          <h2 className="page-title">📄 Bulk Resume Upload</h2>
          <p className="page-subtitle">Upload up to {MAX_FILES} resumes — AI scans each and creates candidates automatically</p>
        </div>
        {files.length > 0 && !isRunning && (
          <button className="btn btn-secondary" onClick={clearAll}>🗑️ Clear All</button>
        )}
      </div>

      {/* Job selector */}
      <div className="card" style={{ marginBottom: 16, padding: '14px 18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
            📋 Link to Job (optional):
          </span>
          <select
            className="form-input form-select"
            style={{ flex: 1, minWidth: 200, maxWidth: 360 }}
            value={jobId}
            onChange={e => setJobId(e.target.value)}
            disabled={isRunning}
          >
            <option value="">— No specific job —</option>
            {jobs.map(j => (
              <option key={j.id} value={j.id}>{j.title} ({j.location || 'Any'})</option>
            ))}
          </select>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            Candidates will be assigned to this job after creation
          </span>
        </div>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
        onClick={() => !isRunning && fileInputRef.current?.click()}
        style={{
          border: `2px dashed ${isDragging ? 'var(--accent)' : 'var(--border)'}`,
          borderRadius: 14,
          padding: '36px 24px',
          textAlign: 'center',
          cursor: isRunning ? 'not-allowed' : 'pointer',
          background: isDragging ? 'var(--accent-dim)' : 'var(--bg-surface)',
          transition: 'all 0.2s',
          marginBottom: 20,
          opacity: isRunning ? 0.6 : 1,
        }}
      >
        <div style={{ fontSize: 40, marginBottom: 12 }}>
          {isDragging ? '📂' : '📁'}
        </div>
        <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--text-primary)', marginBottom: 6 }}>
          {isDragging ? 'Drop resumes here!' : 'Drag & drop resumes here'}
        </div>
        <div style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 14 }}>
          or click to browse — PDF, DOC, DOCX supported
        </div>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          background: 'var(--accent)', color: '#fff',
          padding: '8px 20px', borderRadius: 8, fontSize: 13, fontWeight: 600
        }}>
          📎 Choose Files
          <span style={{
            background: 'rgba(255,255,255,0.2)',
            borderRadius: 20, padding: '1px 8px', fontSize: 11
          }}>
            max {MAX_FILES}
          </span>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.doc,.docx"
          style={{ display: 'none' }}
          onChange={e => { addFiles(e.target.files); e.target.value = ''; }}
        />
      </div>

      {/* Progress bar — shown when processing */}
      {isRunning && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 600 }}>
              🔍 Scanning resumes with AI...
            </span>
            <span style={{ fontSize: 13, color: 'var(--accent-light)', fontWeight: 700 }}>
              {progress}%
            </span>
          </div>
          <div style={{ height: 6, background: 'var(--bg-elevated)', borderRadius: 10, overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              width: `${progress}%`,
              background: 'linear-gradient(90deg, var(--accent), #818cf8)',
              borderRadius: 10,
              transition: 'width 0.4s ease'
            }} />
          </div>
        </div>
      )}

      {/* Stats row */}
      {files.length > 0 && (
        <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
          {[
            { label: 'Total', value: counts.total, color: 'var(--text-secondary)' },
            { label: 'Waiting', value: counts.waiting, color: '#64748b' },
            { label: 'Scanning', value: counts.scanning, color: '#f59e0b' },
            { label: 'Created', value: counts.done, color: '#10b981' },
            { label: 'Failed', value: counts.error, color: '#ef4444' },
          ].map(s => (
            <div key={s.label} style={{
              padding: '6px 14px',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              display: 'flex', gap: 6, alignItems: 'center'
            }}>
              <span style={{ fontWeight: 700, color: s.color, fontSize: 15 }}>{s.value}</span>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{s.label}</span>
            </div>
          ))}
        </div>
      )}

      {/* File list */}
      {files.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
          {files.map((item, idx) => {
            const cfg = statusConfig[item.status];
            return (
              <div key={item.id} style={{
                background: 'var(--bg-surface)',
                border: `1px solid ${item.status === STATUS.DONE ? 'rgba(16,185,129,0.2)' : item.status === STATUS.ERROR ? 'rgba(239,68,68,0.2)' : 'var(--border)'}`,
                borderRadius: 10,
                padding: '12px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                transition: 'all 0.2s'
              }}>
                {/* Index */}
                <div style={{
                  width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
                  background: 'var(--bg-elevated)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, fontWeight: 700, color: 'var(--text-muted)'
                }}>
                  {idx + 1}
                </div>

                {/* File icon */}
                <div style={{ fontSize: 22, flexShrink: 0 }}>
                  {item.file.name.endsWith('.pdf') ? '📄' : '📝'}
                </div>

                {/* File info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontWeight: 600, fontSize: 13,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    color: 'var(--text-primary)'
                  }}>
                    {item.file.name}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                    {(item.file.size / 1024).toFixed(0)} KB
                    {item.result?.candidate?.name && (
                      <span style={{ color: '#10b981', marginLeft: 8 }}>
                        → {item.result.candidate.name}
                        {item.result.candidate.email && ` · ${item.result.candidate.email}`}
                      </span>
                    )}
                    {item.error && (
                      <span style={{ color: '#ef4444', marginLeft: 8 }}>{item.error}</span>
                    )}
                  </div>
                </div>

                {/* ATS Score (if done) */}
                {item.status === STATUS.DONE && item.result?.atsScore != null && (
                  <div style={{
                    textAlign: 'center', padding: '4px 10px',
                    background: 'rgba(16,185,129,0.1)', borderRadius: 8, flexShrink: 0
                  }}>
                    <div style={{ fontSize: 15, fontWeight: 800, color: '#10b981' }}>
                      {item.result.atsScore}
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>ATS</div>
                  </div>
                )}

                {/* Status badge */}
                <div style={{
                  padding: '4px 10px', borderRadius: 20, flexShrink: 0,
                  background: cfg.bg, color: cfg.color,
                  fontSize: 12, fontWeight: 600,
                  display: 'flex', alignItems: 'center', gap: 5
                }}>
                  {item.status === STATUS.SCANNING ? (
                    <span style={{
                      display: 'inline-block', width: 10, height: 10, borderRadius: '50%',
                      border: `2px solid ${cfg.color}`, borderTopColor: 'transparent',
                      animation: 'spin 0.7s linear infinite'
                    }} />
                  ) : cfg.icon}
                  {cfg.label}
                </div>

                {/* Remove button */}
                {!isRunning && item.status !== STATUS.SCANNING && (
                  <button
                    onClick={() => removeFile(item.id)}
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: 'var(--text-muted)', fontSize: 16, padding: '0 2px',
                      flexShrink: 0, lineHeight: 1
                    }}
                    title="Remove"
                  >✕</button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Action buttons */}
      {files.length > 0 && (
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button
            className="btn btn-primary"
            onClick={runAll}
            disabled={isRunning || counts.waiting === 0}
            style={{ opacity: (isRunning || counts.waiting === 0) ? 0.5 : 1 }}
          >
            {isRunning
              ? `⏳ Scanning ${counts.scanning > 0 ? `(${counts.scanning} active)` : ''}...`
              : `🚀 Start AI Scan (${counts.waiting} resume${counts.waiting !== 1 ? 's' : ''})`}
          </button>

          {counts.error > 0 && !isRunning && (
            <button className="btn btn-secondary" onClick={retryFailed}>
              🔄 Retry Failed ({counts.error})
            </button>
          )}

          {counts.done > 0 && (
            <a href="/candidates" className="btn btn-secondary">
              👤 View Candidates ({counts.done} added)
            </a>
          )}
        </div>
      )}

      {/* Empty state */}
      {files.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: 48, marginBottom: 10 }}>🗂️</div>
          <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>No resumes added yet</div>
          <div style={{ fontSize: 13 }}>Drag files above or click "Choose Files" to get started</div>
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}