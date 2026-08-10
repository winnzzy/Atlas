import { cn } from '@/lib/utils';

type PageHeaderProps = {
  title: string;
  description?: string;
  eyebrow?: string;
  actions?: React.ReactNode;
  className?: string;
};

export function PageHeader({ title, description, eyebrow, actions, className }: PageHeaderProps) {
  return (
    <div className={cn('flex flex-col gap-4 rounded-[28px] border border-slate-200/80 bg-white/80 p-5 shadow-[0_16px_44px_rgba(15,23,42,0.05)] sm:flex-row sm:items-end sm:justify-between sm:p-6', className)}>
      <div className="max-w-2xl">
        {eyebrow ? (
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#0b314f]">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">{title}</h1>
        {description ? <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}
