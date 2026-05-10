const jwt = require('jsonwebtoken');
const { User, Company } = require('../models');

const auth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'No token provided' });
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(decoded.id, { include: [{ model: Company, as: 'company' }] });
    if (!user || !user.isActive) return res.status(401).json({ message: 'Invalid user' });
    if (user.companyId && !user.company?.isActive) return res.status(403).json({ message: 'Company suspended' });
   req.user = user;
req.companyId = user.companyId || user.dataValues?.companyId;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

const requireRole = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) return res.status(403).json({ message: 'Access denied' });
  next();
};

const planLimit = (resource) => async (req, res, next) => {
  try {
    const company = await Company.findByPk(req.companyId);
    if (!company) return next();
    if (resource === 'jobs') {
      const { Job } = require('../models');
      const count = await Job.count({ where: { companyId: req.companyId } });
      if (count >= company.maxJobs) return res.status(403).json({ message: `Job limit reached (${company.maxJobs}). Please upgrade your plan.`, upgrade: true });
    }
    if (resource === 'candidates') {
      const { Candidate } = require('../models');
      const count = await Candidate.count({ where: { companyId: req.companyId } });
      if (count >= company.maxCandidates) return res.status(403).json({ message: `Candidate limit reached (${company.maxCandidates}). Please upgrade your plan.`, upgrade: true });
    }
    next();
  } catch (err) { next(); }
};

module.exports = { auth, requireRole, planLimit };