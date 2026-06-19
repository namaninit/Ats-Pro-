const router = require('express').Router();
const { Op } = require('sequelize');
const { Client, Job } = require('../models');
const { auth } = require('../middleware/auth');
const {  requireRole } = require('../middleware/auth');


// Only super_admin can delete clients
router.delete('/:id', auth, requireRole('super_admin', 'master_admin'), async (req, res) => {
  try {
    const c = await Client.findOne({ where: { id: req.params.id, companyId: req.companyId } });
    if (!c) return res.status(404).json({ message: 'Not found' });
    await c.destroy();
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.get('/', auth, async (req, res) => {
  try {
    const { search, status } = req.query;
    const where = { companyId: req.companyId };
    if (search) where.companyName = { [Op.like]: `%${search}%` };
    if (status) where.status = status;
    const clients = await Client.findAll({ where, include: [{ model: Job, as: 'jobs' }], order: [['createdAt', 'DESC']] });
    res.json(clients);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const c = await Client.findOne({ where: { id: req.params.id, companyId: req.companyId }, include: [{ model: Job, as: 'jobs' }] });
    if (!c) return res.status(404).json({ message: 'Not found' });
    res.json(c);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.post('/', auth, async (req, res) => {
  try {
    const c = await Client.create({ ...req.body, companyId: req.companyId });
    res.status(201).json(c);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const c = await Client.findOne({ where: { id: req.params.id, companyId: req.companyId } });
    if (!c) return res.status(404).json({ message: 'Not found' });
    await c.update(req.body);
    res.json(c);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const c = await Client.findOne({ where: { id: req.params.id, companyId: req.companyId } });
    if (!c) return res.status(404).json({ message: 'Not found' });
    await c.destroy();
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;