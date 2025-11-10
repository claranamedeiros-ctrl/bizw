/**
 * Simplified PDF Processing
 *
 * Strategy:
 * 1. Try to extract text from PDF (FREE!)
 * 2. If text exists, process with text LLM (cheap)
 * 3. If no text (scanned PDF), fallback to Claude/GPT-4 Vision
 */

const pdfParse = require('pdf-parse');

export interface PDFTextResult {
  hasText: boolean;
  text: string;
  numPages: number;
  isScanned: boolean;
}

/**
 * Extract text from PDF
 * Returns whether PDF has extractable text (vs being a scanned image)
 */
export async function extractTextFromPDF(pdfBuffer: Buffer): Promise<PDFTextResult> {
  try {
    const data = await pdfParse(pdfBuffer);

    // Clean and normalize text
    const text = data.text.trim();

    // Heuristic: If text is very short relative to pages, it's probably scanned
    const avgCharsPerPage = text.length / data.numpages;
    const isScanned = avgCharsPerPage < 100; // Less than 100 chars/page = likely scanned

    console.log(`[PDF Text] Extracted ${text.length} characters from ${data.numpages} pages`);
    console.log(`[PDF Text] Average: ${avgCharsPerPage.toFixed(0)} chars/page`);
    console.log(`[PDF Text] Assessment: ${isScanned ? 'SCANNED (needs OCR)' : 'TEXT PDF (parseable)'}`);

    return {
      hasText: text.length > 0,
      text,
      numPages: data.numpages,
      isScanned,
    };
  } catch (error: any) {
    console.error('[PDF Text] Extraction error:', error);

    return {
      hasText: false,
      text: '',
      numPages: 0,
      isScanned: true, // Assume scanned if we can't extract text
    };
  }
}

/**
 * Determine if PDF needs OCR (vision model) or can use text extraction
 */
export async function shouldUseOCR(pdfBuffer: Buffer): Promise<boolean> {
  const result = await extractTextFromPDF(pdfBuffer);
  return result.isScanned || !result.hasText;
}
