const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3500;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Serve static files from the root directory
app.use(express.static(__dirname));

// Database setup
const dbFilePath = path.join(__dirname, 'data.json');
if (!fs.existsSync(dbFilePath)) {
  fs.writeFileSync(dbFilePath, JSON.stringify({}), 'utf8');
}

app.get('/api/db', (req, res) => {
  try {
    const data = fs.readFileSync(dbFilePath, 'utf8');
    res.json(JSON.parse(data));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/db', (req, res) => {
  try {
    fs.writeFileSync(dbFilePath, JSON.stringify(req.body, null, 2), 'utf8');
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create reusable transporter helper
const createTransporter = (settings) => {
  return nodemailer.createTransport({
    host: settings.smtpHost,
    port: parseInt(settings.smtpPort) || 587,
    secure: parseInt(settings.smtpPort) === 465, // true for 465, false for other ports
    auth: {
      user: settings.smtpUser,
      pass: settings.smtpPass,
    },
  });
};

app.post('/api/test-smtp', async (req, res) => {
  const { email, smtpSettings } = req.body;

  if (!email || !smtpSettings || !smtpSettings.smtpHost) {
    return res.status(400).json({ success: false, message: 'Missing required configuration.' });
  }

  try {
    const transporter = createTransporter(smtpSettings);
    
    // Verify connection configuration
    await transporter.verify();

    // Send the test email
    const info = await transporter.sendMail({
      from: `"Abeingo BBF Admin" <${smtpSettings.smtpUser}>`,
      to: email,
      subject: "🔌 Abeingo BBF: SMTP Test Connection Successful",
      text: "Hello! If you are reading this, your SMTP configuration is successfully working for Abeingo BBF.",
      html: "<h3>Hello!</h3><p>If you are reading this, your SMTP configuration is successfully working for Abeingo BBF.</p>",
    });

    res.json({ success: true, message: 'SMTP connection verified and test email sent!' });
  } catch (error) {
    console.error('SMTP Test Error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to connect to SMTP server.' });
  }
});

app.post('/api/send-bulk', async (req, res) => {
  const { notifications, smtpSettings } = req.body;

  if (!notifications || !Array.isArray(notifications) || !smtpSettings) {
    return res.status(400).json({ success: false, message: 'Invalid payload.' });
  }

  let transporter;
  try {
    transporter = createTransporter(smtpSettings);
    await transporter.verify();
  } catch (err) {
    return res.status(500).json({ success: false, message: 'SMTP connection failed: ' + err.message });
  }

  let sentCount = 0;
  let bouncedCount = 0;
  let scheduledCount = 0;

  // We loop sequentially to not overwhelm the SMTP server, 
  // but in production a queue (like Bull) is recommended.
  for (const n of notifications) {
    if (n.status === 'scheduled') {
      scheduledCount++;
      continue;
    }

    try {
      await transporter.sendMail({
        from: `"Abeingo BBF Admin" <${smtpSettings.smtpUser}>`,
        to: n.recipientEmail,
        subject: n.subject,
        text: n.message,
        html: n.message.replace(/\n/g, '<br>'), // Basic HTML parsing
      });
      n.status = 'sent';
      sentCount++;
    } catch (err) {
      console.error(`Failed to send to ${n.recipientEmail}:`, err);
      n.status = 'bounced';
      bouncedCount++;
    }
  }

  let message = '';
  if (scheduledCount > 0 && sentCount === 0 && bouncedCount === 0) {
    message = `Successfully scheduled ${scheduledCount} email(s).`;
  } else {
    message = `Successfully dispatched ${sentCount} email(s).`;
    if (bouncedCount > 0) message += ` (${bouncedCount} addresses bounced).`;
    if (scheduledCount > 0) message += ` (${scheduledCount} scheduled for later).`;
  }

  res.json({ 
    success: true, 
    message,
    results: notifications // Send back the updated statuses
  });
});

app.listen(PORT, () => {
  console.log(`Email backend server running on http://localhost:${PORT}`);
});
