const router = require('express').Router();
const { Interview, Candidate, Job, Client, User } = require('../models');
const { auth } = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  try {
    const { status } = req.query;
    const where = { companyId: req.companyId };
    if (status) where.status = status;
    const interviews = await Interview.findAll({ where, include: [{ model: Candidate, as: 'candidate' }, { model: Job, as: 'job', include: [{ model: Client, as: 'client' }] }, { model: User, as: 'interviewer', attributes: ['id','name','email'] }], order: [['scheduledAt', 'ASC']] });
    res.json(interviews);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.post('/', auth, async (req, res) => {
  try {
    const i = await Interview.create({ ...req.body, companyId: req.companyId });
    res.status(201).json(i);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const i = await Interview.findOne({ where: { id: req.params.id, companyId: req.companyId } });
    if (!i) return res.status(404).json({ message: 'Not found' });
    await i.update(req.body);
    res.json(i);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const i = await Interview.findOne({ where: { id: req.params.id, companyId: req.companyId } });
    if (!i) return res.status(404).json({ message: 'Not found' });
    await i.destroy();
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;