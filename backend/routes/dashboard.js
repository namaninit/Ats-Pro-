const router = require('express').Router();
const { sequelize, Candidate, Job, Client, Interview } = require('../models');
const { auth } = require('../middleware/auth');
const { Op } = require('sequelize');

router.get('/stats', auth, async (req, res) => {
  try {
    const cId = req.companyId;
    const [totalCandidates, totalJobs, totalClients, totalInterviews] = await Promise.all([
      Candidate.count({ where: { companyId: cId } }),
      Job.count({ where: { companyId: cId, status: 'open' } }),
      Client.count({ where: { companyId: cId, status: 'active' } }),
      Interview.count({ where: { companyId: cId, status: 'scheduled', scheduledAt: { [Op.gte]: new Date() } } })
    ]);
    const candidatesByStatus = await Candidate.findAll({ attributes: ['status', [sequelize.fn('COUNT', sequelize.col('id')), 'count']], where: { companyId: cId }, group: ['status'] });
    const jobsByStatus = await Job.findAll({ attributes: ['status', [sequelize.fn('COUNT', sequelize.col('id')), 'count']], where: { companyId: cId }, group: ['status'] });
    const sixMonthsAgo = new Date(); sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const monthlyHired = await Candidate.findAll({ attributes: [[sequelize.fn('MONTH', sequelize.col('createdAt')), 'month'], [sequelize.fn('YEAR', sequelize.col('createdAt')), 'year'], [sequelize.fn('COUNT', sequelize.col('id')), 'count']], where: { companyId: cId, status: 'hired', createdAt: { [Op.gte]: sixMonthsAgo } }, group: [sequelize.fn('MONTH', sequelize.col('createdAt')), sequelize.fn('YEAR', sequelize.col('createdAt'))], order: [[sequelize.fn('YEAR', sequelize.col('createdAt')), 'ASC'], [sequelize.fn('MONTH', sequelize.col('createdAt')), 'ASC']] });
    const recentCandidates = await Candidate.findAll({ where: { companyId: cId }, limit: 5, order: [['createdAt', 'DESC']] });
    const upcomingInterviews = await Interview.findAll({ where: { companyId: cId, status: 'scheduled', scheduledAt: { [Op.gte]: new Date() } }, include: [{ model: Candidate, as: 'candidate' }, { model: Job, as: 'job' }], limit: 5, order: [['scheduledAt', 'ASC']] });
    res.json({ stats: { totalCandidates, totalJobs, totalClients, totalInterviews }, candidatesByStatus, jobsByStatus, monthlyHired, recentCandidates, upcomingInterviews });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;