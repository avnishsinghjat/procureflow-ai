import { getCases } from '@/lib/store';
import { STAGES, STAGE_COLORS, type Stage } from '@/lib/types';
import { Link } from 'react-router-dom';
import { PriorityBadge } from '@/components/Badges';

export default function PipelinePage() {
  const cases = getCases().filter(c => c.status === 'active');

  return (
    <div className="space-y-5 animate-fade-in">
      <h1 className="text-2xl font-heading font-bold">Workflow Pipeline</h1>
      <div className="flex gap-3 overflow-x-auto pb-4">
        {STAGES.map(stage => {
          const stageCases = cases.filter(c => c.currentStage === stage);
          return (
            <div key={stage} className="min-w-[200px] flex-1">
              <div className={`${STAGE_COLORS[stage]} text-primary-foreground rounded-t-lg px-3 py-2 text-sm font-semibold text-center`}>
                {stage} ({stageCases.length})
              </div>
              <div className="bg-card border border-t-0 border-border rounded-b-lg p-2 space-y-2 min-h-[200px]">
                {stageCases.map(c => (
                  <Link
                    key={c.id}
                    to={`/cases/${c.id}`}
                    className="block bg-background rounded-lg p-3 border border-border hover:border-primary/30 transition-colors"
                  >
                    <p className="text-xs font-medium text-primary">{c.caseNumber}</p>
                    <p className="text-sm font-medium mt-0.5 truncate">{c.title}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-[10px] text-muted-foreground truncate">₹{(c.estimatedValue / 100000).toFixed(1)}L</span>
                      <PriorityBadge priority={c.priority} />
                    </div>
                  </Link>
                ))}
                {stageCases.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-8">No cases</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
