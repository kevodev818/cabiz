import { useState } from 'react';
import StatusBadge from './StatusBadge';

export default function LeadDetail({ lead, onClose, onSendEmail, onQueueMailer }) {
  const [notes, setNotes] = useState(lead.notes || '');
  const [copied, setCopied] = useState(null);

  const copy = (text, label) => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        onClick={e => e.stopPropagation()}
        className="bg-white rounded-2xl w-full max-w-[600px] max-h-[85vh] overflow-y-auto shadow-2xl animate-slide-up"
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-surface-100 flex items-start justify-between">
          <div className="min-w-0 flex-1">
            <h2 className="font-bold text-lg truncate">{lead.businessName}</h2>
            <p className="text-xs text-surface-300 mt-1">
              {lead.entityType} · {lead.industry} · Filing #{lead.filingNumber}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-surface-50 flex items-center justify-center
                       hover:bg-surface-100 transition-colors text-surface-300 text-lg shrink-0 ml-3"
          >
            ×
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Status + Date */}
          <div className="flex items-center gap-3">
            <StatusBadge status={lead.outreachStatus} />
            <span className="text-xs text-surface-300 font-mono">Filed: {lead.filingDate}</span>
          </div>

          {/* Contact + Address Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-surface-50 rounded-xl p-4">
              <p className="section-title mb-3">Contact Info</p>
              <div className="space-y-2.5 text-sm">
                <InfoRow icon="👤" text={lead.agentName} onCopy={() => copy(lead.agentName, 'name')} copied={copied === 'name'} />
                <InfoRow icon="📧" text={lead.agentEmail} onCopy={() => copy(lead.agentEmail, 'email')} copied={copied === 'email'} className="text-blue-600" />
                <InfoRow icon="📞" text={lead.agentPhone} onCopy={() => copy(lead.agentPhone, 'phone')} copied={copied === 'phone'} />
              </div>
            </div>

            <div className="bg-surface-50 rounded-xl p-4">
              <p className="section-title mb-3">Mailing Address</p>
              <div className="text-sm leading-relaxed">
                <p>{lead.address}</p>
                <p>{lead.city}, {lead.state} {lead.zip}</p>
              </div>
              <button
                onClick={() => copy(lead.fullAddress, 'address')}
                className="mt-3 text-xs text-brand-600 font-semibold hover:text-brand-700 transition-colors"
              >
                {copied === 'address' ? '✓ Copied!' : '📋 Copy full address'}
              </button>
            </div>
          </div>

          {/* Filing Details */}
          <div className="bg-surface-50 rounded-xl p-4">
            <p className="section-title mb-3">Filing Details</p>
            <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
              <Detail label="Filing Number" value={lead.filingNumber} />
              <Detail label="Entity Type" value={lead.entityType} />
              <Detail label="Industry" value={lead.industry} />
              <Detail label="Status" value={lead.status || 'Active'} />
              <Detail label="Filing Date" value={lead.filingDate} />
              <Detail label="Source" value="CA Secretary of State" />
            </div>
          </div>

          {/* Notes */}
          <div>
            <p className="section-title mb-2">Notes</p>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Add notes about this lead..."
              className="input-field min-h-[80px] text-sm"
              style={{ resize: 'vertical' }}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={() => onSendEmail(lead._id)}
              disabled={lead.emailSent}
              className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all duration-200 flex items-center justify-center gap-2 ${
                lead.emailSent
                  ? 'bg-surface-100 text-surface-300 cursor-default'
                  : 'bg-amber-500 text-white hover:bg-amber-600 active:scale-[0.98]'
              }`}
            >
              {lead.emailSent ? '✓ Email Sent' : '📧 Send Email'}
            </button>
            <button
              onClick={() => onQueueMailer(lead._id)}
              disabled={lead.mailerQueued}
              className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all duration-200 flex items-center justify-center gap-2 ${
                lead.mailerQueued
                  ? 'bg-surface-100 text-surface-300 cursor-default'
                  : 'bg-purple-600 text-white hover:bg-purple-700 active:scale-[0.98]'
              }`}
            >
              {lead.mailerQueued ? '✓ Mailer Queued' : '📬 Queue Mailer'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ icon, text, onCopy, copied, className = '' }) {
  return (
    <div className="flex items-center justify-between group">
      <div className={`flex items-center gap-2 min-w-0 ${className}`}>
        <span className="text-xs">{icon}</span>
        <span className="truncate">{text}</span>
      </div>
      <button
        onClick={onCopy}
        className="text-xs text-surface-300 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-2"
      >
        {copied ? '✓' : '📋'}
      </button>
    </div>
  );
}

function Detail({ label, value }) {
  return (
    <div>
      <span className="text-xs text-surface-300">{label}:</span>
      <span className="text-xs font-semibold ml-1">{value}</span>
    </div>
  );
}
