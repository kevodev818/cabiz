import { useApp } from '../App';

const STAT_CARDS = [
  { key: 'total', label: 'Total Leads', color: '#1a1a17', sub: 'all time' },
  { key: 'today', label: 'Filed Today', color: '#2563eb', sub: 'new today' },
  { key: 'thisWeek', label: 'This Week', color: '#059669', sub: 'last 7 days' },
  { key: 'emailsSent', label: 'Emails Sent', color: '#d97706', sub: 'outreach' },
  { key: 'mailersQueued', label: 'Mailers Queued', color: '#7c3aed', sub: 'physical' },
  { key: 'untouched', label: 'Untouched', color: '#dc2626', sub: 'needs action' },
];

export default function Dashboard() {
  const { stats, leads, setActiveTab, setSelectedLead } = useApp();

  if (!stats) return null;

  const todayLeads = leads.filter(l => {
    const today = new Date().toISOString().split('T')[0];
    return l.filingDate === today;
  });

  const citySorted = Object.entries(stats.cities || {}).sort((a, b) => b[1] - a[1]);
  const industrySorted = Object.entries(stats.industries || {}).sort((a, b) => b[1] - a[1]);

  return (
    <div className="animate-fade-in">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        {STAT_CARDS.map((card, i) => (
          <div
            key={card.key}
            className="stat-card animate-slide-up"
            style={{ animationDelay: `${i * 60}ms`, animationFillMode: 'both' }}
          >
            <p className="section-title">{card.label}</p>
            <p
              className="text-3xl font-bold font-mono mt-1.5 tracking-tight"
              style={{ color: card.color }}
            >
              {stats[card.key] ?? 0}
            </p>
            <p className="text-[11px] text-surface-300 mt-0.5">{card.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Latest Filings */}
        <div className="lg:col-span-2 glass-card overflow-hidden">
          <div className="px-5 py-4 border-b border-surface-100 flex items-center justify-between">
            <h3 className="font-bold text-sm">🔥 Latest Filings</h3>
            <button
              onClick={() => setActiveTab('leads')}
              className="text-xs text-brand-600 font-semibold hover:text-brand-700 transition-colors"
            >
              View all →
            </button>
          </div>
          <div className="max-h-[420px] overflow-y-auto">
            {leads.slice(0, 15).map((lead, i) => (
              <div
                key={lead._id}
                onClick={() => setSelectedLead(lead)}
                className="table-row px-5 py-3 flex items-center justify-between animate-slide-up"
                style={{ animationDelay: `${i * 40}ms`, animationFillMode: 'both' }}
              >
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-sm truncate">{lead.businessName}</p>
                  <p className="text-xs text-surface-300 mt-0.5 truncate">
                    {lead.agentName} · {lead.city} · {lead.entityType}
                  </p>
                </div>
                <div className="flex items-center gap-3 ml-3 shrink-0">
                  <span className="text-xs font-mono text-surface-300">{lead.filingDate}</span>
                  <StatusDot status={lead.outreachStatus} />
                </div>
              </div>
            ))}
            {leads.length === 0 && (
              <div className="px-5 py-12 text-center text-sm text-surface-300">
                No leads yet — hit "Scan Now" to get started
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-4">
          {/* City Breakdown */}
          <div className="glass-card overflow-hidden">
            <div className="px-5 py-4 border-b border-surface-100">
              <h3 className="font-bold text-sm">📍 By City</h3>
            </div>
            <div className="p-5 max-h-[200px] overflow-y-auto space-y-3">
              {citySorted.slice(0, 10).map(([city, count]) => {
                const pct = Math.round((count / stats.total) * 100);
                return (
                  <div key={city}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-semibold">{city}</span>
                      <span className="text-surface-300">{count} ({pct}%)</span>
                    </div>
                    <div className="h-1.5 bg-surface-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${pct}%`,
                          background: 'linear-gradient(90deg, #f59e0b, #d97706)',
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Industry Breakdown */}
          <div className="glass-card overflow-hidden">
            <div className="px-5 py-4 border-b border-surface-100">
              <h3 className="font-bold text-sm">🏭 By Industry</h3>
            </div>
            <div className="p-5 max-h-[200px] overflow-y-auto space-y-3">
              {industrySorted.slice(0, 8).map(([industry, count]) => {
                const pct = Math.round((count / stats.total) * 100);
                return (
                  <div key={industry}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-semibold">{industry}</span>
                      <span className="text-surface-300">{count} ({pct}%)</span>
                    </div>
                    <div className="h-1.5 bg-surface-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${pct}%`,
                          background: 'linear-gradient(90deg, #7c3aed, #5b21b6)',
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="glass-card p-5">
            <h3 className="font-bold text-sm mb-3">📊 Entity Types</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-blue-50 rounded-xl p-3 text-center">
                <p className="text-2xl font-bold font-mono text-blue-600">{stats.llcs}</p>
                <p className="text-[10px] font-bold uppercase tracking-wider text-blue-400 mt-1">LLCs</p>
              </div>
              <div className="bg-red-50 rounded-xl p-3 text-center">
                <p className="text-2xl font-bold font-mono text-red-600">{stats.corps}</p>
                <p className="text-[10px] font-bold uppercase tracking-wider text-red-400 mt-1">Corps</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusDot({ status }) {
  const colors = {
    new: 'bg-blue-500',
    email_sent: 'bg-amber-500',
    mailer_queued: 'bg-purple-500',
    contacted: 'bg-green-500',
  };
  return (
    <span className={`w-2 h-2 rounded-full ${colors[status] || colors.new}`} />
  );
}
