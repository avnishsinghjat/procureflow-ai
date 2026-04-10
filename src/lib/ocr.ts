import Tesseract from 'tesseract.js';

export interface OcrResult {
  text: string;
  confidence: number;
}

/**
 * Run Tesseract.js OCR on an image file (PNG/JPG).
 * For PDFs, the caller must first render pages to images.
 */
export async function runOcr(
  imageSource: File | Blob | string,
  onProgress?: (progress: number) => void
): Promise<OcrResult> {
  const result = await Tesseract.recognize(imageSource, 'eng', {
    logger: (m) => {
      if (m.status === 'recognizing text' && onProgress) {
        onProgress(Math.round(m.progress * 100));
      }
    },
  });

  return {
    text: result.data.text,
    confidence: result.data.confidence / 100, // normalize to 0-1
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
