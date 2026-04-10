import { getSetting } from './store';

async function callLmStudio(systemPrompt: string, userPrompt: string): Promise<string> {
  const baseUrl = getSetting('lmstudio_base_url') || 'http://localhost:1234';
  const model = getSetting('lmstudio_model') || 'default';

  const res = await fetch(`${baseUrl}/v1/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.2,
      max_tokens: 1024,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `LM Studio error ${res.status}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content?.trim() || '';
}

function parseJsonFromResponse(text: string): Record<string, unknown> | null {
  const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/) || text.match(/(\{[\s\S]*\})/);
  if (!jsonMatch) return null;
  try {
    return JSON.parse(jsonMatch[1].trim());
  } catch {
    return null;
  }
}

/** Classify a document based on OCR text */
export async function classifyDocument(ocrText: string): Promise<{
  documentType: string;
  confidence: number;
  reasoning: string;
}> {
  const system = `You are an AI assistant for procurement operations. Based on the OCR text below, classify the document into one of these categories ONLY: MPR Form, Tender Notice, Technical Evaluation, Commercial Comparison, CST Document, Approval Note, Purchase Order, Receipt Note, Invoice, Payment Voucher, Other. Return strict JSON with keys: documentType, confidence (0-1), reasoning.`;

  const raw = await callLmStudio(system, `OCR Text:\n\n${ocrText.slice(0, 3000)}`);
  const parsed = parseJsonFromResponse(raw);
  return {
    documentType: (parsed?.documentType as string) || 'Other',
    confidence: Number(parsed?.confidence) || 0.5,
    reasoning: (parsed?.reasoning as string) || raw.slice(0, 200),
  };
}

/** Extract structured fields from OCR text */
export async function extractFields(ocrText: string): Promise<Record<string, unknown>> {
  const system = `You are an AI information extraction assistant. Extract the following fields from the OCR text if present: vendorName, itemName, documentDate, amount, currency, documentNumber, requesterName, department. Return strict JSON only. If a field is missing, return null for that field.`;

  const raw = await callLmStudio(system, `OCR Text:\n\n${ocrText.slice(0, 3000)}`);
  return parseJsonFromResponse(raw) || {};
}

/** Summarize a procurement document */
export async function summarizeDocument(ocrText: string): Promise<string> {
  const system = `Summarize this procurement document for an internal reviewer in concise business language. Return exactly 5 bullet points and 1 short risk note. Use plain text, no markdown headers.`;

  return callLmStudio(system, `Document text:\n\n${ocrText.slice(0, 4000)}`);
}

/** Detect missing attachments for a stage */
export async function detectMissingAttachments(
  stage: string,
  documentTypes: string[],
  requiredChecklist: string[]
): Promise<{ missingItems: string[]; warnings: string[]; canProceed: boolean }> {
  const system = `You are validating a procurement file set. Return strict JSON with keys: missingItems (array of strings), warnings (array of strings), canProceed (boolean).`;

  const prompt = `Current stage: ${stage}\nProvided document types: ${JSON.stringify(documentTypes)}\nRequired document checklist: ${JSON.stringify(requiredChecklist)}`;

  const raw = await callLmStudio(system, prompt);
  const parsed = parseJsonFromResponse(raw);
  return {
    missingItems: (parsed?.missingItems as string[]) || [],
    warnings: (parsed?.warnings as string[]) || [],
    canProceed: (parsed?.canProceed as boolean) ?? true,
  };
}

/** Draft an approval note for a stage */
export async function draftApprovalNote(
  stage: string,
  caseTitle: string,
  vendorName: string,
  estimatedValue: number,
  extractedData: Record<string, unknown>
): Promise<string> {
  const system = `Using the case details, extracted metadata, and available documents, draft a formal approval note for the ${stage} stage. Keep it clear, professional, and concise. Return plain text only.`;

  const prompt = `Case: ${caseTitle}\nVendor: ${vendorName}\nEstimated Value: INR ${estimatedValue.toLocaleString()}\nStage: ${stage}\nExtracted Data: ${JSON.stringify(extractedData)}`;

  return callLmStudio(system, prompt);
}

/** Check if LM Studio is configured (base URL is set) */
export function isLmStudioConfigured(): boolean {
  return !!getSetting('lmstudio_base_url');
}
