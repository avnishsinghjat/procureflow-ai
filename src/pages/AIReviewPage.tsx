import { getCases, getDocuments, getCase } from '@/lib/store';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { Brain, FileText, AlertTriangle, CheckCircle2, RefreshCw, Sparkles, Loader2, Info } from 'lucide-react';
import {
  classifyDocument, extractFields, summarizeDocument,
  detectMissingAttachments, draftApprovalNote, isLmStudioConfigured
} from '@/lib/lmstudio';
import { STAGE_REQUIRED_DOCS } from '@/lib/types';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

export default function AIReviewPage() {
  const cases = getCases();
  const [selectedCase, setSelectedCase] = useState(cases[0]?.id || '');
  const docs = getDocuments(selectedCase);
  const caseData = cases.find(c => c.id === selectedCase);
  const docsWithOcr = docs.filter(d => d.ocrText);
  const configured = isLmStudioConfigured();

  const [loading, setLoading] = useState<string | null>(null);
  const [aiResults, setAiResults] = useState<{
    classification?: { documentType: string; confidence: number; reasoning: string };
    fields?: Record<string, unknown>;
    summary?: string;
    missing?: { missingItems: string[]; warnings: string[]; canProceed: boolean };
    approvalNote?: string;
  }>({});

  const combinedOcrText = docsWithOcr.map(d => d.ocrText).join('\n\n');

  const handleClassify = async () => {
    if (!combinedOcrText) return;
    setLoading('classify');
    try {
      const result = await classifyDocument(combinedOcrText);
      setAiResults(prev => ({ ...prev, classification: result }));
      toast.success('Classification complete');
    } catch (e: any) { toast.error(e.message); }
    setLoading(null);
  };

  const handleExtract = async () => {
    if (!combinedOcrText) return;
    setLoading('extract');
    try {
      const result = await extractFields(combinedOcrText);
      setAiResults(prev => ({ ...prev, fields: result }));
      toast.success('Field extraction complete');
    } catch (e: any) { toast.error(e.message); }
    setLoading(null);
  };

  const handleSummarize = async () => {
    if (!combinedOcrText) return;
    setLoading('summarize');
    try {
      const result = await summarizeDocument(combinedOcrText);
      setAiResults(prev => ({ ...prev, summary: result }));
      toast.success('Summary generated');
    } catch (e: any) { toast.error(e.message); }
    setLoading(null);
  };

  const handleMissing = async () => {
    if (!caseData) return;
    setLoading('missing');
    try {
      const docTypes = docs.map(d => d.documentType);
      const required = STAGE_REQUIRED_DOCS[caseData.currentStage] || [];
      const result = await detectMissingAttachments(caseData.currentStage, docTypes, required);
      setAiResults(prev => ({ ...prev, missing: result }));
      toast.success('Missing attachment check complete');
    } catch (e: any) { toast.error(e.message); }
    setLoading(null);
  };

  const handleDraftNote = async () => {
    if (!caseData) return;
    setLoading('draft');
    try {
      const extractedData = docsWithOcr[0]?.extractionJson || {};
      const result = await draftApprovalNote(
        caseData.currentStage, caseData.title, caseData.vendorName,
        caseData.estimatedValue, extractedData as Record<string, unknown>
      );
      setAiResults(prev => ({ ...prev, approvalNote: result }));
      toast.success('Approval note drafted');
    } catch (e: any) { toast.error(e.message); }
    setLoading(null);
  };

  const isLoading = (key: string) => loading === key;

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-heading font-bold">AI Review Center</h1>
        <Select value={selectedCase} onValueChange={v => { setSelectedCase(v); setAiResults({}); }}>
          <SelectTrigger className="w-[280px]"><SelectValue placeholder="Select case" /></SelectTrigger>
          <SelectContent>
            {cases.map(c => <SelectItem key={c.id} value={c.id}>{c.caseNumber} - {c.title}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {!configured && (
        <div className="bg-warning/10 border border-warning/30 rounded-xl p-4 flex items-start gap-3">
          <Info className="h-5 w-5 text-warning shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium">LM Studio not configured</p>
            <p className="text-xs text-muted-foreground">Set your LM Studio server URL in <Link to="/settings" className="text-primary underline">Settings</Link> to enable real AI analysis.</p>
          </div>
        </div>
      )}

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
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-heading font-semibold text-sm flex items-center gap-2">
                <Sparkles className="h-4 w-4" /> Extracted Fields
              </h2>
              <Button size="sm" variant="outline" onClick={handleExtract} disabled={!configured || !!loading || !combinedOcrText}>
                {isLoading('extract') ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
              </Button>
            </div>
            {/* Show AI-extracted fields first, then fall back to stored */}
            {aiResults.fields && Object.keys(aiResults.fields).length > 0 ? (
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(aiResults.fields).filter(([, v]) => v != null).map(([k, v]) => (
                  <div key={k} className="bg-muted rounded-lg p-2">
                    <p className="text-[10px] text-muted-foreground uppercase">{k}</p>
                    <p className="text-sm font-medium">{String(v)}</p>
                  </div>
                ))}
              </div>
            ) : docsWithOcr.filter(d => d.extractionJson).length > 0 ? (
              docsWithOcr.filter(d => d.extractionJson).map(d => (
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
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">No extracted fields. Click extract to run AI.</p>
            )}
          </div>

          {/* AI Classification */}
          <div className="bg-card rounded-xl border border-border p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-heading font-semibold text-sm flex items-center gap-2">
                <Brain className="h-4 w-4" /> Document Classification
              </h2>
              <Button size="sm" variant="outline" onClick={handleClassify} disabled={!configured || !!loading || !combinedOcrText}>
                {isLoading('classify') ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <>Classify</>}
              </Button>
            </div>
            {aiResults.classification ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold bg-primary/10 text-primary px-3 py-1 rounded-full">{aiResults.classification.documentType}</span>
                  <span className="text-xs text-success">{(aiResults.classification.confidence * 100).toFixed(0)}% confidence</span>
                </div>
                <p className="text-xs text-muted-foreground">{aiResults.classification.reasoning}</p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">Click Classify to identify the document type.</p>
            )}
          </div>

          {/* AI Summary */}
          <div className="bg-card rounded-xl border border-border p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-heading font-semibold text-sm flex items-center gap-2">
                <Brain className="h-4 w-4" /> AI Summary
              </h2>
              <Button size="sm" variant="outline" onClick={handleSummarize} disabled={!configured || !!loading || !combinedOcrText}>
                {isLoading('summarize') ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <>Summarize</>}
              </Button>
            </div>
            {aiResults.summary ? (
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{aiResults.summary}</p>
            ) : docsWithOcr.some(d => d.aiSummary) ? (
              docsWithOcr.filter(d => d.aiSummary).map(d => (
                <p key={d.id} className="text-sm text-muted-foreground mb-2">{d.aiSummary}</p>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">Click Summarize to generate an AI summary.</p>
            )}
          </div>

          {/* Missing attachments */}
          <div className="bg-card rounded-xl border border-border p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-heading font-semibold text-sm flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" /> Missing Attachment Check
              </h2>
              <Button size="sm" variant="outline" onClick={handleMissing} disabled={!configured || !!loading}>
                {isLoading('missing') ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <>Check</>}
              </Button>
            </div>
            {aiResults.missing ? (
              <div className="space-y-2">
                {aiResults.missing.missingItems.length > 0 ? (
                  <div className="bg-destructive/10 rounded-lg p-3">
                    <p className="text-sm font-medium text-destructive mb-1">Missing Items:</p>
                    <ul className="text-xs text-muted-foreground space-y-0.5">
                      {aiResults.missing.missingItems.map((item, i) => <li key={i}>• {item}</li>)}
                    </ul>
                  </div>
                ) : (
                  <div className="bg-success/10 rounded-lg p-3 flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-success" />
                    <p className="text-sm font-medium text-success">All required documents present</p>
                  </div>
                )}
                {aiResults.missing.warnings.length > 0 && (
                  <div className="bg-warning/10 rounded-lg p-3">
                    <p className="text-sm font-medium text-warning mb-1">Warnings:</p>
                    <ul className="text-xs text-muted-foreground space-y-0.5">
                      {aiResults.missing.warnings.map((w, i) => <li key={i}>• {w}</li>)}
                    </ul>
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  Can proceed: <span className={aiResults.missing.canProceed ? 'text-success' : 'text-destructive'}>{aiResults.missing.canProceed ? 'Yes' : 'No'}</span>
                </p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">Click Check to validate attachments for this stage.</p>
            )}
          </div>

          {/* Draft approval note */}
          <div className="bg-card rounded-xl border border-border p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-heading font-semibold text-sm flex items-center gap-2">
                <Sparkles className="h-4 w-4" /> Draft Approval Note
              </h2>
              <Button size="sm" variant="outline" onClick={handleDraftNote} disabled={!configured || !!loading}>
                {isLoading('draft') ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <>Draft</>}
              </Button>
            </div>
            {aiResults.approvalNote ? (
              <pre className="text-sm text-muted-foreground whitespace-pre-wrap bg-muted rounded-lg p-4">{aiResults.approvalNote}</pre>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">Click Draft to generate an approval note for the {caseData.currentStage} stage.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
