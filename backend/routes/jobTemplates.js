const router = require('express').Router();
const { JobTemplate } = require('../models');
const { auth } = require('../middleware/auth');

// Get all templates for the logged-in user's company
router.get('/', auth, async (req, res) => {
  try {
    const templates = await JobTemplate.findAll({
      where: { companyId: req.companyId },
      order: [['createdAt', 'DESC']]
    });
    res.json(templates);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create a new template
router.post('/', auth, async (req, res) => {
  try {
    const { title, description } = req.body;
    const template = await JobTemplate.create({
      companyId: req.companyId,
      title,
      description,
      createdBy: req.user.id
    });
    res.status(201).json(template);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete a template
router.delete('/:id', auth, async (req, res) => {
  try {
    const template = await JobTemplate.findOne({
      where: { id: req.params.id, companyId: req.companyId }
    });
    if (!template) return res.status(404).json({ message: 'Not found' });
    await template.destroy();
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;