import { createPortal } from 'react-dom';

const cx = (...c) => c.filter(Boolean).join(' ');

// ---- Button ----
export function Button({ variant = 'primary', size = 'md', className, ...props }) {
  const variants = {
    primary: 'bg-slate-900 text-white hover:bg-slate-700 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200',
    secondary: 'border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800',
    danger: 'bg-red-600 text-white hover:bg-red-500',
    ghost: 'hover:bg-slate-100 dark:hover:bg-slate-800',
  };
  const sizes = { sm: 'px-2.5 py-1 text-sm', md: 'px-4 py-2 text-sm', lg: 'px-5 py-2.5' };
  return (
    <button
      className={cx('rounded-lg font-medium transition disabled:opacity-50 disabled:pointer-events-none',
        variants[variant], sizes[size], className)}
      {...props}
    />
  );
}

// ---- Input ----
export function Input({ label, error, className, ...props }) {
  return (
    <label className="block">
      {label && <span className="mb-1 block text-sm font-medium text-slate-600 dark:text-slate-300">{label}</span>}
      <input
        className={cx('w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none',
          'focus:border-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:focus:border-slate-400',
          error && 'border-red-500', className)}
        {...props}
      />
      {error && <span className="mt-1 block text-xs text-red-500">{error}</span>}
    </label>
  );
}

// ---- Select ----
export function Select({ label, children, className, ...props }) {
  return (
    <label className="block">
      {label && <span className="mb-1 block text-sm font-medium text-slate-600 dark:text-slate-300">{label}</span>}
      <select
        className={cx('w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none',
          'focus:border-slate-900 dark:border-slate-700 dark:bg-slate-900', className)}
        {...props}
      >
        {children}
      </select>
    </label>
  );
}

// ---- Card ----
export function Card({ className, children, title, action }) {
  return (
    <div className={cx('rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900', className)}>
      {(title || action) && (
        <div className="mb-4 flex items-center justify-between">
          {title && <h3 className="font-semibold">{title}</h3>}
          {action}
        </div>
      )}
      {children}
    </div>
  );
}

// ---- Badge ----
export function Badge({ children, color = 'slate' }) {
  const colors = {
    slate: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
    green: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400',
    red: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400',
    blue: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400',
  };
  return <span className={cx('rounded-full px-2.5 py-0.5 text-xs font-medium', colors[color])}>{children}</span>;
}

// ---- Spinner ----
export function Spinner() {
  return (
    <div className="flex justify-center p-8">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-slate-900 dark:border-slate-700 dark:border-t-white" />
    </div>
  );
}

// ---- Modal ----
export function Modal({ open, onClose, title, children, footer }) {
  if (!open) return null;
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-900">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">✕</button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto">{children}</div>
        {footer && <div className="mt-6 flex justify-end gap-2">{footer}</div>}
      </div>
    </div>,
    document.body
  );
}
