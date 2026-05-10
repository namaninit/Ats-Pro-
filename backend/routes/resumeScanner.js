const router = require('express').Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
let pdfParse;
try {
  const mod = require('pdf-parse');
  pdfParse = mod.default || mod;
} catch(e) {
  pdfParse = null;
}
const Groq = require('groq-sdk');
const { auth } = require('../middleware/auth');
const { Job, Client, Candidate } = require('../models');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '../uploads/resumes')),
  filename: (req, file, cb) => cb(null, `scan_${Date.now()}_${file.originalname.replace(/\s/g, '_')}`)
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['.pdf', '.doc', '.docx'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) cb(null, true);
    else cb(new Error('Only PDF/DOC files allowed'));
  }
});

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// ✅ PERMANENT FIX — companyId always set hoga
const ensureCompany = (req, res, next) => {
  const companyId = req.companyId
    || req.user?.companyId
    || req.user?.dataValues?.companyId;

  if (!companyId) {
    return res.status(400).json({ message: 'Company not found. Please logout and login again.' });
  }
  req.companyId = companyId;
  next();
};

async function extractTextFromFile(filePath, originalName) {
  const ext = path.extname(originalName).toLowerCase();
  if (ext === '.pdf') {
    const buffer = fs.readFileSync(filePath);
    if (!pdfParse) throw new Error('PDF parser not available');
    const data = await pdfParse(buffer);
    return data.text;
  }
  return fs.readFileSync(filePath, 'utf8').replace(/[^\x20-\x7E\n]/g, ' ');
}

function calculateATSScore(parsedResume, job) {
  let score = 0;
  let breakdown = {};

  const resumeSkills = (parsedResume.skills || []).map(s => s.toLowerCase());
  const jobSkills = (Array.isArray(job.requiredSkills) ? job.requiredSkills : []).map(s => s.toLowerCase());

  if (jobSkills.length > 0) {
    const matched = jobSkills.filter(s => resumeSkills.some(r => r.includes(s) || s.includes(r)));
    const skillScore = Math.round((matched.length / jobSkills.length) * 40);
    score += skillScore;
    breakdown.skills = {
      score: skillScore, max: 40, matched,
      missing: jobSkills.filter(s => !resumeSkills.some(r => r.includes(s) || s.includes(r)))
    };
  } else {
    score += 20;
    breakdown.skills = { score: 20, max: 40, matched: [], missing: [] };
  }

  const resumeExp = parseFloat(parsedResume.totalExperience) || 0;
  const minExp = parseFloat(job.minExperience) || 0;
  const maxExp = parseFloat(job.maxExperience) || 99;
  let expScore = resumeExp >= minExp && resumeExp <= maxExp ? 30
    : resumeExp >= minExp ? 25
    : resumeExp >= minExp * 0.7 ? 15 : 5;
  score += expScore;
  breakdown.experience = { score: expScore, max: 30, required: `${minExp}-${maxExp} yrs`, found: `${resumeExp} yrs` };

  const hasEducation = parsedResume.education && parsedResume.education.length > 0;
  const eduScore = hasEducation ? 15 : 5;
  score += eduScore;
  breakdown.education = { score: eduScore, max: 15, found: parsedResume.education || [] };

  let contactScore = 0;
  if (parsedResume.email) contactScore += 5;
  if (parsedResume.phone) contactScore += 5;
  if (parsedResume.name) contactScore += 5;
  score += contactScore;
  breakdown.contact = { score: contactScore, max: 15 };

  return { total: Math.min(score, 100), breakdown };
}

// ✅ SCAN RESUME + ATS SCORE
router.post('/scan', auth, ensureCompany, upload.single('resume'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'Resume file required' });
    const { jobId } = req.body;

    const resumeText = await extractTextFromFile(req.file.path, req.file.originalname);
    if (!resumeText || resumeText.trim().length < 50)
      return res.status(400).json({ message: 'Could not extract text. Use a text-based PDF.' });

    const parsePrompt = `You are an expert resume parser. Extract structured information from this resume text.
Resume Text: """${resumeText.slice(0, 3000)}"""
Return ONLY valid JSON (no markdown):
{"name":"","email":"","phone":"","totalExperience":0,"skills":[],"education":[],"currentRole":"","currentCompany":"","summary":"","strengths":[],"languages":[]}`;

    const aiResponse = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: parsePrompt }],
      max_tokens: 1000, temperature: 0.1
    });

    let parsedResume;
    try {
      const raw = aiResponse.choices[0].message.content.trim().replace(/```json|```/g, '').trim();
      parsedResume = JSON.parse(raw);
    } catch {
      return res.status(500).json({ message: 'AI could not parse resume. Try a cleaner PDF.' });
    }

    let atsResult = null;
    if (jobId) {
      const job = await Job.findByPk(jobId, { include: [{ model: Client, as: 'client' }] });
      if (job) {
        const scoreData = calculateATSScore(parsedResume, job);
        const feedbackPrompt = `ATS expert. Job: "${job.title}". Requires: ${(Array.isArray(job.requiredSkills) ? job.requiredSkills : []).join(', ')}. Exp: ${job.minExperience}-${job.maxExperience}yrs. Candidate skills: ${parsedResume.skills?.join(', ')}. Exp: ${parsedResume.totalExperience}yrs. Score: ${scoreData.total}/100. Missing: ${scoreData.breakdown.skills?.missing?.join(', ') || 'none'}. Return ONLY JSON: {"good":"...","improve":"...","recommendation":"Strong Match|Good Match|Partial Match|Not Suitable","recommendationColor":"green|blue|amber|red"}`;

        const feedbackRes = await groq.chat.completions.create({
          model: 'llama-3.3-70b-versatile',
          messages: [{ role: 'user', content: feedbackPrompt }],
          max_tokens: 400, temperature: 0.3
        });

        let aiFeedback = { recommendation: 'Partial Match', recommendationColor: 'amber' };
        try {
          aiFeedback = JSON.parse(feedbackRes.choices[0].message.content.trim().replace(/```json|```/g, '').trim());
        } catch {}

        atsResult = {
          job: { id: job.id, title: job.title, client: job.client?.companyName },
          ...scoreData,
          feedback: aiFeedback
        };
      }
    }

    const allJobs = await Job.findAll({
      where: { status: 'open', companyId: req.companyId },
      include: [{ model: Client, as: 'client' }]
    });

    const jobSuggestions = allJobs.map(j => {
      const sc = calculateATSScore(parsedResume, j);
      return {
        id: j.id, title: j.title, client: j.client?.companyName,
        location: j.location, minSalary: j.minSalary, maxSalary: j.maxSalary,
        atsScore: sc.total, matched: sc.breakdown.skills?.matched || []
      };
    }).sort((a, b) => b.atsScore - a.atsScore).slice(0, 5);

    try { fs.unlinkSync(req.file.path); } catch {}
    res.json({ parsedResume, atsResult, jobSuggestions });
  } catch (err) {
    console.error('Scan error:', err);
    res.status(500).json({ message: err.message || 'Resume scanning failed' });
  }
});

// ✅ SUGGEST JOBS
router.post('/suggest-jobs', auth, ensureCompany, upload.single('resume'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'Resume required' });

    const resumeText = await extractTextFromFile(req.file.path, req.file.originalname);

    const aiRes = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: `Extract skills and experience. Return ONLY JSON: {"skills":[],"totalExperience":0}\nResume: ${resumeText.slice(0, 2000)}` }],
      max_tokens: 300, temperature: 0.1
    });

    let parsed = { skills: [], totalExperience: 0 };
    try {
      parsed = JSON.parse(aiRes.choices[0].message.content.trim().replace(/```json|```/g, '').trim());
    } catch {}

    const allJobs = await Job.findAll({
      where: { status: 'open', companyId: req.companyId },
      include: [{ model: Client, as: 'client' }]
    });

    const suggestions = allJobs.map(j => {
      const sc = calculateATSScore(parsed, j);
      return {
        id: j.id, title: j.title, client: j.client?.companyName,
        location: j.location, minSalary: j.minSalary, maxSalary: j.maxSalary,
        jobType: j.jobType, atsScore: sc.total
      };
    }).sort((a, b) => b.atsScore - a.atsScore);

    try { fs.unlinkSync(req.file.path); } catch {}
    res.json({ suggestions, parsedSkills: parsed.skills, parsedExperience: parsed.totalExperience });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ✅ AUTO CREATE CANDIDATE FROM RESUME
router.post('/create-candidate', auth, ensureCompany, upload.single('resume'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'Resume required' });

    const resumeText = await extractTextFromFile(req.file.path, req.file.originalname);
    if (!resumeText || resumeText.trim().length < 50)
      return res.status(400).json({ message: 'Could not extract text from resume.' });

    const parsePrompt = `You are an expert resume parser. Extract structured information from this resume.
Resume: """${resumeText.slice(0, 3000)}"""
Return ONLY valid JSON:
{"name":"","email":"","phone":"","totalExperience":0,"skills":[],"currentLocation":"","currentRole":"","expectedCTC":0,"currentCTC":0,"noticePeriod":30}`;

    const aiResponse = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: parsePrompt }],
      max_tokens: 500, temperature: 0.1
    });

    let parsed;
    try {
      const raw = aiResponse.choices[0].message.content.trim().replace(/```json|```/g, '').trim();
      parsed = JSON.parse(raw);
    } catch {
      return res.status(500).json({ message: 'AI could not parse resume.' });
    }

    const candidate = await Candidate.create({
      name: parsed.name || 'Unknown',
      email: parsed.email || `unknown_${Date.now()}@resume.com`,
      phone: parsed.phone || '',
      skills: parsed.skills || [],
      experience: parseFloat(parsed.totalExperience) || 0,
      currentCTC: parseFloat(parsed.currentCTC) || 0,
      expectedCTC: parseFloat(parsed.expectedCTC) || 0,
      noticePeriod: parseInt(parsed.noticePeriod) || 30,
      currentLocation: parsed.currentLocation || '',
      resumePath: req.file.filename,
      status: 'new',
      source: 'Resume Upload',
      notes: `Auto-imported via Resume Scanner. Role: ${parsed.currentRole || 'N/A'}`,
      companyId: req.companyId
    });

    try { fs.unlinkSync(req.file.path); } catch {}
    res.status(201).json({ candidate, parsed });
  } catch (err) {
    console.error('Create candidate error:', err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;