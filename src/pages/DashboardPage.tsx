import { getCases, getDocuments, getEvents, getApprovals, getUser } from '@/lib/store';
import { useAuth } from '@/contexts/AuthContext';
import { STAGES, type Stage } from '@/lib/types';
import { StatCard } from '@/components/StatCard';
import { PriorityBadge, StageBadge, StatusBadge } from '@/components/Badges';
import { canCreateCase, canUploadDocuments, canAccessRoute } from '@/lib/rbac';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  FolderOpen, Clock, AlertTriangle, FileText, Plus, Upload, Eye,
  BarChart3, TrendingUp,
} from 'lucide-react';

export default function DashboardPage() {
  const { user } = useAuth();
  const cases = getCases();
  const docs = getDocuments();
  const events = getEvents();
  const activeCases = cases.filter(c => c.status === 'active');

  const stageCount = (s: Stage) => activeCases.filter(c => c.currentStage === s).length;
  const overdue = activeCases.filter(c => new Date(c.dueDate) < new Date()).length;
  const recentDocs = [...docs].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5);

  const avgConfidence = docs.filter(d => d.extractionConfidence).reduce((a, d) => a + (d.extractionConfidence || 0), 0) / Math.max(docs.filter(d => d.extractionConfidence).length, 1);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Welcome back, {user?.name}</p>
        </div>
        <div className="flex gap-2">
          {user && canCreateCase(user.role) && (
            <Link to="/cases/new"><Button size="sm"><Plus className="h-4 w-4 mr-1" /> Create MPR</Button></Link>
          )}
          {user && canUploadDocuments(user.role) && (
            <Link to="/upload"><Button size="sm" variant="outline"><Upload className="h-4 w-4 mr-1" /> Upload</Button></Link>
          )}
          {user && canAccessRoute(user.role, '/approvals') && (
            <Link to="/approvals"><Button size="sm" variant="outline"><Eye className="h-4 w-4 mr-1" /> Review</Button></Link>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Cases" value={cases.length} icon={<FolderOpen className="h-5 w-5" />} subtitle={`${activeCases.length} active`} />
        <StatCard title="Pending My Action" value={3} icon={<Clock className="h-5 w-5" />} subtitle="Across stages" />
        <StatCard title="Overdue" value={overdue} icon={<AlertTriangle className="h-5 w-5" />} trend={overdue === 0 ? 'All on track' : undefined} />
        <StatCard title="AI Confidence" value={`${(avgConfidence * 100).toFixed(0)}%`} icon={<TrendingUp className="h-5 w-5" />} subtitle="Avg extraction" />
      </div>

      {/* Stage throughput */}
      <div className="bg-card rounded-xl border border-border p-5">
        <h2 className="font-heading font-semibold text-sm mb-4">Cases by Stage</h2>
        <div className="flex gap-2">
          {STAGES.map(s => (
            <div key={s} className="flex-1 text-center">
              <div className="h-20 bg-muted rounded-lg flex items-end justify-center pb-1 relative overflow-hidden">
                <div
                  className="absolute bottom-0 left-0 right-0 bg-primary/20 rounded-b-lg transition-all"
                  style={{ height: `${Math.max(stageCount(s) * 25, 5)}%` }}
                />
                <span className="text-lg font-heading font-bold relative z-10">{stageCount(s)}</span>
              </div>
              <p className="text-[10px] text-muted-foreground mt-1 font-medium">{s}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Recent docs */}
        <div className="bg-card rounded-xl border border-border p-5">
          <h2 className="font-heading font-semibold text-sm mb-3">Recent Documents</h2>
          <div className="space-y-2">
            {recentDocs.map(d => (
              <div key={d.id} className="flex items-center gap-3 py-2 border-b border-border last:border-0">
                <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{d.fileName}</p>
                  <p className="text-[10px] text-muted-foreground">{d.documentType} • {new Date(d.createdAt).toLocaleDateString()}</p>
                </div>
                {d.extractionConfidence && (
                  <span className="text-[10px] text-success font-medium">{(d.extractionConfidence * 100).toFixed(0)}%</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Recent activity */}
        <div className="bg-card rounded-xl border border-border p-5">
          <h2 className="font-heading font-semibold text-sm mb-3">Recent Activity</h2>
          <div className="space-y-2">
            {events.slice(0, 6).map(e => {
              const actor = getUser(e.actorId);
              return (
                <div key={e.id} className="flex items-start gap-3 py-2 border-b border-border last:border-0">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm"><span className="font-medium">{actor?.name}</span> {e.action}</p>
                    <p className="text-[10px] text-muted-foreground">{e.notes} • {new Date(e.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
