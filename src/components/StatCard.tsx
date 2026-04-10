import type { ReactNode } from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: ReactNode;
  trend?: string;
  className?: string;
}

export function StatCard({ title, value, subtitle, icon, trend, className = '' }: StatCardProps) {
  return (
    <div className={`bg-card rounded-xl border border-border p-5 animate-fade-in ${className}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{title}</p>
          <p className="text-2xl font-heading font-bold mt-1">{value}</p>
          {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
          {trend && <p className="text-xs text-success font-medium mt-1">{trend}</p>}
        </div>
        {icon && <div className="p-2 rounded-lg bg-accent text-accent-foreground">{icon}</div>}
      </div>
    </div>
  );
}
