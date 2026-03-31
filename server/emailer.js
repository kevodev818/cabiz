/**
 * Email Service
 * 
 * Supports two modes:
 * 1. Microsoft Graph API (sends from your Outlook mailbox)
 * 2. SMTP via Nodemailer (fallback, works with any SMTP provider)
 * 
 * Set your credentials in .env to activate either mode.
 */

import nodemailer from 'nodemailer';
import { db } from './database.js';

// ============================================
// TEMPLATE ENGINE
// ============================================

function renderTemplate(templateStr, lead, settings = {}) {
  const vars = {
    '{{businessName}}': lead.businessName,
    '{{agentName}}': lead.agentName,
    '{{agentFirstName}}': lead.agentFirstName || lead.agentName.split(' ')[0],
    '{{agentEmail}}': lead.agentEmail,
    '{{city}}': lead.city,
    '{{state}}': lead.state,
    '{{industry}}': lead.industry,
    '{{entityType}}': lead.entityType,
    '{{filingDate}}': lead.filingDate,
    '{{fullAddress}}': lead.fullAddress,
    '{{senderName}}': settings.senderName || process.env.SENDER_NAME || 'Your Name',
    '{{senderCompany}}': settings.senderCompany || process.env.SENDER_COMPANY || 'Your Company',
    '{{senderPhone}}': settings.senderPhone || process.env.SENDER_PHONE || '',
    '{{senderWebsite}}': settings.senderWebsite || process.env.SENDER_WEBSITE || '',
    '{{senderEmail}}': settings.senderEmail || process.env.OUTLOOK_EMAIL || process.env.SMTP_USER || '',
  };

  let result = templateStr;
  for (const [key, value] of Object.entries(vars)) {
    result = result.replaceAll(key, value || '');
  }
  return result;
}

// ============================================
// MICROSOFT GRAPH API EMAIL
// ============================================

async function sendViaGraph(to, subject, body) {
  const { ConfidentialClientApplication } = await import('@azure/msal-node');

  const msalConfig = {
    auth: {
      clientId: process.env.AZURE_CLIENT_ID,
      clientSecret: process.env.AZURE_CLIENT_SECRET,
      authority: `https://login.microsoftonline.com/${process.env.AZURE_TENANT_ID}`,
    },
  };

  const cca = new ConfidentialClientApplication(msalConfig);
  const tokenResponse = await cca.acquireTokenByClientCredential({
    scopes: ['https://graph.microsoft.com/.default'],
  });

  const { Client } = await import('@microsoft/microsoft-graph-client');

  const client = Client.init({
    authProvider: (done) => {
      done(null, tokenResponse.accessToken);
    },
  });

  const message = {
    subject,
    body: { contentType: 'Text', content: body },
    toRecipients: [{ emailAddress: { address: to } }],
  };

  const userEmail = process.env.OUTLOOK_EMAIL;
  await client.api(`/users/${userEmail}/sendMail`).post({ message });

  console.log(`[EMAIL] Sent via Graph API to ${to}`);
  return { method: 'graph', to, subject };
}

// ============================================
// SMTP EMAIL (Nodemailer)
// ============================================

async function sendViaSMTP(to, subject, body) {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.office365.com',
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  const fromName = process.env.SMTP_FROM_NAME || process.env.SENDER_NAME || 'CA Lead Engine';
  const fromEmail = process.env.SMTP_USER;

  const info = await transporter.sendMail({
    from: `"${fromName}" <${fromEmail}>`,
    to,
    subject,
    text: body,
    // You can add HTML version here:
    // html: `<div style="font-family: sans-serif; line-height: 1.6;">${body.replace(/\n/g, '<br>')}</div>`,
  });

  console.log(`[EMAIL] Sent via SMTP to ${to} (${info.messageId})`);
  return { method: 'smtp', to, subject, messageId: info.messageId };
}

// ============================================
// MAIN SEND FUNCTION
// ============================================

export async function sendOutreachEmail(lead, templateId = 'default') {
  // Load settings
  const settings = await db.settings.findOne({ _id: 'app-settings' }) || {};

  // Load template
  let template = await db.templates.findOne({ _id: `email-${templateId}` });
  if (!template) {
    template = await db.templates.findOne({ type: 'email', isDefault: true });
  }
  if (!template) {
    throw new Error(`Email template "${templateId}" not found`);
  }

  const subject = renderTemplate(template.subject, lead, settings);
  const body = renderTemplate(template.body, lead, settings);

  // Try Graph API first, fall back to SMTP
  if (process.env.AZURE_CLIENT_ID && process.env.AZURE_CLIENT_SECRET) {
    try {
      return await sendViaGraph(lead.agentEmail, subject, body);
    } catch (err) {
      console.error('[EMAIL] Graph API failed, trying SMTP:', err.message);
    }
  }

  if (process.env.SMTP_USER && process.env.SMTP_PASS) {
    return await sendViaSMTP(lead.agentEmail, subject, body);
  }

  // Demo mode — just log
  console.log(`[EMAIL] DEMO MODE — Would send to: ${lead.agentEmail}`);
  console.log(`[EMAIL] Subject: ${subject}`);
  console.log(`[EMAIL] Body preview: ${body.slice(0, 200)}...`);

  return {
    method: 'demo',
    to: lead.agentEmail,
    subject,
    note: 'Configure SMTP or Azure credentials in .env to send real emails',
  };
}
