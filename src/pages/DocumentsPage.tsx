import { useState } from 'react';
import { getDocuments, getCase, getUser, updateDocument, deleteDocument } from '@/lib/store';
import { useAuth } from '@/contexts/AuthContext';
import type { Document as PFDocument, DocumentType } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  FileText, Search, Trash2, Pencil, Eye, Download, Tag, Filter,
  Image, FileType, X, Save, Plus, FolderOpen,
} from 'lucide-react';
import { toast } from 'sonner';

const DOC_TYPES: DocumentType[] = [
  'MPR Form', 'Tender Notice', 'Technical Evaluation', 'Commercial Comparison',
  'CST Document', 'Approval Note', 'Purchase Order', 'Receipt Note',
  'Invoice', 'Payment Voucher', 'Other',
];

const CATEGORIES = ['General', 'Financial', 'Technical', 'Legal', 'Compliance', 'Correspondence'];

export default function DocumentsPage() {
  const { user } = useAuth();
  const [refresh, setRefresh] = useState(0);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [previewDoc, setPreviewDoc] = useState<PFDocument | null>(null);
  const [editDoc, setEditDoc] = useState<PFDocument | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Edit form state
  const [editFileName, setEditFileName] = useState('');
  const [editDocType, setEditDocType] = useState<DocumentType>('Other');
  const [editCategory, setEditCategory] = useState('General');
  const [editTags, setEditTags] = useState<string[]>([]);
  const [editSummary, setEditSummary] = useState('');
  const [newTag, setNewTag] = useState('');

  const allDocs = getDocuments();

  const filteredDocs = allDocs.filter(d => {
    const q = search.toLowerCase();
    const matchesSearch = !q || d.fileName.toLowerCase().includes(q) ||
      d.documentType.toLowerCase().includes(q) ||
      (d.ocrText?.toLowerCase().includes(q)) ||
      (d.tags?.some(t => t.toLowerCase().includes(q)));
    const matchesType = filterType === 'all' || d.documentType === filterType;
    const matchesCategory = filterCategory === 'all' || (d.category || 'General') === filterCategory;
    return matchesSearch && matchesType && matchesCategory;
  });

  const openEdit = (doc: PFDocument) => {
    setEditDoc(doc);
    setEditFileName(doc.fileName);
    setEditDocType(doc.documentType);
    setEditCategory(doc.category || 'General');
    setEditTags(doc.tags || []);
    setEditSummary(doc.aiSummary || '');
  };

  const handleSaveEdit = () => {
    if (!editDoc) return;
    updateDocument({
      ...editDoc,
      fileName: editFileName,
      documentType: editDocType,
      category: editCategory,
      tags: editTags,
      aiSummary: editSummary,
      updatedAt: new Date().toISOString(),
    });
    setEditDoc(null);
    setRefresh(n => n + 1);
    toast.success('Document updated successfully');
  };

  const handleDelete = (id: string) => {
    deleteDocument(id);
    setDeleteConfirm(null);
    setRefresh(n => n + 1);
    toast.success('Document deleted');
  };

  const handleDownload = (doc: PFDocument) => {
    if (!doc.fileDataUrl) {
      toast.error('No file data available for download');
      return;
    }
    const a = document.createElement('a');
    a.href = doc.fileDataUrl;
    a.download = doc.fileName;
    a.click();
  };

  const handleExportAll = () => {
    const csv = [
      ['File Name', 'Type', 'Category', 'Tags', 'Case', 'Size (KB)', 'Version', 'Uploaded', 'Summary'].join(','),
      ...filteredDocs.map(d => {
        const c = getCase(d.caseId);
        return [
          `"${d.fileName}"`, d.documentType, d.category || 'General',
          `"${(d.tags || []).join('; ')}"`, c?.caseNumber || d.caseId,
          (d.fileSize / 1024).toFixed(1), d.version,
          new Date(d.createdAt).toLocaleDateString(),
          `"${(d.aiSummary || '').replace(/"/g, '""')}"`,
        ].join(',');
      }),
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'documents_export.csv';
    a.click();
    toast.success('Exported documents as CSV');
  };

  const addTag = () => {
    const t = newTag.trim();
    if (t && !editTags.includes(t)) {
      setEditTags([...editTags, t]);
      setNewTag('');
    }
  };

  const removeTag = (t: string) => setEditTags(editTags.filter(x => x !== t));

  // Collect all unique tags for display
  const allTags = Array.from(new Set(allDocs.flatMap(d => d.tags || [])));

  return (
    <div className="space-y-6 animate-fade-in" key={refresh}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold">Document Management</h1>
          <p className="text-sm text-muted-foreground">{allDocs.length} documents across all cases</p>
        </div>
        <Button variant="outline" size="sm" onClick={handleExportAll}>
          <Download className="h-4 w-4 mr-2" /> Export CSV
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, type, tags, OCR text…"
            className="pl-9 h-9"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[180px] h-9">
            <Filter className="h-3.5 w-3.5 mr-1.5" />
            <SelectValue placeholder="All types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {DOC_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-[160px] h-9">
            <FolderOpen className="h-3.5 w-3.5 mr-1.5" />
            <SelectValue placeholder="All categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Tag cloud */}
      {allTags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          <Tag className="h-3.5 w-3.5 text-muted-foreground mt-0.5" />
          {allTags.map(t => (
            <button
              key={t}
              onClick={() => setSearch(t)}
              className="text-[11px] px-2 py-0.5 rounded-full bg-accent text-accent-foreground hover:bg-primary hover:text-primary-foreground transition-colors"
            >
              {t}
            </button>
          ))}
        </div>
      )}

      {/* Documents table */}
      {filteredDocs.length === 0 ? (
        <div className="bg-card rounded-xl border border-border p-12 text-center">
          <FileText className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">No documents found</p>
        </div>
      ) : (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">File</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Type</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Category</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Case</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Tags</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Size</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Uploaded</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredDocs.map(d => {
                  const caseData = getCase(d.caseId);
                  const uploader = getUser(d.uploadedById);
                  return (
                    <tr key={d.id} className="border-b border-border last:border-0 hover:bg-accent/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          {d.mimeType?.startsWith('image/') ? (
                            <Image className="h-4 w-4 text-primary shrink-0" />
                          ) : (
                            <FileType className="h-4 w-4 text-primary shrink-0" />
                          )}
                          <div className="min-w-0">
                            <p className="font-medium truncate max-w-[200px]">{d.fileName}</p>
                            <p className="text-[10px] text-muted-foreground">by {uploader?.name || 'Unknown'} • v{d.version}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{d.documentType}</td>
                      <td className="px-4 py-3">
                        <span className="text-xs px-2 py-0.5 rounded-full bg-accent text-accent-foreground">
                          {d.category || 'General'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{caseData?.caseNumber || '—'}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {(d.tags || []).map(t => (
                            <span key={t} className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary">{t}</span>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{(d.fileSize / 1024).toFixed(1)} KB</td>
                      <td className="px-4 py-3 text-muted-foreground">{new Date(d.createdAt).toLocaleDateString()}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 justify-end">
                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => setPreviewDoc(d)}>
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => openEdit(d)}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => handleDownload(d)}>
                            <Download className="h-3.5 w-3.5" />
                          </Button>
                          {(user?.role === 'admin' || user?.id === d.uploadedById) && (
                            <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive hover:text-destructive" onClick={() => setDeleteConfirm(d.id)}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      <Dialog open={!!previewDoc} onOpenChange={() => setPreviewDoc(null)}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <FileText className="h-4 w-4" /> {previewDoc?.fileName}
            </DialogTitle>
          </DialogHeader>
          {previewDoc && (
            <div className="space-y-4">
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
                  <p className="text-sm text-muted-foreground">No preview data stored.</p>
                </div>
              )}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                <div><span className="text-muted-foreground text-xs block">Type</span>{previewDoc.documentType}</div>
                <div><span className="text-muted-foreground text-xs block">Category</span>{previewDoc.category || 'General'}</div>
                <div><span className="text-muted-foreground text-xs block">Size</span>{(previewDoc.fileSize / 1024).toFixed(1)} KB</div>
                <div><span className="text-muted-foreground text-xs block">Version</span>v{previewDoc.version}</div>
              </div>
              {(previewDoc.tags || []).length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {previewDoc.tags!.map(t => (
                    <span key={t} className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">{t}</span>
                  ))}
                </div>
              )}
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
              {previewDoc.aiSummary && (
                <div>
                  <h3 className="text-sm font-semibold mb-2">Summary</h3>
                  <p className="text-sm text-muted-foreground bg-muted/30 rounded-lg p-3">{previewDoc.aiSummary}</p>
                </div>
              )}
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

      {/* Edit Modal */}
      <Dialog open={!!editDoc} onOpenChange={() => setEditDoc(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="h-4 w-4" /> Edit Document
            </DialogTitle>
          </DialogHeader>
          {editDoc && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1 block">File Name</label>
                <Input value={editFileName} onChange={e => setEditFileName(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium mb-1 block">Document Type</label>
                  <Select value={editDocType} onValueChange={v => setEditDocType(v as DocumentType)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {DOC_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Category</label>
                  <Select value={editCategory} onValueChange={setEditCategory}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Tags</label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {editTags.map(t => (
                    <span key={t} className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary flex items-center gap-1">
                      {t}
                      <button onClick={() => removeTag(t)}><X className="h-3 w-3" /></button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Add tag…"
                    value={newTag}
                    onChange={e => setNewTag(e.target.value)}
                    className="h-8 text-sm"
                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  />
                  <Button size="sm" variant="outline" className="h-8" onClick={addTag} disabled={!newTag.trim()}>
                    <Plus className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Summary</label>
                <Textarea value={editSummary} onChange={e => setEditSummary(e.target.value)} className="min-h-[80px]" />
              </div>
              <div className="flex gap-2 pt-2">
                <Button onClick={handleSaveEdit} className="flex-1">
                  <Save className="h-4 w-4 mr-2" /> Save Changes
                </Button>
                <Button variant="outline" onClick={() => setEditDoc(null)}>Cancel</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Document?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">This action cannot be undone.</p>
          <div className="flex gap-2 pt-2">
            <Button variant="destructive" className="flex-1" onClick={() => deleteConfirm && handleDelete(deleteConfirm)}>
              <Trash2 className="h-4 w-4 mr-2" /> Delete
            </Button>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
