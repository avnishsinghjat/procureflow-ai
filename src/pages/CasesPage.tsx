import { getCases, getUser } from '@/lib/store';
import { Link } from 'react-router-dom';
import { PriorityBadge, StatusBadge, StageBadge } from '@/components/Badges';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { canCreateCase } from '@/lib/rbac';

export default function CasesPage() {
  const { user } = useAuth();
  const cases = getCases();
  const [search, setSearch] = useState('');

  const filtered = cases.filter(c =>
    c.title.toLowerCase().includes(search.toLowerCase()) ||
    c.caseNumber.toLowerCase().includes(search.toLowerCase()) ||
    c.vendorName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-heading font-bold">Procurement Cases</h1>
        {user && canCreateCase(user.role) && (
          <Link to="/cases/new"><Button size="sm"><Plus className="h-4 w-4 mr-1" /> New MPR</Button></Link>
        )}
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search cases..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Case #</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Title</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Vendor</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Value</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Stage</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Priority</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(c => (
              <tr key={c.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3">
                  <Link to={`/cases/${c.id}`} className="text-primary font-medium hover:underline">{c.caseNumber}</Link>
                </td>
                <td className="px-4 py-3 font-medium">{c.title}</td>
                <td className="px-4 py-3 text-muted-foreground">{c.vendorName}</td>
                <td className="px-4 py-3 font-medium">₹{(c.estimatedValue / 100000).toFixed(1)}L</td>
                <td className="px-4 py-3"><StageBadge stage={c.currentStage} /></td>
                <td className="px-4 py-3"><PriorityBadge priority={c.priority} /></td>
                <td className="px-4 py-3"><StatusBadge status={c.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
