import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { jobAPI } from '../hooks/useApi';

const ScoreRing = ({ score }) => {
  const color = score >= 75 ? '#10b981' : score >= 50 ? '#f59e0b' : score >= 30 ? '#6366f1' : '#ef4444';
  const label = score >= 75 ? 'Strong Match' : score >= 50 ? 'Good Match' : score >= 30 ? 'Partial Match' : 'Not Suitable';
  const r = 54, circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      <svg width="140" height="140" viewBox="0 0 140 140">
        <circle cx="70" cy="70" r={r} fill="none" stroke="var(--border)" strokeWidth="10" />
        <circle cx="70" cy="70" r={r} fill="none" stroke={color} strokeWidth="10"
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
          transform="rotate(-90 70 70)" style={{ transition: 'stroke-dasharray 1s ease' }} />
        <text x="70" y="65" textAnchor="middle" fill={color} fontSize="28" fontWeight="700" fontFamily="Syne, sans-serif">{score}</text>
        <text x="70" y="85" textAnchor="middle" fill="var(--text-secondary)" fontSize="11">/100</text>
      </svg>
      <span style={{ background: color + '20', color, padding: '4px 14px', borderRadius: 20, fontSize: 13, fontWeight: 600 }}>{label}</span>
    </div>
  );
};

const ScoreBar = ({ label, score, max, color }) => (
  <div style={{ marginBottom: 14 }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
      <span style={{ fontSize: 13, fontWeight: 500 }}>{label}</span>
      <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{score}/{max}</span>
    </div>
    <div style={{ height: 8, background: 'var(--border)', borderRadius: 4, overflow: 'hidden' }}>
      <div style={{ height: '100%', width: `${(score / max) * 100}%`, background: color, borderRadius: 4, transition: 'width 1s ease' }} />
    </div>
  </div>
);

export default function ResumeScanner() {
  const [tab, setTab] = useState('scan');
  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState('');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [dragOver, setDragOver] = useState(false);

  useEffect(() => { jobAPI.getAll({ status: 'open' }).then(r => setJobs(r.data)).catch(() => {}); }, []);

  const handleFile = (f) => {
    if (!f) return;
    if (!f.name.match(/\.(pdf|doc|docx)$/i)) { toast.error('Only PDF or DOC files allowed'); return; }
    setFile(f);
    setResult(null);
  };

  const scan = async () => {
    if (!file) return toast.error('Please upload a resume first');
    if (tab === 'scan' && !selectedJob) return toast.error('Please select a job to scan against');
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('resume', file);
      if (tab === 'scan') fd.append('jobId', selectedJob);
      const endpoint = tab === 'scan' ? '/api/resume/scan' : '/api/resume/suggest-jobs';
      const r = await axios.post(endpoint, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setResult(r.data);
      toast.success('Resume scanned successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Scan failed. Check Groq API key in .env');
    } finally { setLoading(false); }
  };
  const createCandidate = async () => {
  if (!file) return toast.error('Please upload a resume first');
  setLoading(true);
  try {
    const fd = new FormData();
    fd.append('resume', file);
    const r = await axios.post('/api/resume/create-candidate', fd, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    toast.success(`✅ ${r.data.candidate.name} added to Candidates!`);
    setFile(null);
    setResult(null);
  } catch (err) {
    toast.error(err.response?.data?.message || 'Failed to create candidate');
  } finally { setLoading(false); }
};

  const SCORE_COLORS = { skills: '#6366f1', experience: '#10b981', education: '#f59e0b', contact: '#3b82f6' };

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-title">Resume Scanner</h2>
          <p className="page-subtitle">AI-powered ATS scoring & job matching using Groq</p>
        </div>
      </div>

      <div className="tabs">
        <button className={`tab ${tab === 'scan' ? 'active' : ''}`} onClick={() => { setTab('scan'); setResult(null); }}>🎯 ATS Score vs Job</button>
        <button className={`tab ${tab === 'suggest' ? 'active' : ''}`} onClick={() => { setTab('suggest'); setResult(null); }}>💡 Job Suggestions</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: result ? '1fr 1.4fr' : '1fr', gap: 24 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          <div className="card"
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={e => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]); }}
            style={{ border: `2px dashed ${dragOver ? 'var(--accent)' : file ? 'var(--green)' : 'var(--border-light)'}`, background: dragOver ? 'var(--accent-dim)' : file ? 'var(--green-dim)' : 'var(--bg-surface)', textAlign: 'center', padding: 32, cursor: 'pointer' }}
            onClick={() => document.getElementById('resume-input').click()}>
            <input id="resume-input" type="file" accept=".pdf,.doc,.docx" style={{ display: 'none' }} onChange={e => handleFile(e.target.files[0])} />
            {file ? (
              <>
                <div style={{ fontSize: 40, marginBottom: 8 }}>📄</div>
                <div style={{ fontWeight: 600, color: 'var(--green)', fontSize: 15 }}>{file.name}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{(file.size / 1024).toFixed(0)} KB — Click to change</div>
              </>
            ) : (
              <>
                <div style={{ fontSize: 40, marginBottom: 8 }}>📁</div>
                <div style={{ fontWeight: 600, fontSize: 15 }}>Drop resume here or click to upload</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>PDF, DOC, DOCX — Max 5MB</div>
              </>
            )}
          </div>

          {tab === 'scan' && (
            <div className="card">
              <div style={{ fontWeight: 600, marginBottom: 12, fontSize: 14 }}>Select Job to Match Against</div>
              <select className="form-input form-select" value={selectedJob} onChange={e => setSelectedJob(e.target.value)}>
                <option value="">-- Select a Job --</option>
                {jobs.map(j => <option key={j.id} value={j.id}>{j.title} — {j.client?.companyName || 'N/A'}</option>)}
              </select>
              {selectedJob && (() => {
                const j = jobs.find(x => x.id == selectedJob);
                return j ? (
                  <div style={{ marginTop: 12, padding: '10px 14px', background: 'var(--bg-elevated)', borderRadius: 8, fontSize: 13 }}>
                    <div style={{ fontWeight: 500, marginBottom: 4 }}>{j.title}</div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: 12 }}>Skills: {(Array.isArray(j.requiredSkills) ? j.requiredSkills : []).join(', ')}</div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: 12 }}>Exp: {j.minExperience}–{j.maxExperience} yrs | ₹{j.minSalary}–{j.maxSalary} LPA</div>
                  </div>
                ) : null;
              })()}
            </div>
          )}

          {tab === 'suggest' && (
            <div className="card" style={{ background: 'var(--accent-dim)', border: '1px solid rgba(99,102,241,0.2)' }}>
              <div style={{ fontSize: 13, color: 'var(--accent-light)', lineHeight: 1.6 }}>
                💡 Upload any resume — AI will automatically suggest which jobs are the best fit, ranked by ATS score.
              </div>
            </div>
          )}

          <button className="btn btn-primary" style={{ justifyContent: 'center', padding: 14, fontSize: 15 }} onClick={scan} disabled={loading}>
            {loading ? <><div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> Scanning with AI...</> : <>{tab === 'scan' ? '🎯 Scan & Get ATS Score' : '💡 Find Matching Jobs'}</>}
          </button>
          <button 
  className="btn btn-secondary" 
  style={{ justifyContent: 'center', padding: 14, fontSize: 15, marginTop: -8 }} 
  onClick={createCandidate} 
  disabled={loading}>
  👤 Auto-Add to Candidates
</button>

          {loading && (
            <div className="card" style={{ textAlign: 'center', padding: 20 }}>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 2 }}>
                <div>🤖 Groq AI is reading the resume...</div>
                <div>📊 Calculating skill matches...</div>
                <div>🎯 Generating ATS score...</div>
              </div>
            </div>
          )}
        </div>

        {result && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {result.parsedResume && (
              <div className="card">
                <div style={{ fontWeight: 600, marginBottom: 14, fontSize: 14 }}>👤 Resume Parsed</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                  <div className="avatar" style={{ width: 48, height: 48, fontSize: 18 }}>{result.parsedResume.name?.[0] || '?'}</div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 16 }}>{result.parsedResume.name || 'Unknown'}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{result.parsedResume.currentRole} {result.parsedResume.currentCompany ? `@ ${result.parsedResume.currentCompany}` : ''}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{result.parsedResume.email} {result.parsedResume.phone}</div>
                  </div>
                </div>
                {result.parsedResume.summary && (
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)', background: 'var(--bg-elevated)', padding: '10px 14px', borderRadius: 8, marginBottom: 12, lineHeight: 1.6 }}>
                    {result.parsedResume.summary}
                  </div>
                )}
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
                  {(result.parsedResume.skills || []).map(s => (
                    <span key={s} style={{ background: 'var(--accent-dim)', color: 'var(--accent-light)', borderRadius: 4, padding: '3px 8px', fontSize: 12 }}>{s}</span>
                  ))}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  Experience: <strong style={{ color: 'var(--text-primary)' }}>{result.parsedResume.totalExperience} years</strong>
                {result.parsedResume.education?.length > 0 && (
  <span> | {typeof result.parsedResume.education[0] === 'object' 
    ? Object.values(result.parsedResume.education[0]).join(', ') 
    : result.parsedResume.education[0]}
  </span>
)}
                </div>
              </div>
            )}

            {result.atsResult && (
              <div className="card">
                <div style={{ fontWeight: 600, marginBottom: 16, fontSize: 14 }}>🎯 ATS Score — {result.atsResult.job?.title}</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                  <ScoreRing score={result.atsResult.total} />
                  <div>
                    <ScoreBar label="Skills Match" score={result.atsResult.breakdown?.skills?.score || 0} max={40} color={SCORE_COLORS.skills} />
                    <ScoreBar label="Experience" score={result.atsResult.breakdown?.experience?.score || 0} max={30} color={SCORE_COLORS.experience} />
                    <ScoreBar label="Education" score={result.atsResult.breakdown?.education?.score || 0} max={15} color={SCORE_COLORS.education} />
                    <ScoreBar label="Contact Info" score={result.atsResult.breakdown?.contact?.score || 0} max={15} color={SCORE_COLORS.contact} />
                  </div>
                </div>

                {result.atsResult.breakdown?.skills && (
                  <div style={{ marginTop: 14, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--green)', marginBottom: 6 }}>✅ Matched Skills</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                        {result.atsResult.breakdown.skills.matched.length > 0
                          ? result.atsResult.breakdown.skills.matched.map(s => <span key={s} style={{ background: 'var(--green-dim)', color: 'var(--green)', borderRadius: 4, padding: '2px 7px', fontSize: 11 }}>{s}</span>)
                          : <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>None matched</span>}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--red)', marginBottom: 6 }}>❌ Missing Skills</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                        {result.atsResult.breakdown.skills.missing.length > 0
                          ? result.atsResult.breakdown.skills.missing.map(s => <span key={s} style={{ background: 'var(--red-dim)', color: 'var(--red)', borderRadius: 4, padding: '2px 7px', fontSize: 11 }}>{s}</span>)
                          : <span style={{ fontSize: 12, color: 'var(--green)' }}>All skills present!</span>}
                      </div>
                    </div>
                  </div>
                )}

                {result.atsResult.feedback && (
                  <div style={{ marginTop: 14, borderTop: '1px solid var(--border)', paddingTop: 14 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>🤖 AI Feedback</div>
                    <div style={{ fontSize: 13, color: 'var(--green)', marginBottom: 8, background: 'var(--green-dim)', padding: '8px 12px', borderRadius: 8 }}>👍 {result.atsResult.feedback.good}</div>
                    <div style={{ fontSize: 13, color: 'var(--amber)', marginBottom: 8, background: 'var(--amber-dim)', padding: '8px 12px', borderRadius: 8 }}>⚡ {result.atsResult.feedback.improve}</div>
                    <div style={{ fontSize: 14, fontWeight: 600, textAlign: 'center', padding: '10px', borderRadius: 8, background: 'var(--accent-dim)', color: 'var(--accent-light)' }}>Final: {result.atsResult.feedback.recommendation}</div>
                  </div>
                )}
              </div>
            )}

            {result.jobSuggestions?.length > 0 && (
              <div className="card">
                <div style={{ fontWeight: 600, marginBottom: 14, fontSize: 14 }}>💡 Best Matching Jobs</div>
                {result.jobSuggestions.map((j, i) => (
                  <div key={j.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: i < result.jobSuggestions.length - 1 ? '1px solid var(--border)' : 'none' }}>
                    <div style={{ width: 42, height: 42, borderRadius: 10, background: j.atsScore >= 70 ? 'var(--green-dim)' : j.atsScore >= 45 ? 'var(--accent-dim)' : 'var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14, color: j.atsScore >= 70 ? 'var(--green)' : j.atsScore >= 45 ? 'var(--accent-light)' : 'var(--text-muted)', flexShrink: 0 }}>
                      {j.atsScore}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 500, fontSize: 14 }}>{j.title}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{j.client} {j.location ? `· ${j.location}` : ''}</div>
                      {j.matched?.length > 0 && <div style={{ fontSize: 11, color: 'var(--green)', marginTop: 2 }}>✅ {j.matched.join(', ')}</div>}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{j.minSalary ? `₹${j.minSalary}–${j.maxSalary}L` : ''}</div>
                  </div>
                ))}
              </div>
            )}

            {result.suggestions && (
              <div className="card">
                <div style={{ fontWeight: 600, marginBottom: 6, fontSize: 14 }}>💡 All Job Matches</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 14 }}>
                  Skills found: {(result.parsedSkills || []).join(', ')} | Exp: {result.parsedExperience} yrs
                </div>
                {result.suggestions.map((j, i) => (
                  <div key={j.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: i < result.suggestions.length - 1 ? '1px solid var(--border)' : 'none' }}>
                    <div style={{ width: 46, height: 46, borderRadius: 10, background: j.atsScore >= 70 ? 'var(--green-dim)' : j.atsScore >= 45 ? 'var(--accent-dim)' : 'var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 15, color: j.atsScore >= 70 ? 'var(--green)' : j.atsScore >= 45 ? 'var(--accent-light)' : 'var(--text-muted)', flexShrink: 0 }}>
                      {j.atsScore}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 500 }}>{j.title}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{j.client} · {j.jobType?.replace('_', ' ')}</div>
                    </div>
                    <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, background: j.atsScore >= 70 ? 'var(--green-dim)' : j.atsScore >= 45 ? 'var(--accent-dim)' : 'var(--red-dim)', color: j.atsScore >= 70 ? 'var(--green)' : j.atsScore >= 45 ? 'var(--accent-light)' : 'var(--red)', fontWeight: 600 }}>
                      {j.atsScore >= 70 ? 'Strong' : j.atsScore >= 45 ? 'Good' : 'Weak'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}