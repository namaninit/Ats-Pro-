// FILE: backend/routes/resumeScanner.js
// ACTION: ADD the /scan-and-create route to your existing resumeScanner.js
// Find your existing module.exports line and ADD this route BEFORE it.
// If you want the full file, replace everything with this.

const router = require('express').Router();
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const Groq = require('groq-sdk');
const { auth } = require('../middleware/auth');
const { Candidate, Job } = require('../models');
const { uploadResume } = require('../services/cloudinary');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Multer — store temp on disk, max 5MB per file
const upload = multer({
  dest: 'uploads/resumes/',
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['.pdf', '.doc', '.docx'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) cb(null, true);
    else cb(new Error('Only PDF/DOC/DOCX allowed'));
  }
});

// ─── Helper: extract text from file ───────────────────────────────────────────
async function extractText(filePath, mimetype) {
  // For PDFs use pdf-parse if available, else send raw bytes to Groq vision
  // For DOC/DOCX use mammoth if available
  // Fallback: read as buffer and send filename context to AI
  try {
    if (mimetype === 'application/pdf') {
      try {
        const pdfParse = require('pdf-parse');
        const buffer = fs.readFileSync(filePath);
        const data = await pdfParse(buffer);
        return data.text;
      } catch { /* pdf-parse not installed, fall through */ }
    }
    if (mimetype?.includes('wordprocessingml') || mimetype?.includes('msword')) {
      try {
        const mammoth = require('mammoth');
        const result = await mammoth.extractRawText({ path: filePath });
        return result.value;
      } catch { /* mammoth not installed, fall through */ }
    }
    // Fallback — return empty so AI uses filename only
    return '';
  } catch {
    return '';
  }
}

// ─── Helper: ask Groq to parse resume text ────────────────────────────────────
async function parseResumeWithAI(resumeText, filename) {
  const prompt = resumeText
    ? `Extract candidate information from this resume text and return ONLY valid JSON, no markdown, no explanation:

Resume text:
${resumeText.slice(0, 6000)}

Return this exact JSON structure:
{
  "name": "Full Name",
  "email": "email@example.com",
  "phone": "phone number or null",
  "skills": ["skill1", "skill2"],
  "experience": 2,
  "currentCTC": null,
  "expectedCTC": null,
  "noticePeriod": null,
  "currentLocation": "City or null",
  "summary": "2-3 sentence professional summary",
  "atsScore": 72
}

Rules:
- experience: number in years (integer), guess from work history
- skills: array of strings, max 15
- atsScore: 0-100 based on completeness and quality of resume
- All monetary values in LPA (lakhs per annum) as numbers or null
- noticePeriod: number in days or null
- Return ONLY the JSON object, nothing else`
    : `Return a JSON object for an unknown candidate from file "${filename}":
{"name":"Unknown","email":null,"phone":null,"skills":[],"experience":0,"currentCTC":null,"expectedCTC":null,"noticePeriod":null,"currentLocation":null,"summary":"Resume could not be parsed","atsScore":0}`;

  const completion = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 800,
    temperature: 0.1,
  });

  const raw = completion.choices[0]?.message?.content?.trim() || '{}';
  // Strip markdown fences if present
  const clean = raw.replace(/```json|```/g, '').trim();
  return JSON.parse(clean);
}

// ─── POST /api/resume-scanner/scan-and-create ─────────────────────────────────
// Bulk-safe: processes ONE resume per call, caller loops for multiple
router.post('/scan-and-create', auth, upload.single('resume'), async (req, res) => {
  const file = req.file;
  if (!file) return res.status(400).json({ message: 'No resume file provided' });

  try {
    // 1. Extract text from file
    const text = await extractText(file.path, file.mimetype);
    // TEMP DEBUG — remove after testing
const stats = fs.statSync(file.path);
console.log('📁 File path:', file.path);
console.log('📁 File size on disk:', stats.size, 'bytes');
console.log('📁 Multer reported size:', file.size, 'bytes');
console.log('📁 Multer mimetype:', file.mimetype);
console.log('📁 Extracted text length:', text.length);
console.log('📁 Extracted text preview:', text.slice(0, 200));

    // 2. AI parse
    let parsed;
    try {
      parsed = await parseResumeWithAI(text, file.originalname);
    } catch (aiErr) {
      console.error('Groq parse error:', aiErr.message);
      parsed = {
        name: path.basename(file.originalname, path.extname(file.originalname)),
        email: null, phone: null, skills: [], experience: 0,
        currentCTC: null, expectedCTC: null, noticePeriod: null,
        currentLocation: null, summary: 'AI parsing failed', atsScore: 0
      };
    }

    // 3. Upload to Cloudinary
   let resumePath = null;
try {
  resumePath = await uploadResume(file.path, file.originalname);
} catch (cloudErr) {
  console.error('Cloudinary upload error:', cloudErr.message);
}

    // 4. Check duplicate by email
    if (parsed.email) {
      const existing = await Candidate.findOne({
        where: { email: parsed.email, companyId: req.companyId }
      });
      if (existing) {
        // Clean up temp file
        fs.unlink(file.path, () => {});
        return res.status(409).json({
          message: `Candidate with email ${parsed.email} already exists`,
          duplicate: true,
          candidate: existing
        });
      }
    }

    // 5. Create candidate
    const candidate = await Candidate.create({
      companyId: req.companyId,
      name: parsed.name || path.basename(file.originalname, path.extname(file.originalname)),
      email: parsed.email || null,
      phone: parsed.phone || null,
      skills: parsed.skills || [],
      experience: parsed.experience || 0,
      currentCTC: parsed.currentCTC || null,
      expectedCTC: parsed.expectedCTC || null,
      noticePeriod: parsed.noticePeriod || null,
      currentLocation: parsed.currentLocation || null,
      resumePath: resumePath,
      status: 'new',
      source: 'bulk_upload',
      jobId: req.body.jobId || null,
    });

    // 6. Clean up temp file
    fs.unlink(file.path, () => {});

    return res.status(201).json({
      success: true,
      candidate,
      atsScore: parsed.atsScore || 0,
      summary: parsed.summary || '',
      skills: parsed.skills || [],
    });

  } catch (err) {
    // Clean up temp file on error
    if (file?.path) fs.unlink(file.path, () => {});
    console.error('scan-and-create error:', err);
    if (!res.headersSent) {
      res.status(500).json({ message: err.message || 'Resume processing failed' });
    }
  }
});

// ─── Your existing routes below (keep them) ───────────────────────────────────
// POST /api/resume-scanner/scan  (single scan without creating candidate)
router.post('/scan', auth, upload.single('resume'), async (req, res) => {
  const file = req.file;
  if (!file) return res.status(400).json({ message: 'No file provided' });

  try {
    const text = await extractText(file.path, file.mimetype);
    const parsed = await parseResumeWithAI(text, file.originalname);
    fs.unlink(file.path, () => {});

    // Optionally match against a job
    let jobMatch = null;
    if (req.body.jobId) {
      const job = await Job.findByPk(req.body.jobId);
      if (job && parsed.skills?.length) {
        const required = job.requiredSkills || [];
        const matched = required.filter(s => parsed.skills.some(ps => ps.toLowerCase().includes(s.toLowerCase())));
        const missing = required.filter(s => !parsed.skills.some(ps => ps.toLowerCase().includes(s.toLowerCase())));
        jobMatch = { jobTitle: job.title, matched, missing };
      }
    }

    res.json({ ...parsed, jobMatch });
  } catch (err) {
    if (file?.path) fs.unlink(file.path, () => {});
    if (!res.headersSent) res.status(500).json({ message: err.message });
  }
});

module.exports = router;