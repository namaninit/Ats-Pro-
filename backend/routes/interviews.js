// FILE: backend/routes/interviews.js
// ACTION: REPLACE your existing interviews.js with this

const router = require('express').Router();
const { Resend } = require('resend');
const { format } = require('date-fns');
const { Interview, Candidate, Job, Client, User } = require('../models');
const { auth, requireRole } = require('../middleware/auth');

const resend = new Resend(process.env.RESEND_API_KEY);

// ─── Helper: send interview email ─────────────────────────────────────────────
const sendInterviewEmail = async (interview, candidate, job) => {
  if (!candidate?.email) return; // no email = skip silently

  try {
    const dateStr = interview.scheduledAt
      ? format(new Date(interview.scheduledAt), 'EEEE, dd MMMM yyyy')
      : 'To be confirmed';
    const timeStr = interview.scheduledAt
      ? format(new Date(interview.scheduledAt), 'h:mm a')
      : '';
    const modeLabel = {
      video_call: '📹 Video Call',
      phone_call: '📞 Phone Call',
      in_person:  '🏢 In Person',
    }[interview.mode] || interview.mode || 'To be confirmed';

    const { error } = await resend.emails.send({
      from: 'ATS Pro <onboarding@resend.dev>',
      to: candidate.email,
      subject: `Interview Scheduled — ${job?.title || 'Position'} | Round ${interview.round}`,
      html: `
        <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;background:#f8fafc;">
          <div style="background:#fff;border-radius:12px;padding:32px;border:1px solid #e2e8f0;">

            <div style="text-align:center;margin-bottom:28px;">
              <div style="display:inline-block;background:#6366f1;color:#fff;border-radius:10px;padding:8px 16px;font-size:13px;font-weight:600;margin-bottom:16px;">
                ATS Pro
              </div>
              <h1 style="margin:0;font-size:22px;font-weight:700;color:#1e293b;">
                Interview Scheduled 🎉
              </h1>
              <p style="color:#64748b;font-size:14px;margin-top:8px;">
                Congratulations ${candidate.name}! You have been shortlisted.
              </p>
            </div>

            <!-- Interview details card -->
            <div style="background:#f1f5f9;border-radius:10px;padding:20px;margin-bottom:24px;">
              <table style="width:100%;border-collapse:collapse;">
                <tr>
                  <td style="padding:8px 0;font-size:13px;color:#64748b;width:120px;">Position</td>
                  <td style="padding:8px 0;font-size:13px;font-weight:600;color:#1e293b;">
                    ${job?.title || 'Not specified'}
                  </td>
                </tr>
                <tr style="border-top:1px solid #e2e8f0;">
                  <td style="padding:8px 0;font-size:13px;color:#64748b;">Round</td>
                  <td style="padding:8px 0;font-size:13px;font-weight:600;color:#1e293b;">
                    Round ${interview.round}
                  </td>
                </tr>
                <tr style="border-top:1px solid #e2e8f0;">
                  <td style="padding:8px 0;font-size:13px;color:#64748b;">Date</td>
                  <td style="padding:8px 0;font-size:13px;font-weight:600;color:#1e293b;">
                    ${dateStr}
                  </td>
                </tr>
                <tr style="border-top:1px solid #e2e8f0;">
                  <td style="padding:8px 0;font-size:13px;color:#64748b;">Time</td>
                  <td style="padding:8px 0;font-size:13px;font-weight:600;color:#1e293b;">
                    ${timeStr}
                  </td>
                </tr>
                <tr style="border-top:1px solid #e2e8f0;">
                  <td style="padding:8px 0;font-size:13px;color:#64748b;">Mode</td>
                  <td style="padding:8px 0;font-size:13px;font-weight:600;color:#1e293b;">
                    ${modeLabel}
                  </td>
                </tr>
                ${interview.notes ? `
                <tr style="border-top:1px solid #e2e8f0;">
                  <td style="padding:8px 0;font-size:13px;color:#64748b;">Notes</td>
                  <td style="padding:8px 0;font-size:13px;color:#475569;">
                    ${interview.notes}
                  </td>
                </tr>` : ''}
              </table>
            </div>

            <p style="font-size:13px;color:#64748b;line-height:1.7;margin-bottom:24px;">
              Please be prepared and join on time. If you have any questions or need to reschedule, 
              reply to this email or contact your recruiter directly.
            </p>

            <div style="text-align:center;padding-top:20px;border-top:1px solid #e2e8f0;">
              <p style="font-size:12px;color:#94a3b8;margin:0;">
                This email was sent by ATS Pro — Recruitment Management Platform
              </p>
            </div>
          </div>
        </div>
      `
    });

    if (error) {
      console.error('Interview email error:', error);
    } else {
      console.log(`✅ Interview email sent to ${candidate.email}`);
    }
  } catch (err) {
    // Never let email failure crash the interview creation
    console.error('Interview email failed (non-blocking):', err.message);
  }
};

// ─── GET all interviews ────────────────────────────────────────────────────────
router.get('/', auth, async (req, res) => {
  try {
    const { status, candidateId } = req.query;
    const where = { companyId: req.companyId };
    if (status) where.status = status;
    if (candidateId) where.candidateId = candidateId;

    const interviews = await Interview.findAll({
      where,
      include: [
        { model: Candidate, as: 'candidate' },
        { model: Job, as: 'job', include: [{ model: Client, as: 'client' }] },
        { model: User, as: 'interviewer', attributes: ['id', 'name', 'email'] }
      ],
      order: [['scheduledAt', 'ASC']]
    });
    res.json(interviews);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ─── POST create interview ─────────────────────────────────────────────────────
router.post('/', auth, async (req, res) => {
  try {
    const interview = await Interview.create({
      ...req.body,
      companyId: req.companyId
    });

    // Fetch candidate + job for email (non-blocking)
    try {
      const [candidate, job] = await Promise.all([
        Candidate.findByPk(interview.candidateId),
        Job.findByPk(interview.jobId),
      ]);
      // Fire and forget — don't await, don't block the response
      sendInterviewEmail(interview, candidate, job);
    } catch {
      // Email fetch failed — still return success
    }

    res.status(201).json(interview);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ─── PUT update interview ──────────────────────────────────────────────────────
router.put('/:id', auth, async (req, res) => {
  try {
    const i = await Interview.findOne({
      where: { id: req.params.id, companyId: req.companyId }
    });
    if (!i) return res.status(404).json({ message: 'Not found' });

    const wasScheduled = i.status !== 'scheduled' && req.body.status === 'scheduled';
    await i.update(req.body);

    // Send email if interview was rescheduled or time changed
    if (wasScheduled || req.body.scheduledAt !== i.scheduledAt) {
      try {
        const [candidate, job] = await Promise.all([
          Candidate.findByPk(i.candidateId),
          Job.findByPk(i.jobId),
        ]);
        sendInterviewEmail(i, candidate, job);
      } catch { /* non-blocking */ }
    }

    res.json(i);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ─── DELETE interview — super_admin only ──────────────────────────────────────
router.delete('/:id', auth, requireRole('super_admin', 'master_admin'), async (req, res) => {
  try {
    const i = await Interview.findOne({
      where: { id: req.params.id, companyId: req.companyId }
    });
    if (!i) return res.status(404).json({ message: 'Not found' });
    await i.destroy();
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;