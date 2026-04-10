import { getCases, getDocuments } from '@/lib/store';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { Brain, FileText, AlertTriangle, CheckCircle2, RefreshCw, Sparkles } from 'lucide-react';

export default function AIReviewPage() {
  const cases = getCases();
  const [selectedCase, setSelectedCase] = useState(cases[0]?.id || '');
  const docs = getDocuments(selectedCase);
  const caseData = cases.find(c => c.id === selectedCase);

  const docsWithOcr = docs.filter(d => d.ocrText);

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-heading font-bold">AI Review Center</h1>
        <Select value={selectedCase} onValueChange={setSelectedCase}>
          <SelectTrigger className="w-[280px]"><SelectValue placeholder="Select case" /></SelectTrigger>
          <SelectContent>
            {cases.map(c => <SelectItem key={c.id} value={c.id}>{c.caseNumber} - {c.title}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {caseData && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* OCR text */}
          <div className="bg-card rounded-xl border border-border p-5">
            <h2 className="font-heading font-semibold text-sm mb-3 flex items-center gap-2">
              <FileText className="h-4 w-4" /> OCR Text Preview
            </h2>
            {docsWithOcr.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">No OCR text available. Upload documents first.</p>
            ) : (
              <div className="space-y-3">
                {docsWithOcr.map(d => (
                  <div key={d.id}>
                    <p className="text-xs font-medium text-primary mb-1">{d.fileName}</p>
                    <pre className="bg-muted rounded-lg p-3 text-xs font-mono whitespace-pre-wrap max-h-[200px] overflow-auto">{d.ocrText}</pre>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Extracted fields */}
          <div className="bg-card rounded-xl border border-border p-5">
            <h2 className="font-heading font-semibold text-sm mb-3 flex items-center gap-2">
              <Sparkles className="h-4 w-4" /> Extracted Fields
            </h2>
            {docsWithOcr.filter(d => d.extractionJson).map(d => (
              <div key={d.id} className="mb-3">
                <p className="text-xs font-medium text-primary mb-2">{d.fileName}</p>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(d.extractionJson || {}).map(([k, v]) => (
                    <div key={k} className="bg-muted rounded-lg p-2">
                      <p className="text-[10px] text-muted-foreground uppercase">{k}</p>
                      <p className="text-sm font-medium">{String(v)}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* AI Summary */}
          <div className="bg-card rounded-xl border border-border p-5">
            <h2 className="font-heading font-semibold text-sm mb-3 flex items-center gap-2">
              <Brain className="h-4 w-4" /> AI Summary
            </h2>
            {docsWithOcr.filter(d => d.aiSummary).map(d => (
              <p key={d.id} className="text-sm text-muted-foreground mb-2">{d.aiSummary}</p>
            ))}
            {!docsWithOcr.some(d => d.aiSummary) && <p className="text-sm text-muted-foreground text-center py-4">No AI summaries yet.</p>}
          </div>

          {/* AI actions */}
          <div className="bg-card rounded-xl border border-border p-5 space-y-3">
            <h2 className="font-heading font-semibold text-sm mb-3 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" /> AI Flags & Actions
            </h2>
            <div className="bg-warning/10 rounded-lg p-3 flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-warning shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium">Missing Documents Detected</p>
                <p className="text-xs text-muted-foreground">Some required checklist items for the current stage may be missing.</p>
              </div>
            </div>
            <div className="bg-success/10 rounded-lg p-3 flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-success shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium">Recommended Next Step</p>
                <p className="text-xs text-muted-foreground">Review and approve at {caseData.currentStage} stage, then advance to next.</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline"><RefreshCw className="h-3.5 w-3.5 mr-1" /> Re-extract</Button>
              <Button size="sm" variant="outline"><Sparkles className="h-3.5 w-3.5 mr-1" /> Draft Stage Note</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
