import { useState, useRef } from 'react';
import { getCases, addDocument } from '@/lib/store';
import { useAuth } from '@/contexts/AuthContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import type { DocumentType } from '@/lib/types';
import { Upload, Brain, CheckCircle2, Loader2, Sparkles, AlertCircle } from 'lucide-react';
import { runOcr, isImageFile, isPdfFile } from '@/lib/ocr';
import { classifyDocument, extractFields, summarizeDocument, isOpenRouterConfigured } from '@/lib/openrouter';
import { toast } from 'sonner';

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
  const [result, setResult] = useState<{ ocrText: string; confidence: number; summary: string; extractedFields?: Record<string, unknown>; classifiedType?: string; classifyConfidence?: number } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (f: File | null) => {
    setFile(f);
    setResult(null);
    setOcrProgress(0);
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
    setResult(null);

    try {
      let ocrText = '';
      let confidence = 0;

      if (isImageFile(file)) {
        setStatusMsg('Running Tesseract.js OCR on image…');
        const ocr = await runOcr(file, setOcrProgress);
        ocrText = ocr.text;
        confidence = ocr.confidence;
      } else if (isPdfFile(file)) {
        // For PDFs, we render the first page to a canvas using pdf.js CDN
        setStatusMsg('Loading PDF…');
        const arrayBuffer = await file.arrayBuffer();
        const pdfjsLib = await loadPdfJs();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

        const totalPages = Math.min(pdf.numPages, 5); // OCR first 5 pages max
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
        toast.error('Unsupported file type. Please upload a PNG, JPG, or PDF.');
        setProcessing(false);
        return;
      }

      let summary = `OCR extracted ${ocrText.split(/\s+/).length} words from ${file.name} with ${(confidence * 100).toFixed(0)}% average confidence.`;
      let extractedFields: Record<string, unknown> = {};
      let classifiedType: string = docType;
      let classifyConfidence = 0;

      // Run AI if OpenRouter is configured
      if (isOpenRouterConfigured() && ocrText.trim().length > 20) {
        try {
          setStatusMsg('AI: Classifying document…');
          const classification = await classifyDocument(ocrText);
          classifiedType = classification.documentType;
          classifyConfidence = classification.confidence;

          setStatusMsg('AI: Extracting fields…');
          extractedFields = await extractFields(ocrText);

          setStatusMsg('AI: Generating summary…');
          summary = await summarizeDocument(ocrText);
        } catch (aiErr: any) {
          console.warn('AI processing failed, using OCR-only results:', aiErr);
          toast.error(`AI processing failed: ${aiErr.message}`);
        }
      }

      setStatusMsg('Saving document…');

      const doc = {
        id: crypto.randomUUID(),
        caseId: selectedCase,
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
        documentType: classifiedType as DocumentType,
        uploadedById: user.id,
        ocrText,
        extractionJson: Object.keys(extractedFields).length > 0 ? extractedFields : undefined,
        extractionConfidence: confidence,
        aiSummary: summary,
        version: 1,
        createdAt: new Date().toISOString(),
      };

      addDocument(doc);
      setResult({ ocrText, confidence, summary, extractedFields, classifiedType, classifyConfidence });
      toast.success('Processing complete!');
    } catch (err) {
      console.error('OCR error:', err);
      toast.error('OCR processing failed. Please try again.');
    } finally {
      setProcessing(false);
      setStatusMsg('');
      setOcrProgress(0);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      <h1 className="text-2xl font-heading font-bold">Document Upload & OCR</h1>

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
                {['MPR Form', 'Tender Notice', 'Technical Evaluation', 'Commercial Comparison', 'CST Document', 'Approval Note', 'Purchase Order', 'Receipt Note', 'Invoice', 'Payment Voucher', 'Other'].map(t =>
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Drop zone */}
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
          <input
            ref={inputRef}
            type="file"
            className="hidden"
            accept=".pdf,.png,.jpg,.jpeg,.bmp,.webp,.tiff"
            onChange={e => handleFileSelect(e.target.files?.[0] || null)}
          />
        </div>

        {/* Progress */}
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
          {processing ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Processing OCR…</> : <><Brain className="h-4 w-4 mr-2" /> Upload & Run OCR</>}
        </Button>
      </div>

      {/* Results */}
      {result && (
        <div className="space-y-4 animate-fade-in">
          <div className="bg-card rounded-xl border border-border p-5">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 className="h-5 w-5 text-success" />
              <h2 className="font-heading font-semibold text-sm">OCR Extraction Complete</h2>
              <span className="text-xs bg-success/10 text-success px-2 py-0.5 rounded-full ml-auto">{(result.confidence * 100).toFixed(0)}% confidence</span>
            </div>
            <pre className="bg-muted rounded-lg p-4 text-xs font-mono whitespace-pre-wrap max-h-[400px] overflow-auto">{result.ocrText}</pre>
          </div>
          <div className="bg-card rounded-xl border border-border p-5">
            <h2 className="font-heading font-semibold text-sm mb-2">Summary</h2>
            <p className="text-sm text-muted-foreground">{result.summary}</p>
          </div>
        </div>
      )}
    </div>
  );
}

// Lazy-load pdf.js from CDN via classic script tag
let pdfJsPromise: Promise<any> | null = null;
function loadPdfJs(): Promise<any> {
  if (pdfJsPromise) return pdfJsPromise;
  pdfJsPromise = new Promise((resolve, reject) => {
    if ((window as any).pdfjsLib) {
      resolve((window as any).pdfjsLib);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
    script.onload = () => {
      const lib = (window as any).pdfjsLib;
      lib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
      resolve(lib);
    };
    script.onerror = reject;
    document.head.appendChild(script);
  });
  return pdfJsPromise;
}
