import { cn } from '@/lib/utils';

export function Avatar({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div
      className={cn(
        'flex h-10 w-10 items-center justify-center rounded-full bg-[#0f4c81] font-semibold text-white',
        className,
      )}
    >
      {children}
    </div>
  );
}
