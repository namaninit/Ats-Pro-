import React, { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { cvMakerAPI } from '../hooks/useApi';

const TEMPLATES = [
  { id: 'modern',       name: 'Modern',       accent: '#6366f1', desc: 'Sidebar layout, bold header' },
  { id: 'classic',      name: 'Classic',      accent: '#1f2937', desc: 'Traditional single column' },
  { id: 'minimal',      name: 'Minimal',      accent: '#0f766e', desc: 'Clean, lots of white space' },
  { id: 'creative',     name: 'Creative',     accent: '#db2777', desc: 'Color banner, skill pills' },
  { id: 'professional', name: 'Professional', accent: '#1d4ed8', desc: 'Centered header, section bands' },
];

const EMPTY_FORM = { fullName: '', email: '', phone: '', location: '', targetJob: '', background: '' };

export default function CVMaker() {
  const [tab, setTab] = useState('create'); // create | saved
  const [templateId, setTemplateId] = useState('modern');
  const [form, setForm] = useState(EMPTY_FORM);
  const [cv, setCv] = useState(null);       // generated/edited CV content
  const [currentId, setCurrentId] = useState(null); // saved CvDocument id, if any
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [saved, setSaved] = useState([]);
  const [loadingSaved, setLoadingSaved] = useState(false);
  const printRef = useRef(null);

  const handle = (e) => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const loadSaved = async () => {
    setLoadingSaved(true);
    try {
      const r = await cvMakerAPI.getAll();
      setSaved(r.data);
    } catch { toast.error('Failed to load saved CVs'); }
    finally { setLoadingSaved(false); }
  };

  useEffect(() => { if (tab === 'saved') loadSaved(); }, [tab]);

  const generate = async () => {
    if (!form.fullName || !form.targetJob || !form.background) {
      toast.error('Full name, target job, and background notes are required');
      return;
    }
    setGenerating(true);
    try {
      const r = await cvMakerAPI.generate(form);
      setCv(r.data);
      setCurrentId(null);
      toast.success('CV generated! Review and edit below.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Generation failed');
    } finally { setGenerating(false); }
  };

  const save = async () => {
    if (!cv) return;
    setSaving(true);
    try {
      const payload = { fullName: form.fullName, targetJob: form.targetJob, templateId, data: cv };
      if (currentId) {
        await cvMakerAPI.update(currentId, payload);
        toast.success('CV updated');
      } else {
        const r = await cvMakerAPI.save(payload);
        setCurrentId(r.data.id);
        toast.success('CV saved');
      }
    } catch { toast.error('Save failed'); }
    finally { setSaving(false); }
  };

  const openSaved = (doc) => {
    setForm(p => ({ ...p, fullName: doc.fullName, targetJob: doc.targetJob }));
    setCv(doc.data);
    setTemplateId(doc.templateId);
    setCurrentId(doc.id);
    setTab('create');
    setEditMode(false);
  };

  const deleteSaved = async (id) => {
    if (!window.confirm('Delete this saved CV?')) return;
    try {
      await cvMakerAPI.delete(id);
      setSaved(p => p.filter(s => s.id !== id));
      toast.success('Deleted');
    } catch { toast.error('Delete failed'); }
  };

  const downloadPdf = () => {
    if (!cv) return;
    window.print();
  };

  // ── Editable field helpers ──
  const updateField = (key, value) => setCv(p => ({ ...p, [key]: value }));
  const updateExperience = (i, key, value) => setCv(p => {
    const exp = [...(p.experience || [])];
    exp[i] = { ...exp[i], [key]: value };
    return { ...p, experience: exp };
  });
  const updateExpBullets = (i, text) => updateExperience(i, 'bullets', text.split('\n').filter(Boolean));
  const updateEducation = (i, key, value) => setCv(p => {
    const edu = [...(p.education || [])];
    edu[i] = { ...edu[i], [key]: value };
    return { ...p, education: edu };
  });
  const addExperience = () => setCv(p => ({ ...p, experience: [...(p.experience || []), { title: '', company: '', duration: '', bullets: [] }] }));
  const removeExperience = (i) => setCv(p => ({ ...p, experience: p.experience.filter((_, idx) => idx !== i) }));
  const addEducation = () => setCv(p => ({ ...p, education: [...(p.education || []), { degree: '', institution: '', year: '' }] }));
  const removeEducation = (i) => setCv(p => ({ ...p, education: p.education.filter((_, idx) => idx !== i) }));

  return (
    <div className="page-content">
      <div className="page-header no-print">
        <div>
          <h1 className="page-title">📄 CV Maker</h1>
          <p className="page-subtitle">AI-generated, ATS-optimized CVs — pick a template, describe the candidate, let AI write it</p>
        </div>
      </div>

      <div className="tabs no-print">
        <button className={`tab ${tab === 'create' ? 'active' : ''}`} onClick={() => setTab('create')}>✨ Create</button>
        <button className={`tab ${tab === 'saved' ? 'active' : ''}`} onClick={() => setTab('saved')}>💾 Saved CVs ({saved.length || ''})</button>
      </div>

      {tab === 'saved' ? (
        <SavedList loading={loadingSaved} saved={saved} onOpen={openSaved} onDelete={deleteSaved} />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: cv ? '380px 1fr' : '1fr', gap: 24, alignItems: 'flex-start' }}>

          {/* ── Left: template picker + form ── */}
          <div className="no-print" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div className="card card-sm">
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                1. Choose a template
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {TEMPLATES.map(t => (
                  <button key={t.id} onClick={() => setTemplateId(t.id)}
                    style={{
                      textAlign: 'left', padding: 10, borderRadius: 10, cursor: 'pointer',
                      border: templateId === t.id ? `2px solid ${t.accent}` : '1px solid var(--border-light)',
                      background: templateId === t.id ? `${t.accent}22` : 'var(--bg-elevated)',
                    }}>
                    <div style={{ width: '100%', height: 44, borderRadius: 6, background: '#fff', marginBottom: 8, padding: 5, display: 'flex', flexDirection: 'column', gap: 3 }}>
                      <div style={{ width: '60%', height: 6, borderRadius: 2, background: t.accent }} />
                      <div style={{ width: '90%', height: 3, borderRadius: 2, background: '#d1d5db' }} />
                      <div style={{ width: '75%', height: 3, borderRadius: 2, background: '#d1d5db' }} />
                      <div style={{ width: '85%', height: 3, borderRadius: 2, background: '#e5e7eb' }} />
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>{t.name}</div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{t.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="card card-sm">
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                2. Candidate details
              </div>
              <div className="form-group">
                <label className="form-label">Full Name *</label>
                <input className="form-input" name="fullName" value={form.fullName} onChange={handle} placeholder="Ritu Sharma" />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input className="form-input" name="email" value={form.email} onChange={handle} placeholder="ritu@email.com" />
                </div>
                <div className="form-group">
                  <label className="form-label">Phone</label>
                  <input className="form-input" name="phone" value={form.phone} onChange={handle} placeholder="+91 98765 43210" />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Location</label>
                <input className="form-input" name="location" value={form.location} onChange={handle} placeholder="Bengaluru, India" />
              </div>
              <div className="form-group">
                <label className="form-label">Target Job Title *</label>
                <input className="form-input" name="targetJob" value={form.targetJob} onChange={handle} placeholder="Software Engineer" />
              </div>
              <div className="form-group">
                <label className="form-label">Background — experience, education, skills (in your own words) *</label>
                <textarea className="form-input" name="background" value={form.background} onChange={handle} rows={6}
                  placeholder="e.g. 2 years as backend developer at XYZ Pvt Ltd building REST APIs in Node.js and MySQL. Led a team of 2 juniors on a payments integration project. BTech in Computer Science from ABC University, 2022. Skills: JavaScript, Node.js, React, AWS, Docker." />
              </div>
              <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={generate} disabled={generating}>
                {generating ? <><div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> Generating...</> : '✨ Generate with AI'}
              </button>
            </div>
          </div>

          {/* ── Right: preview / edit ── */}
          {cv && (
            <div>
              <div className="no-print" style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
                <button className="btn btn-secondary btn-sm" onClick={() => setEditMode(m => !m)}>
                  {editMode ? '👁️ Preview' : '✏️ Edit content'}
                </button>
                <button className="btn btn-secondary btn-sm" onClick={generate} disabled={generating}>🔄 Regenerate</button>
                <button className="btn btn-primary btn-sm" onClick={save} disabled={saving}>
                  {saving ? 'Saving...' : currentId ? '💾 Update' : '💾 Save'}
                </button>
                <button className="btn btn-secondary btn-sm" onClick={downloadPdf}>⬇️ Download PDF</button>
              </div>

              {editMode ? (
                <EditPanel cv={cv} updateField={updateField} updateExperience={updateExperience}
                  updateExpBullets={updateExpBullets} updateEducation={updateEducation}
                  addExperience={addExperience} removeExperience={removeExperience}
                  addEducation={addEducation} removeEducation={removeEducation} />
              ) : (
                <div ref={printRef} className="cv-page">
                  <CvRender templateId={templateId} cv={cv} accent={TEMPLATES.find(t => t.id === templateId)?.accent} />
                </div>
              )}

              {/* Hidden always-rendered printable copy so Download PDF works even in edit mode */}
              {editMode && (
                <div style={{ display: 'none' }}>
                  <div className="cv-page">
                    <CvRender templateId={templateId} cv={cv} accent={TEMPLATES.find(t => t.id === templateId)?.accent} />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <style>{`
        @page { size: A4; margin: 12mm; }
        @media print {
          body * { visibility: hidden; }
          .cv-page, .cv-page * { visibility: visible; }
          .cv-page { position: absolute; top: 0; left: 0; width: 100%; margin: 0; box-shadow: none !important; border-radius: 0 !important; }
          .no-print { display: none !important; }
        }
      `}</style>
    </div>
  );
}

// ─── Saved CVs list ────────────────────────────────────────────────────────
function SavedList({ loading, saved, onOpen, onDelete }) {
  if (loading) return <div className="loading"><div className="spinner" /></div>;
  if (saved.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">📄</div>
        <h3>No saved CVs yet</h3>
        <p>Generate one from the Create tab and hit Save.</p>
      </div>
    );
  }
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 }}>
      {saved.map(doc => (
        <div key={doc.id} className="card card-sm">
          <div style={{ fontWeight: 700, marginBottom: 4 }}>{doc.fullName}</div>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 4 }}>{doc.targetJob}</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 14 }}>
            Template: {doc.templateId} · {new Date(doc.updatedAt).toLocaleDateString('en-IN')}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-secondary btn-sm" style={{ flex: 1, justifyContent: 'center' }} onClick={() => onOpen(doc)}>Open</button>
            <button className="btn btn-danger btn-sm" onClick={() => onDelete(doc.id)}>🗑️</button>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Edit panel — plain fields feeding back into cv state ───────────────────
function EditPanel({ cv, updateField, updateExperience, updateExpBullets, updateEducation, addExperience, removeExperience, addEducation, removeEducation }) {
  return (
    <div className="card">
      <div className="form-group">
        <label className="form-label">Professional Summary</label>
        <textarea className="form-input" rows={3} value={cv.professionalSummary || ''} onChange={e => updateField('professionalSummary', e.target.value)} />
      </div>
      <div className="form-group">
        <label className="form-label">Skills (comma separated)</label>
        <input className="form-input" value={(cv.skills || []).join(', ')} onChange={e => updateField('skills', e.target.value.split(',').map(s => s.trim()).filter(Boolean))} />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 20, marginBottom: 8 }}>
        <label className="form-label" style={{ margin: 0 }}>Experience</label>
        <button className="btn btn-secondary btn-sm" onClick={addExperience}>+ Add role</button>
      </div>
      {(cv.experience || []).map((exp, i) => (
        <div key={i} className="card card-sm" style={{ marginBottom: 12, background: 'var(--bg-elevated)' }}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Title</label>
              <input className="form-input" value={exp.title || ''} onChange={e => updateExperience(i, 'title', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Company</label>
              <input className="form-input" value={exp.company || ''} onChange={e => updateExperience(i, 'company', e.target.value)} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Duration</label>
            <input className="form-input" value={exp.duration || ''} onChange={e => updateExperience(i, 'duration', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Bullets (one per line)</label>
            <textarea className="form-input" rows={4} value={(exp.bullets || []).join('\n')} onChange={e => updateExpBullets(i, e.target.value)} />
          </div>
          <button className="btn btn-danger btn-sm" onClick={() => removeExperience(i)}>Remove role</button>
        </div>
      ))}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 20, marginBottom: 8 }}>
        <label className="form-label" style={{ margin: 0 }}>Education</label>
        <button className="btn btn-secondary btn-sm" onClick={addEducation}>+ Add education</button>
      </div>
      {(cv.education || []).map((edu, i) => (
        <div key={i} className="card card-sm" style={{ marginBottom: 12, background: 'var(--bg-elevated)' }}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Degree</label>
              <input className="form-input" value={edu.degree || ''} onChange={e => updateEducation(i, 'degree', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Institution</label>
              <input className="form-input" value={edu.institution || ''} onChange={e => updateEducation(i, 'institution', e.target.value)} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Year</label>
            <input className="form-input" value={edu.year || ''} onChange={e => updateEducation(i, 'year', e.target.value)} />
          </div>
          <button className="btn btn-danger btn-sm" onClick={() => removeEducation(i)}>Remove</button>
        </div>
      ))}

      <div className="form-group" style={{ marginTop: 20 }}>
        <label className="form-label">Certifications (comma separated)</label>
        <input className="form-input" value={(cv.certifications || []).join(', ')} onChange={e => updateField('certifications', e.target.value.split(',').map(s => s.trim()).filter(Boolean))} />
      </div>
    </div>
  );
}

// ─── CV render — 5 distinct print-ready templates ───────────────────────────
function CvRender({ templateId, cv, accent }) {
  const c = cv.contactInfo || {};
  const contactParts = [];
  if (c.email) contactParts.push(`✉️ ${c.email}`);
  if (c.phone) contactParts.push(`📞 ${c.phone}`);
  if (c.location) contactParts.push(`📍 ${c.location}`);
  const contactLine = contactParts.join('   ·   ');

  const pageBase = {
    background: '#fff', color: '#1f2937', width: '210mm', maxWidth: '210mm',
    margin: '0 auto', boxShadow: '0 8px 32px rgba(0,0,0,0.35)', fontFamily: 'Georgia, "Times New Roman", serif',
    fontSize: 13, lineHeight: 1.55, borderRadius: 3, overflow: 'hidden',
  };

  if (templateId === 'modern') {
    return (
      <div style={{ ...pageBase, display: 'flex', fontFamily: '"DM Sans", Arial, sans-serif' }}>
        <div style={{ width: '32%', background: '#1f2937', color: '#fff', padding: '32px 22px' }}>
          <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 4, wordBreak: 'break-word' }}>{c.fullName}</div>
          <div style={{ fontSize: 12, color: accent, fontWeight: 700, marginBottom: 20 }}>{cv.targetJob || ''}</div>
          <div style={{ fontSize: 10.5, color: '#cbd5e1', marginBottom: 24, lineHeight: 2 }}>
            {c.email && <div>✉️ {c.email}</div>}
            {c.phone && <div>📞 {c.phone}</div>}
            {c.location && <div>📍 {c.location}</div>}
          </div>
          <SidebarSection title="Skills" color={accent}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
              {(cv.skills || []).map((s, i) => (
                <span key={i} style={{ fontSize: 10, background: 'rgba(255,255,255,0.1)', padding: '3px 8px', borderRadius: 10 }}>{s}</span>
              ))}
            </div>
          </SidebarSection>
          {cv.education?.length > 0 && (
            <SidebarSection title="Education" color={accent}>
              {cv.education.map((e, i) => (
                <div key={i} style={{ marginBottom: 10, fontSize: 11 }}>
                  <div style={{ fontWeight: 700 }}>{e.degree}</div>
                  <div style={{ color: '#cbd5e1' }}>{e.institution}</div>
                  <div style={{ color: '#94a3b8', fontSize: 10 }}>{e.year}</div>
                </div>
              ))}
            </SidebarSection>
          )}
          {cv.certifications?.length > 0 && (
            <SidebarSection title="Certifications" color={accent}>
              {cv.certifications.map((cert, i) => <div key={i} style={{ fontSize: 11, marginBottom: 5 }}>{cert}</div>)}
            </SidebarSection>
          )}
        </div>
        <div style={{ flex: 1, padding: '32px 28px' }}>
          <MainSection title="Summary" color={accent}><p style={{ fontSize: 12.5 }}>{cv.professionalSummary}</p></MainSection>
          {cv.experience?.length > 0 && (
            <MainSection title="Experience" color={accent}>
              {cv.experience.map((exp, i) => <ExperienceBlock key={i} exp={exp} accent={accent} />)}
            </MainSection>
          )}
        </div>
      </div>
    );
  }

  if (templateId === 'classic') {
    return (
      <div style={{ ...pageBase, padding: '38px 46px' }}>
        <div style={{ textAlign: 'center', borderBottom: `3px solid ${accent}`, paddingBottom: 16, marginBottom: 20 }}>
          <div style={{ fontSize: 27, fontWeight: 800, letterSpacing: 1.5, color: '#111827' }}>{c.fullName?.toUpperCase()}</div>
          <div style={{ fontSize: 12.5, color: accent, fontWeight: 700, marginTop: 5, letterSpacing: 0.5 }}>{cv.targetJob}</div>
          <div style={{ fontSize: 11, color: '#6b7280', marginTop: 8, display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
            {c.email && <span>✉️ {c.email}</span>}
            {c.phone && <span>📞 {c.phone}</span>}
            {c.location && <span>📍 {c.location}</span>}
          </div>
        </div>
        <ClassicSection title="Professional Summary" accent={accent}><p style={{ color: '#374151' }}>{cv.professionalSummary}</p></ClassicSection>
        {cv.experience?.length > 0 && (
          <ClassicSection title="Experience" accent={accent}>
            {cv.experience.map((exp, i) => (
              <div key={i} style={{ marginBottom: 13 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, color: '#111827' }}>
                  <span>{exp.title}{exp.company ? `, ${exp.company}` : ''}</span>
                  <span style={{ fontWeight: 600, color: accent, fontSize: 11 }}>{exp.duration}</span>
                </div>
                <ul style={{ margin: '6px 0 0 18px' }}>
                  {(exp.bullets || []).map((b, j) => <li key={j} style={{ marginBottom: 3, color: '#374151' }}>{b}</li>)}
                </ul>
              </div>
            ))}
          </ClassicSection>
        )}
        {cv.education?.length > 0 && (
          <ClassicSection title="Education" accent={accent}>
            {cv.education.map((e, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                <span style={{ color: '#374151' }}><strong style={{ color: '#111827' }}>{e.degree}</strong> — {e.institution}</span>
                <span style={{ color: accent, fontSize: 11, fontWeight: 600 }}>{e.year}</span>
              </div>
            ))}
          </ClassicSection>
        )}
        {cv.skills?.length > 0 && (
          <ClassicSection title="Skills" accent={accent}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {cv.skills.map((s, i) => (
                <span key={i} style={{ fontSize: 11, background: `${accent}14`, color: accent, padding: '3px 10px', borderRadius: 4, fontWeight: 600 }}>{s}</span>
              ))}
            </div>
          </ClassicSection>
        )}
        {cv.certifications?.length > 0 && <ClassicSection title="Certifications" accent={accent}><p style={{ color: '#374151' }}>{cv.certifications.join('  ·  ')}</p></ClassicSection>}
      </div>
    );
  }

  if (templateId === 'minimal') {
    return (
      <div style={{ ...pageBase, padding: '48px 56px', fontFamily: '"DM Sans", Arial, sans-serif' }}>
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 28, fontWeight: 300, letterSpacing: 0.5 }}>{c.fullName}</div>
          <div style={{ fontSize: 12, color: accent, fontWeight: 600, marginTop: 4 }}>{cv.targetJob}</div>
          <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 8 }}>{contactLine}</div>
        </div>
        <p style={{ fontSize: 12.5, color: '#374151', marginBottom: 28, maxWidth: '85%' }}>{cv.professionalSummary}</p>
        {cv.experience?.length > 0 && (
          <MinimalSection title="Experience" accent={accent}>
            {cv.experience.map((exp, i) => (
              <div key={i} style={{ marginBottom: 16 }}>
                <div style={{ fontWeight: 700, fontSize: 13 }}>{exp.title}</div>
                <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 6 }}>{exp.company} · {exp.duration}</div>
                {(exp.bullets || []).map((b, j) => (
                  <div key={j} style={{ fontSize: 12, color: '#374151', marginBottom: 2 }}>— {b}</div>
                ))}
              </div>
            ))}
          </MinimalSection>
        )}
        {cv.education?.length > 0 && (
          <MinimalSection title="Education" accent={accent}>
            {cv.education.map((e, i) => (
              <div key={i} style={{ fontSize: 12, marginBottom: 6 }}>{e.degree}, {e.institution} <span style={{ color: '#9ca3af' }}>({e.year})</span></div>
            ))}
          </MinimalSection>
        )}
        {cv.skills?.length > 0 && (
          <MinimalSection title="Skills" accent={accent}><div style={{ fontSize: 12, color: '#374151' }}>{cv.skills.join(', ')}</div></MinimalSection>
        )}
      </div>
    );
  }

  if (templateId === 'creative') {
    return (
      <div style={{ ...pageBase, fontFamily: '"DM Sans", Arial, sans-serif' }}>
        <div style={{ background: `linear-gradient(135deg, ${accent}, #f472b6)`, color: '#fff', padding: '36px 40px' }}>
          <div style={{ fontSize: 26, fontWeight: 800 }}>{c.fullName}</div>
          <div style={{ fontSize: 13, opacity: 0.9, marginTop: 2 }}>{cv.targetJob}</div>
          <div style={{ fontSize: 11, opacity: 0.85, marginTop: 10 }}>{contactLine}</div>
        </div>
        <div style={{ padding: '28px 40px' }}>
          <p style={{ fontSize: 12.5, marginBottom: 20 }}>{cv.professionalSummary}</p>
          {cv.skills?.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: accent, marginBottom: 8 }}>SKILLS</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {cv.skills.map((s, i) => (
                  <span key={i} style={{ fontSize: 11, background: `${accent}18`, color: accent, padding: '4px 10px', borderRadius: 14, fontWeight: 600 }}>{s}</span>
                ))}
              </div>
            </div>
          )}
          {cv.experience?.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: accent, marginBottom: 10 }}>EXPERIENCE</div>
              {cv.experience.map((exp, i) => <ExperienceBlock key={i} exp={exp} accent={accent} />)}
            </div>
          )}
          {cv.education?.length > 0 && (
            <div>
              <div style={{ fontSize: 12, fontWeight: 800, color: accent, marginBottom: 10 }}>EDUCATION</div>
              {cv.education.map((e, i) => (
                <div key={i} style={{ marginBottom: 6, fontSize: 12 }}><strong>{e.degree}</strong> — {e.institution} ({e.year})</div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // professional
  return (
    <div style={{ ...pageBase, fontFamily: '"DM Sans", Arial, sans-serif' }}>
      <div style={{ textAlign: 'center', padding: '32px 40px 20px', borderBottom: `3px solid ${accent}` }}>
        <div style={{ fontSize: 24, fontWeight: 800 }}>{c.fullName}</div>
        <div style={{ fontSize: 13, color: accent, fontWeight: 600, marginTop: 2 }}>{cv.targetJob}</div>
        <div style={{ fontSize: 11, color: '#6b7280', marginTop: 8 }}>{contactLine}</div>
      </div>
      <div style={{ padding: '24px 40px' }}>
        <p style={{ fontSize: 12.5, marginBottom: 22, textAlign: 'center', color: '#374151' }}>{cv.professionalSummary}</p>
        {cv.experience?.length > 0 && (
          <div style={{ background: '#f9fafb', padding: '18px 22px', borderRadius: 8, marginBottom: 18 }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: accent, marginBottom: 10, letterSpacing: 0.5 }}>EXPERIENCE</div>
            {cv.experience.map((exp, i) => <ExperienceBlock key={i} exp={exp} accent={accent} />)}
          </div>
        )}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
          {cv.education?.length > 0 && (
            <div style={{ background: '#f9fafb', padding: '16px 20px', borderRadius: 8 }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: accent, marginBottom: 8 }}>EDUCATION</div>
              {cv.education.map((e, i) => (
                <div key={i} style={{ fontSize: 11.5, marginBottom: 6 }}><strong>{e.degree}</strong><br />{e.institution}, {e.year}</div>
              ))}
            </div>
          )}
          {cv.skills?.length > 0 && (
            <div style={{ background: '#f9fafb', padding: '16px 20px', borderRadius: 8 }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: accent, marginBottom: 8 }}>SKILLS</div>
              <div style={{ fontSize: 11.5 }}>{cv.skills.join(', ')}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const SidebarSection = ({ title, color, children }) => (
  <div style={{ marginBottom: 22 }}>
    <div style={{ fontSize: 11, fontWeight: 800, color, marginBottom: 8, letterSpacing: 0.5 }}>{title.toUpperCase()}</div>
    {children}
  </div>
);
const MainSection = ({ title, color, children }) => (
  <div style={{ marginBottom: 22 }}>
    <div style={{ fontSize: 13, fontWeight: 800, color, marginBottom: 10, borderBottom: `1px solid ${color}33`, paddingBottom: 4 }}>{title}</div>
    {children}
  </div>
);
const ClassicSection = ({ title, accent, children }) => (
  <div style={{ marginBottom: 15 }}>
    <div style={{ fontSize: 12.5, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.8, color: accent, borderBottom: `1px solid ${accent}33`, paddingBottom: 4, marginBottom: 8 }}>{title}</div>
    {children}
  </div>
);
const MinimalSection = ({ title, accent, children }) => (
  <div style={{ marginBottom: 20 }}>
    <div style={{ fontSize: 10, fontWeight: 700, color: accent, letterSpacing: 1.5, marginBottom: 10 }}>{title.toUpperCase()}</div>
    {children}
  </div>
);
const ExperienceBlock = ({ exp, accent }) => (
  <div style={{ marginBottom: 14 }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap' }}>
      <span style={{ fontWeight: 700, fontSize: 12.5 }}>{exp.title}{exp.company ? ` · ${exp.company}` : ''}</span>
      <span style={{ fontSize: 10.5, color: '#6b7280' }}>{exp.duration}</span>
    </div>
    <ul style={{ margin: '4px 0 0 16px' }}>
      {(exp.bullets || []).map((b, j) => <li key={j} style={{ fontSize: 11.5, marginBottom: 2, color: '#374151' }}>{b}</li>)}
    </ul>
  </div>
);