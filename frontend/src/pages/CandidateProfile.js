import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { candidateAPI, jobAPI, interviewAPI } from "../hooks/useApi";
import { format } from "date-fns";
import { RATING_CONFIG } from "./Candidates";
import ScoreGauge from '../components/ScoreGauge';


// ── Job Assign Modal ──────────────────────────────────────────────────────────
function JobAssignModal({ jobs, currentJobId, onClose, onSave }) {
  const [jobId, setJobId] = useState(currentJobId || "");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    setSaving(true);
    try {
      await onSave(jobId || null);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal" style={{ maxWidth: 420 }}>
        <div className="modal-header">
          <div className="modal-title">💼 Assign Job</div>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label className="form-label">Select Job</label>
            <select className="form-input form-select" value={jobId} onChange={(e) => setJobId(e.target.value)}>
              <option value="">— No job assigned —</option>
              {jobs.map((j) => (
                <option key={j.id} value={j.id}>
                  {j.title} {j.client?.companyName ? `· ${j.client.companyName}` : ""}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={submit} disabled={saving}>
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Schedule Interview Modal ──────────────────────────────────────────────────
function ScheduleInterviewModal({ candidateId, jobId, onClose, onSave }) {
  const [form, setForm] = useState({
  scheduledAt: "", mode: "video", round: 1, notes: ""
});
  const [saving, setSaving] = useState(false);
  const handle = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const submit = async () => {
    if (!form.scheduledAt) return toast.error("Pick a date & time");
    setSaving(true);
    try {
      await interviewAPI.create({
        candidateId,
        jobId: jobId || null,
        scheduledAt: form.scheduledAt,
        mode: form.mode,
        round: Number(form.round) || 1,
        notes: form.notes,
        status: "scheduled",
      });
      toast.success("Interview scheduled! Email sent to candidate.");
      onSave();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to schedule");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal" style={{ maxWidth: 460 }}>
        <div className="modal-header">
          <div className="modal-title">📅 Schedule Interview</div>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Date & Time</label>
              <input className="form-input" type="datetime-local" name="scheduledAt" value={form.scheduledAt} onChange={handle} />
            </div>
            <div className="form-group">
              <label className="form-label">Round</label>
              <input className="form-input" type="number" min="1" name="round" value={form.round} onChange={handle} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Mode</label>
            <select className="form-input form-select" name="mode" value={form.mode} onChange={handle}>
  <option value="video">📹 Video Call</option>
  <option value="phone">📞 Phone Call</option>
  <option value="in_person">🏢 In Person</option>
</select>
          </div>
          <div className="form-group">
            <label className="form-label">Notes (optional)</label>
            <textarea className="form-input" rows={2} name="notes" value={form.notes} onChange={handle} placeholder="Interview link, address, instructions..." />
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={submit} disabled={saving}>
            {saving ? "Scheduling..." : "📅 Schedule & Notify"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function CandidateProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [candidate, setCandidate] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("resume");
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [savingNotes, setSavingNotes] = useState(false);
  const [showJobModal, setShowJobModal] = useState(false);
  const [showInterviewModal, setShowInterviewModal] = useState(false);

  useEffect(() => { load(); }, [id]);

  const load = async () => {
    setLoading(true);
    try {
      const [cr, jr, ir] = await Promise.all([
        candidateAPI.getOne(id),
        jobAPI.getAll(),
        interviewAPI.getAll({ candidateId: id }),
      ]);
      setCandidate(cr.data);
      setForm(cr.data);
      setJobs(jr.data);
      setInterviews(ir.data);
    } catch {
      toast.error("Failed to load candidate");
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = () => {
    setActiveTab("details");
    setEditing((prev) => !prev);
  };

  const saveEdit = async () => {
    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => {
        if (v !== null && v !== undefined)
          fd.append(k, Array.isArray(v) ? v.join(",") : v);
      });
      await candidateAPI.update(id, fd);
      toast.success("Updated!");
      setEditing(false);
      load();
    } catch {
      toast.error("Update failed");
    } finally {
      setSaving(false);
    }
  };

  const saveNotes = async () => {
    setSavingNotes(true);
    try {
      const fd = new FormData();
      fd.append("notes", form.notes || "");
      await candidateAPI.update(id, fd);
      setCandidate((p) => ({ ...p, notes: form.notes }));
      toast.success("Notes saved!");
    } catch {
      toast.error("Failed to save notes");
    } finally {
      setSavingNotes(false);
    }
  };

  const updateRating = async (rating) => {
    try {
      const fd = new FormData();
      fd.append("scoreRating", rating);
      await candidateAPI.update(id, fd);
      setCandidate((p) => ({ ...p, scoreRating: rating }));
      toast.success(`Rated: ${RATING_CONFIG[rating].label}`);
    } catch {
      toast.error("Failed to rate");
    }
  };

  const updateJobAssignment = async (newJobId) => {
    try {
      const fd = new FormData();
      fd.append("jobId", newJobId || "");
      await candidateAPI.update(id, fd);
      setCandidate((p) => ({ ...p, jobId: newJobId }));
      toast.success(newJobId ? "Job assigned!" : "Job unassigned");
    } catch {
      toast.error("Failed to assign job");
    }
  };

  if (loading) return <div className="loading"><div className="spinner" /></div>;
  if (!candidate) return <div className="empty-state"><h3>Candidate not found</h3></div>;

  const job = jobs.find((j) => j.id === candidate.jobId);
  const apiBase = process.env.REACT_APP_API_URL || "";
  const resumeUrl = candidate.resumePath?.startsWith("http")
    ? candidate.resumePath
    : `${apiBase}/uploads/resumes/${candidate.resumePath}`;
  const upcomingInterviews = interviews.filter((i) => i.status === "scheduled");

  return (
    <div>
      <button className="btn btn-ghost" style={{ marginBottom: 16 }} onClick={() => navigate("/candidates")}>
        ← Back to Candidates
      </button>

      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 20 }}>
          <div style={{
            width: 80, height: 80, borderRadius: "50%",
            background: "var(--accent-dim)", border: "3px solid var(--accent)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 32, fontWeight: 700, color: "var(--accent-light)", flexShrink: 0,
          }}>
            {candidate.name?.[0]?.toUpperCase()}
          </div>

          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6, flexWrap: "wrap" }}>
              <h2 style={{ fontSize: 22, fontFamily: "var(--font-display)", margin: 0 }}>{candidate.name}</h2>
              <span style={{ fontSize: 12, color: "var(--text-muted)", background: "var(--bg-elevated)", padding: "2px 8px", borderRadius: 4 }}>
                #{candidate.id}
              </span>
            </div>


            <div style={{ fontSize: 14, color: "var(--text-secondary)", marginBottom: 8 }}>
              {candidate.currentRole || "No role specified"}
              {job && <span> · Applied for <strong style={{ color: "var(--accent-light)" }}>{job.title}</strong></span>}
            </div>

            <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
              {candidate.email && (
                <a href={`mailto:${candidate.email}`} style={{ fontSize: 13, color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: 4 }}>
                  ✉️ {candidate.email}
                </a>
              )}
              {candidate.phone && (
                <a href={`tel:${candidate.phone}`} style={{ fontSize: 13, color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: 4 }}>
                  📞 {candidate.phone}
                </a>
              )}
              {candidate.currentLocation && (
                <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>📍 {candidate.currentLocation}</span>
              )}
            </div>
          </div>
        
  
          <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
            {candidate.email && <a href={`mailto:${candidate.email}`} className="btn btn-secondary btn-sm">✉️ Email</a>}
            {candidate.phone && <a href={`tel:${candidate.phone}`} className="btn btn-secondary btn-sm">📞 Call</a>}
            <button className="btn btn-primary btn-sm" onClick={handleEditClick}>
              {editing ? "✕ Cancel" : "✏️ Edit"}
            </button>
          </div>
          
        </div>
        {/* Score gauge — own full-width centered row */}
        <div style={{ marginTop: 18, paddingTop: 18, borderTop: "1px solid var(--border)", display: "flex", justifyContent: "center" }}>
          <ScoreGauge rating={candidate.scoreRating} />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginTop: 20, paddingTop: 20, borderTop: "1px solid var(--border)" }}>
          {[
            { label: "Experience",    value: candidate.experience   ? `${candidate.experience} yrs`   : "—" },
            { label: "Current CTC",   value: candidate.currentCTC   ? `₹${candidate.currentCTC} LPA`  : "—" },
            { label: "Expected CTC",  value: candidate.expectedCTC  ? `₹${candidate.expectedCTC} LPA` : "—" },
            { label: "Notice Period", value: candidate.noticePeriod ? `${candidate.noticePeriod} days` : "—" },
          ].map((s) => (
            <div key={s.label} style={{ textAlign: "center", padding: 10, background: "var(--bg-elevated)", borderRadius: 8 }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: "var(--accent-light)", fontFamily: "var(--font-display)" }}>{s.value}</div>
              <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>
        
      </div>

      

      <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 16 }}>

        <div>
          <div className="tabs">
            {["resume", "details", "interviews"].map((t) => (
              <button key={t} className={`tab ${activeTab === t ? "active" : ""}`} onClick={() => setActiveTab(t)}>
                {t === "resume" ? "📄" : t === "details" ? "👤" : "📅"} {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>

          {activeTab === "resume" && (
            <div className="card" style={{ padding: 0, overflow: "hidden" }}>
              {candidate.resumePath ? (
                <>
                  <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, padding: "12px 16px", borderBottom: "1px solid var(--border)" }}>
                    <a href={resumeUrl} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm">👁️ Open in New Tab</a>
                    <a href={resumeUrl} download target="_blank" rel="noreferrer" className="btn btn-primary btn-sm">⬇️ Download</a>
                  </div>
                  <iframe
                    src={`https://docs.google.com/viewer?url=${encodeURIComponent(resumeUrl)}&embedded=true`}
                    width="100%"
                    height="650"
                    style={{ border: "none", display: "block" }}
                    title="Resume Preview"
                  />
                </>
              ) : (
                <div className="empty-state" style={{ padding: 60 }}>
                  <div className="empty-state-icon">📄</div>
                  <h3>No resume uploaded</h3>
                </div>
              )}
            </div>
          )}

          {activeTab === "details" && (
            <div className="card">
              {editing ? (
                <div>
                  <div style={{ fontWeight: 600, marginBottom: 16 }}>✏️ Edit Details</div>
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Name</label>
                      <input className="form-input" value={form.name || ""} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Email</label>
                      <input className="form-input" value={form.email || ""} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Phone</label>
                      <input className="form-input" value={form.phone || ""} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Location</label>
                      <input className="form-input" value={form.currentLocation || ""} onChange={(e) => setForm((p) => ({ ...p, currentLocation: e.target.value }))} />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Experience (yrs)</label>
                      <input className="form-input" type="number" value={form.experience || ""} onChange={(e) => setForm((p) => ({ ...p, experience: e.target.value }))} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Current CTC (LPA)</label>
                      <input className="form-input" type="number" value={form.currentCTC || ""} onChange={(e) => setForm((p) => ({ ...p, currentCTC: e.target.value }))} />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Expected CTC (LPA)</label>
                      <input className="form-input" type="number" value={form.expectedCTC || ""} onChange={(e) => setForm((p) => ({ ...p, expectedCTC: e.target.value }))} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Notice Period (days)</label>
                      <input className="form-input" type="number" value={form.noticePeriod || ""} onChange={(e) => setForm((p) => ({ ...p, noticePeriod: e.target.value }))} />
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Skills (comma separated)</label>
                    <input className="form-input"
                      value={Array.isArray(form.skills) ? form.skills.join(", ") : form.skills || ""}
                      onChange={(e) => setForm((p) => ({ ...p, skills: e.target.value }))} />
                  </div>
                  <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                    <button className="btn btn-secondary" onClick={() => setEditing(false)}>Cancel</button>
                    <button className="btn btn-primary" onClick={saveEdit} disabled={saving}>
                      {saving ? "Saving..." : "Save Changes"}
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <div style={{ fontWeight: 600, marginBottom: 16 }}>👤 Candidate Details</div>
                  {[
                    { label: "Full Name",     value: candidate.name },
                    { label: "Email",         value: candidate.email },
                    { label: "Phone",         value: candidate.phone },
                    { label: "Location",      value: candidate.currentLocation },
                    { label: "Experience",    value: candidate.experience   ? `${candidate.experience} years`   : "—" },
                    { label: "Current CTC",   value: candidate.currentCTC   ? `₹${candidate.currentCTC} LPA`   : "—" },
                    { label: "Expected CTC",  value: candidate.expectedCTC  ? `₹${candidate.expectedCTC} LPA`  : "—" },
                    { label: "Notice Period", value: candidate.noticePeriod ? `${candidate.noticePeriod} days`  : "—" },
                    { label: "Added On",      value: candidate.createdAt ? format(new Date(candidate.createdAt), "dd MMM yyyy") : "—" },
                  ].map((item) => (
                    <div key={item.label} style={{ display: "flex", padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
                      <div style={{ width: 140, fontSize: 13, color: "var(--text-muted)", flexShrink: 0 }}>{item.label}</div>
                      <div style={{ fontSize: 13, fontWeight: 500 }}>{item.value || "—"}</div>
                    </div>
                  ))}
                  <div style={{ padding: "12px 0" }}>
                    <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 8 }}>Skills</div>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      {(Array.isArray(candidate.skills) ? candidate.skills : []).map((s) => (
                        <span key={s} style={{ background: "var(--accent-dim)", color: "var(--accent-light)", borderRadius: 4, padding: "3px 10px", fontSize: 12 }}>
                          {s}
                        </span>
                      ))}
                      {(!candidate.skills || candidate.skills.length === 0) && (
                        <span style={{ fontSize: 13, color: "var(--text-muted)" }}>No skills added</span>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "interviews" && (
            <div className="card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <div style={{ fontWeight: 600 }}>📅 Interview History</div>
                <button className="btn btn-primary btn-sm" onClick={() => setShowInterviewModal(true)}>
                  ➕ Schedule Interview
                </button>
              </div>
              {interviews.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state-icon">📅</div>
                  <h3>No interviews yet</h3>
                  <p style={{ marginBottom: 16 }}>Schedule the first interview for this candidate</p>
                  <button className="btn btn-primary" onClick={() => setShowInterviewModal(true)}>
                    📅 Schedule Interview
                  </button>
                </div>
              ) : interviews.map((i) => (
                <div key={i.id} style={{ padding: 12, background: "var(--bg-elevated)", borderRadius: 8, marginBottom: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <div style={{ fontWeight: 500 }}>Round {i.round} — {i.mode?.replace("_", " ")}</div>
                    <span className={`badge badge-${i.status}`}>{i.status}</span>
                  </div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                    {i.scheduledAt ? format(new Date(i.scheduledAt), "dd MMM yyyy, h:mm a") : "—"}
                  </div>
                  {i.notes && <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 6 }}>📝 {i.notes}</div>}
                  {i.feedback && <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 6 }}>💬 {i.feedback}</div>}
                  {i.outcome && i.outcome !== "pending" && (
                    <div style={{ fontSize: 12, fontWeight: 600, marginTop: 4, color: i.outcome === "pass" ? "var(--green)" : i.outcome === "fail" ? "var(--red)" : "var(--amber)" }}>
                      Outcome: {i.outcome}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

          <div className="card">
            <div style={{ fontWeight: 600, marginBottom: 12, fontSize: 14 }}>🎯 Score Card</div>
            
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {Object.entries(RATING_CONFIG).map(([key, cfg]) => (
                <label key={key} style={{
                  display: "flex", alignItems: "center", gap: 8,
                  padding: "8px 10px", borderRadius: 8, cursor: "pointer",
                  background: candidate.scoreRating === key ? cfg.color + "20" : "var(--bg-elevated)",
                  border: `1px solid ${candidate.scoreRating === key ? cfg.color + "60" : "var(--border)"}`,
                }}>
                  <input
                    type="checkbox"
                    checked={candidate.scoreRating === key}
                    onChange={() => updateRating(key)}
                    style={{ accentColor: cfg.color, width: 15, height: 15 }}
                  />
                  <span style={{ fontSize: 13, color: candidate.scoreRating === key ? cfg.color : "var(--text-secondary)", fontWeight: candidate.scoreRating === key ? 600 : 400 }}>
                    {cfg.icon} {cfg.label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div style={{ fontWeight: 600, fontSize: 14 }}>💼 Job Assigned</div>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowJobModal(true)} style={{ padding: "2px 8px" }}>
                {job ? "✏️ Change" : "➕ Assign"}
              </button>
            </div>
            {job ? (
              <div style={{ padding: 10, background: "var(--bg-elevated)", borderRadius: 8 }}>
                <div style={{ fontWeight: 500, fontSize: 13 }}>{job.title}</div>
                <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 3 }}>{job.client?.companyName}</div>
                <span className={`badge badge-${job.status}`} style={{ marginTop: 6 }}>{job.status}</span>
              </div>
            ) : (
              <p style={{ color: "var(--text-muted)", fontSize: 13 }}>No job assigned</p>
            )}
          </div>

          <div className="card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div style={{ fontWeight: 600, fontSize: 14 }}>📅 Upcoming Interviews</div>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowInterviewModal(true)} style={{ padding: "2px 8px" }}>
                ➕ Schedule
              </button>
            </div>
            {upcomingInterviews.length === 0 ? (
              <p style={{ color: "var(--text-muted)", fontSize: 13 }}>No upcoming interviews</p>
            ) : upcomingInterviews.map((i) => (
              <div key={i.id} style={{ padding: 8, background: "var(--bg-elevated)", borderRadius: 8, marginBottom: 8, fontSize: 13 }}>
                <div style={{ fontWeight: 500 }}>Round {i.round}</div>
                <div style={{ color: "var(--text-muted)", fontSize: 12 }}>
                  {i.scheduledAt ? format(new Date(i.scheduledAt), "dd MMM, h:mm a") : "—"}
                </div>
              </div>
            ))}
          </div>

          <div className="card">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <div style={{ fontWeight: 600, fontSize: 14 }}>📝 Notes</div>
              {candidate.notes && (
                <span style={{ fontSize: 10, color: "var(--text-muted)", background: "var(--bg-elevated)", padding: "2px 7px", borderRadius: 10 }}>
                  Saved
                </span>
              )}
            </div>
            <textarea
              className="form-input"
              rows={5}
              value={form.notes || ""}
              onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
              placeholder="Interview feedback, observations, follow-ups..."
              style={{ resize: "vertical", fontSize: 13, minHeight: 100 }}
            />
            <button
              className="btn btn-primary btn-sm"
              style={{ width: "100%", justifyContent: "center", marginTop: 8 }}
              onClick={saveNotes}
              disabled={savingNotes}
            >
              {savingNotes ? "Saving..." : "💾 Save Notes"}
            </button>
          </div>

        </div>
      </div>

      {showJobModal && (
        <JobAssignModal
          jobs={jobs}
          currentJobId={candidate.jobId}
          onClose={() => setShowJobModal(false)}
          onSave={updateJobAssignment}
        />
      )}
      {showInterviewModal && (
        <ScheduleInterviewModal
          candidateId={candidate.id}
          jobId={candidate.jobId}
          onClose={() => setShowInterviewModal(false)}
          onSave={load}
        />
      )}
    </div>
  );
}