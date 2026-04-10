import { useState } from 'react';
import { getCases, addDocument } from '@/lib/store';
import { useAuth } from '@/contexts/AuthContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import type { DocumentType } from '@/lib/types';
import { Upload, FileText, Brain, CheckCircle2, Loader2 } from 'lucide-react';

export default function UploadPage() {
  const { user } = useAuth();
  const cases = getCases();
  const [selectedCase, setSelectedCase] = useState('');
  const [docType, setDocType] = useState<DocumentType>('Other');
  const [file, setFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<{ ocrText: string; confidence: number; summary: string } | null>(null);

  const handleUpload = async () => {
    if (!file || !selectedCase || !user) return;
    setProcessing(true);

    // Simulate OCR processing
    await new Promise(r => setTimeout(r, 2000));

    const mockOcr = `Document scanned: ${file.name}\nType: ${docType}\nDate: ${new Date().toLocaleDateString()}\nVendor: Sample Vendor Corp\nAmount: INR 5,00,000\nDocument Number: DOC-${Math.floor(Math.random() * 9000) + 1000}`;
    const mockSummary = `This is a ${docType} document uploaded for case processing. Contains standard procurement information including vendor details and financial data.`;
    const confidence = 0.85 + Math.random() * 0.12;

    const doc = {
      id: crypto.randomUUID(),
      caseId: selectedCase,
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type,
      documentType: docType,
      uploadedById: user.id,
      ocrText: mockOcr,
      extractionJson: { vendorName: 'Sample Vendor Corp', amount: 500000, currency: 'INR', documentNumber: `DOC-${Math.floor(Math.random() * 9000) + 1000}` },
      extractionConfidence: confidence,
      aiSummary: mockSummary,
      version: 1,
      createdAt: new Date().toISOString(),
    };

    addDocument(doc);
    setResult({ ocrText: mockOcr, confidence, summary: mockSummary });
    setProcessing(false);
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
          onClick={() => document.getElementById('file-input')?.click()}
        >
          <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm font-medium">{file ? file.name : 'Click or drop PDF / image here'}</p>
          <p className="text-xs text-muted-foreground mt-1">Supports PDF, PNG, JPG</p>
          <input id="file-input" type="file" className="hidden" accept=".pdf,.png,.jpg,.jpeg" onChange={e => setFile(e.target.files?.[0] || null)} />
        </div>

        <Button onClick={handleUpload} disabled={!file || !selectedCase || processing} className="w-full">
          {processing ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Processing OCR...</> : <><Brain className="h-4 w-4 mr-2" /> Upload & Process</>}
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
            <pre className="bg-muted rounded-lg p-4 text-xs font-mono whitespace-pre-wrap">{result.ocrText}</pre>
          </div>
          <div className="bg-card rounded-xl border border-border p-5">
            <h2 className="font-heading font-semibold text-sm mb-2">AI Summary</h2>
            <p className="text-sm text-muted-foreground">{result.summary}</p>
          </div>
        </div>
      )}
    </div>
  );
}
