const STYLES = {
  new: { bg: 'bg-blue-50', text: 'text-blue-600', dot: 'bg-blue-500', label: 'New Lead' },
  email_sent: { bg: 'bg-amber-50', text: 'text-amber-600', dot: 'bg-amber-500', label: 'Email Sent' },
  mailer_queued: { bg: 'bg-purple-50', text: 'text-purple-600', dot: 'bg-purple-500', label: 'Mailer Queued' },
  contacted: { bg: 'bg-green-50', text: 'text-green-600', dot: 'bg-green-500', label: 'Contacted' },
  responded: { bg: 'bg-emerald-50', text: 'text-emerald-600', dot: 'bg-emerald-500', label: 'Responded' },
};

export default function StatusBadge({ status }) {
  const s = STYLES[status] || STYLES.new;
  return (
    <span className={`badge ${s.bg} ${s.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  );
}
