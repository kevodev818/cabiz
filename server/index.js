import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { scrapeNewFilings } from './scraper.js';
import { sendOutreachEmail } from './emailer.js';
import { queueMailer } from './mailer.js';
import { db } from './database.js';
import { CronJob } from 'cron';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Serve static frontend — always serve if dist folder exists
const distPath = path.join(__dirname, '..', 'dist');
import fs from 'fs';
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  console.log(`[STATIC] Serving frontend from ${distPath}`);
}

// ============================================
// API ROUTES
// ============================================

// GET /api/leads — fetch all leads with optional filters
app.get('/api/leads', async (req, res) => {
  try {
    const { type, city, status, search, days } = req.query;
    let query = {};

    if (type && type !== 'all') query.entityType = type;
    if (city && city !== 'all') query.city = city;
    if (status && status !== 'all') query.outreachStatus = status;

    let leads = await db.leads.find(query).sort({ filingDate: -1 });

    if (search) {
      const s = search.toLowerCase();
      leads = leads.filter(l =>
        l.businessName.toLowerCase().includes(s) ||
        l.agentName.toLowerCase().includes(s) ||
        l.city.toLowerCase().includes(s)
      );
    }

    if (days) {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - parseInt(days));
      leads = leads.filter(l => new Date(l.filingDate) >= cutoff);
    }

    res.json({ success: true, leads, total: leads.length });
  } catch (err) {
    console.error('Error fetching leads:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/leads/:id — single lead detail
app.get('/api/leads/:id', async (req, res) => {
  try {
    const lead = await db.leads.findOne({ _id: req.params.id });
    if (!lead) return res.status(404).json({ success: false, error: 'Lead not found' });
    res.json({ success: true, lead });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PATCH /api/leads/:id — update lead (notes, status, etc.)
app.patch('/api/leads/:id', async (req, res) => {
  try {
    const updates = req.body;
    await db.leads.update({ _id: req.params.id }, { $set: updates });
    const lead = await db.leads.findOne({ _id: req.params.id });
    res.json({ success: true, lead });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/leads/:id/email — send outreach email
app.post('/api/leads/:id/email', async (req, res) => {
  try {
    const lead = await db.leads.findOne({ _id: req.params.id });
    if (!lead) return res.status(404).json({ success: false, error: 'Lead not found' });

    const template = req.body.template || 'default';
    const result = await sendOutreachEmail(lead, template);

    await db.leads.update({ _id: req.params.id }, {
      $set: {
        outreachStatus: 'email_sent',
        emailSent: true,
        emailSentAt: new Date().toISOString(),
      }
    });

    await db.activity.insert({
      leadId: req.params.id,
      type: 'email_sent',
      details: `Email sent to ${lead.agentEmail}`,
      timestamp: new Date().toISOString(),
    });

    res.json({ success: true, result });
  } catch (err) {
    console.error('Email error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/leads/:id/mailer — queue physical mailer
app.post('/api/leads/:id/mailer', async (req, res) => {
  try {
    const lead = await db.leads.findOne({ _id: req.params.id });
    if (!lead) return res.status(404).json({ success: false, error: 'Lead not found' });

    const result = await queueMailer(lead);

    await db.leads.update({ _id: req.params.id }, {
      $set: {
        outreachStatus: 'mailer_queued',
        mailerQueued: true,
        mailerQueuedAt: new Date().toISOString(),
      }
    });

    await db.activity.insert({
      leadId: req.params.id,
      type: 'mailer_queued',
      details: `Mailer queued for ${lead.fullAddress}`,
      timestamp: new Date().toISOString(),
    });

    res.json({ success: true, result });
  } catch (err) {
    console.error('Mailer error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/leads/bulk/email — bulk send emails
app.post('/api/leads/bulk/email', async (req, res) => {
  try {
    const { ids } = req.body;
    const results = [];

    for (const id of ids) {
      try {
        const lead = await db.leads.findOne({ _id: id });
        if (lead && !lead.emailSent) {
          await sendOutreachEmail(lead, 'default');
          await db.leads.update({ _id: id }, {
            $set: { outreachStatus: 'email_sent', emailSent: true, emailSentAt: new Date().toISOString() }
          });
          results.push({ id, success: true });
        }
      } catch (err) {
        results.push({ id, success: false, error: err.message });
      }
    }

    res.json({ success: true, results, sent: results.filter(r => r.success).length });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/leads/bulk/mailer — bulk queue mailers
app.post('/api/leads/bulk/mailer', async (req, res) => {
  try {
    const { ids } = req.body;
    const results = [];

    for (const id of ids) {
      try {
        const lead = await db.leads.findOne({ _id: id });
        if (lead && !lead.mailerQueued) {
          await queueMailer(lead);
          await db.leads.update({ _id: id }, {
            $set: { outreachStatus: 'mailer_queued', mailerQueued: true, mailerQueuedAt: new Date().toISOString() }
          });
          results.push({ id, success: true });
        }
      } catch (err) {
        results.push({ id, success: false, error: err.message });
      }
    }

    res.json({ success: true, results, queued: results.filter(r => r.success).length });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/scan — trigger manual scan
app.post('/api/scan', async (req, res) => {
  try {
    const results = await scrapeNewFilings();
    res.json({
      success: true,
      newLeads: results.length,
      message: `Found ${results.length} new filings`,
    });
  } catch (err) {
    console.error('Scan error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/stats — dashboard statistics
app.get('/api/stats', async (req, res) => {
  try {
    const allLeads = await db.leads.find({});
    const today = new Date().toISOString().split('T')[0];
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const stats = {
      total: allLeads.length,
      today: allLeads.filter(l => l.filingDate === today).length,
      thisWeek: allLeads.filter(l => new Date(l.filingDate) >= weekAgo).length,
      emailsSent: allLeads.filter(l => l.emailSent).length,
      mailersQueued: allLeads.filter(l => l.mailerQueued).length,
      llcs: allLeads.filter(l => l.entityType === 'LLC').length,
      corps: allLeads.filter(l => l.entityType === 'CORP').length,
      untouched: allLeads.filter(l => l.outreachStatus === 'new').length,
      cities: {},
      industries: {},
      dailyCounts: {},
    };

    allLeads.forEach(l => {
      stats.cities[l.city] = (stats.cities[l.city] || 0) + 1;
      stats.industries[l.industry] = (stats.industries[l.industry] || 0) + 1;
      stats.dailyCounts[l.filingDate] = (stats.dailyCounts[l.filingDate] || 0) + 1;
    });

    res.json({ success: true, stats });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/activity — recent activity log
app.get('/api/activity', async (req, res) => {
  try {
    const activities = await db.activity.find({}).sort({ timestamp: -1 }).limit(50);
    res.json({ success: true, activities });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/settings — get app settings
app.get('/api/settings', async (req, res) => {
  try {
    let settings = await db.settings.findOne({ _id: 'app-settings' });
    if (!settings) {
      settings = {
        _id: 'app-settings',
        senderName: process.env.SENDER_NAME || 'Your Name',
        senderCompany: process.env.SENDER_COMPANY || 'Your Company',
        senderEmail: process.env.OUTLOOK_EMAIL || process.env.SMTP_USER || '',
        senderPhone: process.env.SENDER_PHONE || '',
        senderWebsite: process.env.SENDER_WEBSITE || '',
        scanInterval: parseInt(process.env.SCAN_INTERVAL_MINUTES) || 360,
        autoEmail: false,
        autoMailer: false,
        emailTemplate: 'default',
        mailerTemplate: 'handwritten',
        targetEntityTypes: ['LLC', 'CORP'],
        targetCities: [],
        targetIndustries: [],
      };
      await db.settings.insert(settings);
    }
    res.json({ success: true, settings });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/settings — update settings
app.put('/api/settings', async (req, res) => {
  try {
    await db.settings.update({ _id: 'app-settings' }, { $set: req.body });
    const settings = await db.settings.findOne({ _id: 'app-settings' });
    res.json({ success: true, settings });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/templates — get email/mailer templates
app.get('/api/templates', async (req, res) => {
  try {
    const templates = await db.templates.find({});
    if (templates.length === 0) {
      // Seed default templates
      const defaults = [
        {
          _id: 'email-default',
          name: 'Welcome Email',
          type: 'email',
          subject: 'Congrats on {{businessName}} — welcome to California business!',
          body: `Hi {{agentFirstName}},

I noticed you just registered {{businessName}} with the California Secretary of State — congratulations! Starting a {{industry}} business is a big move, and I wanted to reach out personally.

We specialize in helping newly formed California businesses with [YOUR SERVICE]. Many of our clients come to us right after filing and we've helped them [SPECIFIC BENEFIT].

Would you be open to a quick 15-minute call this week? No pressure at all — just happy to help if there's a fit.

Best,
{{senderName}}
{{senderCompany}}
{{senderPhone}}
{{senderWebsite}}`,
          isDefault: true,
        },
        {
          _id: 'email-followup',
          name: 'Follow-Up Email',
          type: 'email',
          subject: 'Quick follow-up — {{businessName}}',
          body: `Hi {{agentFirstName}},

I reached out last week about {{businessName}} and wanted to follow up. I know the first few weeks of a new business are hectic, so I'll keep this brief.

We've helped over [NUMBER] California businesses get started with [YOUR SERVICE], and I'd love to offer you a complimentary [OFFER].

If now isn't the right time, no worries at all — I just wanted to make sure you had this resource available.

Best,
{{senderName}}`,
          isDefault: true,
        },
        {
          _id: 'mailer-handwritten',
          name: 'Handwritten Welcome',
          type: 'mailer',
          body: `Dear {{agentName}},

Congratulations on filing {{businessName}}! Starting a new business in {{city}} is an exciting journey, and I wanted to be one of the first to welcome you.

As a fellow business professional in California, I know firsthand the challenges of getting started. Whether you need [YOUR SERVICE], I'd love to offer a complimentary consultation to help you hit the ground running.

I'd be happy to connect at your convenience — feel free to call, email, or visit our website.

Warm regards,
{{senderName}}
{{senderCompany}}
{{senderPhone}}`,
          isDefault: true,
        },
      ];

      for (const t of defaults) {
        await db.templates.insert(t);
      }
      return res.json({ success: true, templates: defaults });
    }
    res.json({ success: true, templates });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/templates/:id — update a template
app.put('/api/templates/:id', async (req, res) => {
  try {
    await db.templates.update({ _id: req.params.id }, { $set: req.body });
    const template = await db.templates.findOne({ _id: req.params.id });
    res.json({ success: true, template });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/templates — create a new template
app.post('/api/templates', async (req, res) => {
  try {
    const template = await db.templates.insert(req.body);
    res.json({ success: true, template });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/export/csv — export leads as CSV
app.get('/api/export/csv', async (req, res) => {
  try {
    const leads = await db.leads.find({}).sort({ filingDate: -1 });
    const header = 'Filing Number,Business Name,Entity Type,Industry,Filing Date,Agent Name,Email,Phone,Address,City,State,ZIP,Status\n';
    const rows = leads.map(l =>
      `${l.filingNumber},"${l.businessName}",${l.entityType},${l.industry},${l.filingDate},"${l.agentName}",${l.agentEmail},${l.agentPhone},"${l.address}",${l.city},${l.state},${l.zip},${l.outreachStatus}`
    ).join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=ca_leads.csv');
    res.send(header + rows);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/export/addresses — export mailing addresses
app.get('/api/export/addresses', async (req, res) => {
  try {
    const leads = await db.leads.find({}).sort({ filingDate: -1 });
    const header = 'Name,Company,Address,City,State,ZIP\n';
    const rows = leads.map(l =>
      `"${l.agentName}","${l.businessName}","${l.address}",${l.city},${l.state},${l.zip}`
    ).join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=mailer_addresses.csv');
    res.send(header + rows);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Catch-all for SPA — serve index.html for any non-API route
if (fs.existsSync(distPath)) {
  app.get('*', (req, res) => {
    if (req.path.startsWith('/api')) {
      return res.status(404).json({ error: 'API route not found' });
    }
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

// ============================================
// CRON JOB — Automated scanning
// ============================================
const intervalMinutes = parseInt(process.env.SCAN_INTERVAL_MINUTES) || 360;
const cronExpression = `*/${intervalMinutes} * * * *`;

const scanJob = new CronJob(cronExpression, async () => {
  console.log(`[CRON] Running scheduled scan at ${new Date().toISOString()}`);
  try {
    const results = await scrapeNewFilings();
    console.log(`[CRON] Found ${results.length} new filings`);

    // Auto-outreach if enabled
    const settings = await db.settings.findOne({ _id: 'app-settings' });
    if (settings?.autoEmail) {
      for (const lead of results) {
        try {
          await sendOutreachEmail(lead, settings.emailTemplate || 'default');
          await db.leads.update({ _id: lead._id }, {
            $set: { outreachStatus: 'email_sent', emailSent: true, emailSentAt: new Date().toISOString() }
          });
        } catch (err) {
          console.error(`[CRON] Email failed for ${lead.businessName}:`, err.message);
        }
      }
    }

    if (settings?.autoMailer) {
      for (const lead of results) {
        try {
          await queueMailer(lead);
          await db.leads.update({ _id: lead._id }, {
            $set: { mailerQueued: true, mailerQueuedAt: new Date().toISOString() }
          });
        } catch (err) {
          console.error(`[CRON] Mailer failed for ${lead.businessName}:`, err.message);
        }
      }
    }
  } catch (err) {
    console.error('[CRON] Scan failed:', err);
  }
});

scanJob.start();
console.log(`[CRON] Scan scheduled every ${intervalMinutes} minutes`);

// ============================================
// START
// ============================================
app.listen(PORT, () => {
  console.log(`\n⚡ CA Lead Engine server running on http://localhost:${PORT}`);
  console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`   Scan interval: every ${intervalMinutes} minutes\n`);
});
