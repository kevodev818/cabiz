export default function Toast({ message, type = 'success' }) {
  const styles = {
    success: 'bg-surface-900 text-white',
    error: 'bg-red-600 text-white',
    info: 'bg-blue-600 text-white',
  };

  const icons = {
    success: '✓',
    error: '✕',
    info: 'ℹ',
  };

  return (
    <div className={`${styles[type]} px-5 py-3 rounded-xl shadow-lg text-sm font-semibold
                     flex items-center gap-2.5 animate-slide-in-right min-w-[200px]`}>
      <span className="text-xs opacity-80">{icons[type]}</span>
      {message}
    </div>
  );
}
