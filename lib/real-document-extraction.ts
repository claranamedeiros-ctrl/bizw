/**
 * REAL Document Extraction using OpenAI GPT-4
 * This actually calls the OpenAI API - not a simulation
 */

import OpenAI from 'openai';
import * as XLSX from 'xlsx';
import * as pdfjsLib from 'pdfjs-dist';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface FinancialData {
  // Company Info
  companyName?: string;
  fiscalYear?: string;
  currency?: string;

  // Profit & Loss
  revenue?: number;
  costOfGoodsSold?: number;
  grossProfit?: number;
  operatingExpenses?: number;
  ebitda?: number;
  netIncome?: number;

  // Balance Sheet
  totalAssets?: number;
  currentAssets?: number;
  fixedAssets?: number;
  totalLiabilities?: number;
  currentLiabilities?: number;
  equity?: number;

  // Cash Flow
  operatingCashFlow?: number;
  investingCashFlow?: number;
  financingCashFlow?: number;
  netCashChange?: number;
}

export interface ExtractionResult {
  success: boolean;
  data: Partial<FinancialData>;
  confidence: number;
  validationErrors: string[];
  extractionMethod: 'csv' | 'excel' | 'pdf-text' | 'pdf-vision' | 'word';
  cost: number; // USD
  processingTime: number; // milliseconds
  fieldsExtracted: string[];
  error?: string;
}

/**
 * Main entry point - detects file type and routes to appropriate parser
 */
export async function extractFinancialData(
  fileBuffer: Buffer,
  fileName: string,
  documentType?: 'profit-loss' | 'balance-sheet' | 'cashflow' | 'general'
): Promise<ExtractionResult> {
  const startTime = Date.now();

  try {
    // Detect file type from extension
    const ext = fileName.split('.').pop()?.toLowerCase();

    switch (ext) {
      case 'csv':
        return await extractFromCSV(fileBuffer, startTime, documentType);

      case 'xlsx':
      case 'xls':
        return await extractFromExcel(fileBuffer, startTime, documentType);

      case 'pdf':
        return await extractFromPDF(fileBuffer, startTime, documentType);

      case 'docx':
      case 'doc':
        return await extractFromWord(fileBuffer, startTime, documentType);

      default:
        return {
          success: false,
          data: {},
          confidence: 0,
          validationErrors: [`Unsupported file type: ${ext}`],
          extractionMethod: 'csv',
          cost: 0,
          processingTime: Date.now() - startTime,
          fieldsExtracted: [],
          error: `Unsupported file type: ${ext}`,
        };
    }
  } catch (error: any) {
    return {
      success: false,
      data: {},
      confidence: 0,
      validationErrors: [error.message],
      extractionMethod: 'csv',
      cost: 0,
      processingTime: Date.now() - startTime,
      fieldsExtracted: [],
      error: error.message || 'Unknown error',
    };
  }
}

/**
 * Extract data from CSV file
 */
async function extractFromCSV(
  fileBuffer: Buffer,
  startTime: number,
  documentType?: string
): Promise<ExtractionResult> {
  try {
    // Parse CSV to text
    const csvText = fileBuffer.toString('utf-8');

    // Use GPT-4 to extract structured data
    const extraction = await extractWithGPT4(csvText, 'CSV', documentType);

    return {
      ...extraction,
      extractionMethod: 'csv',
      processingTime: Date.now() - startTime,
    };
  } catch (error: any) {
    return {
      success: false,
      data: {},
      confidence: 0,
      validationErrors: [error.message],
      extractionMethod: 'csv',
      cost: 0,
      processingTime: Date.now() - startTime,
      fieldsExtracted: [],
      error: error.message,
    };
  }
}

/**
 * Extract data from Excel file
 */
async function extractFromExcel(
  fileBuffer: Buffer,
  startTime: number,
  documentType?: string
): Promise<ExtractionResult> {
  try {
    // Parse Excel file
    const workbook = XLSX.read(fileBuffer, { type: 'buffer' });

    // Get first sheet (or find sheet with financial data)
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    // Convert to CSV for easier parsing
    const csvText = XLSX.utils.sheet_to_csv(worksheet);

    // Use GPT-4 to extract structured data
    const extraction = await extractWithGPT4(csvText, 'Excel', documentType);

    return {
      ...extraction,
      extractionMethod: 'excel',
      processingTime: Date.now() - startTime,
    };
  } catch (error: any) {
    return {
      success: false,
      data: {},
      confidence: 0,
      validationErrors: [error.message],
      extractionMethod: 'excel',
      cost: 0,
      processingTime: Date.now() - startTime,
      fieldsExtracted: [],
      error: error.message,
    };
  }
}

/**
 * Extract data from PDF file
 */
async function extractFromPDF(
  fileBuffer: Buffer,
  startTime: number,
  documentType?: string
): Promise<ExtractionResult> {
  try {
    // Try extracting text from PDF first (cheaper)
    console.log('[PDF Extraction] Attempting text extraction...');

    const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(fileBuffer) });
    const pdfDoc = await loadingTask.promise;

    let fullText = '';
    const maxPages = Math.min(pdfDoc.numPages, 5); // Only process first 5 pages

    for (let i = 1; i <= maxPages; i++) {
      const page = await pdfDoc.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((item: any) => item.str).join(' ');
      fullText += pageText + '\n\n';
    }

    console.log(`[PDF Extraction] Extracted ${fullText.length} characters of text`);

    // If we got good text (>100 chars), use GPT-4 text
    if (fullText.length > 100) {
      const extraction = await extractWithGPT4(fullText, 'PDF', documentType);

      // If confidence is high, return
      if (extraction.confidence >= 70) {
        return {
          ...extraction,
          extractionMethod: 'pdf-text',
          processingTime: Date.now() - startTime,
        };
      }
    }

    // If text extraction failed or low confidence, use GPT-4 Vision
    console.log('[PDF Extraction] Text extraction insufficient, using GPT-4 Vision...');

    // For POC, we'll skip GPT-4 Vision (requires image conversion)
    // In production, you would convert PDF to images and send to GPT-4 Vision

    return {
      success: false,
      data: {},
      confidence: 0,
      validationErrors: ['PDF Vision extraction not implemented in POC'],
      extractionMethod: 'pdf-text',
      cost: 0.02,
      processingTime: Date.now() - startTime,
      fieldsExtracted: [],
      error: 'PDF Vision extraction requires additional implementation',
    };
  } catch (error: any) {
    return {
      success: false,
      data: {},
      confidence: 0,
      validationErrors: [error.message],
      extractionMethod: 'pdf-text',
      cost: 0,
      processingTime: Date.now() - startTime,
      fieldsExtracted: [],
      error: error.message,
    };
  }
}

/**
 * Extract data from Word document
 */
async function extractFromWord(
  fileBuffer: Buffer,
  startTime: number,
  documentType?: string
): Promise<ExtractionResult> {
  // For POC, Word extraction is not implemented
  // In production, you would use mammoth.js or docx to extract text

  return {
    success: false,
    data: {},
    confidence: 0,
    validationErrors: ['Word document extraction not implemented in POC'],
    extractionMethod: 'word',
    cost: 0,
    processingTime: Date.now() - startTime,
    fieldsExtracted: [],
    error: 'Word extraction requires mammoth.js implementation',
  };
}

/**
 * Use GPT-4 to extract structured financial data from text
 */
async function extractWithGPT4(
  text: string,
  sourceType: string,
  documentType?: string
): Promise<Omit<ExtractionResult, 'processingTime' | 'extractionMethod'>> {
  try {
    console.log(`[GPT-4 Extraction] Processing ${text.length} characters from ${sourceType}...`);

    // Create extraction prompt
    const systemPrompt = `You are a financial data extraction expert. Extract structured financial data from the provided text.

Return ONLY a valid JSON object with these fields (omit fields if not found):
{
  "companyName": string,
  "fiscalYear": string,
  "currency": string (e.g., "USD"),
  "revenue": number,
  "costOfGoodsSold": number,
  "grossProfit": number,
  "operatingExpenses": number,
  "ebitda": number,
  "netIncome": number,
  "totalAssets": number,
  "currentAssets": number,
  "fixedAssets": number,
  "totalLiabilities": number,
  "currentLiabilities": number,
  "equity": number,
  "operatingCashFlow": number,
  "investingCashFlow": number,
  "financingCashFlow": number,
  "netCashChange": number
}

Rules:
- Extract ONLY numbers (no currency symbols, commas, or text)
- Be conservative - only extract values you're confident about
- Handle different terminologies:
  * Revenue = Sales = Total Revenue = Turnover
  * COGS = Cost of Goods Sold = Cost of Sales
  * Net Income = Net Profit = Bottom Line = Net Earnings
  * Assets = Total Assets
  * Liabilities = Total Liabilities
  * Equity = Shareholders Equity = Owners Equity
- If a value appears in parentheses like "(1234)", it's negative: -1234`;

    const userPrompt = `Extract financial data from this ${sourceType}:\n\n${text.slice(0, 8000)}`; // Limit to 8K chars

    // Call GPT-4 Turbo
    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.1, // Low temperature for consistency
      max_tokens: 1000,
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0].message.content || '{}';
    console.log('[GPT-4 Extraction] Response:', content);

    // Parse JSON response
    const extractedData: Partial<FinancialData> = JSON.parse(content);

    // Calculate cost (GPT-4 Turbo pricing: $0.01/1K input, $0.03/1K output)
    const inputTokens = response.usage?.prompt_tokens || 0;
    const outputTokens = response.usage?.completion_tokens || 0;
    const cost = (inputTokens / 1000) * 0.01 + (outputTokens / 1000) * 0.03;

    // Get fields extracted
    const fieldsExtracted = Object.keys(extractedData).filter(
      (key) => extractedData[key as keyof FinancialData] !== undefined
    );

    // Calculate confidence based on number of fields extracted
    const confidence = Math.min(100, fieldsExtracted.length * 8); // 8 points per field, max 100

    // Validate data
    const validationErrors = validateFinancialData(extractedData);

    // Adjust confidence based on validation errors
    const adjustedConfidence = Math.max(
      0,
      confidence - validationErrors.length * 10
    );

    return {
      success: fieldsExtracted.length > 0,
      data: extractedData,
      confidence: adjustedConfidence,
      validationErrors,
      cost,
      fieldsExtracted,
    };
  } catch (error: any) {
    console.error('[GPT-4 Extraction] Error:', error.message);

    return {
      success: false,
      data: {},
      confidence: 0,
      validationErrors: [error.message],
      cost: 0,
      fieldsExtracted: [],
      error: error.message,
    };
  }
}

/**
 * Validate extracted financial data
 */
function validateFinancialData(data: Partial<FinancialData>): string[] {
  const errors: string[] = [];

  // P&L Validations
  if (data.revenue !== undefined && data.costOfGoodsSold !== undefined && data.grossProfit !== undefined) {
    const calculatedGrossProfit = data.revenue - data.costOfGoodsSold;
    const diff = Math.abs(data.grossProfit - calculatedGrossProfit);
    const tolerance = data.revenue * 0.02; // 2% tolerance

    if (diff > tolerance) {
      errors.push(
        `Gross Profit validation failed: ${data.grossProfit} ≠ ${data.revenue} - ${data.costOfGoodsSold}`
      );
    }
  }

  // Balance Sheet Validation
  if (
    data.totalAssets !== undefined &&
    data.totalLiabilities !== undefined &&
    data.equity !== undefined
  ) {
    const sum = data.totalLiabilities + data.equity;
    const diff = Math.abs(data.totalAssets - sum);
    const tolerance = data.totalAssets * 0.02; // 2% tolerance

    if (diff > tolerance) {
      errors.push(
        `Accounting equation failed: Assets (${data.totalAssets}) ≠ Liabilities (${data.totalLiabilities}) + Equity (${data.equity})`
      );
    }
  }

  // Current Assets should be <= Total Assets
  if (
    data.currentAssets !== undefined &&
    data.totalAssets !== undefined &&
    data.currentAssets > data.totalAssets
  ) {
    errors.push('Current Assets cannot exceed Total Assets');
  }

  // Cash Flow Validation
  if (
    data.operatingCashFlow !== undefined &&
    data.investingCashFlow !== undefined &&
    data.financingCashFlow !== undefined &&
    data.netCashChange !== undefined
  ) {
    const sum = data.operatingCashFlow + data.investingCashFlow + data.financingCashFlow;
    const diff = Math.abs(data.netCashChange - sum);
    const tolerance = Math.abs(data.netCashChange) * 0.02;

    if (diff > tolerance) {
      errors.push('Cash Flow reconciliation failed');
    }
  }

  // Reasonableness checks
  if (data.revenue !== undefined && data.revenue < 0) {
    errors.push('Revenue should typically be positive');
  }

  if (
    data.revenue !== undefined &&
    data.costOfGoodsSold !== undefined &&
    data.costOfGoodsSold > data.revenue * 2
  ) {
    errors.push('COGS is more than 2x revenue, which is unusual');
  }

  return errors;
}

/**
 * Map extracted data to form fields
 * Returns field mapping with confidence scores
 */
export function mapToFormFields(
  extractedData: Partial<FinancialData>
): Array<{
  fieldName: string;
  value: any;
  confidence: number;
  dataType: string;
}> {
  const mappings: Array<{
    fieldName: string;
    value: any;
    confidence: number;
    dataType: string;
  }> = [];

  // Map each extracted field
  for (const [key, value] of Object.entries(extractedData)) {
    if (value === undefined || value === null) continue;

    // Determine confidence based on data type and value
    let confidence = 80; // Base confidence

    // String fields get lower confidence
    if (typeof value === 'string') {
      confidence = 70;
    }

    // Numbers get validation
    if (typeof value === 'number') {
      // Check for reasonable values
      if (value < 0 && !key.includes('Loss') && !key.includes('Expense')) {
        confidence = 50; // Suspicious negative value
      }
      if (value > 1e12) {
        confidence = 50; // Unreasonably large number
      }
    }

    mappings.push({
      fieldName: key,
      value,
      confidence,
      dataType: typeof value,
    });
  }

  return mappings;
}
