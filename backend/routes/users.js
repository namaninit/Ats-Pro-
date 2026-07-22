const router = require('express').Router();
const bcrypt = require('bcryptjs');
const { User } = require('../models');
const { auth, requireRole } = require('../middleware/auth');

const DEFAULT_PERMISSIONS = {
  canDelete: false,
  canEdit: true,
  canGmailImport: false,
  canBulkUpload: true,
  canViewCTC: true,
  canScheduleInterview: true,
  canViewClients: false,
};

router.get('/', auth, requireRole('super_admin'), async (req, res) => {
  try {
    const users = await User.findAll({
      where: { companyId: req.companyId },
      attributes: { exclude: ['password'] },
      order: [['createdAt', 'DESC']]
    });
    res.json(users);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.post('/', auth, requireRole('super_admin'), async (req, res) => {
  try {
    const { name, email, password, role, permissions } = req.body;
    if (!name || !email || !password) return res.status(400).json({ message: 'Name, email and password required' });
    const exists = await User.findOne({ where: { email } });
    if (exists) return res.status(400).json({ message: 'Email already exists' });
    const hash = await bcrypt.hash(password, 12);
    const user = await User.create({
      name, email, password: hash, role,
      companyId: req.companyId,
      permissions: permissions || DEFAULT_PERMISSIONS
    });
    res.status(201).json({ id: user.id, name: user.name, email: user.email, role: user.role, permissions: user.permissions });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.put('/:id', auth, requireRole('super_admin'), async (req, res) => {
  try {
    const user = await User.findOne({ where: { id: req.params.id, companyId: req.companyId } });
    if (!user) return res.status(404).json({ message: 'Not found' });
    const updates = {};
    if (req.body.name !== undefined) updates.name = req.body.name;
    if (req.body.role !== undefined) updates.role = req.body.role;
    if (req.body.isActive !== undefined) updates.isActive = req.body.isActive;
    if (req.body.permissions !== undefined) updates.permissions = req.body.permissions;
    await user.update(updates);
    res.json({ id: user.id, name: user.name, email: user.email, role: user.role, isActive: user.isActive, permissions: user.permissions });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.delete('/:id', auth, requireRole('super_admin'), async (req, res) => {
  try {
    if (req.params.id == req.user.id) return res.status(400).json({ message: 'Cannot delete yourself' });
    const user = await User.findOne({ where: { id: req.params.id, companyId: req.companyId } });
    if (!user) return res.status(404).json({ message: 'Not found' });
    await user.destroy();
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;