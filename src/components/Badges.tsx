import { type Priority, type CaseStatus, type Stage } from '@/lib/types';

export function PriorityBadge({ priority }: { priority: Priority }) {
  const styles: Record<Priority, string> = {
    low: 'bg-muted text-muted-foreground',
    medium: 'bg-info/15 text-info',
    high: 'bg-warning/15 text-warning',
    critical: 'bg-destructive/15 text-destructive',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide ${styles[priority]}`}>
      {priority}
    </span>
  );
}

export function StatusBadge({ status }: { status: CaseStatus }) {
  const styles: Record<CaseStatus, string> = {
    active: 'bg-success/15 text-success',
    completed: 'bg-muted text-muted-foreground',
    on_hold: 'bg-warning/15 text-warning',
    rejected: 'bg-destructive/15 text-destructive',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide ${styles[status]}`}>
      {status.replace('_', ' ')}
    </span>
  );
}

export function StageBadge({ stage }: { stage: Stage }) {
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-primary/10 text-primary">
      {stage}
    </span>
  );
}
