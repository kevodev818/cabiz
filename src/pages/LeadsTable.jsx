import { useState, useMemo } from 'react';
import { useApp } from '../App';
import StatusBadge from '../components/StatusBadge';

export default function LeadsTable() {
  const { leads, setSelectedLead, handleSendEmail, handleQueueMailer, handleBulkEmail, handleBulkMailer, toast } = useApp();

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [cityFilter, setCityFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedIds, setSelectedIds] = useState(new Set());

  const cities = useMemo(() => [...new Set(leads.map(l => l.city))].sort(), [leads]);

  const filtered = useMemo(() => {
    let result = leads;
    if (search) {
      const s = search.toLowerCase();
      result = result.filter(l =>
        l.businessName.toLowerCase().includes(s) ||
        l.agentName.toLowerCase().includes(s) ||
        l.city.toLowerCase().includes(s) ||
        l.agentEmail.toLowerCase().includes(s)
      );
    }
    if (typeFilter !== 'all') result = result.filter(l => l.entityType === typeFilter);
    if (cityFilter !== 'all') result = result.filter(l => l.city === cityFilter);
    if (statusFilter !== 'all') result = result.filter(l => l.outreachStatus === statusFilter);
    return result;
  }, [leads, search, typeFilter, cityFilter, statusFilter]);

  const toggleSelect = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedIds.size === filtered.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(filtered.map(l => l._id)));
  };

  const exportCSV = async () => {
    try {
      await (await import('../utils/api')).api.exportCSV();
      toast('CSV exported!');
    } catch (err) { toast('Export failed', 'error'); }
  };

  const exportAddresses = async () => {
    try {
      await (await import('../utils/api')).api.exportAddresses();
      toast('Addresses exported!');
    } catch (err) { toast('Export failed', 'error'); }
  };

  return (
    <div className="animate-fade-in">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-3 mb-4 items-center">
        {/* Search */}
        <div className="relative flex-1 min-w-[240px]">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-300 text-sm">🔍</span>
          <input
            placeholder="Search businesses, agents, cities, emails..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input-field pl-10"
          />
        </div>

        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="select-field">
          <option value="all">All Types</option>
          <option value="LLC">LLC</option>
          <option value="CORP">Corp</option>
          <option value="LP">LP</option>
          <option value="LLP">LLP</option>
        </select>

        <select value={cityFilter} onChange={e => setCityFilter(e.target.value)} className="select-field">
          <option value="all">All Cities</option>
          {cities.map(c => <option key={c} value={c}>{c}</option>)}
        </select>

        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="select-field">
          <option value="all">All Statuses</option>
          <option value="new">New</option>
          <option value="email_sent">Email Sent</option>
          <option value="mailer_queued">Mailer Queued</option>
          <option value="contacted">Contacted</option>
        </select>

        <button onClick={exportCSV} className="btn-primary">
          📥 Export CSV
        </button>
        <button onClick={exportAddresses} className="btn-ghost" style={{ borderColor: '#7c3aed', color: '#7c3aed' }}>
          🏠 Export Addresses
        </button>
      </div>

      {/* Bulk Actions */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 px-4 py-3 bg-brand-50 border border-brand-200 rounded-xl mb-4 animate-slide-up">
          <span className="text-sm font-bold text-brand-800">{selectedIds.size} selected</span>
          <button
            onClick={() => { handleBulkEmail([...selectedIds]); setSelectedIds(new Set()); }}
            className="px-3 py-1.5 bg-amber-500 text-white rounded-lg text-xs font-bold hover:bg-amber-600 transition-colors"
          >
            📧 Send Emails
          </button>
          <button
            onClick={() => { handleBulkMailer([...selectedIds]); setSelectedIds(new Set()); }}
            className="px-3 py-1.5 bg-purple-600 text-white rounded-lg text-xs font-bold hover:bg-purple-700 transition-colors"
          >
            📬 Queue Mailers
          </button>
          <button
            onClick={() => setSelectedIds(new Set())}
            className="px-3 py-1.5 bg-surface-200 text-surface-800 rounded-lg text-xs font-semibold hover:bg-surface-300 transition-colors"
          >
            Clear
          </button>
        </div>
      )}

      {/* Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-surface-50 border-b border-surface-100">
                <th className="table-header w-10">
                  <input
                    type="checkbox"
                    checked={selectedIds.size === filtered.length && filtered.length > 0}
                    onChange={toggleAll}
                  />
                </th>
                <th className="table-header">Business</th>
                <th className="table-header">Contact</th>
                <th className="table-header">Location</th>
                <th className="table-header">Filed</th>
                <th className="table-header">Status</th>
                <th className="table-header text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((lead, i) => (
                <tr
                  key={lead._id}
                  className="table-row animate-slide-up"
                  style={{ animationDelay: `${Math.min(i * 20, 400)}ms`, animationFillMode: 'both' }}
                >
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(lead._id)}
                      onChange={() => toggleSelect(lead._id)}
                      onClick={e => e.stopPropagation()}
                    />
                  </td>
                  <td className="px-4 py-3" onClick={() => setSelectedLead(lead)}>
                    <p className="font-semibold text-sm">{lead.businessName}</p>
                    <p className="text-xs text-surface-300 mt-0.5">
                      {lead.entityType} · {lead.industry}
                    </p>
                  </td>
                  <td className="px-4 py-3" onClick={() => setSelectedLead(lead)}>
                    <p className="text-sm">{lead.agentName}</p>
                    <p className="text-xs text-blue-500 mt-0.5">{lead.agentEmail}</p>
                    <p className="text-xs text-surface-300 mt-0.5">{lead.agentPhone}</p>
                  </td>
                  <td className="px-4 py-3" onClick={() => setSelectedLead(lead)}>
                    <p className="text-xs">{lead.address}</p>
                    <p className="text-xs text-surface-300">{lead.city}, CA {lead.zip}</p>
                  </td>
                  <td className="px-4 py-3" onClick={() => setSelectedLead(lead)}>
                    <p className="text-xs font-mono">{lead.filingDate}</p>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={lead.outreachStatus} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1.5 justify-center">
                      <button
                        onClick={(e) => { e.stopPropagation(); setSelectedLead(lead); }}
                        className="w-8 h-8 rounded-lg border border-surface-200 bg-white flex items-center justify-center
                                   hover:bg-surface-50 transition-colors text-xs"
                        title="View Details"
                      >👁</button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleSendEmail(lead._id); }}
                        disabled={lead.emailSent}
                        className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors text-xs
                          ${lead.emailSent
                            ? 'bg-surface-100 text-surface-300 cursor-default'
                            : 'bg-amber-500 text-white hover:bg-amber-600 cursor-pointer'
                          }`}
                        title="Send Email"
                      >📧</button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleQueueMailer(lead._id); }}
                        disabled={lead.mailerQueued}
                        className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors text-xs
                          ${lead.mailerQueued
                            ? 'bg-surface-100 text-surface-300 cursor-default'
                            : 'bg-purple-600 text-white hover:bg-purple-700 cursor-pointer'
                          }`}
                        title="Queue Mailer"
                      >📬</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="px-5 py-3 border-t border-surface-100 flex items-center justify-between">
          <span className="text-xs text-surface-300">
            Showing {filtered.length} of {leads.length} leads
          </span>
        </div>
      </div>
    </div>
  );
}
