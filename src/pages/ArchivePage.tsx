import { useState } from 'react';
import { getCases, getDocuments } from '@/lib/store';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { STAGES, type Stage } from '@/lib/types';
import { Link } from 'react-router-dom';
import { StageBadge, PriorityBadge, StatusBadge } from '@/components/Badges';
import { Search } from 'lucide-react';

export default function ArchivePage() {
  const [query, setQuery] = useState('');
  const [stageFilter, setStageFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const cases = getCases();
  const docs = getDocuments();

  const filtered = cases.filter(c => {
    const matchQuery = !query ||
      c.title.toLowerCase().includes(query.toLowerCase()) ||
      c.caseNumber.toLowerCase().includes(query.toLowerCase()) ||
      c.vendorName.toLowerCase().includes(query.toLowerCase()) ||
      c.department.toLowerCase().includes(query.toLowerCase()) ||
      docs.filter(d => d.caseId === c.id).some(d =>
        d.ocrText?.toLowerCase().includes(query.toLowerCase()) ||
        d.aiSummary?.toLowerCase().includes(query.toLowerCase())
      );
    const matchStage = stageFilter === 'all' || c.currentStage === stageFilter;
    const matchStatus = statusFilter === 'all' || c.status === statusFilter;
    return matchQuery && matchStage && matchStatus;
  });

  return (
    <div className="space-y-5 animate-fade-in">
      <h1 className="text-2xl font-heading font-bold">Searchable Archive</h1>
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search cases, OCR text, summaries..." className="pl-9" value={query} onChange={e => setQuery(e.target.value)} />
        </div>
        <Select value={stageFilter} onValueChange={setStageFilter}>
          <SelectTrigger className="w-[140px]"><SelectValue placeholder="Stage" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Stages</SelectItem>
            {STAGES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="on_hold">On Hold</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <p className="text-sm text-muted-foreground">{filtered.length} cases found</p>

      <div className="grid gap-3">
        {filtered.map(c => (
          <Link key={c.id} to={`/cases/${c.id}`} className="bg-card border border-border rounded-xl p-4 hover:border-primary/30 transition-colors block">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs text-primary font-medium">{c.caseNumber}</span>
                <h3 className="font-medium mt-0.5">{c.title}</h3>
                <p className="text-sm text-muted-foreground">{c.vendorName} • {c.department} • ₹{(c.estimatedValue / 100000).toFixed(1)}L</p>
              </div>
              <div className="flex items-center gap-2">
                <StageBadge stage={c.currentStage} />
                <PriorityBadge priority={c.priority} />
                <StatusBadge status={c.status} />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
