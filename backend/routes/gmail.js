require('dotenv').config();
const router = require('express').Router();
const { google } = require('googleapis');
const { auth } = require('../middleware/auth');
const { GmailToken, Candidate, Job } = require('../models');
const Groq = require('groq-sdk');
const fs = require('fs');
const path = require('path');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// OAuth2 client
const getOAuth2Client = () => new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

// STEP 1 — Generate Gmail auth URL
router.get('/auth-url', auth, (req, res) => {
  const oauth2Client = getOAuth2Client();
  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: [
      'https://www.googleapis.com/auth/gmail.readonly',
      'https://www.googleapis.com/auth/userinfo.email',
    ],
    state: JSON.stringify({ userId: req.user.id, companyId: req.companyId })
  });
  res.json({ url });
});

// STEP 2 — OAuth callback (Google redirects here)
router.get('/callback', async (req, res) => {
  try {
    const { code, state } = req.query;
    const { userId, companyId } = JSON.parse(state);
    const oauth2Client = getOAuth2Client();
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Get user email
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const userInfo = await oauth2.userinfo.get();
    const email = userInfo.data.email;

    // Save or update token
    await GmailToken.upsert({
      companyId, userId, email,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiryDate: tokens.expiry_date,
      isActive: true
    });

    // Redirect to frontend
    res.redirect(`${process.env.FRONTEND_URL}/gmail-import?connected=true&email=${email}`);
  } catch (err) {
    console.error('Gmail callback error:', err);
    res.redirect(`${process.env.FRONTEND_URL}/gmail-import?error=true`);
  }
});

// STEP 3 — Get connected Gmail accounts
router.get('/accounts', auth, async (req, res) => {
  try {
    const tokens = await GmailToken.findAll({
      where: { companyId: req.companyId, isActive: true }
    });
    res.json(tokens);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// STEP 4 — Disconnect Gmail
router.delete('/disconnect/:id', auth, async (req, res) => {
  try {
    const token = await GmailToken.findOne({ where: { id: req.params.id, companyId: req.companyId } });
    if (!token) return res.status(404).json({ message: 'Not found' });
    await token.update({ isActive: false });
    res.json({ message: 'Disconnected' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// STEP 5 — Scan Gmail for resumes
router.post('/scan/:tokenId', auth, async (req, res) => {
  try {
    const gmailToken = await GmailToken.findOne({ where: { id: req.params.tokenId, companyId: req.companyId } });
    if (!gmailToken) return res.status(404).json({ message: 'Gmail account not found' });

    const oauth2Client = getOAuth2Client();
    oauth2Client.setCredentials({
      access_token: gmailToken.accessToken,
      refresh_token: gmailToken.refreshToken,
      expiry_date: gmailToken.expiryDate
    });

    // Auto refresh token if expired
    oauth2Client.on('tokens', async (tokens) => {
      if (tokens.refresh_token) await gmailToken.update({ refreshToken: tokens.refresh_token });
      await gmailToken.update({ accessToken: tokens.access_token, expiryDate: tokens.expiry_date });
    });

    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    // Search for emails with resume attachments (last 30 days)
    const since = new Date();
    since.setDate(since.getDate() - 30);
    const query = `has:attachment filename:(pdf OR doc OR docx) after:${Math.floor(since.getTime() / 1000)}`;

    const listRes = await gmail.users.messages.list({ userId: 'me', q: query, maxResults: 50 });
    const messages = listRes.data.messages || [];

    if (!messages.length) return res.json({ message: 'No resume emails found in last 30 days', imported: 0, skipped: 0 });

    let imported = 0, skipped = 0, errors = 0;
    const results = [];

    for (const msg of messages) {
      try {
        const fullMsg = await gmail.users.messages.get({ userId: 'me', id: msg.id, format: 'full' });
        const payload = fullMsg.data.payload;
        const headers = payload.headers || [];
        const subject = headers.find(h => h.name === 'Subject')?.value || '';
        const from = headers.find(h => h.name === 'From')?.value || '';
        const date = headers.find(h => h.name === 'Date')?.value || '';

        // Find PDF/DOC attachments
        const parts = payload.parts || [];
        const attachments = parts.filter(p =>
          p.filename && /\.(pdf|doc|docx)$/i.test(p.filename) && p.body?.attachmentId
        );

        if (!attachments.length) { skipped++; continue; }

        for (const att of attachments) {
          try {
            // Download attachment
            const attRes = await gmail.users.messages.attachments.get({
              userId: 'me', messageId: msg.id, id: att.body.attachmentId
            });

            const buffer = Buffer.from(attRes.data.data, 'base64');
            const filename = `gmail_${Date.now()}_${att.filename.replace(/\s/g, '_')}`;
            const filePath = path.join(__dirname, '../uploads/resumes', filename);
            fs.writeFileSync(filePath, buffer);

            // Parse with Groq AI
            let resumeText = '';
            if (att.filename.toLowerCase().endsWith('.pdf')) {
              const pdfParse = require('pdf-parse');
              const pdfData = await pdfParse(buffer);
              resumeText = pdfData.text;
            } else {
              resumeText = buffer.toString('utf8').replace(/[^\x20-\x7E\n]/g, ' ');
            }

            if (!resumeText || resumeText.trim().length < 50) { skipped++; continue; }

            const parsePrompt = `Extract candidate info from this resume. Return ONLY JSON:
{"name":"","email":"","phone":"","totalExperience":0,"skills":[],"currentLocation":"","currentRole":"","expectedCTC":0,"currentCTC":0,"noticePeriod":30}

Resume: ${resumeText.slice(0, 3000)}`;

            const aiRes = await groq.chat.completions.create({
              model: 'llama-3.3-70b-versatile',
              messages: [{ role: 'user', content: parsePrompt }],
              max_tokens: 500, temperature: 0.1
            });

            let parsed = {};
            try {
              const raw = aiRes.choices[0].message.content.trim().replace(/```json|```/g, '').trim();
              parsed = JSON.parse(raw);
            } catch { parsed = {}; }

            // Check if candidate already exists
            const existing = parsed.email ? await Candidate.findOne({
              where: { email: parsed.email, companyId: req.companyId }
            }) : null;

            if (existing) { skipped++; results.push({ name: parsed.name, status: 'skipped', reason: 'Already exists' }); continue; }

            // Create candidate
            const candidate = await Candidate.create({
              name: parsed.name || att.filename.replace(/\.(pdf|doc|docx)$/i, ''),
              email: parsed.email || '',
              phone: parsed.phone || '',
              skills: parsed.skills || [],
              experience: parseFloat(parsed.totalExperience) || 0,
              currentCTC: parseFloat(parsed.currentCTC) || 0,
              expectedCTC: parseFloat(parsed.expectedCTC) || 0,
              noticePeriod: parseInt(parsed.noticePeriod) || 30,
              currentLocation: parsed.currentLocation || '',
              resumePath: filename,
              status: 'new',
              source: 'Gmail Import',
              notes: `Imported from Gmail. From: ${from}. Subject: ${subject}. Date: ${date}`,
              companyId: req.companyId
            });

            imported++;
            results.push({ name: candidate.name, email: candidate.email, status: 'imported' });
          } catch (attErr) {
            errors++;
            console.error('Attachment error:', attErr.message);
          }
        }
      } catch (msgErr) {
        errors++;
        console.error('Message error:', msgErr.message);
      }
    }

    // Update last sync
    await gmailToken.update({ lastSyncAt: new Date(), totalImported: gmailToken.totalImported + imported });

    res.json({ message: `✅ ${imported} candidates imported from Gmail!`, imported, skipped, errors, results });
  } catch (err) {
    console.error('Gmail scan error:', err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;