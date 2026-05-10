const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User, Company } = require('../models');
const { auth } = require('../middleware/auth');

// COMPANY REGISTER (self signup)
router.post('/register', async (req, res) => {
  try {
    const { companyName, name, email, password } = req.body;
    if (!companyName || !name || !email || !password)
      return res.status(400).json({ message: 'All fields required' });

    const exists = await User.findOne({ where: { email } });
    if (exists) return res.status(400).json({ message: 'Email already registered' });

    const company = await Company.create({
      name: companyName, email,
      plan: 'free', maxJobs: 3, maxCandidates: 25, maxUsers: 2
    });

    const hash = await bcrypt.hash(password, 12);
    const user = await User.create({ name, email, password: hash, role: 'super_admin', companyId: company.id });

    const token = jwt.sign({ id: user.id, companyId: company.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role, companyId: company.id }, company });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// LOGIN
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ where: { email }, include: [{ model: Company, as: 'company' }] });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ message: 'Invalid credentials' });
    if (!user.isActive) return res.status(403).json({ message: 'Account deactivated' });
    const token = jwt.sign({ id: user.id, companyId: user.companyId, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role, companyId: user.companyId }, company: user.company });
  } catch (err) { res.status(500).json({ message: err.message }); }
});




// ME
router.get('/me', auth, async (req, res) => {
  res.json({ user: { id: req.user.id, name: req.user.name, email: req.user.email, role: req.user.role, companyId: req.user.companyId }, company: req.user.company });
});

module.exports = router;