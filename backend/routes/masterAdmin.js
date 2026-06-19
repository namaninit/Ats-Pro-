const router = require('express').Router();
const { Op } = require('sequelize');
const { User, Company, Candidate, Job, Client, Interview } = require('../models');
const { auth } = require('../middleware/auth');

const masterOnly = (req, res, next) => {
  if (req.userRole !== 'master_admin')
    return res.status(403).json({ message: 'Master admin access only' });
  next();
};

router.get('/companies', auth, masterOnly, async (req, res) => {
  try {
    const companies = await Company.findAll({
      include: [{ model: User, as: 'users', attributes: ['id','name','email','role','isActive'] }],
      order: [['createdAt', 'DESC']]
    });
    const companiesWithStats = await Promise.all(companies.map(async (c) => {
      const [candidates, jobs, clients] = await Promise.all([
        Candidate.count({ where: { companyId: c.id } }),
        Job.count({ where: { companyId: c.id } }),
        Client.count({ where: { companyId: c.id } }),
      ]);
      return { ...c.toJSON(), stats: { candidates, jobs, clients } };
    }));
    res.json(companiesWithStats);
  } catch (err) {
    if (!res.headersSent) res.status(500).json({ message: err.message });
  }
});

router.get('/companies/:id', auth, masterOnly, async (req, res) => {
  try {
    const company = await Company.findByPk(req.params.id, {
      include: [{ model: User, as: 'users', attributes: { exclude: ['password'] } }]
    });
    if (!company) return res.status(404).json({ message: 'Company not found' });
    const [candidates, jobs, clients, interviews] = await Promise.all([
      Candidate.count({ where: { companyId: company.id } }),
      Job.count({ where: { companyId: company.id } }),
      Client.count({ where: { companyId: company.id } }),
      Interview.count({ where: { companyId: company.id } }),
    ]);
    res.json({ ...company.toJSON(), stats: { candidates, jobs, clients, interviews } });
  } catch (err) {
    if (!res.headersSent) res.status(500).json({ message: err.message });
  }
});

router.put('/companies/:id/plan', auth, masterOnly, async (req, res) => {
  try {
    const { plan, maxJobs, maxCandidates, maxUsers, isActive } = req.body;
    const company = await Company.findByPk(req.params.id);
    if (!company) return res.status(404).json({ message: 'Company not found' });
    await company.update({ plan, maxJobs, maxCandidates, maxUsers, isActive });
    res.json(company);
  } catch (err) {
    if (!res.headersSent) res.status(500).json({ message: err.message });
  }
});

router.delete('/companies/:id', auth, masterOnly, async (req, res) => {
  try {
    const company = await Company.findByPk(req.params.id);
    if (!company) return res.status(404).json({ message: 'Company not found' });
    await company.destroy();
    res.json({ message: 'Company deleted' });
  } catch (err) {
    if (!res.headersSent) res.status(500).json({ message: err.message });
  }
});

router.get('/users', auth, masterOnly, async (req, res) => {
  try {
    const users = await User.findAll({
      where: { role: { [Op.ne]: 'master_admin' } },
      attributes: { exclude: ['password'] },
      include: [{ model: Company, as: 'company', attributes: ['id','name','plan'] }],
      order: [['createdAt', 'DESC']]
    });
    res.json(users);
  } catch (err) {
    if (!res.headersSent) res.status(500).json({ message: err.message });
  }
});

router.put('/users/:id', auth, masterOnly, async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    await user.update({ name: req.body.name, role: req.body.role, isActive: req.body.isActive, companyId: req.body.companyId });
    res.json(user);
  } catch (err) {
    if (!res.headersSent) res.status(500).json({ message: err.message });
  }
});

router.get('/stats', auth, masterOnly, async (req, res) => {
  try {
    const [totalCompanies, activeCompanies, totalUsers, totalCandidates, totalJobs] = await Promise.all([
      Company.count(),
      Company.count({ where: { isActive: true } }),
      User.count({ where: { role: { [Op.ne]: 'master_admin' } } }),
      Candidate.count(),
      Job.count(),
    ]);
    res.json({ totalCompanies, activeCompanies, suspendedCompanies: totalCompanies - activeCompanies, totalUsers, totalCandidates, totalJobs });
  } catch (err) {
    if (!res.headersSent) res.status(500).json({ message: err.message });
  }
});

module.exports = router;