/**
 * Physical Mailer Service
 * 
 * Integrates with Lob (https://lob.com) to send handwritten-style postcards
 * and letters to newly filed businesses.
 * 
 * If Lob is not configured, falls back to demo mode and logs the mailer.
 * You can also export addresses as CSV and use any print-and-mail service.
 */

import { db } from './database.js';

// ============================================
// TEMPLATE ENGINE
// ============================================

function renderTemplate(templateStr, lead, settings = {}) {
  const vars = {
    '{{businessName}}': lead.businessName,
    '{{agentName}}': lead.agentName,
    '{{agentFirstName}}': lead.agentFirstName || lead.agentName.split(' ')[0],
    '{{city}}': lead.city,
    '{{state}}': lead.state,
    '{{industry}}': lead.industry,
    '{{entityType}}': lead.entityType,
    '{{filingDate}}': lead.filingDate,
    '{{fullAddress}}': lead.fullAddress,
    '{{senderName}}': settings.senderName || process.env.SENDER_NAME || '',
    '{{senderCompany}}': settings.senderCompany || process.env.SENDER_COMPANY || '',
    '{{senderPhone}}': settings.senderPhone || process.env.SENDER_PHONE || '',
    '{{senderWebsite}}': settings.senderWebsite || process.env.SENDER_WEBSITE || '',
  };

  let result = templateStr;
  for (const [key, value] of Object.entries(vars)) {
    result = result.replaceAll(key, value || '');
  }
  return result;
}

// ============================================
// LOB API INTEGRATION
// ============================================

async function sendViaLob(lead, renderedBody, settings) {
  const axios = (await import('axios')).default;

  const lobKey = process.env.LOB_API_KEY;
  const response = await axios.post(
    'https://api.lob.com/v1/letters',
    {
      description: `Outreach to ${lead.businessName}`,
      to: {
        name: lead.agentName,
        company: lead.businessName,
        address_line1: lead.address,
        address_city: lead.city,
        address_state: lead.state,
        address_zip: lead.zip,
        address_country: 'US',
      },
      from: {
        name: process.env.LOB_FROM_NAME || settings.senderName,
        company: settings.senderCompany || process.env.SENDER_COMPANY,
        address_line1: process.env.LOB_FROM_ADDRESS,
        address_city: process.env.LOB_FROM_CITY,
        address_state: process.env.LOB_FROM_STATE,
        address_zip: process.env.LOB_FROM_ZIP,
        address_country: 'US',
      },
      // Lob accepts raw HTML for the letter content
      file: `<html>
<head>
  <style>
    body { font-family: 'Georgia', serif; font-size: 14px; line-height: 1.8; color: #2a2520; padding: 40px; }
    .header { font-size: 11px; color: #8a7d6b; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 30px; }
    .signature { font-family: 'Brush Script MT', cursive; font-size: 28px; color: #6b5a3e; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="header">${settings.senderCompany || ''}</div>
  ${renderedBody.split('\n').map(p => `<p>${p}</p>`).join('')}
</body>
</html>`,
      color: false,
      mail_type: 'usps_first_class',
    },
    {
      auth: { username: lobKey, password: '' },
      headers: { 'Content-Type': 'application/json' },
    }
  );

  console.log(`[MAILER] Sent via Lob to ${lead.agentName} (${response.data.id})`);
  return {
    method: 'lob',
    lobId: response.data.id,
    to: lead.fullAddress,
    expectedDelivery: response.data.expected_delivery_date,
  };
}

// ============================================
// MAIN MAILER FUNCTION
// ============================================

export async function queueMailer(lead) {
  // Load settings
  const settings = await db.settings.findOne({ _id: 'app-settings' }) || {};

  // Load template
  let template = await db.templates.findOne({ type: 'mailer', isDefault: true });
  if (!template) {
    template = await db.templates.findOne({ type: 'mailer' });
  }
  if (!template) {
    throw new Error('No mailer template found');
  }

  const renderedBody = renderTemplate(template.body, lead, settings);

  // Try Lob API
  if (process.env.LOB_API_KEY) {
    try {
      return await sendViaLob(lead, renderedBody, settings);
    } catch (err) {
      console.error('[MAILER] Lob API failed:', err.response?.data || err.message);
    }
  }

  // Demo mode
  console.log(`[MAILER] DEMO MODE — Would mail to: ${lead.fullAddress}`);
  console.log(`[MAILER] Recipient: ${lead.agentName} at ${lead.businessName}`);
  console.log(`[MAILER] Body preview: ${renderedBody.slice(0, 200)}...`);

  return {
    method: 'demo',
    to: lead.fullAddress,
    recipient: lead.agentName,
    note: 'Configure LOB_API_KEY in .env to send real mailers, or export addresses CSV',
  };
}
