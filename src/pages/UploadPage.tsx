import { useState, useRef } from 'react';
import { getCases, addDocument } from '@/lib/store';
import { useAuth } from '@/contexts/AuthContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import type { DocumentType } from '@/lib/types';
import { Upload, Brain, CheckCircle2, Loader2, Sparkles, Save, PenLine, Plus, Trash2, RotateCcw } from 'lucide-react';
import { runOcr, isImageFile, isPdfFile } from '@/lib/ocr';
import { classifyDocument, extractFields, summarizeDocument, isLmStudioConfigured } from '@/lib/lmstudio';
import { toast } from 'sonner';

const EXTRACTION_FIELD_KEYS = [
  'vendorName', 'itemName', 'documentDate', 'amount', 'currency',
  'documentNumber', 'requesterName', 'department',
];

const DOC_TYPES: DocumentType[] = [
  'MPR Form', 'Tender Notice', 'Technical Evaluation', 'Commercial Comparison',
  'CST Document', 'Approval Note', 'Purchase Order', 'Receipt Note',
  'Invoice', 'Payment Voucher', 'Other',
];

/** Try to guess basic fields from raw OCR text using simple regex patterns */
function extractFieldsFromText(text: string): Record<string, string> {
  const fields: Record<string, string> = {};
  const patterns: [string, RegExp][] = [
    ['vendorName', /(?:vendor|supplier|company)\s*[:\-–]?\s*(.+)/i],
    ['amount', /(?:amount|value|total|sum)\s*[:\-–]?\s*(?:(?:INR|₹|Rs\.?)\s*)?([0-9,]+(?:\.\d{1,2})?)/i],
    ['currency', /(?:INR|USD|EUR|₹|Rs)/i],
    ['documentDate', /(?:date)\s*[:\-–]?\s*(\d{1,2}[\-\/\.]\w{3,9}[\-\/\.]\d{2,4}|\d{1,2}[\-\/]\d{1,2}[\-\/]\d{2,4})/i],
    ['documentNumber', /(?:no|number|ref|doc)\s*[:\-–#]?\s*([A-Z0-9][\w\-\/]+)/i],
    ['department', /(?:department|dept)\s*[:\-–]?\s*(.+)/i],
    ['requesterName', /(?:requester|requested\s*by|from)\s*[:\-–]?\s*(.+)/i],
    ['itemName', /(?:item|material|product|description)\s*[:\-–]?\s*(.+)/i],
  ];
  for (const [key, regex] of patterns) {
    const match = text.match(regex);
    if (match) {
      fields[key] = key === 'currency'
        ? (match[0].includes('₹') || match[0].includes('Rs') || match[0].includes('INR') ? 'INR' : match[0])
        : match[1].trim();
    }
  }
  return fields;
}

export default function UploadPage() {
  const { user } = useAuth();
  const cases = getCases();
  const [selectedCase, setSelectedCase] = useState('');
  const [docType, setDocType] = useState<DocumentType>('Other');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [ocrProgress, setOcrProgress] = useState(0);
  const [statusMsg, setStatusMsg] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Phase 2: editable review state
  const [ocrResult, setOcrResult] = useState<{ text: string; confidence: number } | null>(null);
  const [editableFields, setEditableFields] = useState<Record<string, string>>({});
  const [editableDocType, setEditableDocType] = useState<DocumentType>('Other');
  const [editableSummary, setEditableSummary] = useState('');
  const [saved, setSaved] = useState(false);
  const [newFieldKey, setNewFieldKey] = useState('');

  const handleFileSelect = (f: File | null) => {
    setFile(f);
    setOcrResult(null);
    setOcrProgress(0);
    setSaved(false);
    setEditableFields({});
    if (f && isImageFile(f)) {
      setPreview(URL.createObjectURL(f));
    } else {
      setPreview(null);
    }
  };

  const handleUpload = async () => {
    if (!file || !selectedCase || !user) return;
    setProcessing(true);
    setOcrProgress(0);
    setOcrResult(null);
    setSaved(false);

    try {
      let ocrText = '';
      let confidence = 0;

      if (isImageFile(file)) {
        setStatusMsg('Running Tesseract.js OCR on image…');
        const ocr = await runOcr(file, setOcrProgress);
        ocrText = ocr.text;
        confidence = ocr.confidence;
      } else if (isPdfFile(file)) {
        setStatusMsg('Loading PDF…');
        const arrayBuffer = await file.arrayBuffer();
        const pdfjsLib = await loadPdfJs();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        const totalPages = Math.min(pdf.numPages, 5);
        const allText: string[] = [];
        let totalConf = 0;

        for (let i = 1; i <= totalPages; i++) {
          setStatusMsg(`OCR page ${i} of ${totalPages}…`);
          const page = await pdf.getPage(i);
          const viewport = page.getViewport({ scale: 2 });
          const canvas = document.createElement('canvas');
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          const ctx = canvas.getContext('2d')!;
          await page.render({ canvasContext: ctx, viewport }).promise;
          const blob = await new Promise<Blob>((resolve) =>
            canvas.toBlob((b) => resolve(b!), 'image/png')
          );
          const ocr = await runOcr(blob, (p) => setOcrProgress(Math.round(((i - 1) / totalPages) * 100 + p / totalPages)));
          allText.push(`--- Page ${i} ---\n${ocr.text}`);
          totalConf += ocr.confidence;
        }
        ocrText = allText.join('\n\n');
        confidence = totalConf / totalPages;
      } else {
        toast.error('Unsupported file type.');
        setProcessing(false);
        return;
      }

      // Extract fields: AI if configured, else regex fallback
      let fields: Record<string, string> = {};
      let classifiedType: DocumentType = docType;
      let summary = `OCR extracted ${ocrText.split(/\s+/).length} words with ${(confidence * 100).toFixed(0)}% confidence.`;

      if (isLmStudioConfigured() && ocrText.trim().length > 20) {
        try {
          setStatusMsg('AI: Classifying document…');
          const cls = await classifyDocument(ocrText);
          classifiedType = cls.documentType as DocumentType;

          setStatusMsg('AI: Extracting fields…');
          const aiFields = await extractFields(ocrText);
          fields = Object.fromEntries(
            Object.entries(aiFields).map(([k, v]) => [k, v != null ? String(v) : ''])
          );

          setStatusMsg('AI: Generating summary…');
          summary = await summarizeDocument(ocrText);
        } catch (aiErr: any) {
          console.warn('AI failed, using regex fallback:', aiErr);
          toast.error(`AI failed: ${aiErr.message}. Using pattern matching.`);
          fields = extractFieldsFromText(ocrText);
        }
      } else {
        fields = extractFieldsFromText(ocrText);
      }

      // Ensure all standard keys exist (empty if not found)
      for (const key of EXTRACTION_FIELD_KEYS) {
        if (!(key in fields)) fields[key] = '';
      }

      setOcrResult({ text: ocrText, confidence });
      setEditableFields(fields);
      setEditableDocType(DOC_TYPES.includes(classifiedType) ? classifiedType : 'Other');
      setEditableSummary(summary);
      toast.success('OCR complete — review and edit extracted fields below.');
    } catch (err) {
      console.error('OCR error:', err);
      toast.error('OCR processing failed.');
    } finally {
      setProcessing(false);
      setStatusMsg('');
      setOcrProgress(0);
    }
  };

  const handleFieldChange = (key: string, value: string) => {
    setEditableFields(prev => ({ ...prev, [key]: value }));
  };

  const handleRemoveField = (key: string) => {
    setEditableFields(prev => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const handleAddField = () => {
    const key = newFieldKey.trim();
    if (!key || key in editableFields) return;
    setEditableFields(prev => ({ ...prev, [key]: '' }));
    setNewFieldKey('');
  };

  const handleSave = async () => {
    if (!ocrResult || !file || !user || !selectedCase) return;
    const extractionJson = Object.fromEntries(
      Object.entries(editableFields).filter(([, v]) => v.trim() !== '')
    );

    // Store file as data URL for preview
    let fileDataUrl: string | undefined;
    try {
      fileDataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    } catch { /* skip if too large */ }

    addDocument({
      id: crypto.randomUUID(),
      caseId: selectedCase,
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type,
      documentType: editableDocType,
      uploadedById: user.id,
      ocrText: ocrResult.text,
      extractionJson: Object.keys(extractionJson).length > 0 ? extractionJson : undefined,
      extractionConfidence: ocrResult.confidence,
      aiSummary: editableSummary,
      fileDataUrl,
      version: 1,
      createdAt: new Date().toISOString(),
    });

    setSaved(true);
    toast.success('Document saved with your corrections!');
  };

  const handleReset = () => {
    setOcrResult(null);
    setFile(null);
    setPreview(null);
    setSaved(false);
    setEditableFields({});
    setEditableSummary('');
  };

  const fieldLabel = (key: string) =>
    key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase());

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <h1 className="text-2xl font-heading font-bold">Document Upload & OCR</h1>

      {/* Phase 1: Upload */}
      {!ocrResult && (
        <div className="bg-card rounded-xl border border-border p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Procurement Case</label>
              <Select value={selectedCase} onValueChange={setSelectedCase}>
                <SelectTrigger><SelectValue placeholder="Select case" /></SelectTrigger>
                <SelectContent>
                  {cases.map(c => <SelectItem key={c.id} value={c.id}>{c.caseNumber} - {c.title}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Document Type</label>
              <Select value={docType} onValueChange={v => setDocType(v as DocumentType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {DOC_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div
            className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
            onClick={() => inputRef.current?.click()}
            onDragOver={e => { e.preventDefault(); e.stopPropagation(); }}
            onDrop={e => { e.preventDefault(); handleFileSelect(e.dataTransfer.files?.[0] || null); }}
          >
            {preview ? (
              <img src={preview} alt="Preview" className="max-h-40 mx-auto rounded-lg mb-2 border border-border" />
            ) : (
              <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            )}
            <p className="text-sm font-medium">{file ? file.name : 'Click or drag & drop PDF / image here'}</p>
            <p className="text-xs text-muted-foreground mt-1">Supports PDF, PNG, JPG — OCR powered by Tesseract.js</p>
            <input ref={inputRef} type="file" className="hidden" accept=".pdf,.png,.jpg,.jpeg,.bmp,.webp,.tiff" onChange={e => handleFileSelect(e.target.files?.[0] || null)} />
          </div>

          {processing && (
            <div className="space-y-2 animate-fade-in">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>{statusMsg}</span>
              </div>
              <Progress value={ocrProgress} className="h-2" />
              <p className="text-xs text-muted-foreground text-right">{ocrProgress}%</p>
            </div>
          )}

          <Button onClick={handleUpload} disabled={!file || !selectedCase || processing} className="w-full">
            {processing ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Processing…</> : <><Brain className="h-4 w-4 mr-2" /> Upload & Run OCR</>}
          </Button>
        </div>
      )}

      {/* Phase 2: Editable Review */}
      {ocrResult && !saved && (
        <div className="space-y-5 animate-fade-in">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-success" />
            <h2 className="font-heading font-semibold">Review & Edit Extracted Data</h2>
            <span className="text-xs bg-success/10 text-success px-2 py-0.5 rounded-full ml-auto">
              {(ocrResult.confidence * 100).toFixed(0)}% OCR confidence
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Left: OCR text */}
            <div className="bg-card rounded-xl border border-border p-5">
              <h3 className="font-heading font-semibold text-sm mb-2">OCR Text</h3>
              <pre className="bg-muted rounded-lg p-4 text-xs font-mono whitespace-pre-wrap max-h-[400px] overflow-auto">
                {ocrResult.text}
              </pre>
            </div>

            {/* Right: Editable fields */}
            <div className="space-y-4">
              {/* Document type */}
              <div className="bg-card rounded-xl border border-border p-5">
                <h3 className="font-heading font-semibold text-sm mb-2 flex items-center gap-2">
                  <Sparkles className="h-4 w-4" /> Document Type
                </h3>
                <Select value={editableDocType} onValueChange={v => setEditableDocType(v as DocumentType)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {DOC_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              {/* Fields */}
              <div className="bg-card rounded-xl border border-border p-5">
                <h3 className="font-heading font-semibold text-sm mb-3 flex items-center gap-2">
                  <PenLine className="h-4 w-4" /> Extracted Fields
                  <span className="text-[10px] text-muted-foreground font-normal ml-auto">Edit any value before saving</span>
                </h3>
                <div className="space-y-2.5">
                  {Object.entries(editableFields).map(([key, value]) => (
                    <div key={key} className="flex items-center gap-2">
                      <label className="text-xs text-muted-foreground w-28 shrink-0 text-right">
                        {fieldLabel(key)}
                      </label>
                      <Input
                        value={value}
                        onChange={e => handleFieldChange(key, e.target.value)}
                        className="h-8 text-sm"
                        placeholder={`Enter ${fieldLabel(key).toLowerCase()}`}
                      />
                      {!EXTRACTION_FIELD_KEYS.includes(key) && (
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0 shrink-0" onClick={() => handleRemoveField(key)}>
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>

                {/* Add custom field */}
                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border">
                  <Input
                    value={newFieldKey}
                    onChange={e => setNewFieldKey(e.target.value)}
                    placeholder="Custom field name"
                    className="h-8 text-sm"
                    onKeyDown={e => e.key === 'Enter' && handleAddField()}
                  />
                  <Button size="sm" variant="outline" className="h-8 shrink-0" onClick={handleAddField} disabled={!newFieldKey.trim()}>
                    <Plus className="h-3.5 w-3.5 mr-1" /> Add
                  </Button>
                </div>
              </div>

              {/* Summary */}
              <div className="bg-card rounded-xl border border-border p-5">
                <h3 className="font-heading font-semibold text-sm mb-2">Summary</h3>
                <Textarea
                  value={editableSummary}
                  onChange={e => setEditableSummary(e.target.value)}
                  className="min-h-[80px] text-sm"
                />
              </div>
            </div>
          </div>

          {/* Save / Reset */}
          <div className="flex gap-3">
            <Button onClick={handleSave} className="flex-1">
              <Save className="h-4 w-4 mr-2" /> Confirm & Save Document
            </Button>
            <Button variant="outline" onClick={handleReset}>
              <RotateCcw className="h-4 w-4 mr-2" /> Start Over
            </Button>
          </div>
        </div>
      )}

      {/* Phase 3: Saved confirmation */}
      {saved && (
        <div className="bg-card rounded-xl border border-success/30 p-6 text-center space-y-4 animate-fade-in">
          <CheckCircle2 className="h-10 w-10 text-success mx-auto" />
          <h2 className="font-heading font-semibold text-lg">Document Saved Successfully</h2>
          <p className="text-sm text-muted-foreground">
            <strong>{file?.name}</strong> saved as <strong>{editableDocType}</strong> with {Object.values(editableFields).filter(v => v.trim()).length} extracted fields.
          </p>
          <Button onClick={handleReset}><Plus className="h-4 w-4 mr-2" /> Upload Another Document</Button>
        </div>
      )}
    </div>
  );
}

async function loadPdfJs() {
  const pdfjs = await import('pdfjs-dist');
  pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.js',
    import.meta.url
  ).toString();
  return pdfjs;
}
