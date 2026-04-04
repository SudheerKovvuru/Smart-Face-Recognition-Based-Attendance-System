const express = require('express');
const router = express.Router();
const { sendEmail } = require('../utils/mailService');
const { auth } = require('../middleware/auth');

// ── Send absence alert email ───────────────────────────────────────────────
router.post('/send-absence-email', auth, async (req, res) => {
  try {
    const { studentEmail, studentName } = req.body;

    if (!studentEmail || !studentName) {
      return res.status(400).json({
        error: 'Missing required fields: studentEmail, studentName'
      });
    }

    const subject = '⚠️ Absence Alert';
    const message = `Dear ${studentName}, you have been marked ABSENT in today's class. Please contact your faculty for more details.`;

    const result = await sendEmail(studentEmail, subject, message);
    
    res.json(result);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to send email',
      details: error.message
    });
  }
});

module.exports = router;
