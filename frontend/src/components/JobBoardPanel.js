import React, { useState } from 'react';
import toast from 'react-hot-toast';

const PLATFORMS = [
  { key: 'linkedin', name: 'LinkedIn', url: 'https://www.linkedin.com/talent/post-a-job', color: '#0a66c2' },
  { key: 'naukri', name: 'Naukri', url: 'https://www.naukri.com/recruit/post-jobs', color: '#4a90d9' },
  { key: 'indeed', name: 'Indeed', url: 'https://www.indeed.com/hire', color: '#003a9b' },
  { key: 'internshala', name: 'Internshala', url: 'https://internshala.com/employer/postinternship', color: '#00a5ec' },
  { key: 'freshersworld', name: 'FreshersWorld', url: 'https://www.freshersworld.com/employer/postjob', color: '#e67e22' },
];

function formatForPlatform(job, platform) {
  const skills = Array.isArray(job.requiredSkills) ? job.requiredSkills.join(', ') : job.requiredSkills || '';
  const exp = job.minExperience || job.maxExperience
    ? `${job.minExperience || 0}-${job.maxExperience || job.minExperience || 0} years`
    : 'Not specified';
  const salary = job.minSalary ? `₹${job.minSalary}-${job.maxSalary || job.minSalary} LPA` : 'Not disclosed';

  const header = `${job.title}\n${job.location || 'Remote'} | ${(job.jobType || 'full_time').replace('_', ' ')}\n\n`;
  const body = `${job.description || ''}\n\n`;
  const footer = `Experience: ${exp}\nSalary: ${salary}\nSkills: ${skills}\nOpenings: ${job.openings || 1}`;

  return header + body + footer;
}

export default function JobBoardPanel({ job }) {
  const [copiedKey, setCopiedKey] = useState('');

  const handleCopy = (platform) => {
    const text = formatForPlatform(job, platform.key);
    navigator.clipboard.writeText(text).then(() => {
      setCopiedKey(platform.key);
      toast.success(`Copied for ${platform.name}! Opening site...`);
      window.open(platform.url, '_blank');
      setTimeout(() => setCopiedKey(''), 2000);
    }).catch(() => toast.error('Copy failed'));
  };

  return (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
      {PLATFORMS.map(p => (
        <button
          key={p.key}
          onClick={() => handleCopy(p)}
          style={{
            background: copiedKey === p.key ? '#16a34a' : p.color,
            color: '#fff',
            border: 'none',
            borderRadius: 6,
            padding: '4px 10px',
            fontSize: 11,
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'background 0.2s'
          }}
          title={`Copy formatted job description and open ${p.name}`}
        >
          {copiedKey === p.key ? '✓ Copied' : `📋 ${p.name}`}
        </button>
      ))}
    </div>
  );
}