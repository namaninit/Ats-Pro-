import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { api } from '../hooks/useApi';

export default function PublicCareers() {
  const { companyId } = useParams();
  const [jobs, setJobs] = useState([]);
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [applyingJob, setApplyingJob] = useState(null);

  useEffect(() => {
    Promise.all([
      api.get(`/api/public/careers/${companyId}/jobs`),
      api.get(`/api/public/careers/${companyId}/company`)
    ]).then(([jr, cr]) => {
      setJobs(jr.data);
      setCompany(cr.data);
    }).catch(() => toast.error('Unable to load jobs'))
      .finally(() => setLoading(false));
  }, [companyId]);

  useEffect(() => {
    if (!company || !jobs.length) return;
    document.querySelectorAll('script[data-jobposting]').forEach(el => el.remove());
    jobs.forEach(j => {
      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.setAttribute('data-jobposting', 'true');
      script.text = JSON.stringify({
        '@context': 'https://schema.org/',
        '@type': 'JobPosting',
        title: j.title,
        description: j.description || j.title,
        datePosted: j.createdAt,
        employmentType: (j.jobType || 'FULL_TIME').toUpperCase(),
        hiringOrganization: { '@type': 'Organization', name: company.name },
        jobLocation: { '@type': 'Place', address: { '@type': 'PostalAddress', addressLocality: j.location || '' } }
      });
      document.head.appendChild(script);
    });
  }, [company, jobs]);

  if (loading) return <div style={{ padding: 40, textAlign: 'center' }}>Loading jobs...</div>;

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '40px 20px', fontFamily: 'sans-serif' }}>
      <h1>{company?.name || 'Careers'}</h1>
      <p style={{ color: '#666', marginBottom: 30 }}>{jobs.length} open positions</p>
      {jobs.map(j => (
        <div key={j.id} style={{ border: '1px solid #ddd', borderRadius: 10, padding: 20, marginBottom: 16 }}>
          <h3 style={{ margin: '0 0 8px' }}>{j.title}</h3>
          <div style={{ fontSize: 13, color: '#666', marginBottom: 10 }}>
            📍 {j.location || 'Remote'} · {(j.jobType || '').replace('_', ' ')}
            {j.minSalary ? ` · ₹${j.minSalary}–${j.maxSalary}L` : ''}
          </div>
          <p style={{ whiteSpace: 'pre-line', fontSize: 14, color: '#333' }}>{j.description}</p>
          {applyingJob === j.id ? (
            <ApplyForm companyId={companyId} jobId={j.id} onDone={() => setApplyingJob(null)} />
          ) : (
            <button onClick={() => setApplyingJob(j.id)} style={{ background: '#4f46e5', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px', cursor: 'pointer' }}>Apply Now</button>
          )}
        </div>
      ))}
    </div>
  );
}

function ApplyForm({ companyId, jobId, onDone }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [resume, setResume] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!resume) { toast.error('Please attach your resume'); return; }
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('name', name);
      formData.append('email', email);
      formData.append('phone', phone);
      formData.append('resume', resume);
      await api.post(`/api/public/careers/${companyId}/jobs/${jobId}/apply`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success('Application submitted!');
      onDone();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Submission failed');
    } finally { setSubmitting(false); }
  };

  return (
    <form onSubmit={submit} style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
      <input placeholder="Full Name" value={name} onChange={e => setName(e.target.value)} required style={inputStyle} />
      <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required style={inputStyle} />
      <input placeholder="Phone" value={phone} onChange={e => setPhone(e.target.value)} style={inputStyle} />
      <input type="file" accept=".pdf,.doc,.docx" onChange={e => setResume(e.target.files[0])} required />
      <div style={{ display: 'flex', gap: 8 }}>
        <button type="submit" disabled={submitting} style={{ background: '#16a34a', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', cursor: 'pointer' }}>
          {submitting ? 'Submitting...' : 'Submit Application'}
        </button>
        <button type="button" onClick={onDone} style={{ background: '#eee', border: 'none', borderRadius: 8, padding: '8px 16px', cursor: 'pointer' }}>Cancel</button>
      </div>
    </form>
  );
}

const inputStyle = { padding: 8, borderRadius: 6, border: '1px solid #ccc', fontSize: 14 };