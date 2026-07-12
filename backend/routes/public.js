const express = require('express');
const router = express.Router();
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { Job, Candidate, Company } = require('../models');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

// List open jobs for a company's public careers page
router.get('/careers/:companyId/jobs', async (req, res) => {
  try {
    const jobs = await Job.findAll({
      where: { companyId: req.params.companyId, status: 'open' },
      attributes: ['id', 'title', 'description', 'location', 'jobType', 'minExperience', 'maxExperience', 'minSalary', 'maxSalary', 'openings', 'createdAt']
    });
    res.json(jobs);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Single job detail
router.get('/careers/:companyId/jobs/:jobId', async (req, res) => {
  try {
    const job = await Job.findOne({
      where: { id: req.params.jobId, companyId: req.params.companyId, status: 'open' },
      attributes: ['id', 'title', 'description', 'location', 'jobType', 'minExperience', 'maxExperience', 'minSalary', 'maxSalary', 'openings', 'createdAt']
    });
    if (!job) return res.status(404).json({ message: 'Job not found' });
    res.json(job);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Company branding (name) for the careers page header
router.get('/careers/:companyId/company', async (req, res) => {
  try {
    const company = await Company.findByPk(req.params.companyId, { attributes: ['id', 'name'] });
    if (!company) return res.status(404).json({ message: 'Not found' });
    res.json(company);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Apply to a job — creates candidate automatically
router.post('/careers/:companyId/jobs/:jobId/apply', upload.single('resume'), async (req, res) => {
  try {
    const { name, email, phone } = req.body;
    if (!name || !email || !req.file) {
      return res.status(400).json({ message: 'Name, email, and resume are required' });
    }

    const job = await Job.findOne({ where: { id: req.params.jobId, companyId: req.params.companyId, status: 'open' } });
    if (!job) return res.status(404).json({ message: 'Job not found or closed' });

    const uploadResult = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { resource_type: 'raw', folder: 'resumes', public_id: `${Date.now()}_${name.replace(/\s+/g, '_')}` },
        (error, result) => error ? reject(error) : resolve(result)
      );
      stream.end(req.file.buffer);
    });

    const candidate = await Candidate.create({
      name,
      email,
      phone: phone || null,
      resumeUrl: uploadResult.secure_url,
      jobId: job.id,
      companyId: req.params.companyId,
      status: 'new'
    });

    res.status(201).json({ message: 'Application submitted successfully', candidateId: candidate.id });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Indeed-compatible XML feed (free organic listing)
router.get('/careers/:companyId/feed.xml', async (req, res) => {
  try {
    const company = await Company.findByPk(req.params.companyId, { attributes: ['name'] });
    const jobs = await Job.findAll({ where: { companyId: req.params.companyId, status: 'open' } });
    const baseUrl = process.env.FRONTEND_URL || '';

    const escapeXml = (str = '') => String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

    const items = jobs.map(j => `
    <job>
      <title><![CDATA[${j.title}]]></title>
      <date><![CDATA[${new Date(j.createdAt).toUTCString()}]]></date>
      <referencenumber><![CDATA[${j.id}]]></referencenumber>
      <url><![CDATA[${baseUrl}/careers/${req.params.companyId}/jobs/${j.id}]]></url>
      <company><![CDATA[${company?.name || 'Company'}]]></company>
      <city><![CDATA[${j.location || ''}]]></city>
      <state></state>
      <country><![CDATA[IN]]></country>
      <description><![CDATA[${j.description || ''}]]></description>
      <jobtype><![CDATA[${(j.jobType || 'full_time').replace('_', ' ')}]]></jobtype>
    </job>`).join('');

    res.set('Content-Type', 'application/xml');
    res.send(`<?xml version="1.0" encoding="UTF-8"?><source>${items}</source>`);
  } catch (err) {
    res.status(500).send('Error generating feed');
  }
});

module.exports = router;