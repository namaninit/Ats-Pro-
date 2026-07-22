const router = require('express').Router();
const { Op } = require('sequelize');
const { Client, Job } = require('../models');
const { auth, requireRole, requirePermission } = require('../middleware/auth');

// ── LITE LIST (name + id only) ───────────────────────────────────────────────
// Used for dropdowns (e.g. assigning a client when creating a job).
// Open to everyone on the company — no sensitive contact/financial data,
// so this does NOT require the canViewClients permission.
router.get('/lite', auth, async (req, res) => {
  try {
    const clients = await Client.findAll({
      where: { companyId: req.companyId },
      attributes: ['id', 'companyName', 'status'],
      order: [['companyName', 'ASC']]
    });
    res.json(clients);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ── FULL LIST / DETAIL — gated behind canViewClients ─────────────────────────
router.get('/', auth, requirePermission('canViewClients'), async (req, res) => {
  try {
    const { search, status } = req.query;
    const where = { companyId: req.companyId };
    if (search) where.companyName = { [Op.like]: `%${search}%` };
    if (status) where.status = status;
    const clients = await Client.findAll({ where, include: [{ model: Job, as: 'jobs' }], order: [['createdAt', 'DESC']] });
    res.json(clients);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.get('/:id', auth, requirePermission('canViewClients'), async (req, res) => {
  try {
    const c = await Client.findOne({ where: { id: req.params.id, companyId: req.companyId }, include: [{ model: Job, as: 'jobs' }] });
    if (!c) return res.status(404).json({ message: 'Not found' });
    res.json(c);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ── CREATE / EDIT — reuses the existing canEdit permission ───────────────────
router.post('/', auth, requirePermission('canEdit'), async (req, res) => {
  try {
    const c = await Client.create({ ...req.body, companyId: req.companyId });
    res.status(201).json(c);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.put('/:id', auth, requirePermission('canEdit'), async (req, res) => {
  try {
    const c = await Client.findOne({ where: { id: req.params.id, companyId: req.companyId } });
    if (!c) return res.status(404).json({ message: 'Not found' });
    await c.update(req.body);
    res.json(c);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ── DELETE — restricted to admins only, regardless of permission toggles ────
router.delete('/:id', auth, requireRole('super_admin', 'master_admin'), async (req, res) => {
  try {
    const c = await Client.findOne({ where: { id: req.params.id, companyId: req.companyId } });
    if (!c) return res.status(404).json({ message: 'Not found' });
    await c.destroy();
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;