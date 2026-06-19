const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { Op } = require('sequelize');
const { Resend } = require('resend');
const { User, Company } = require('../models');
const { auth } = require('../middleware/auth');

const resend = new Resend(process.env.RESEND_API_KEY);

// ─── REGISTER ────────────────────────────────────────────────────────────────
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
    const user = await User.create({
      name, email, password: hash,
      role: 'super_admin', companyId: company.id
    });

    const token = jwt.sign(
      { id: user.id, companyId: company.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role, companyId: company.id },
      company
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── LOGIN ───────────────────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: 'Email and password required' });

    const user = await User.findOne({
      where: { email },
      include: [{ model: Company, as: 'company' }]
    });

    if (!user) return res.status(401).json({ message: 'Invalid credentials' });
    if (!user.isActive) return res.status(403).json({ message: 'Account deactivated' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

    if (user.role !== 'master_admin') {
      if (!user.company || !user.company.isActive)
        return res.status(403).json({ message: 'Company not found or suspended' });
    }

    const token = jwt.sign(
      { id: user.id, companyId: user.companyId || null, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role, companyId: user.companyId || null },
      company: user.company || null
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// ─── ME ──────────────────────────────────────────────────────────────────────
router.get('/me', auth, async (req, res) => {
  res.json({
    user: { id: req.user.id, name: req.user.name, email: req.user.email, role: req.user.role, companyId: req.user.companyId },
    company: req.user.company || null
  });
});

// ─── FORGOT PASSWORD ─────────────────────────────────────────────────────────
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email required' });

    console.log('📧 Forgot password for:', email);
    console.log('🔑 Resend key loaded:', !!process.env.RESEND_API_KEY);

    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(404).json({ message: 'No account found with this email address.' });

    const token = crypto.randomBytes(32).toString('hex');
    const expiry = new Date(Date.now() + 60 * 60 * 1000);
    await user.update({ resetToken: token, resetTokenExpiry: expiry });

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
    console.log('🔗 Reset URL:', resetUrl);

    // ✅ Check for errors from Resend
    const { data, error } = await resend.emails.send({
      from: 'ATS Pro <onboarding@resend.dev>',
      to: user.email,
      subject: 'Reset your ATS Pro password',
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
          <h2 style="color:#6366f1">ATS Pro — Password Reset</h2>
          <p>Hi ${user.name},</p>
          <p>Click the button below to reset your password:</p>
          <a href="${resetUrl}"
             style="display:inline-block;margin:16px 0;padding:12px 24px;
                    background:#6366f1;color:#fff;border-radius:8px;
                    text-decoration:none;font-weight:600">
            Reset Password
          </a>
          <p style="color:#888;font-size:13px">
            This link expires in 1 hour. If you didn't request this, ignore this email.
          </p>
        </div>
      `
    });

    if (error) {
      console.error('❌ Resend error:', error);
      return res.status(500).json({ message: 'Failed to send reset email: ' + error.message });
    }

    console.log('✅ Email sent! Resend ID:', data?.id);
    return res.json({ message: 'Reset link sent! Check your email inbox.' });

  } catch (err) {
    console.error('Forgot password error:', err);
    if (!res.headersSent) res.status(500).json({ message: 'Failed to send reset email' });
  }
});

// ─── RESET PASSWORD ──────────────────────────────────────────────────────────
router.post('/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) return res.status(400).json({ message: 'Token and password required' });
    if (password.length < 6) return res.status(400).json({ message: 'Minimum 6 characters' });

    const user = await User.findOne({
      where: {
        resetToken: token,
        resetTokenExpiry: { [Op.gt]: new Date() }
      }
    });

    if (!user) return res.status(400).json({ message: 'Invalid or expired reset link. Please request a new one.' });

    const hash = await bcrypt.hash(password, 12);
    await user.update({ password: hash, resetToken: null, resetTokenExpiry: null });

    return res.json({ message: 'Password reset successfully. You can now log in.' });
  } catch (err) {
    console.error('Reset password error:', err);
    if (!res.headersSent) res.status(500).json({ message: 'Reset failed' });
  }
});

module.exports = router;