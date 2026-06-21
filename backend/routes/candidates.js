const router = require('express').Router();
const multer = require('multer');
const path = require('path');
const { Op } = require('sequelize');
const { Candidate, Job, Client } = require('../models');
const { uploadResume } = require('../services/cloudinary');
const fs = require('fs');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '../uploads/resumes')),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname.replace(/\s/g, '_')}`)
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

// Change this line at top — add requireRole
const { auth, planLimit, requireRole } = require('../middleware/auth');

// Fix POST — guard against no file
router.post('/', auth, planLimit('candidates'), upload.single('resume'), async (req, res) => {
  try {
    const data = { ...req.body, companyId: req.companyId };
    if (req.file) {  // ← ADD THIS CHECK
       const stats = fs.statSync(req.file.path);
      console.log('📁 File path:', req.file.path);
      console.log('📁 File size on disk:', stats.size, 'bytes');
      console.log('📁 Multer reported size:', req.file.size, 'bytes');
      console.log('📁 Mimetype:', req.file.mimetype);
      console.log('📁 Original name:', req.file.originalname);
      data.resumePath = await uploadResume(req.file.path, req.file.originalname);
      fs.unlinkSync(req.file.path);
    }
    if (typeof data.skills === 'string') data.skills = data.skills.split(',').map(s => s.trim()).filter(Boolean);
    const c = await Candidate.create(data);
    res.status(201).json(c);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Fix DELETE — only super_admin can delete
router.delete('/:id', auth, requireRole('super_admin', 'master_admin'), async (req, res) => {
  try {
    const c = await Candidate.findOne({ where: { id: req.params.id, companyId: req.companyId } });
    if (!c) return res.status(404).json({ message: 'Not found' });
    await c.destroy();
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Fix Excel import — add planLimit
// router.post('/import-excel', auth, planLimit('candidates'), multerExcel.single('excel'), async (req, res) => {
 
// });

router.get('/', auth, async (req, res) => {
  try {
    const { search, status, jobId, page = 1, limit = 10 } = req.query;
    const where = { companyId: req.companyId };
    if (search) where[Op.or] = [{ name: { [Op.like]: `%${search}%` } }, { email: { [Op.like]: `%${search}%` } }];
    if (status) where.status = status;
    if (jobId) where.jobId = jobId;
    const offset = (page - 1) * limit;
    const { count, rows } = await Candidate.findAndCountAll({ where, include: [{ model: Job, as: 'job', include: [{ model: Client, as: 'client' }] }], limit: parseInt(limit), offset: parseInt(offset), order: [['createdAt', 'DESC']] });
    res.json({ candidates: rows, total: count, page: parseInt(page), pages: Math.ceil(count / limit) });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const c = await Candidate.findOne({ where: { id: req.params.id, companyId: req.companyId }, include: [{ model: Job, as: 'job', include: [{ model: Client, as: 'client' }] }] });
    if (!c) return res.status(404).json({ message: 'Not found' });
    res.json(c);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.post('/', auth, planLimit('candidates'), upload.single('resume'), async (req, res) => {
  try {
    const data = { ...req.body, companyId: req.companyId };
      data.resumePath = await uploadResume(req.file.path, req.file.originalname);
  fs.unlinkSync(req.file.path);
    if (typeof data.skills === 'string') data.skills = data.skills.split(',').map(s => s.trim()).filter(Boolean);
    const c = await Candidate.create(data);
    res.status(201).json(c);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.put('/:id', auth, upload.single('resume'), async (req, res) => {
  try {
    const c = await Candidate.findOne({ where: { id: req.params.id, companyId: req.companyId } });
    if (!c) return res.status(404).json({ message: 'Not found' });
    const data = { ...req.body };
    if (req.file){
      data.resumePath = await uploadResume(req.file.path, req.file.originalname);
  fs.unlinkSync(req.file.path);
    }
    if (typeof data.skills === 'string') data.skills = data.skills.split(',').map(s => s.trim()).filter(Boolean);
    await c.update(data);
    res.json(c);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.patch('/:id/status', auth, async (req, res) => {
  try {
    const c = await Candidate.findOne({ where: { id: req.params.id, companyId: req.companyId } });
    if (!c) return res.status(404).json({ message: 'Not found' });
    await c.update({ status: req.body.status });
    res.json(c);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const c = await Candidate.findOne({ where: { id: req.params.id, companyId: req.companyId } });
    if (!c) return res.status(404).json({ message: 'Not found' });
    await c.destroy();
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Excel Import
// Excel Import
const multerExcel = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });
router.post('/import-excel', auth, multerExcel.single('excel'), async (req, res) => {
  try {
    console.log('=== EXCEL IMPORT STARTED ===');
    console.log('companyId:', req.companyId);
    console.log('file:', req.file?.originalname, req.file?.size);

    if (!req.file) return res.status(400).json({ message: 'Excel file required' });

    const XLSX = require('xlsx');
    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    console.log('Sheet names:', workbook.SheetNames);

    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet, { defval: '', raw: false });
    console.log('Total rows:', rows.length);
    console.log('First row sample:', JSON.stringify(rows[0]));
    console.log('Column headers:', Object.keys(rows[0] || {}));

    if (!rows.length) return res.status(400).json({ message: 'Excel file is empty' });

    const normalize = (str) => String(str || '').toLowerCase().replace(/[^a-z0-9]/g, '');

    const FIELD_MAP = {
      name:            ['name','fullname','candidatename','candidate'],
      email:           ['email','emailaddress','mail'],
      phone:           ['phone','mobile','contact','phonenumber','mobilenumber','contactnumber'],
      experience:      ['experience','exp','years','totalexperience','experienceyears','totalexp'],
      expectedCTC:     ['expectedctc','expectedsalary','ctcexpected','expctc','expsalary','expectctc'],
      currentCTC:      ['currentctc','currentsalary','ctc','currentsal'],
      skills:          ['skills','skillset','keyskills','skill'],
      currentLocation: ['location','city','currentlocation','place','currentcity'],
      noticePeriod:    ['noticeperiod','notice','noticedays'],
      source:          ['source','from','referredby'],
      notes:           ['notes','remarks','comments'],
    };

    const mapRow = (row) => {
      const mapped = {
        companyId: req.companyId,
        status: 'new',
        source: 'Excel Import'
      };
      const headers = Object.keys(row);
      for (const [field, aliases] of Object.entries(FIELD_MAP)) {
        const matchedHeader = headers.find(h => aliases.includes(normalize(h)));
        if (matchedHeader !== undefined) {
          const val = String(row[matchedHeader] || '').trim();
          if (!val) continue;
          if (field === 'skills') {
            mapped[field] = val.split(/[,;|\/]/).map(s => s.trim()).filter(Boolean);
          } else if (['experience','expectedCTC','currentCTC','noticePeriod'].includes(field)) {
            const num = parseFloat(val.replace(/[^\d.]/g, ''));
            if (!isNaN(num)) mapped[field] = num;
          } else {
            mapped[field] = val;
          }
        }
      }
      return mapped;
    };

    const allMapped = rows.map(mapRow);
    console.log('First mapped row:', JSON.stringify(allMapped[0]));

    const candidates = allMapped.filter(c => c.name && c.name.length > 1);
    console.log('Valid candidates after filter:', candidates.length);

    if (!candidates.length) {
      return res.status(400).json({
        message: `No valid candidates. Columns found: [${Object.keys(rows[0] || {}).join(', ')}]. Need a "Name" column.`
      });
    }

    // Try inserting just first row to check DB error
    try {
      const test = await Candidate.create(candidates[0]);
      console.log('TEST INSERT SUCCESS:', test.id);
      await test.destroy(); // remove test row
    } catch(testErr) {
      console.log('TEST INSERT FAILED:', testErr.message);
      return res.status(500).json({ message: `DB Error: ${testErr.message}`, firstRow: candidates[0] });
    }

    const created = [];
    const errors = [];

    for (let i = 0; i < candidates.length; i++) {
      try {
        const c = await Candidate.create(candidates[i]);
        created.push(c);
      } catch (err) {
        if (errors.length < 3) console.log(`Row ${i+2} error:`, err.message, JSON.stringify(candidates[i]));
        errors.push({ row: i + 2, name: candidates[i].name, error: err.message });
      }
    }

    console.log(`=== DONE: ${created.length} created, ${errors.length} failed ===`);

    res.json({
      message: `✅ ${created.length} candidates imported successfully!`,
      success: created.length,
      failed: errors.length,
      errors: errors.slice(0, 5)
    });
  } catch (err) {
    console.error('EXCEL IMPORT CRASH:', err.message, err.stack);
    res.status(500).json({ message: err.message || 'Import failed' });
  }
});

module.exports = router;