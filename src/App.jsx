import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import Dashboard from './pages/Dashboard';
import LeadsTable from './pages/LeadsTable';
import OutreachQueue from './pages/OutreachQueue';
import Templates from './pages/Templates';
import Settings from './pages/Settings';
import LeadDetail from './components/LeadDetail';
import Toast from './components/Toast';
import { api } from './utils/api';

// Global context
export const AppContext = createContext(null);
export const useApp = () => useContext(AppContext);

const TABS = [
  { id: 'dashboard', label: 'Dashboard', icon: '⚡' },
  { id: 'leads', label: 'All Leads', icon: '🏢' },
  { id: 'outreach', label: 'Outreach', icon: '📨' },
  { id: 'templates', label: 'Templates', icon: '✉️' },
  { id: 'settings', label: 'Settings', icon: '⚙️' },
];

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [leads, setLeads] = useState([]);
  const [stats, setStats] = useState(null);
  const [settings, setSettings] = useState(null);
  const [templates, setTemplates] = useState([]);
  const [selectedLead, setSelectedLead] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isScanning, setIsScanning] = useState(false);
  const [lastScan, setLastScan] = useState(null);
  const [toasts, setToasts] = useState([]);

  const toast = useCallback((message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  }, []);

  const loadData = useCallback(async () => {
    try {
      const [leadsRes, statsRes, settingsRes, templatesRes] = await Promise.all([
        api.getLeads(),
        api.getStats(),
        api.getSettings(),
        api.getTemplates(),
      ]);
      setLeads(leadsRes.leads || []);
      setStats(statsRes.stats || null);
      setSettings(settingsRes.settings || null);
      setTemplates(templatesRes.templates || []);
    } catch (err) {
      console.error('Failed to load data:', err);
      toast('Failed to load data — is the server running?', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleScan = useCallback(async () => {
    setIsScanning(true);
    try {
      const res = await api.triggerScan();
      toast(`Scan complete — found ${res.newLeads} new filings!`);
      setLastScan(new Date());
      await loadData();
    } catch (err) {
      toast('Scan failed: ' + err.message, 'error');
    } finally {
      setIsScanning(false);
    }
  }, [loadData, toast]);

  const handleSendEmail = useCallback(async (id) => {
    try {
      await api.sendEmail(id);
      toast('Email queued successfully!');
      await loadData();
    } catch (err) {
      toast('Email failed: ' + err.message, 'error');
    }
  }, [loadData, toast]);

  const handleQueueMailer = useCallback(async (id) => {
    try {
      await api.queueMailer(id);
      toast('Physical mailer queued!');
      await loadData();
    } catch (err) {
      toast('Mailer failed: ' + err.message, 'error');
    }
  }, [loadData, toast]);

  const handleBulkEmail = useCallback(async (ids) => {
    try {
      const res = await api.bulkEmail(ids);
      toast(`${res.sent} emails queued!`);
      await loadData();
    } catch (err) {
      toast('Bulk email failed: ' + err.message, 'error');
    }
  }, [loadData, toast]);

  const handleBulkMailer = useCallback(async (ids) => {
    try {
      const res = await api.bulkMailer(ids);
      toast(`${res.queued} mailers queued!`);
      await loadData();
    } catch (err) {
      toast('Bulk mailer failed: ' + err.message, 'error');
    }
  }, [loadData, toast]);

  const ctx = {
    leads, stats, settings, templates, isLoading, isScanning, lastScan,
    setActiveTab, setSelectedLead, setSettings, setTemplates,
    handleScan, handleSendEmail, handleQueueMailer, handleBulkEmail, handleBulkMailer,
    loadData, toast,
  };

  return (
    <AppContext.Provider value={ctx}>
      <div className="min-h-screen bg-surface-50">
        {/* Header */}
        <header className="bg-surface-950 text-white">
          <div className="max-w-[1440px] mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
                   style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
                ⚡
              </div>
              <div>
                <h1 className="text-lg font-bold tracking-tight">CA Lead Engine</h1>
                <p className="text-xs text-white/50 mt-0.5">California Secretary of State · Filing Monitor</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {lastScan && (
                <span className="text-xs text-white/40 hidden sm:inline">
                  Last scan: {lastScan.toLocaleTimeString()}
                </span>
              )}
              <button
                onClick={handleScan}
                disabled={isScanning}
                className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-xl text-sm font-semibold
                           transition-all duration-200 flex items-center gap-2 disabled:opacity-50"
              >
                <span className={isScanning ? 'animate-spin' : ''}>↻</span>
                {isScanning ? 'Scanning...' : 'Scan Now'}
              </button>
            </div>
          </div>

          {/* Tab Navigation */}
          <nav className="max-w-[1440px] mx-auto px-6">
            <div className="flex gap-1 -mb-px">
              {TABS.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-3 text-sm font-semibold rounded-t-xl transition-all duration-200 flex items-center gap-2
                    ${activeTab === tab.id
                      ? 'bg-surface-50 text-surface-900 shadow-sm'
                      : 'text-white/50 hover:text-white/80 hover:bg-white/5'
                    }`}
                >
                  <span className="text-base">{tab.icon}</span>
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              ))}
            </div>
          </nav>
        </header>

        {/* Content */}
        <main className="max-w-[1440px] mx-auto px-6 py-6">
          {isLoading ? (
            <LoadingState />
          ) : (
            <>
              {activeTab === 'dashboard' && <Dashboard />}
              {activeTab === 'leads' && <LeadsTable />}
              {activeTab === 'outreach' && <OutreachQueue />}
              {activeTab === 'templates' && <Templates />}
              {activeTab === 'settings' && <Settings />}
            </>
          )}
        </main>

        {/* Lead Detail Modal */}
        {selectedLead && (
          <LeadDetail
            lead={selectedLead}
            onClose={() => setSelectedLead(null)}
            onSendEmail={handleSendEmail}
            onQueueMailer={handleQueueMailer}
          />
        )}

        {/* Toasts */}
        <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2">
          {toasts.map(t => (
            <Toast key={t.id} message={t.message} type={t.type} />
          ))}
        </div>
      </div>
    </AppContext.Provider>
  );
}

function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center py-24">
      <div className="w-12 h-12 border-[3px] border-surface-200 border-t-brand-500 rounded-full animate-spin mb-4" />
      <p className="text-sm text-surface-300 font-medium">Loading CA Lead Engine...</p>
      <p className="text-xs text-surface-300/60 mt-1">Connecting to database</p>
    </div>
  );
}
