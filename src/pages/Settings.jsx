import { useState, useEffect } from 'react';
import { useApp } from '../App';
import { api } from '../utils/api';

export default function Settings() {
  const { settings, setSettings, toast } = useApp();
  const [form, setForm] = useState(settings || {});
  const [saving, setSaving] = useState(false);
  const [activeSection, setActiveSection] = useState('profile');

  useEffect(() => {
    if (settings) setForm(settings);
  }, [settings]);

  const update = (key, value) => setForm(prev => ({ ...prev, [key]: value }));

  const save = async () => {
    setSaving(true);
    try {
      const res = await api.updateSettings(form);
      setSettings(res.settings);
      toast('Settings saved!');
    } catch (err) {
      toast('Failed to save: ' + err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const SECTIONS = [
    { id: 'profile', label: '👤 Your Profile', desc: 'Name, company, contact info' },
    { id: 'email', label: '📧 Email Config', desc: 'Outlook / SMTP settings' },
    { id: 'mailer', label: '📬 Physical Mailer', desc: 'Lob / print service' },
    { id: 'automation', label: '🤖 Automation', desc: 'Auto-outreach & scanning' },
    { id: 'targeting', label: '🎯 Targeting', desc: 'Filter which leads to capture' },
  ];

  return (
    <div className="animate-fade-in">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="space-y-1">
          {SECTIONS.map(section => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`w-full text-left px-4 py-3 rounded-xl transition-all duration-200 ${
                activeSection === section.id
                  ? 'bg-white shadow-sm border border-surface-200'
                  : 'hover:bg-white/60'
              }`}
            >
              <p className="font-semibold text-sm">{section.label}</p>
              <p className="text-xs text-surface-300 mt-0.5">{section.desc}</p>
            </button>
          ))}

          <div className="pt-4">
            <button
              onClick={save}
              disabled={saving}
              className="btn-accent w-full justify-center"
            >
              {saving ? '⏳ Saving...' : '💾 Save All Settings'}
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="lg:col-span-3">
          {/* Profile */}
          {activeSection === 'profile' && (
            <div className="glass-card p-6 animate-fade-in">
              <h2 className="font-bold text-lg mb-1">Your Profile</h2>
              <p className="text-sm text-surface-300 mb-6">This info appears in your outreach emails and mailers.</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <Field label="Your Name" value={form.senderName} onChange={v => update('senderName', v)} placeholder="Alex Rivera" />
                <Field label="Company Name" value={form.senderCompany} onChange={v => update('senderCompany', v)} placeholder="Rivera Consulting" />
                <Field label="Email Address" value={form.senderEmail} onChange={v => update('senderEmail', v)} placeholder="alex@riveraconsulting.com" type="email" />
                <Field label="Phone Number" value={form.senderPhone} onChange={v => update('senderPhone', v)} placeholder="(310) 555-0100" />
                <Field label="Website" value={form.senderWebsite} onChange={v => update('senderWebsite', v)} placeholder="https://riveraconsulting.com" className="sm:col-span-2" />
              </div>
            </div>
          )}

          {/* Email Config */}
          {activeSection === 'email' && (
            <div className="space-y-4 animate-fade-in">
              <div className="glass-card p-6">
                <h2 className="font-bold text-lg mb-1">Email Configuration</h2>
                <p className="text-sm text-surface-300 mb-6">
                  Connect your Outlook or SMTP server to send emails from your own address.
                </p>

                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
                  <p className="text-sm font-bold text-blue-900 mb-2">📘 Microsoft Outlook (Recommended)</p>
                  <ol className="text-xs text-blue-800 leading-relaxed space-y-1 list-decimal list-inside">
                    <li>Go to <code className="bg-blue-100 px-1 rounded">portal.azure.com</code> → Azure Active Directory → App registrations</li>
                    <li>Create new registration: Name it "CA Lead Engine", set redirect URI to <code className="bg-blue-100 px-1 rounded">http://localhost:3001/auth/callback</code></li>
                    <li>Under API Permissions, add: <code className="bg-blue-100 px-1 rounded">Mail.Send</code>, <code className="bg-blue-100 px-1 rounded">User.Read</code></li>
                    <li>Under Certificates & secrets, create a client secret</li>
                    <li>Copy the Client ID, Tenant ID, and Secret into your <code className="bg-blue-100 px-1 rounded">.env</code> file</li>
                  </ol>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                  <p className="text-sm font-bold text-amber-900 mb-2">⚡ SMTP Alternative</p>
                  <p className="text-xs text-amber-800 leading-relaxed">
                    If you prefer SMTP, set these in your <code className="bg-amber-100 px-1 rounded">.env</code> file: 
                    SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS. Works with Outlook, Gmail, SendGrid, Mailgun, and any SMTP provider.
                  </p>
                </div>

                <div className="mt-6 p-4 bg-surface-50 rounded-xl">
                  <p className="text-xs font-bold text-surface-300 uppercase tracking-wider mb-2">Current Status</p>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse-soft" />
                    <span className="text-sm font-medium">Demo Mode</span>
                    <span className="text-xs text-surface-300">— Configure .env credentials to send real emails</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Physical Mailer */}
          {activeSection === 'mailer' && (
            <div className="glass-card p-6 animate-fade-in">
              <h2 className="font-bold text-lg mb-1">Physical Mailer Service</h2>
              <p className="text-sm text-surface-300 mb-6">
                Send handwritten-style postcards and letters automatically.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <div className="border border-surface-200 rounded-xl p-5 hover:border-brand-300 hover:shadow-sm transition-all cursor-pointer">
                  <p className="font-bold text-sm">🖋 Lob</p>
                  <p className="text-xs text-surface-300 mt-1 leading-relaxed">
                    Automated print & mail API. Sends postcards, letters, and checks.
                    Sign up at lob.com and add your API key to .env
                  </p>
                  <p className="text-xs font-bold text-brand-600 mt-2">$0.63 – $1.50/letter</p>
                </div>
                <div className="border border-surface-200 rounded-xl p-5 hover:border-brand-300 hover:shadow-sm transition-all cursor-pointer">
                  <p className="font-bold text-sm">✍️ Handwrytten</p>
                  <p className="text-xs text-surface-300 mt-1 leading-relaxed">
                    Robot-written cards that look truly handwritten. Premium feel.
                    Sign up at handwrytten.com
                  </p>
                  <p className="text-xs font-bold text-brand-600 mt-2">$3.25+/card</p>
                </div>
              </div>

              <div className="bg-surface-50 rounded-xl p-5">
                <p className="font-bold text-sm mb-3">📋 Manual Option: Export Addresses</p>
                <p className="text-xs text-surface-300 leading-relaxed mb-3">
                  Don't want to use an API? Export all lead addresses as a CSV and upload to any print-and-mail service, 
                  or use them with a local printer and mail merge.
                </p>
                <button
                  onClick={async () => { 
                    try { await api.exportAddresses(); toast('Addresses exported!'); } 
                    catch(e) { toast('Export failed', 'error'); }
                  }}
                  className="btn-ghost text-xs"
                >
                  📥 Export Address CSV
                </button>
              </div>

              <div className="mt-6">
                <h3 className="font-bold text-sm mb-3">Your Return Address</h3>
                <p className="text-xs text-surface-300 mb-4">Set in your .env file under LOB_FROM_* variables</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="From Name" value={form.senderName} onChange={v => update('senderName', v)} disabled />
                  <Field label="From Company" value={form.senderCompany} onChange={v => update('senderCompany', v)} disabled />
                </div>
              </div>
            </div>
          )}

          {/* Automation */}
          {activeSection === 'automation' && (
            <div className="glass-card p-6 animate-fade-in">
              <h2 className="font-bold text-lg mb-1">Automation Settings</h2>
              <p className="text-sm text-surface-300 mb-6">
                Control how the system scans for new businesses and handles outreach.
              </p>

              <div className="space-y-6">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-surface-300 block mb-2">
                    Scan Interval
                  </label>
                  <select
                    value={form.scanInterval || 360}
                    onChange={e => update('scanInterval', parseInt(e.target.value))}
                    className="select-field w-full sm:w-64"
                  >
                    <option value={60}>Every 1 hour</option>
                    <option value={180}>Every 3 hours</option>
                    <option value={360}>Every 6 hours</option>
                    <option value={720}>Every 12 hours</option>
                    <option value={1440}>Every 24 hours</option>
                  </select>
                  <p className="text-xs text-surface-300 mt-2">
                    How often the system checks the CA SOS database for new filings.
                  </p>
                </div>

                <Toggle
                  label="Auto-Send Emails"
                  desc="Automatically send outreach email when a new filing is detected"
                  value={form.autoEmail}
                  onChange={v => update('autoEmail', v)}
                />

                <Toggle
                  label="Auto-Queue Mailers"
                  desc="Automatically queue a physical mailer for each new filing"
                  value={form.autoMailer}
                  onChange={v => update('autoMailer', v)}
                />
              </div>

              {(form.autoEmail || form.autoMailer) && (
                <div className="mt-6 bg-green-50 border border-green-200 rounded-xl p-4">
                  <p className="text-sm font-bold text-green-900">✅ Automation Active</p>
                  <p className="text-xs text-green-800 mt-1 leading-relaxed">
                    When new filings are detected, the system will automatically:
                    {form.autoEmail && ' send an outreach email'}
                    {form.autoEmail && form.autoMailer && ' and'}
                    {form.autoMailer && ' queue a physical mailer'}
                    . Make sure your email and mailer services are configured.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Targeting */}
          {activeSection === 'targeting' && (
            <div className="glass-card p-6 animate-fade-in">
              <h2 className="font-bold text-lg mb-1">Lead Targeting</h2>
              <p className="text-sm text-surface-300 mb-6">
                Filter which new filings to capture and reach out to.
              </p>

              <div className="space-y-6">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-surface-300 block mb-3">
                    Entity Types to Target
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {['LLC', 'CORP', 'LP', 'LLP'].map(type => {
                      const active = (form.targetEntityTypes || []).includes(type);
                      return (
                        <button
                          key={type}
                          onClick={() => {
                            const current = form.targetEntityTypes || [];
                            update('targetEntityTypes', active ? current.filter(t => t !== type) : [...current, type]);
                          }}
                          className={`px-4 py-2 rounded-xl text-sm font-bold transition-all duration-200 ${
                            active
                              ? 'bg-surface-900 text-white'
                              : 'bg-surface-100 text-surface-300 hover:bg-surface-200'
                          }`}
                        >
                          {type}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-surface-300 block mb-2">
                    Target Cities (leave empty for all)
                  </label>
                  <input
                    value={(form.targetCities || []).join(', ')}
                    onChange={e => update('targetCities', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                    className="input-field"
                    placeholder="Los Angeles, San Francisco, San Diego..."
                  />
                  <p className="text-xs text-surface-300 mt-1">Comma-separated city names</p>
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-surface-300 block mb-2">
                    Target Industries (leave empty for all)
                  </label>
                  <input
                    value={(form.targetIndustries || []).join(', ')}
                    onChange={e => update('targetIndustries', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                    className="input-field"
                    placeholder="Technology, Real Estate, Healthcare..."
                  />
                  <p className="text-xs text-surface-300 mt-1">Comma-separated industry names</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder, type = 'text', className = '', disabled = false }) {
  return (
    <div className={className}>
      <label className="text-xs font-bold uppercase tracking-wider text-surface-300 block mb-1.5">{label}</label>
      <input
        type={type}
        value={value || ''}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className={`input-field ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      />
    </div>
  );
}

function Toggle({ label, desc, value, onChange }) {
  return (
    <div className="flex items-start justify-between py-2">
      <div>
        <p className="font-semibold text-sm">{label}</p>
        <p className="text-xs text-surface-300 mt-0.5">{desc}</p>
      </div>
      <button
        onClick={() => onChange(!value)}
        className={`relative w-12 h-7 rounded-full transition-colors duration-200 shrink-0 ml-4 ${
          value ? 'bg-brand-500' : 'bg-surface-200'
        }`}
      >
        <span className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200 ${
          value ? 'translate-x-6' : 'translate-x-1'
        }`} />
      </button>
    </div>
  );
}
