const router = require('express').Router();
const { Op } = require('sequelize');
const { Job, Client, Candidate } = require('../models');
const { auth, planLimit } = require('../middleware/auth');
const { requireRole } = require('../middleware/auth');


// Only super_admin can delete jobs
router.delete('/:id', auth, requireRole('super_admin', 'master_admin'), async (req, res) => {
  try {
    const j = await Job.findOne({ where: { id: req.params.id, companyId: req.companyId } });
    if (!j) return res.status(404).json({ message: 'Not found' });
    await j.destroy();
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.get('/', auth, async (req, res) => {
  try {
    const { search, status, clientId } = req.query;
    const where = { companyId: req.companyId };
    if (search) where.title = { [Op.like]: `%${search}%` };
    if (status) where.status = status;
    if (clientId) where.clientId = clientId;
    const jobs = await Job.findAll({ where, include: [{ model: Client, as: 'client' }, { model: Candidate, as: 'candidates' }], order: [['createdAt', 'DESC']] });
    res.json(jobs);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const j = await Job.findOne({ where: { id: req.params.id, companyId: req.companyId }, include: [{ model: Client, as: 'client' }, { model: Candidate, as: 'candidates' }] });
    if (!j) return res.status(404).json({ message: 'Not found' });
    res.json(j);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.post('/', auth, planLimit('jobs'), async (req, res) => {
  try {
    const data = { ...req.body, companyId: req.companyId };
    if (typeof data.requiredSkills === 'string') 
      data.requiredSkills = data.requiredSkills.split(',').map(s => s.trim()).filter(Boolean);
    if (!data.deadline || data.deadline === '' || data.deadline === 'Invalid date') 
      data.deadline = null;
    const j = await Job.create(data);
    res.status(201).json(j);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const j = await Job.findOne({ where: { id: req.params.id, companyId: req.companyId } });
    if (!j) return res.status(404).json({ message: 'Not found' });
    const data = { ...req.body };
    if (typeof data.requiredSkills === 'string') data.requiredSkills = data.requiredSkills.split(',').map(s => s.trim()).filter(Boolean);
    if (!data.deadline || data.deadline === '' || data.deadline === 'Invalid date') data.deadline = null;

    await j.update(data);
    res.json(j);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const j = await Job.findOne({ where: { id: req.params.id, companyId: req.companyId } });
    if (!j) return res.status(404).json({ message: 'Not found' });
    await j.destroy();
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;