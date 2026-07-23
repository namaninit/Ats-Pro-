const router = require('express').Router();
const Groq = require('groq-sdk');
const { auth } = require('../middleware/auth');
const { CvDocument } = require('../models');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// ─── Helper: ask Groq to write a tailored, ATS-optimized CV ──────────────────
async function generateCvWithAI({ fullName, targetJob, email, phone, location, background }) {
  const prompt = `You are an expert professional resume writer. Write a polished, ATS-optimized CV for the candidate below, tailored specifically for the target job title. Rewrite everything in strong, achievement-focused language (use action verbs, quantify impact where the background text implies numbers, keep bullets concise). Do not invent employers, job titles, dates, or specific numbers that are not implied by the background text — only rephrase and organize what's given, filling structural gaps (like generic bullet phrasing) with reasonable professional language.

Candidate name: ${fullName}
Target job title: ${targetJob}
Raw background notes (experience, education, skills, achievements, in the candidate's own words):
"""
${background.slice(0, 4000)}
"""

Return ONLY valid JSON, no markdown, no explanation, matching exactly this structure:
{
  "professionalSummary": "2-3 sentence summary tailored to the target job",
  "skills": ["skill1", "skill2", "... up to 12 relevant skills"],
  "experience": [
    { "title": "Job Title", "company": "Company Name", "duration": "e.g. Jan 2022 - Present", "bullets": ["achievement-focused bullet 1", "bullet 2", "bullet 3"] }
  ],
  "education": [
    { "degree": "Degree Name", "institution": "Institution Name", "year": "Year or range" }
  ],
  "certifications": ["cert1", "cert2"]
}

Rules:
- experience array: one entry per distinct role mentioned in the background notes. If no clear roles are mentioned, return an empty array.
- education array: one entry per degree/qualification mentioned. If none mentioned, return an empty array.
- certifications: only include if explicitly mentioned in background notes, else empty array.
- Every bullet must be a complete, professional sentence fragment starting with an action verb.
- Return ONLY the JSON object, nothing else.`;

  const completion = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 1800,
    temperature: 0.4,
  });

  const raw = completion.choices[0]?.message?.content?.trim() || '{}';
  const clean = raw.replace(/```json|```/g, '').trim();
  return JSON.parse(clean);
}

// ─── POST /api/cv-maker/generate ──────────────────────────────────────────────
// Generates CV content with AI. Does NOT save — frontend calls /save separately
// once the user is happy with the result (or after their own edits).
router.post('/generate', auth, async (req, res) => {
  try {
    const { fullName, targetJob, email, phone, location, background } = req.body;
    if (!fullName || !targetJob || !background)
      return res.status(400).json({ message: 'Full name, target job, and background notes are required' });

    const content = await generateCvWithAI({ fullName, targetJob, email, phone, location, background });
    res.json({
      ...content,
      contactInfo: { fullName, email: email || '', phone: phone || '', location: location || '' }
    });
  } catch (err) {
    console.error('CV generation error:', err.message);
    res.status(500).json({ message: 'AI generation failed. Please try again.' });
  }
});

// ─── SAVE / LIST / GET / UPDATE / DELETE saved CVs ────────────────────────────
router.post('/', auth, async (req, res) => {
  try {
    const { fullName, targetJob, templateId, data } = req.body;
    if (!fullName || !targetJob || !data) return res.status(400).json({ message: 'Missing required fields' });
    const cv = await CvDocument.create({
      companyId: req.companyId,
      userId: req.user.id,
      fullName, targetJob,
      templateId: templateId || 'modern',
      data
    });
    res.status(201).json(cv);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.get('/', auth, async (req, res) => {
  try {
    const cvs = await CvDocument.findAll({
      where: { companyId: req.companyId, userId: req.user.id },
      order: [['updatedAt', 'DESC']]
    });
    res.json(cvs);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const cv = await CvDocument.findOne({ where: { id: req.params.id, companyId: req.companyId, userId: req.user.id } });
    if (!cv) return res.status(404).json({ message: 'Not found' });
    res.json(cv);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const cv = await CvDocument.findOne({ where: { id: req.params.id, companyId: req.companyId, userId: req.user.id } });
    if (!cv) return res.status(404).json({ message: 'Not found' });
    const { fullName, targetJob, templateId, data } = req.body;
    await cv.update({
      fullName: fullName ?? cv.fullName,
      targetJob: targetJob ?? cv.targetJob,
      templateId: templateId ?? cv.templateId,
      data: data ?? cv.data
    });
    res.json(cv);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const cv = await CvDocument.findOne({ where: { id: req.params.id, companyId: req.companyId, userId: req.user.id } });
    if (!cv) return res.status(404).json({ message: 'Not found' });
    await cv.destroy();
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;