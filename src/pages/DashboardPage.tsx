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
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
  AreaChart, Area,
  RadialBarChart, RadialBar,
} from 'recharts';

// Chart color palette using CSS variable-compatible colors
const CHART_COLORS = [
  'hsl(215, 90%, 50%)',   // primary
  'hsl(160, 60%, 45%)',   // secondary/success
  'hsl(35, 90%, 55%)',    // warning/amber
  'hsl(0, 72%, 51%)',     // destructive
  'hsl(270, 60%, 55%)',   // purple
  'hsl(190, 70%, 45%)',   // cyan
  'hsl(330, 60%, 50%)',   // pink
  'hsl(45, 80%, 50%)',    // gold
  'hsl(140, 50%, 40%)',   // green
];

export default function DashboardPage() {
  const { user } = useAuth();
  const cases = getCases();
  const docs = getDocuments();
  const events = getEvents();
  const approvals = getApprovals();
  const activeCases = cases.filter(c => c.status === 'active');

  const stageCount = (s: Stage) => activeCases.filter(c => c.currentStage === s).length;
  const overdue = activeCases.filter(c => new Date(c.dueDate) < new Date()).length;
  const recentDocs = [...docs].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5);
  const avgConfidence = docs.filter(d => d.extractionConfidence).reduce((a, d) => a + (d.extractionConfidence || 0), 0) / Math.max(docs.filter(d => d.extractionConfidence).length, 1);

  // --- Chart data ---

  // Stage throughput bar chart
  const stageBarData = STAGES.map((s, i) => ({
    stage: s,
    cases: stageCount(s),
    fill: CHART_COLORS[i % CHART_COLORS.length],
  }));

  // Priority distribution pie
  const priorityCounts = ['critical', 'high', 'medium', 'low'].map(p => ({
    name: p.charAt(0).toUpperCase() + p.slice(1),
    value: activeCases.filter(c => c.priority === p).length,
  })).filter(d => d.value > 0);

  // SLA compliance — overdue vs on-track
  const onTrack = activeCases.length - overdue;
  const slaPercent = activeCases.length > 0 ? Math.round((onTrack / activeCases.length) * 100) : 100;
  const slaRadialData = [{ name: 'SLA', value: slaPercent, fill: slaPercent >= 80 ? 'hsl(160, 60%, 45%)' : slaPercent >= 60 ? 'hsl(35, 90%, 55%)' : 'hsl(0, 72%, 51%)' }];

  // Cycle time trend — simulate from seed data
  const cycleTimeData = cases
    .filter(c => c.createdAt)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    .map(c => {
      const created = new Date(c.createdAt).getTime();
      const updated = new Date(c.updatedAt).getTime();
      const days = Math.max(1, Math.round((updated - created) / (1000 * 60 * 60 * 24)));
      return {
        case: c.caseNumber.replace('MPR-', ''),
        days,
        target: 30,
      };
    });

  // Monthly activity area chart
  const monthMap = new Map<string, number>();
  events.forEach(e => {
    const d = new Date(e.createdAt);
    const key = `${d.toLocaleString('default', { month: 'short' })} ${d.getDate()}`;
    monthMap.set(key, (monthMap.get(key) || 0) + 1);
  });
  const activityData = Array.from(monthMap.entries()).slice(-10).map(([date, count]) => ({ date, actions: count }));

  // Value by department
  const deptMap = new Map<string, number>();
  activeCases.forEach(c => deptMap.set(c.department, (deptMap.get(c.department) || 0) + c.estimatedValue));
  const deptData = Array.from(deptMap.entries()).map(([dept, value]) => ({
    department: dept,
    value: Math.round(value / 100000),
  }));

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
        <StatCard title="Approvals" value={approvals.length} icon={<Clock className="h-5 w-5" />} subtitle="Total recorded" />
        <StatCard title="Overdue" value={overdue} icon={<AlertTriangle className="h-5 w-5" />} trend={overdue === 0 ? 'All on track' : undefined} />
        <StatCard title="AI Confidence" value={`${(avgConfidence * 100).toFixed(0)}%`} icon={<TrendingUp className="h-5 w-5" />} subtitle="Avg extraction" />
      </div>

      {/* Row 1: Stage throughput + SLA gauge */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 bg-card rounded-xl border border-border p-5">
          <h2 className="font-heading font-semibold text-sm mb-4 flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-primary" /> Stage Throughput
          </h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={stageBarData} barSize={28} margin={{ top: 5, right: 10, left: -15, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(210, 15%, 88%)" vertical={false} />
              <XAxis dataKey="stage" tick={{ fontSize: 11 }} stroke="hsl(220, 10%, 46%)" />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} stroke="hsl(220, 10%, 46%)" />
              <Tooltip
                contentStyle={{ borderRadius: 8, border: '1px solid hsl(210, 15%, 88%)', fontSize: 12 }}
                cursor={{ fill: 'hsl(215, 80%, 95%)' }}
              />
              <Bar dataKey="cases" radius={[4, 4, 0, 0]}>
                {stageBarData.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* SLA Compliance Radial */}
        <div className="bg-card rounded-xl border border-border p-5 flex flex-col items-center justify-center">
          <h2 className="font-heading font-semibold text-sm mb-2">SLA Compliance</h2>
          <div className="relative">
            <ResponsiveContainer width={180} height={180}>
              <RadialBarChart
                cx="50%" cy="50%" innerRadius="70%" outerRadius="95%"
                barSize={14} data={slaRadialData} startAngle={90} endAngle={-270}
              >
                <RadialBar background={{ fill: 'hsl(210, 15%, 93%)' }} dataKey="value" cornerRadius={8} />
              </RadialBarChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-heading font-bold">{slaPercent}%</span>
              <span className="text-[10px] text-muted-foreground">On Track</span>
            </div>
          </div>
          <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-success inline-block" />{onTrack} on time</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-destructive inline-block" />{overdue} overdue</span>
          </div>
        </div>
      </div>

      {/* Row 2: Cycle time + Priority */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Cycle Time Trend */}
        <div className="bg-card rounded-xl border border-border p-5">
          <h2 className="font-heading font-semibold text-sm mb-4 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" /> Cycle Time (days)
          </h2>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={cycleTimeData} margin={{ top: 5, right: 10, left: -15, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(210, 15%, 88%)" vertical={false} />
              <XAxis dataKey="case" tick={{ fontSize: 10 }} stroke="hsl(220, 10%, 46%)" />
              <YAxis tick={{ fontSize: 11 }} stroke="hsl(220, 10%, 46%)" />
              <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid hsl(210, 15%, 88%)', fontSize: 12 }} />
              <Area type="monotone" dataKey="days" stroke="hsl(215, 90%, 50%)" fill="hsl(215, 90%, 50%)" fillOpacity={0.15} strokeWidth={2} dot={{ r: 3, fill: 'hsl(215, 90%, 50%)' }} />
              <Area type="monotone" dataKey="target" stroke="hsl(0, 72%, 51%)" strokeDasharray="5 5" fill="none" strokeWidth={1.5} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
          <p className="text-[10px] text-muted-foreground mt-1 text-center">— Actual &nbsp; --- 30-day target</p>
        </div>

        {/* Priority Distribution */}
        <div className="bg-card rounded-xl border border-border p-5">
          <h2 className="font-heading font-semibold text-sm mb-4">Priority Distribution</h2>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={priorityCounts}
                cx="50%" cy="50%"
                innerRadius={50} outerRadius={80}
                paddingAngle={3}
                dataKey="value"
                strokeWidth={0}
              >
                {priorityCounts.map((_, i) => (
                  <Cell key={i} fill={[
                    'hsl(0, 72%, 51%)',    // critical
                    'hsl(35, 90%, 55%)',   // high
                    'hsl(215, 90%, 50%)',  // medium
                    'hsl(160, 60%, 45%)',  // low
                  ][i] || CHART_COLORS[i]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid hsl(210, 15%, 88%)', fontSize: 12 }} />
              <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Row 3: Activity + Value by Dept */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Activity trend */}
        <div className="bg-card rounded-xl border border-border p-5">
          <h2 className="font-heading font-semibold text-sm mb-4">Workflow Activity</h2>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={activityData} margin={{ top: 5, right: 10, left: -15, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(210, 15%, 88%)" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="hsl(220, 10%, 46%)" />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} stroke="hsl(220, 10%, 46%)" />
              <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid hsl(210, 15%, 88%)', fontSize: 12 }} />
              <Area type="monotone" dataKey="actions" stroke="hsl(160, 60%, 45%)" fill="hsl(160, 60%, 45%)" fillOpacity={0.12} strokeWidth={2} dot={{ r: 3, fill: 'hsl(160, 60%, 45%)' }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Value by department */}
        <div className="bg-card rounded-xl border border-border p-5">
          <h2 className="font-heading font-semibold text-sm mb-4">Value by Department (₹ Lakhs)</h2>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={deptData} layout="vertical" barSize={16} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(210, 15%, 88%)" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11 }} stroke="hsl(220, 10%, 46%)" />
              <YAxis type="category" dataKey="department" tick={{ fontSize: 11 }} stroke="hsl(220, 10%, 46%)" width={70} />
              <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid hsl(210, 15%, 88%)', fontSize: 12 }} />
              <Bar dataKey="value" fill="hsl(270, 60%, 55%)" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Row 4: Recent docs + activity feed */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
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
