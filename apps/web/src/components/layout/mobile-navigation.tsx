import { Sidebar } from './sidebar';

export function MobileNavigation({ open }: { open: boolean }) {
  if (!open) return null;
  return (
    <div className="lg:hidden">
      <Sidebar mobile />
    </div>
  );
}
