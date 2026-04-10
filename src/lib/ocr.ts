import Tesseract from 'tesseract.js';

export interface OcrResult {
  text: string;
  confidence: number;
}

/**
 * Run Tesseract.js OCR on an image file (PNG/JPG).
 * All assets (worker, WASM core, language data) are served from /tesseract/
 * so the app works fully offline.
 */
export async function runOcr(
  imageSource: File | Blob | string,
  onProgress?: (progress: number) => void
): Promise<OcrResult> {
  const result = await Tesseract.recognize(imageSource, 'eng', {
    workerPath: '/tesseract/worker.min.js',
    corePath: '/tesseract',
    langPath: '/tesseract/lang-data',
    logger: (m) => {
      if (m.status === 'recognizing text' && onProgress) {
        onProgress(Math.round(m.progress * 100));
      }
    },
  });

  return {
    text: result.data.text,
    confidence: result.data.confidence / 100,
  };
}

/**
 * Convert a PDF page (from a File) to an image canvas using the browser's
 * built-in rendering or pdf.js. For MVP, we instruct users to upload images
 * directly and fall back to a note for PDFs.
 */
export function isImageFile(file: File): boolean {
  return /^image\/(png|jpe?g|gif|bmp|webp|tiff?)$/i.test(file.type);
}

export function isPdfFile(file: File): boolean {
  return file.type === 'application/pdf';
}
