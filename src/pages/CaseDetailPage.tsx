import { useParams } from 'react-router-dom';
import { getCase, getDocuments, getApprovals, getEvents, getComments, getChecklist, getUser, addComment, addEvent, updateCase, addApproval } from '@/lib/store';
import { useAuth } from '@/contexts/AuthContext';
import { PipelineRibbon } from '@/components/PipelineRibbon';
import { PriorityBadge, StatusBadge } from '@/components/Badges';
import { STAGES, STAGE_REQUIRED_DOCS, type Stage, type Document as PFDocument } from '@/lib/types';
import { canTransitionStage, canSendBack } from '@/lib/rbac';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { FileText, CheckCircle2, XCircle, AlertCircle, MessageSquare, Clock, ArrowRight, ArrowLeft, ShieldAlert, Eye, Image, FileType } from 'lucide-react';
import { useState } from 'react';

export default function CaseDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [commentText, setCommentText] = useState('');
  const [previewDoc, setPreviewDoc] = useState<PFDocument | null>(null);
  const [, setRefresh] = useState(0);
  const refresh = () => setRefresh(n => n + 1);

  const caseData = getCase(id!);
  if (!caseData) return <div className="text-center py-20 text-muted-foreground">Case not found</div>;

  const docs = getDocuments(id);
  const approvals = getApprovals(id);
  const events = getEvents(id);
  const comments = getComments(id);
  const checklist = getChecklist(id);
  const requester = getUser(caseData.requesterId);

  const currentIdx = STAGES.indexOf(caseData.currentStage);

  const handleAdvance = () => {
    if (currentIdx < STAGES.length - 1) {
      const from = caseData.currentStage;
      const to = STAGES[currentIdx + 1];
      updateCase({ ...caseData, currentStage: to, updatedAt: new Date().toISOString() });
      addEvent({ id: crypto.randomUUID(), caseId: id!, actorId: user!.id, action: 'Stage advanced', fromStage: from, toStage: to, notes: `Moved to ${to}`, createdAt: new Date().toISOString() });
      addApproval({ id: crypto.randomUUID(), caseId: id!, stage: from, approverId: user!.id, decision: 'approved', comments: 'Approved and advanced', decidedAt: new Date().toISOString(), version: 1 });
      refresh();
    }
  };

  const handleSendBack = () => {
    if (currentIdx > 0) {
      const from = caseData.currentStage;
      const to = STAGES[currentIdx - 1];
      updateCase({ ...caseData, currentStage: to, updatedAt: new Date().toISOString() });
      addEvent({ id: crypto.randomUUID(), caseId: id!, actorId: user!.id, action: 'Sent back', fromStage: from, toStage: to, notes: `Sent back to ${to}`, createdAt: new Date().toISOString() });
      refresh();
    }
  };

  const handleComment = () => {
    if (!commentText.trim()) return;
    addComment({ id: crypto.randomUUID(), caseId: id!, userId: user!.id, message: commentText, createdAt: new Date().toISOString() });
    setCommentText('');
    refresh();
  };

  const stageChecklist = STAGE_REQUIRED_DOCS[caseData.currentStage] || [];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{caseData.caseNumber}</p>
          <h1 className="text-2xl font-heading font-bold">{caseData.title}</h1>
          <p className="text-sm text-muted-foreground mt-1">{caseData.description}</p>
        </div>
        <div className="flex items-center gap-2">
          <PriorityBadge priority={caseData.priority} />
          <StatusBadge status={caseData.status} />
        </div>
      </div>

      {/* Pipeline */}
      <PipelineRibbon currentStage={caseData.currentStage} />

      {/* Actions — role-gated */}
      {user && canTransitionStage(user.role, caseData.currentStage) ? (
        <div className="flex gap-2">
          <Button size="sm" onClick={handleSendBack} variant="outline" disabled={currentIdx === 0 || !canSendBack(user.role, caseData.currentStage)}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Send Back
          </Button>
          <Button size="sm" onClick={handleAdvance} disabled={currentIdx === STAGES.length - 1}>
            Advance to {currentIdx < STAGES.length - 1 ? STAGES[currentIdx + 1] : '—'} <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      ) : (
        <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted rounded-lg px-4 py-2.5">
          <ShieldAlert className="h-4 w-4" />
          <span>Your role cannot transition this case at the <strong>{caseData.currentStage}</strong> stage.</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left: details + docs */}
        <div className="lg:col-span-2 space-y-5">
          {/* Case info */}
          <div className="bg-card rounded-xl border border-border p-5">
            <h2 className="font-heading font-semibold text-sm mb-3">Case Details</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              <div><span className="text-muted-foreground block text-xs">Department</span>{caseData.department}</div>
              <div><span className="text-muted-foreground block text-xs">Requester</span>{requester?.name}</div>
              <div><span className="text-muted-foreground block text-xs">Vendor</span>{caseData.vendorName}</div>
              <div><span className="text-muted-foreground block text-xs">Est. Value</span>₹{(caseData.estimatedValue / 100000).toFixed(1)}L</div>
              <div><span className="text-muted-foreground block text-xs">Created</span>{new Date(caseData.createdAt).toLocaleDateString()}</div>
              <div><span className="text-muted-foreground block text-xs">Due</span>{new Date(caseData.dueDate).toLocaleDateString()}</div>
            </div>
          </div>

          {/* Documents */}
          <div className="bg-card rounded-xl border border-border p-5">
            <h2 className="font-heading font-semibold text-sm mb-3">Documents ({docs.length})</h2>
            {docs.length === 0 ? (
              <p className="text-sm text-muted-foreground">No documents uploaded yet.</p>
            ) : (
              <div className="space-y-2">
                {docs.map(d => (
                  <button
                    key={d.id}
                    onClick={() => setPreviewDoc(d)}
                    className="flex items-center gap-3 py-2.5 px-3 border border-border rounded-lg w-full text-left hover:bg-accent/50 transition-colors group"
                  >
                    {d.mimeType?.startsWith('image/') ? (
                      <Image className="h-4 w-4 text-primary shrink-0" />
                    ) : (
                      <FileType className="h-4 w-4 text-primary shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{d.fileName}</p>
                      <p className="text-[10px] text-muted-foreground">{d.documentType} • v{d.version}</p>
                    </div>
                    {d.extractionConfidence && (
                      <span className="text-xs bg-success/10 text-success px-2 py-0.5 rounded-full">{(d.extractionConfidence * 100).toFixed(0)}% conf.</span>
                    )}
                    <Eye className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* AI Summary */}
          {docs.some(d => d.aiSummary) && (
            <div className="bg-card rounded-xl border border-border p-5">
              <h2 className="font-heading font-semibold text-sm mb-3">AI Summary</h2>
              {docs.filter(d => d.aiSummary).map(d => (
                <p key={d.id} className="text-sm text-muted-foreground">{d.aiSummary}</p>
              ))}
            </div>
          )}

          {/* Comments */}
          <div className="bg-card rounded-xl border border-border p-5">
            <h2 className="font-heading font-semibold text-sm mb-3">Comments</h2>
            <div className="space-y-3 mb-4">
              {comments.map(c => {
                const author = getUser(c.userId);
                return (
                  <div key={c.id} className="flex gap-3">
                    <div className="w-7 h-7 rounded-full bg-accent flex items-center justify-center text-[10px] font-bold shrink-0">
                      {author?.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <p className="text-sm"><span className="font-medium">{author?.name}</span> <span className="text-muted-foreground text-xs">{new Date(c.createdAt).toLocaleDateString()}</span></p>
                      <p className="text-sm text-muted-foreground">{c.message}</p>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex gap-2">
              <Textarea placeholder="Add a comment..." value={commentText} onChange={e => setCommentText(e.target.value)} className="min-h-[60px]" />
              <Button size="sm" onClick={handleComment} className="self-end">Post</Button>
            </div>
          </div>
        </div>

        {/* Right sidebar */}
        <div className="space-y-5">
          {/* Stage checklist */}
          <div className="bg-card rounded-xl border border-border p-5">
            <h2 className="font-heading font-semibold text-sm mb-3">Stage Checklist: {caseData.currentStage}</h2>
            <div className="space-y-2">
              {stageChecklist.map((item, i) => {
                const cl = checklist.find(c => c.stage === caseData.currentStage && c.itemName === item);
                const present = cl?.isPresent ?? false;
                return (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    {present ? <CheckCircle2 className="h-4 w-4 text-success" /> : <XCircle className="h-4 w-4 text-destructive" />}
                    <span className={present ? '' : 'text-muted-foreground'}>{item}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Approvals */}
          <div className="bg-card rounded-xl border border-border p-5">
            <h2 className="font-heading font-semibold text-sm mb-3">Approvals</h2>
            {approvals.length === 0 ? (
              <p className="text-sm text-muted-foreground">No approvals yet.</p>
            ) : (
              <div className="space-y-3">
                {approvals.map(a => {
                  const approver = getUser(a.approverId);
                  return (
                    <div key={a.id} className="text-sm border-b border-border pb-2 last:border-0">
                      <div className="flex items-center gap-1">
                        <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                        <span className="font-medium">{a.stage}</span>
                        <span className="text-muted-foreground">by {approver?.name}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{a.comments}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Timeline */}
          <div className="bg-card rounded-xl border border-border p-5">
            <h2 className="font-heading font-semibold text-sm mb-3">Timeline</h2>
            <div className="space-y-3">
              {events.map(e => {
                const actor = getUser(e.actorId);
                return (
                  <div key={e.id} className="flex items-start gap-2 text-sm">
                    <Clock className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
                    <div>
                      <p className="font-medium">{e.action}</p>
                      <p className="text-[10px] text-muted-foreground">{actor?.name} • {new Date(e.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Document Preview Modal */}
      <Dialog open={!!previewDoc} onOpenChange={() => setPreviewDoc(null)}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <FileText className="h-4 w-4" />
              {previewDoc?.fileName}
            </DialogTitle>
          </DialogHeader>

          {previewDoc && (
            <div className="space-y-4">
              {/* File preview */}
              {previewDoc.fileDataUrl ? (
                previewDoc.mimeType?.startsWith('image/') ? (
                  <div className="rounded-lg border border-border overflow-hidden bg-muted/30">
                    <img src={previewDoc.fileDataUrl} alt={previewDoc.fileName} className="w-full h-auto max-h-[400px] object-contain" />
                  </div>
                ) : previewDoc.mimeType === 'application/pdf' ? (
                  <div className="rounded-lg border border-border overflow-hidden">
                    <iframe src={previewDoc.fileDataUrl} className="w-full h-[400px]" title={previewDoc.fileName} />
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground italic">Preview not available for this file type.</p>
                )
              ) : (
                <div className="rounded-lg border border-border bg-muted/30 p-8 text-center">
                  <FileText className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No preview data stored. Upload this document again to enable previews.</p>
                </div>
              )}

              {/* Metadata */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                <div><span className="text-muted-foreground text-xs block">Type</span>{previewDoc.documentType}</div>
                <div><span className="text-muted-foreground text-xs block">Size</span>{(previewDoc.fileSize / 1024).toFixed(1)} KB</div>
                <div><span className="text-muted-foreground text-xs block">Version</span>v{previewDoc.version}</div>
                <div><span className="text-muted-foreground text-xs block">Uploaded</span>{new Date(previewDoc.createdAt).toLocaleDateString()}</div>
              </div>

              {/* Extracted fields */}
              {previewDoc.extractionJson && Object.keys(previewDoc.extractionJson).length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold mb-2">Extracted Fields</h3>
                  <div className="bg-muted/30 rounded-lg p-3 space-y-1.5">
                    {Object.entries(previewDoc.extractionJson).map(([k, v]) => (
                      <div key={k} className="flex justify-between text-sm">
                        <span className="text-muted-foreground capitalize">{k.replace(/_/g, ' ')}</span>
                        <span className="font-medium">{String(v)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* AI Summary */}
              {previewDoc.aiSummary && (
                <div>
                  <h3 className="text-sm font-semibold mb-2">AI Summary</h3>
                  <p className="text-sm text-muted-foreground bg-muted/30 rounded-lg p-3">{previewDoc.aiSummary}</p>
                </div>
              )}

              {/* OCR Text */}
              {previewDoc.ocrText && (
                <div>
                  <h3 className="text-sm font-semibold mb-2">OCR Text</h3>
                  <pre className="text-xs text-muted-foreground bg-muted/30 rounded-lg p-3 max-h-48 overflow-y-auto whitespace-pre-wrap font-mono">{previewDoc.ocrText}</pre>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
