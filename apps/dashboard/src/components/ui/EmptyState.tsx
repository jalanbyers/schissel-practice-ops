import type { LucideIcon } from 'lucide-react';
import { List } from 'lucide-react';

interface EmptyStateProps {
  Icon?: LucideIcon;
  title: string;
  desc: string;
}

export function EmptyState({ Icon = List, title, desc }: EmptyStateProps) {
  return (
    <div className="empty">
      <div className="empty-ico">
        <Icon size={22} />
      </div>
      <div className="empty-title">{title}</div>
      <div className="empty-desc">{desc}</div>
    </div>
  );
}
