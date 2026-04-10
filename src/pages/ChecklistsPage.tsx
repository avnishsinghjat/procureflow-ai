import { STAGES, STAGE_REQUIRED_DOCS } from '@/lib/types';
import { CheckCircle2 } from 'lucide-react';

export default function ChecklistsPage() {
  return (
    <div className="space-y-5 animate-fade-in">
      <h1 className="text-2xl font-heading font-bold">Workflow Checklists</h1>
      <p className="text-sm text-muted-foreground">Required documents per procurement stage. Cases cannot advance unless all required items are present (unless overridden).</p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {STAGES.map(stage => (
          <div key={stage} className="bg-card rounded-xl border border-border p-5">
            <h3 className="font-heading font-semibold text-sm mb-3">{stage}</h3>
            <div className="space-y-2">
              {STAGE_REQUIRED_DOCS[stage].map((item, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                  <span>{item}</span>
                  <span className="text-[10px] text-destructive ml-auto">Required</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
