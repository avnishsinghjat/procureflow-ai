import { getEvents, getUser, getCases } from '@/lib/store';
import { Link } from 'react-router-dom';
import { Clock } from 'lucide-react';

export default function AuditTrailPage() {
  const events = getEvents().sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const cases = getCases();

  return (
    <div className="space-y-5 animate-fade-in">
      <h1 className="text-2xl font-heading font-bold">Audit Trail</h1>
      <div className="bg-card rounded-xl border border-border p-5">
        <div className="space-y-4">
          {events.map(e => {
            const actor = getUser(e.actorId);
            const c = cases.find(x => x.id === e.caseId);
            return (
              <div key={e.id} className="flex items-start gap-4 border-b border-border pb-4 last:border-0">
                <div className="p-2 bg-accent rounded-lg shrink-0">
                  <Clock className="h-4 w-4 text-accent-foreground" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-medium">{actor?.name}</span>
                    <span className="text-muted-foreground">{e.action}</span>
                    {c && <Link to={`/cases/${c.id}`} className="text-primary hover:underline text-xs">{c.caseNumber}</Link>}
                  </div>
                  {e.fromStage && e.toStage && (
                    <p className="text-xs text-muted-foreground mt-0.5">{e.fromStage} → {e.toStage}</p>
                  )}
                  <p className="text-xs text-muted-foreground">{e.notes}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">{new Date(e.createdAt).toLocaleString()}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
