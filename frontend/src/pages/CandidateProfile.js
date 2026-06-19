import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { candidateAPI, jobAPI, interviewAPI } from "../hooks/useApi";
import { format } from "date-fns";

const STATUSES = ["new", "screening", "interview", "offered", "hired", "rejected"];
const STATUS_COLORS = {
  new: "#3b82f6", screening: "#f59e0b", interview: "#8b5cf6",
  offered: "#34d399", hired: "#10b981", rejected: "#ef4444",
};

export default function CandidateProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [candidate, setCandidate] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("details");
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [savingNotes, setSavingNotes] = useState(false);

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

  if (loading) return <div className="loading"><div className="spinner" /></div>;
  if (!candidate) return <div className="empty-state"><h3>Candidate not found</h3></div>;

  const job = jobs.find((j) => j.id === candidate.jobId);
  const sc = STATUS_COLORS[candidate.status] || "#64748b";
  const apiBase = process.env.REACT_APP_API_URL || "";
  const resumeUrl = candidate.resumePath?.startsWith("http")
    ? candidate.resumePath
    : `${apiBase}/uploads/resumes/${candidate.resumePath}`;

  return (
    <div>
      <button className="btn btn-ghost" style={{ marginBottom: 16 }} onClick={() => navigate("/candidates")}>
        ← Back to Candidates
      </button>

      {/* Profile Header */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 20 }}>
          <div style={{
            width: 80, height: 80, borderRadius: "50%",
            background: `${sc}20`, border: `3px solid ${sc}40`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 32, fontWeight: 700, color: sc, flexShrink: 0,
          }}>
            {candidate.name?.[0]?.toUpperCase()}
          </div>

          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6, flexWrap: "wrap" }}>
              <h2 style={{ fontSize: 22, fontFamily: "var(--font-display)", margin: 0 }}>{candidate.name}</h2>
              <span style={{ fontSize: 12, color: "var(--text-muted)", background: "var(--bg-elevated)", padding: "2px 8px", borderRadius: 4 }}>
                #{candidate.id}
              </span>
              {/* Static status badge — no dropdown */}
              <span style={{
                background: sc + "20", color: sc,
                border: `1px solid ${sc}40`,
                borderRadius: 20, padding: "4px 14px",
                fontSize: 12, fontWeight: 600,
              }}>
                {candidate.status?.charAt(0).toUpperCase() + candidate.status?.slice(1)}
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
            <button className="btn btn-primary btn-sm" onClick={() => setEditing(!editing)}>
              {editing ? "✕ Cancel" : "✏️ Edit"}
            </button>
          </div>
        </div>

        {/* Stats row */}
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

      {/* Main layout */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 16 }}>

        {/* LEFT — Tabs */}
        <div>
          <div className="tabs">
            {["details", "interviews"].map((t) => (
              <button key={t} className={`tab ${activeTab === t ? "active" : ""}`} onClick={() => setActiveTab(t)}>
                {t === "details" ? "👤" : "📅"} {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>

          {/* DETAILS TAB */}
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

          {/* INTERVIEWS TAB */}
          {activeTab === "interviews" && (
            <div className="card">
              <div style={{ fontWeight: 600, marginBottom: 16 }}>📅 Interview History</div>
              {interviews.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state-icon">📅</div>
                  <h3>No interviews yet</h3>
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

        {/* RIGHT — Sidebar */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

          {/* Resume */}
          <div className="card">
            <div style={{ fontWeight: 600, marginBottom: 12, fontSize: 14 }}>📄 Resume</div>
            {candidate.resumePath ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <a href={resumeUrl} target="_blank" rel="noreferrer"
                  className="btn btn-secondary btn-sm" style={{ justifyContent: "center" }}>
                  👁️ View Resume
                </a>
                <a href={resumeUrl} download target="_blank" rel="noreferrer"
                  className="btn btn-primary btn-sm" style={{ justifyContent: "center" }}>
                  ⬇️ Download Resume
                </a>
              </div>
            ) : (
              <p style={{ color: "var(--text-muted)", fontSize: 13 }}>No resume uploaded</p>
            )}
          </div>

          {/* Job Assigned */}
          <div className="card">
            <div style={{ fontWeight: 600, marginBottom: 12, fontSize: 14 }}>💼 Jobs Assigned</div>
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

          {/* Upcoming Interviews */}
          <div className="card">
            <div style={{ fontWeight: 600, marginBottom: 12, fontSize: 14 }}>📅 Upcoming Interviews</div>
            {interviews.filter((i) => i.status === "scheduled").length === 0 ? (
              <p style={{ color: "var(--text-muted)", fontSize: 13 }}>No upcoming interviews</p>
            ) : interviews.filter((i) => i.status === "scheduled").map((i) => (
              <div key={i.id} style={{ padding: 8, background: "var(--bg-elevated)", borderRadius: 8, marginBottom: 8, fontSize: 13 }}>
                <div style={{ fontWeight: 500 }}>Round {i.round}</div>
                <div style={{ color: "var(--text-muted)", fontSize: 12 }}>
                  {i.scheduledAt ? format(new Date(i.scheduledAt), "dd MMM, h:mm a") : "—"}
                </div>
              </div>
            ))}
          </div>

          {/* Notes — replaces Source */}
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
    </div>
  );
}