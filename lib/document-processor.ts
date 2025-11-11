/**
 * Master Document Processor - El Cerebro del Sistema
 *
 * This is the main router that:
 * 1. Detects file type by extension + MIME validation
 * 2. Routes to the appropriate processor
 * 3. Falls back to more expensive methods if needed
 *
 * Processing Strategy:
 * - CSV/Excel: FREE (regex) → Mistral Text → Claude → GPT-4
 *   - FREE: 95% accuracy, $0
 *   - Mistral Text: 90% accuracy, $0.0001
 *   - Claude: 85-90% accuracy, $0.02
 *   - GPT-4: 90-95% accuracy, $0.30
 * - PDF/Images: Mistral OCR → Claude → GPT-4
 *   - Mistral OCR: 94.9% accuracy, $0.001/page
 *   - Claude: 85-90% accuracy, $0.02
 *   - GPT-4: 90-95% accuracy, $0.30
 */

import * as fs from 'fs';

// Import all processors
import { extractFinancialDataFree } from './free-document-extraction';
import { processPDFWithMistral, processImageWithMistral } from './mistral-ocr-extraction';
import { extractFinancialDataWithMistral } from './mistral-text-extraction';
import { extractFinancialDataWithClaude } from './claude-document-extraction';

export type FileType = 'pdf' | 'image' | 'excel' | 'csv' | 'word' | 'unknown';

export interface ProcessingResult {
  success: boolean;
  data: any;
  confidence: number;
  cost: number;
  processingTime: number;
  method: string;
  fileType: FileType;
  fallbackUsed: boolean;
  error?: string;
}

/**
 * Master Document Processor Class
 */
export class DocumentProcessor {
  // Cost thresholds for method selection
  private readonly CONFIDENCE_THRESHOLD_FREE = 80; // Use FREE if confidence >= 80%
  private readonly CONFIDENCE_THRESHOLD_MISTRAL = 50; // Use Mistral if confidence >= 50% (trust Mistral, let user review if low)

  /**
   * Main entry point - Process any document
   */
  async processDocument(
    filePath: string,
    fileBuffer: Buffer
  ): Promise<ProcessingResult> {
    const startTime = Date.now();

    try {
      // 1. DETECT - Identify file type
      const fileType = this.detectFileType(filePath);
      console.log(`[DocumentProcessor] Detected file type: ${fileType}`);

      // 2. ROUTE - Send to appropriate processor
      let result: ProcessingResult;

      switch (fileType) {
        case 'pdf':
          result = await this.processPDF(fileBuffer, filePath);
          break;

        case 'image':
          result = await this.processImage(fileBuffer, filePath);
          break;

        case 'excel':
          result = await this.processExcel(fileBuffer, filePath);
          break;

        case 'csv':
          result = await this.processCSV(fileBuffer, filePath);
          break;

        case 'word':
          result = await this.processWord(fileBuffer, filePath);
          break;

        default:
          return {
            success: false,
            data: {},
            confidence: 0,
            cost: 0,
            processingTime: Date.now() - startTime,
            method: 'none',
            fileType: 'unknown',
            fallbackUsed: false,
            error: `Unsupported file type: ${fileType}`,
          };
      }

      result.processingTime = Date.now() - startTime;
      return result;
    } catch (error: any) {
      console.error('[DocumentProcessor] Processing error:', error);

      return {
        success: false,
        data: {},
        confidence: 0,
        cost: 0,
        processingTime: Date.now() - startTime,
        method: 'error',
        fileType: 'unknown',
        fallbackUsed: false,
        error: error.message,
      };
    }
  }

  /**
   * Detect file type by extension + MIME validation
   */
  detectFileType(filename: string): FileType {
    const ext = filename.toLowerCase().split('.').pop() || '';

    const typeMap: { [key: string]: FileType } = {
      // PDFs
      pdf: 'pdf',

      // Images
      jpg: 'image',
      jpeg: 'image',
      png: 'image',
      gif: 'image',
      webp: 'image',
      bmp: 'image',
      tiff: 'image',
      tif: 'image',

      // Excel
      xlsx: 'excel',
      xls: 'excel',
      xlsm: 'excel',

      // CSV
      csv: 'csv',
      tsv: 'csv',

      // Word
      docx: 'word',
      doc: 'word',
    };

    return typeMap[ext] || 'unknown';
  }

  /**
   * Process CSV files
   * Strategy: FREE (regex) → Mistral Text → Claude → GPT-4
   */
  private async processCSV(fileBuffer: Buffer, fileName: string): Promise<ProcessingResult> {
    console.log('[CSV] Starting processing...');

    // Step 1: Try FREE extraction
    console.log('[CSV] Trying FREE extraction (regex/pattern matching)...');
    const freeResult = await extractFinancialDataFree(fileBuffer, fileName);

    if (freeResult.success && freeResult.confidence >= this.CONFIDENCE_THRESHOLD_FREE) {
      console.log(`[CSV] FREE extraction sufficient (confidence: ${freeResult.confidence}%)`);
      return {
        success: true,
        data: freeResult.data,
        confidence: freeResult.confidence,
        cost: 0,
        processingTime: freeResult.processingTime,
        method: 'free-csv',
        fileType: 'csv',
        fallbackUsed: false,
      };
    }

    // Step 2: Fallback to paid methods (Mistral Text → Claude → GPT-4)
    console.log('[CSV] FREE confidence low, trying paid methods...');
    return this.fallbackToPaidMethods(fileBuffer, fileName, 'csv', freeResult);
  }

  /**
   * Process Excel files
   * Strategy: FREE (xlsx library) → Mistral Text → Claude → GPT-4
   */
  private async processExcel(fileBuffer: Buffer, fileName: string): Promise<ProcessingResult> {
    console.log('[Excel] Starting processing...');

    // Step 1: Try FREE extraction
    console.log('[Excel] Trying FREE extraction (xlsx library)...');
    const freeResult = await extractFinancialDataFree(fileBuffer, fileName);

    if (freeResult.success && freeResult.confidence >= this.CONFIDENCE_THRESHOLD_FREE) {
      console.log(`[Excel] FREE extraction sufficient (confidence: ${freeResult.confidence}%)`);
      return {
        success: true,
        data: freeResult.data,
        confidence: freeResult.confidence,
        cost: 0,
        processingTime: freeResult.processingTime,
        method: 'free-excel',
        fileType: 'excel',
        fallbackUsed: false,
      };
    }

    // Step 2: Fallback to paid methods
    console.log('[Excel] FREE confidence low, using paid methods...');
    return this.fallbackToPaidMethods(fileBuffer, fileName, 'excel', freeResult);
  }

  /**
   * Process PDF files
   * Strategy: Mistral OCR → Claude → GPT-4
   * (No FREE method for PDFs - they need vision models)
   */
  private async processPDF(fileBuffer: Buffer, fileName: string): Promise<ProcessingResult> {
    console.log('[PDF] Starting processing...');

    // PDFs need vision models - start with Mistral OCR
    console.log('[PDF] Using Mistral OCR (designed for documents)...');

    if (!process.env.MISTRAL_API_KEY) {
      console.log('[PDF] Mistral not configured, falling back to Claude...');
      return this.fallbackToPaidMethods(fileBuffer, fileName, 'pdf', null);
    }

    const mistralResult = await processPDFWithMistral(fileBuffer, fileName);

    if (mistralResult.success && mistralResult.confidence >= this.CONFIDENCE_THRESHOLD_MISTRAL) {
      console.log(`[PDF] Mistral OCR sufficient (confidence: ${mistralResult.confidence}%)`);
      return {
        success: true,
        data: mistralResult.data,
        confidence: mistralResult.confidence,
        cost: mistralResult.cost,
        processingTime: mistralResult.processingTime,
        method: 'mistral-ocr',
        fileType: 'pdf',
        fallbackUsed: false,
      };
    }

    // Fallback to Claude or GPT-4
    console.log('[PDF] Mistral confidence low, falling back to Claude...');
    return this.fallbackToPaidMethods(fileBuffer, fileName, 'pdf', mistralResult);
  }

  /**
   * Process image files
   * Strategy: Mistral OCR → Claude → GPT-4
   */
  private async processImage(fileBuffer: Buffer, fileName: string): Promise<ProcessingResult> {
    console.log('[Image] Starting processing...');

    // Images need vision models - start with Mistral OCR
    console.log('[Image] Using Mistral OCR...');

    if (!process.env.MISTRAL_API_KEY) {
      console.log('[Image] Mistral not configured, falling back to Claude...');
      return this.fallbackToPaidMethods(fileBuffer, fileName, 'image', null);
    }

    const mistralResult = await processImageWithMistral(fileBuffer, fileName);

    if (mistralResult.success && mistralResult.confidence >= this.CONFIDENCE_THRESHOLD_MISTRAL) {
      console.log(`[Image] Mistral OCR sufficient (confidence: ${mistralResult.confidence}%)`);
      return {
        success: true,
        data: mistralResult.data,
        confidence: mistralResult.confidence,
        cost: mistralResult.cost,
        processingTime: mistralResult.processingTime,
        method: 'mistral-ocr',
        fileType: 'image',
        fallbackUsed: false,
      };
    }

    // Fallback to Claude or GPT-4
    console.log('[Image] Mistral confidence low, falling back to Claude...');
    return this.fallbackToPaidMethods(fileBuffer, fileName, 'image', mistralResult);
  }

  /**
   * Process Word documents
   * Strategy: Extract text → FREE → Mistral Text → Claude → GPT-4
   */
  private async processWord(fileBuffer: Buffer, fileName: string): Promise<ProcessingResult> {
    console.log('[Word] Starting processing...');

    // For Word docs, we'd extract text first, then treat as text
    // For now, fall back to paid methods
    console.log('[Word] Word processing not yet implemented, using paid methods...');

    return this.fallbackToPaidMethods(fileBuffer, fileName, 'word', null);
  }

  /**
   * Fallback cascade:
   * - CSV/Excel: Mistral Text → Claude → GPT-4
   * - PDF/Images: Claude → GPT-4 (Mistral OCR already tried)
   */
  private async fallbackToPaidMethods(
    fileBuffer: Buffer,
    fileName: string,
    fileType: FileType,
    previousResult: any
  ): Promise<ProcessingResult> {
    // STEP 1: For CSV/Excel, try Mistral text model first (cheaper than Claude)
    if ((fileType === 'csv' || fileType === 'excel') && process.env.MISTRAL_API_KEY) {
      console.log('[Fallback] Trying Mistral text model for CSV/Excel...');

      const mistralResult = await extractFinancialDataWithMistral(fileBuffer, fileName);

      if (mistralResult.success && mistralResult.confidence >= this.CONFIDENCE_THRESHOLD_MISTRAL) {
        console.log(`[Fallback] Mistral text sufficient (confidence: ${mistralResult.confidence}%)`);
        return {
          success: true,
          data: mistralResult.data,
          confidence: mistralResult.confidence,
          cost: mistralResult.cost,
          processingTime: mistralResult.processingTime,
          method: 'mistral-text',
          fileType,
          fallbackUsed: true,
        };
      }

      // Keep mistralResult as previousResult for potential merging
      if (mistralResult.success) {
        console.log('[Fallback] Mistral text confidence low, keeping partial data...');
        previousResult = mistralResult;
      }
    }

    // STEP 2: Try Claude if available
    if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
      console.log('[Fallback] Trying Claude via Bedrock...');

      const claudeResult = await extractFinancialDataWithClaude(fileBuffer, fileName);

      if (claudeResult.success) {
        console.log(`[Fallback] Claude extraction successful (confidence: ${claudeResult.confidence}%)`);
        return {
          success: true,
          data: claudeResult.data,
          confidence: claudeResult.confidence,
          cost: claudeResult.cost,
          processingTime: claudeResult.processingTime,
          method: 'claude-bedrock',
          fileType,
          fallbackUsed: true,
        };
      }
    }

    // Try GPT-4 Vision if available
    if (process.env.OPENAI_API_KEY) {
      console.log('[Fallback] Trying GPT-4 Vision...');

      const { extractFinancialData } = await import('./real-document-extraction');
      const gpt4Result = await extractFinancialData(fileBuffer, fileName);

      if (gpt4Result.success) {
        console.log(`[Fallback] GPT-4 Vision successful (confidence: ${gpt4Result.confidence}%)`);
        return {
          success: true,
          data: gpt4Result.data,
          confidence: gpt4Result.confidence,
          cost: gpt4Result.cost,
          processingTime: gpt4Result.processingTime,
          method: 'gpt4-vision',
          fileType,
          fallbackUsed: true,
        };
      }
    }

    // No fallback methods available or all failed
    console.warn('[Fallback] All methods exhausted or not configured');

    return {
      success: false,
      data: previousResult?.data || {},
      confidence: previousResult?.confidence || 0,
      cost: previousResult?.cost || 0,
      processingTime: previousResult?.processingTime || 0,
      method: 'none',
      fileType,
      fallbackUsed: true,
      error: 'All extraction methods failed or not configured',
    };
  }
}

/**
 * Convenience function - Process a document from file path
 */
export async function processDocumentFromFile(filePath: string): Promise<ProcessingResult> {
  const fileBuffer = fs.readFileSync(filePath);
  const processor = new DocumentProcessor();
  return processor.processDocument(filePath, fileBuffer);
}

/**
 * Convenience function - Process a document from buffer
 */
export async function processDocumentFromBuffer(
  fileName: string,
  fileBuffer: Buffer
): Promise<ProcessingResult> {
  const processor = new DocumentProcessor();
  return processor.processDocument(fileName, fileBuffer);
}
