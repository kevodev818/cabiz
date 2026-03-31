import { useState, useMemo } from 'react';
import { useApp } from '../App';
import { api } from '../utils/api';

const SAMPLE_LEAD = {
  businessName: 'Pacific Digital Solutions LLC',
  agentName: 'Sarah Martinez',
  agentFirstName: 'Sarah',
  agentEmail: 'sarah.martinez@pacificdigital.com',
  city: 'Los Angeles',
  state: 'CA',
  industry: 'Technology',
  entityType: 'LLC',
  filingDate: new Date().toISOString().split('T')[0],
  fullAddress: '4521 Sunset Blvd, Los Angeles, CA 90027',
};

const VARIABLES = [
  ['{{businessName}}', 'Company name'],
  ['{{agentName}}', 'Full agent name'],
  ['{{agentFirstName}}', 'Agent first name'],
  ['{{agentEmail}}', 'Agent email'],
  ['{{city}}', 'Filing city'],
  ['{{state}}', 'State (CA)'],
  ['{{industry}}', 'Industry category'],
  ['{{entityType}}', 'LLC, Corp, etc.'],
  ['{{filingDate}}', 'Date filed'],
  ['{{fullAddress}}', 'Mailing address'],
  ['{{senderName}}', 'Your name'],
  ['{{senderCompany}}', 'Your company'],
  ['{{senderPhone}}', 'Your phone'],
  ['{{senderWebsite}}', 'Your website'],
];

export default function Templates() {
  const { templates, setTemplates, settings, toast } = useApp();
  const [activeType, setActiveType] = useState('email');
  const [editingId, setEditingId] = useState(null);
  const [editValues, setEditValues] = useState({});

  const filtered = useMemo(() => templates.filter(t => t.type === activeType), [templates, activeType]);

  const startEdit = (template) => {
    setEditingId(template._id);
    setEditValues({ name: template.name, subject: template.subject || '', body: template.body });
  };

  const saveEdit = async () => {
    try {
      await api.updateTemplate(editingId, editValues);
      setTemplates(prev => prev.map(t => t._id === editingId ? { ...t, ...editValues } : t));
      setEditingId(null);
      toast('Template saved!');
    } catch (err) {
      toast('Save failed: ' + err.message, 'error');
    }
  };

  const renderPreview = (text) => {
    if (!text) return '';
    let result = text;
    const vars = {
      '{{businessName}}': SAMPLE_LEAD.businessName,
      '{{agentName}}': SAMPLE_LEAD.agentName,
      '{{agentFirstName}}': SAMPLE_LEAD.agentFirstName,
      '{{agentEmail}}': SAMPLE_LEAD.agentEmail,
      '{{city}}': SAMPLE_LEAD.city,
      '{{state}}': SAMPLE_LEAD.state,
      '{{industry}}': SAMPLE_LEAD.industry,
      '{{entityType}}': SAMPLE_LEAD.entityType,
      '{{filingDate}}': SAMPLE_LEAD.filingDate,
      '{{fullAddress}}': SAMPLE_LEAD.fullAddress,
      '{{senderName}}': settings?.senderName || 'Alex Rivera',
      '{{senderCompany}}': settings?.senderCompany || 'Rivera Consulting',
      '{{senderPhone}}': settings?.senderPhone || '(310) 555-0100',
      '{{senderWebsite}}': settings?.senderWebsite || 'https://riveraconsulting.com',
    };
    for (const [key, value] of Object.entries(vars)) {
      result = result.replaceAll(key, value);
    }
    return result;
  };

  return (
    <div className="animate-fade-in">
      {/* Type Toggle */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => { setActiveType('email'); setEditingId(null); }}
          className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 ${
            activeType === 'email'
              ? 'bg-surface-900 text-white shadow-lg'
              : 'bg-white text-surface-800 border border-surface-200 hover:bg-surface-50'
          }`}
        >
          📧 Email Templates
        </button>
        <button
          onClick={() => { setActiveType('mailer'); setEditingId(null); }}
          className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 ${
            activeType === 'mailer'
              ? 'bg-surface-900 text-white shadow-lg'
              : 'bg-white text-surface-800 border border-surface-200 hover:bg-surface-50'
          }`}
        >
          📬 Mailer Templates
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Template List + Editor */}
        <div className="lg:col-span-3 space-y-4">
          {filtered.map(template => (
            <div key={template._id} className="glass-card overflow-hidden">
              <div className="px-5 py-4 border-b border-surface-100 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm">{template.name}</h3>
                  <p className="text-xs text-surface-300 mt-0.5">
                    {template.type === 'email' ? 'Email' : 'Physical Mailer'} template
                    {template.isDefault && ' · Default'}
                  </p>
                </div>
                {editingId === template._id ? (
                  <div className="flex gap-2">
                    <button onClick={saveEdit} className="px-3 py-1.5 bg-green-500 text-white rounded-lg text-xs font-bold hover:bg-green-600 transition-colors">
                      💾 Save
                    </button>
                    <button onClick={() => setEditingId(null)} className="px-3 py-1.5 bg-surface-200 rounded-lg text-xs font-semibold hover:bg-surface-300 transition-colors">
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button onClick={() => startEdit(template)} className="px-3 py-1.5 bg-surface-100 rounded-lg text-xs font-semibold hover:bg-surface-200 transition-colors">
                    ✏️ Edit
                  </button>
                )}
              </div>

              <div className="p-5">
                {editingId === template._id ? (
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-bold uppercase tracking-wider text-surface-300 block mb-1.5">Template Name</label>
                      <input
                        value={editValues.name}
                        onChange={e => setEditValues(prev => ({ ...prev, name: e.target.value }))}
                        className="input-field"
                      />
                    </div>
                    {template.type === 'email' && (
                      <div>
                        <label className="text-xs font-bold uppercase tracking-wider text-surface-300 block mb-1.5">Subject Line</label>
                        <input
                          value={editValues.subject}
                          onChange={e => setEditValues(prev => ({ ...prev, subject: e.target.value }))}
                          className="input-field"
                        />
                      </div>
                    )}
                    <div>
                      <label className="text-xs font-bold uppercase tracking-wider text-surface-300 block mb-1.5">Body</label>
                      <textarea
                        value={editValues.body}
                        onChange={e => setEditValues(prev => ({ ...prev, body: e.target.value }))}
                        className="input-field min-h-[240px] font-mono text-xs leading-relaxed"
                        style={{ resize: 'vertical' }}
                      />
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Preview Mode */}
                    {template.type === 'email' ? (
                      <EmailPreview
                        subject={renderPreview(template.subject)}
                        body={renderPreview(template.body)}
                        sampleLead={SAMPLE_LEAD}
                      />
                    ) : (
                      <MailerPreview
                        body={renderPreview(template.body)}
                        senderName={settings?.senderName || 'Alex Rivera'}
                      />
                    )}
                  </>
                )}
              </div>
            </div>
          ))}

          {filtered.length === 0 && (
            <div className="glass-card p-12 text-center">
              <p className="text-surface-300 text-sm">No {activeType} templates yet</p>
            </div>
          )}
        </div>

        {/* Variables Sidebar */}
        <div className="lg:col-span-2 space-y-4">
          <div className="glass-card p-5">
            <h3 className="font-bold text-sm mb-4">🔀 Template Variables</h3>
            <p className="text-xs text-surface-300 mb-4 leading-relaxed">
              Use these variables in your templates. They auto-fill with each lead's real data when sending.
            </p>
            <div className="space-y-2">
              {VARIABLES.map(([varName, desc]) => (
                <div
                  key={varName}
                  className="flex items-center justify-between py-1.5 border-b border-surface-50 last:border-0"
                >
                  <code className="text-xs font-mono font-semibold text-brand-600 bg-brand-50 px-2 py-0.5 rounded">
                    {varName}
                  </code>
                  <span className="text-xs text-surface-300">{desc}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-card p-5">
            <h3 className="font-bold text-sm mb-3">🔌 Integration Info</h3>
            <div className="text-xs text-surface-800 leading-relaxed space-y-3">
              <div>
                <p className="font-bold text-surface-900">Physical Mailers</p>
                <p className="text-surface-300 mt-1">
                  Connect Lob API, PostGrid, or Handwrytten for automated handwritten-style cards.
                  Or export the address CSV and use any print service.
                </p>
              </div>
              <div>
                <p className="font-bold text-surface-900">Email</p>
                <p className="text-surface-300 mt-1">
                  Sends via Microsoft Graph (Outlook) or SMTP.
                  Configure in Settings → Email Configuration.
                </p>
              </div>
              <div>
                <p className="font-bold text-surface-900">Data Source</p>
                <p className="text-surface-300 mt-1">
                  CA Secretary of State BizFile Online, scanned on your configured interval.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function EmailPreview({ subject, body, sampleLead }) {
  return (
    <div className="border border-surface-200 rounded-xl overflow-hidden">
      <div className="bg-surface-50 px-4 py-3 border-b border-surface-200 text-xs text-surface-300 space-y-1">
        <div><strong className="text-surface-800">To:</strong> {sampleLead.agentEmail}</div>
        <div><strong className="text-surface-800">Subject:</strong> {subject}</div>
      </div>
      <div className="p-5 text-sm leading-relaxed whitespace-pre-line">
        {body}
      </div>
    </div>
  );
}

function MailerPreview({ body, senderName }) {
  return (
    <div
      className="border border-amber-200 rounded-xl p-6 relative overflow-hidden"
      style={{
        background: '#fffef7',
        fontFamily: "'Caveat', cursive",
        fontSize: 16,
        lineHeight: 1.8,
        color: '#2a2520',
      }}
    >
      <div
        className="absolute top-0 left-0 right-0 h-1"
        style={{ background: 'linear-gradient(90deg, #c7945a, #d4a866, #c7945a)' }}
      />
      <div className="text-[10px] uppercase tracking-[0.2em] text-amber-700/50 mb-4" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
        Handwritten-Style Mailer Preview
      </div>
      <div className="whitespace-pre-line">{body}</div>
    </div>
  );
}
