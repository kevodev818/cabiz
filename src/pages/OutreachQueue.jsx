import { useMemo } from 'react';
import { useApp } from '../App';
import StatusBadge from '../components/StatusBadge';

const PIPELINE_STAGES = [
  { key: 'new', label: 'New Leads', emoji: '⚪', desc: 'Awaiting first outreach' },
  { key: 'email_sent', label: 'Email Sent', emoji: '📧', desc: 'Email delivered, waiting for reply' },
  { key: 'mailer_queued', label: 'Mailer Queued', emoji: '📬', desc: 'Physical mailer in transit' },
  { key: 'contacted', label: 'Fully Contacted', emoji: '✅', desc: 'Both email and mailer sent' },
];

export default function OutreachQueue() {
  const { leads, handleSendEmail, handleQueueMailer, setSelectedLead } = useApp();

  const stages = useMemo(() => {
    return PIPELINE_STAGES.map(stage => ({
      ...stage,
      leads: leads.filter(l => l.outreachStatus === stage.key),
    }));
  }, [leads]);

  const totalContacted = leads.filter(l => l.emailSent || l.mailerQueued).length;
  const conversionRate = leads.length > 0 ? Math.round((totalContacted / leads.length) * 100) : 0;

  return (
    <div className="animate-fade-in">
      {/* Pipeline Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {stages.map((stage, i) => (
          <div
            key={stage.key}
            className="glass-card p-4 text-center animate-slide-up"
            style={{ animationDelay: `${i * 80}ms`, animationFillMode: 'both' }}
          >
            <span className="text-2xl">{stage.emoji}</span>
            <p className="text-2xl font-bold font-mono mt-2">{stage.leads.length}</p>
            <p className="text-xs font-semibold text-surface-300 mt-1">{stage.label}</p>
          </div>
        ))}
      </div>

      {/* Conversion Bar */}
      <div className="glass-card p-5 mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-sm">Outreach Progress</h3>
          <span className="text-sm font-bold font-mono text-brand-600">{conversionRate}%</span>
        </div>
        <div className="h-3 bg-surface-100 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-1000 ease-out"
            style={{
              width: `${conversionRate}%`,
              background: 'linear-gradient(90deg, #f59e0b, #059669)',
            }}
          />
        </div>
        <p className="text-xs text-surface-300 mt-2">
          {totalContacted} of {leads.length} leads have been contacted via email or mail
        </p>
      </div>

      {/* Pipeline Stages */}
      <div className="space-y-4">
        {stages.map(stage => (
          <div key={stage.key} className="glass-card overflow-hidden">
            <div className="px-5 py-4 border-b border-surface-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-xl">{stage.emoji}</span>
                <div>
                  <h3 className="font-bold text-sm">{stage.label}</h3>
                  <p className="text-xs text-surface-300">{stage.desc}</p>
                </div>
              </div>
              <span className="text-xs font-bold font-mono bg-surface-100 px-3 py-1 rounded-full">
                {stage.leads.length}
              </span>
            </div>

            {stage.leads.length > 0 ? (
              <div className="max-h-[300px] overflow-y-auto">
                {stage.leads.map(lead => (
                  <div
                    key={lead._id}
                    className="table-row px-5 py-3 flex items-center justify-between"
                    onClick={() => setSelectedLead(lead)}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-sm truncate">{lead.businessName}</p>
                      <p className="text-xs text-surface-300 mt-0.5">
                        {lead.agentName} · {lead.city} · Filed {lead.filingDate}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 ml-3 shrink-0">
                      {!lead.emailSent && (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleSendEmail(lead._id); }}
                          className="px-3 py-1.5 bg-amber-500 text-white rounded-lg text-xs font-bold
                                     hover:bg-amber-600 transition-colors"
                        >
                          Send Email
                        </button>
                      )}
                      {!lead.mailerQueued && (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleQueueMailer(lead._id); }}
                          className="px-3 py-1.5 bg-purple-600 text-white rounded-lg text-xs font-bold
                                     hover:bg-purple-700 transition-colors"
                        >
                          Queue Mailer
                        </button>
                      )}
                      {lead.emailSent && lead.mailerQueued && (
                        <span className="text-xs font-bold text-green-600">✓ Complete</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="px-5 py-8 text-center text-sm text-surface-300">
                No leads in this stage
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
