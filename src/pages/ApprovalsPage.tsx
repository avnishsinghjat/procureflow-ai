import { getApprovals, getCases, getUser } from '@/lib/store';
import { Link } from 'react-router-dom';
import { StageBadge } from '@/components/Badges';
import { CheckCircle2, XCircle, RotateCcw } from 'lucide-react';

export default function ApprovalsPage() {
  const approvals = getApprovals();
  const cases = getCases();

  return (
    <div className="space-y-5 animate-fade-in">
      <h1 className="text-2xl font-heading font-bold">Approvals & Concurrence</h1>
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Case</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Stage</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Approver</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Decision</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Comments</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Date</th>
            </tr>
          </thead>
          <tbody>
            {approvals.map(a => {
              const c = cases.find(x => x.id === a.caseId);
              const approver = getUser(a.approverId);
              return (
                <tr key={a.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3">
                    <Link to={`/cases/${a.caseId}`} className="text-primary hover:underline">{c?.caseNumber}</Link>
                  </td>
                  <td className="px-4 py-3"><StageBadge stage={a.stage} /></td>
                  <td className="px-4 py-3">{approver?.name}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 text-xs font-medium ${a.decision === 'approved' ? 'text-success' : a.decision === 'rejected' ? 'text-destructive' : 'text-warning'}`}>
                      {a.decision === 'approved' ? <CheckCircle2 className="h-3.5 w-3.5" /> : a.decision === 'rejected' ? <XCircle className="h-3.5 w-3.5" /> : <RotateCcw className="h-3.5 w-3.5" />}
                      {a.decision}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground max-w-[200px] truncate">{a.comments}</td>
                  <td className="px-4 py-3 text-muted-foreground">{new Date(a.decidedAt).toLocaleDateString()}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
