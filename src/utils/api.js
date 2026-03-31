const BASE = '/api';

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || 'Request failed');
  }
  // Handle CSV downloads
  if (res.headers.get('content-type')?.includes('text/csv')) {
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = res.headers.get('content-disposition')?.split('filename=')[1] || 'export.csv';
    a.click();
    URL.revokeObjectURL(url);
    return { success: true };
  }
  return res.json();
}

export const api = {
  // Leads
  getLeads: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/leads${qs ? `?${qs}` : ''}`);
  },
  getLead: (id) => request(`/leads/${id}`),
  updateLead: (id, data) => request(`/leads/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  sendEmail: (id, template) => request(`/leads/${id}/email`, { method: 'POST', body: JSON.stringify({ template }) }),
  queueMailer: (id) => request(`/leads/${id}/mailer`, { method: 'POST' }),
  bulkEmail: (ids) => request('/leads/bulk/email', { method: 'POST', body: JSON.stringify({ ids }) }),
  bulkMailer: (ids) => request('/leads/bulk/mailer', { method: 'POST', body: JSON.stringify({ ids }) }),

  // Scanning
  triggerScan: () => request('/scan', { method: 'POST' }),

  // Stats
  getStats: () => request('/stats'),

  // Activity
  getActivity: () => request('/activity'),

  // Settings
  getSettings: () => request('/settings'),
  updateSettings: (data) => request('/settings', { method: 'PUT', body: JSON.stringify(data) }),

  // Templates
  getTemplates: () => request('/templates'),
  updateTemplate: (id, data) => request(`/templates/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  createTemplate: (data) => request('/templates', { method: 'POST', body: JSON.stringify(data) }),

  // Exports
  exportCSV: () => request('/export/csv'),
  exportAddresses: () => request('/export/addresses'),
};
