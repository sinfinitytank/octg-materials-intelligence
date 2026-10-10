import { ArrowUpRight, CircleHelp, X } from 'lucide-react';
import { useEffect, useRef, type ReactNode } from 'react';
export function PageTitle({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow: string;
  title: string;
  description: string;
  actions?: ReactNode;
}) {
  return (
    <div className="page-heading">
      <div>
        <div className="eyebrow">{eyebrow}</div>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      <div className="heading-actions">{actions}</div>
    </div>
  );
}
export function Badge({ children, tone = 'neutral' }: { children: ReactNode; tone?: string }) {
  return <span className={`badge badge-${tone}`}>{children}</span>;
}
export function Unknown({ label = 'Not reported' }: { label?: string }) {
  return <span className="unknown">{label}</span>;
}
export function Value({
  value,
  unit = '',
}: {
  value: string | number | null | undefined;
  unit?: string;
}) {
  return value === null || value === undefined || value === '' ? (
    <Unknown />
  ) : (
    <>
      {typeof value === 'number'
        ? value.toLocaleString(undefined, { maximumFractionDigits: 2 })
        : value}
      {unit && ` ${unit}`}
    </>
  );
}
export function Notice({ children, tone = 'info' }: { children: ReactNode; tone?: string }) {
  return (
    <div className={`notice notice-${tone}`}>
      <CircleHelp size={17} />
      <div>{children}</div>
    </div>
  );
}
export function EmptyState({
  title,
  children,
  action,
}: {
  title: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="empty-state">
      <div className="empty-symbol">◇</div>
      <h2>{title}</h2>
      <p>{children}</p>
      {action}
    </div>
  );
}
export function SourceLink({
  url,
  children = 'Open source',
}: {
  url: string | null | undefined;
  children?: ReactNode;
}) {
  if (!url || !/^https?:\/\//i.test(url)) return <Unknown label="Source link not available" />;
  return (
    <a href={url} target="_blank" rel="noreferrer" className="source-link">
      {children}
      <ArrowUpRight size={14} />
    </a>
  );
}
export function Modal({
  title,
  onClose,
  children,
  className = '',
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const closeHandler = useRef(onClose);
  closeHandler.current = onClose;
  useEffect(() => {
    const dialog = ref.current;
    const prior = document.activeElement as HTMLElement | null;
    dialog?.showModal();
    const escape = (event: Event) => {
      event.preventDefault();
      closeHandler.current();
    };
    dialog?.addEventListener('cancel', escape);
    return () => {
      dialog?.removeEventListener('cancel', escape);
      dialog?.close();
      prior?.focus();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className={`dialog ${className}`}
      aria-label={title}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="dialog-top">
        <span className="eyebrow">Material intelligence / record detail</span>
        <button className="icon-button" aria-label="Close details" onClick={onClose}>
          <X size={20} />
        </button>
      </div>
      {children}
    </dialog>
  );
}
export function Section({
  title,
  subtitle,
  children,
  className = '',
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`panel ${className}`}>
      <div className="section-heading">
        <div>
          <h2>{title}</h2>
          {subtitle && <p>{subtitle}</p>}
        </div>
      </div>
      {children}
    </section>
  );
}
