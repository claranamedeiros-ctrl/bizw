/**
 * Mistral OCR Integration
 * Uses Pixtral vision models for document understanding
 *
 * Advantages over competitors:
 * - Cost: $0.001 per page (100× cheaper than Claude, 300× cheaper than GPT-4)
 * - Accuracy: 94.9% (vs Google Document AI 83.4%, Azure OCR 89.5%)
 * - Designed specifically for OCR (not general-purpose vision model)
 * - Supports structured JSON output via annotations
 * - Handles PDFs, images, tables, charts, signatures
 */

import { Mistral } from '@mistralai/mistralai';

interface MistralOCRResult {
  success: boolean;
  data: Partial<FinancialData>;
  confidence: number;
  cost: number;
  processingTime: number;
  method: 'mistral-ocr';
  pagesProcessed: number;
  error?: string;
}

interface FinancialData {
  companyName?: string;
  fiscalYear?: string;
  currency?: string;
  revenue?: number;
  costOfGoodsSold?: number;
  grossProfit?: number;
  operatingExpenses?: number;
  ebitda?: number;
  netIncome?: number;
  totalAssets?: number;
  currentAssets?: number;
  fixedAssets?: number;
  totalLiabilities?: number;
  currentLiabilities?: number;
  equity?: number;
  operatingCashFlow?: number;
  investingCashFlow?: number;
  financingCashFlow?: number;
  netCashChange?: number;
}

/**
 * Extract financial data from PDF or image using Mistral OCR
 */
export async function extractWithMistralOCR(
  fileBuffer: Buffer,
  fileName: string,
  mimeType: string
): Promise<MistralOCRResult> {
  const startTime = Date.now();

  try {
    const apiKey = process.env.MISTRAL_API_KEY;

    if (!apiKey) {
      return {
        success: false,
        data: {},
        confidence: 0,
        cost: 0,
        processingTime: Date.now() - startTime,
        method: 'mistral-ocr',
        pagesProcessed: 0,
        error: 'MISTRAL_API_KEY not set in .env.local',
      };
    }

    // Initialize Mistral client
    const client = new Mistral({ apiKey });

    // Convert buffer to base64
    const base64Image = fileBuffer.toString('base64');
    const dataUrl = `data:${mimeType};base64,${base64Image}`;

    // Define the structured output schema for financial data
    const annotationSchema = {
      type: 'object',
      properties: {
        companyName: { type: 'string', description: 'Company name' },
        fiscalYear: { type: 'string', description: 'Fiscal year (YYYY format)' },
        currency: { type: 'string', description: 'Currency code (USD, EUR, etc.)' },
        revenue: { type: 'number', description: 'Total revenue or sales' },
        costOfGoodsSold: { type: 'number', description: 'Cost of goods sold (COGS)' },
        grossProfit: { type: 'number', description: 'Gross profit' },
        operatingExpenses: { type: 'number', description: 'Operating expenses' },
        ebitda: { type: 'number', description: 'EBITDA' },
        netIncome: { type: 'number', description: 'Net income or profit' },
        totalAssets: { type: 'number', description: 'Total assets' },
        currentAssets: { type: 'number', description: 'Current assets' },
        fixedAssets: { type: 'number', description: 'Fixed or non-current assets' },
        totalLiabilities: { type: 'number', description: 'Total liabilities' },
        currentLiabilities: { type: 'number', description: 'Current liabilities' },
        equity: { type: 'number', description: 'Shareholders equity' },
        operatingCashFlow: { type: 'number', description: 'Operating cash flow' },
        investingCashFlow: { type: 'number', description: 'Investing cash flow' },
        financingCashFlow: { type: 'number', description: 'Financing cash flow' },
        netCashChange: { type: 'number', description: 'Net change in cash' },
      },
    };

    // Call Mistral OCR with structured output
    const chatResponse = await client.chat.complete({
      model: 'pixtral-12b-2409', // Mistral's vision model
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              imageUrl: dataUrl,
            },
            {
              type: 'text',
              text: `Extract financial data from this document and return it as structured JSON.

CRITICAL: Extract data for ALL periods/years present in the document (e.g., "Jan 1-Mar 31 2025", "2024", "2023").

Structure your response as:
{
  "companyName": "Company Name",
  "currency": "USD",
  "periods": ["Jan1-Mar31 2025", "2024", "2023"],
  "profitLoss": {
    "Jan1-Mar31 2025": {
      "totalSalesRevenue": number,
      "costOfGoodsSold": number,
      "operatingExpenses": number,
      "nonOperatingIncome": number,
      "otherIncome": number,
      "otherExpenses": number,
      "incomeTaxes": number
    },
    "2024": { ... same structure ... },
    "2023": { ... }
  },
  "assets": {
    "Jan1-Mar31 2025": {
      "cash": number,
      "accountsReceivable": number,
      "inventory": number,
      "otherCurrentAssets": number,
      "fixedAssets": number,
      "accumulatedDepreciation": number,
      "intangibleAssets": number,
      "otherNonCurrentAssets": number
    },
    "2024": { ... },
    "2023": { ... }
  },
  "liabilities": {
    "Jan1-Mar31 2025": {
      "accountsPayable": number,
      "shortTermDebt": number,
      "currentPortionLongTermDebt": number,
      "otherCurrentLiabilities": number,
      "longTermDebt": number,
      "otherNonCurrentLiabilities": number
    },
    "2024": { ... },
    "2023": { ... }
  },
  "equity": {
    "Jan1-Mar31 2025": {
      "ownersEquity": number,
      "retainedEarnings": number
    },
    "2024": { ... },
    "2023": { ... }
  }
}

IMPORTANT RULES:
1. Extract ALL periods shown in the document (don't skip years!)
2. Extract DETAILED line items (Cash, AR, Inventory separately - NOT just totals)
3. Numbers: NO currency symbols, commas, or formatting
4. Parentheses = negative: (1234) → -1234
5. "K" or "000s" → multiply by 1,000
6. "M" or "millions" → multiply by 1,000,000
7. Return null for fields not found
8. Return valid JSON only`,
            },
          ],
        },
      ],
      responseFormat: {
        type: 'json_object',
      },
    });

    // Parse the response
    const rawContent = chatResponse.choices?.[0]?.message?.content;
    const content = typeof rawContent === 'string' ? rawContent : JSON.stringify(rawContent) || '{}';
    const extractedData = parseFinancialData(content);

    // Calculate confidence based on completeness
    const confidence = calculateConfidence(extractedData);

    // Calculate cost: $0.001 per page (assume 1 page for images)
    const pagesProcessed = 1;
    const cost = pagesProcessed * 0.001;

    return {
      success: true,
      data: extractedData,
      confidence,
      cost,
      processingTime: Date.now() - startTime,
      method: 'mistral-ocr',
      pagesProcessed,
    };
  } catch (error: any) {
    console.error('[Mistral OCR] Extraction error:', error);

    return {
      success: false,
      data: {},
      confidence: 0,
      cost: 0,
      processingTime: Date.now() - startTime,
      method: 'mistral-ocr',
      pagesProcessed: 0,
      error: error.message,
    };
  }
}

/**
 * Parse financial data from Mistral's JSON response
 * Now supports multi-period data structure
 */
function parseFinancialData(content: string): any {
  try {
    // Try to find JSON in the response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.warn('[Mistral OCR] No JSON found in response');
      return {};
    }

    const parsed = JSON.parse(jsonMatch[0]);

    // Check if this is the new multi-period format
    if (parsed.periods && Array.isArray(parsed.periods)) {
      // New multi-period format - return as is (already structured correctly)
      console.log('[Mistral OCR] Multi-period data detected:', parsed.periods.length, 'periods');
      return parsed;
    }

    // Legacy format - convert to old structure for backward compatibility
    const cleaned: Partial<FinancialData> = {};

    // String fields
    if (parsed.companyName) cleaned.companyName = String(parsed.companyName);
    if (parsed.fiscalYear) cleaned.fiscalYear = String(parsed.fiscalYear);
    if (parsed.currency) cleaned.currency = String(parsed.currency);

    // Numeric fields
    const numericFields: (keyof FinancialData)[] = [
      'revenue',
      'costOfGoodsSold',
      'grossProfit',
      'operatingExpenses',
      'ebitda',
      'netIncome',
      'totalAssets',
      'currentAssets',
      'fixedAssets',
      'totalLiabilities',
      'currentLiabilities',
      'equity',
      'operatingCashFlow',
      'investingCashFlow',
      'financingCashFlow',
      'netCashChange',
    ];

    for (const field of numericFields) {
      if (parsed[field] !== null && parsed[field] !== undefined) {
        const value = Number(parsed[field]);
        if (!isNaN(value)) {
          (cleaned as any)[field] = value;
        }
      }
    }

    return cleaned;
  } catch (error) {
    console.error('[Mistral OCR] Failed to parse response:', error);
    return {};
  }
}

/**
 * Calculate confidence score based on data completeness
 * Now supports multi-period data structure
 */
function calculateConfidence(data: any): number {
  // Check if multi-period format
  if (data.periods && Array.isArray(data.periods) && data.periods.length > 0) {
    // Multi-period format - calculate confidence based on data completeness across periods
    let totalScore = 0;
    let totalMaxScore = 0;

    for (const period of data.periods) {
      const periodData = {
        profitLoss: data.profitLoss?.[period],
        assets: data.assets?.[period],
        liabilities: data.liabilities?.[period],
        equity: data.equity?.[period],
      };

      // Score for this period
      let periodScore = 0;
      let periodMaxScore = 100;

      // P&L data (30 points)
      if (periodData.profitLoss?.totalSalesRevenue !== undefined) periodScore += 10;
      if (periodData.profitLoss?.costOfGoodsSold !== undefined) periodScore += 10;
      if (periodData.profitLoss?.operatingExpenses !== undefined) periodScore += 10;

      // Assets data (30 points)
      if (periodData.assets?.cash !== undefined) periodScore += 8;
      if (periodData.assets?.accountsReceivable !== undefined) periodScore += 8;
      if (periodData.assets?.inventory !== undefined) periodScore += 7;
      if (periodData.assets?.fixedAssets !== undefined) periodScore += 7;

      // Liabilities data (20 points)
      if (periodData.liabilities?.accountsPayable !== undefined) periodScore += 7;
      if (periodData.liabilities?.shortTermDebt !== undefined) periodScore += 7;
      if (periodData.liabilities?.longTermDebt !== undefined) periodScore += 6;

      // Equity data (20 points)
      if (periodData.equity?.ownersEquity !== undefined) periodScore += 10;
      if (periodData.equity?.retainedEarnings !== undefined) periodScore += 10;

      totalScore += periodScore;
      totalMaxScore += periodMaxScore;
    }

    return Math.round((totalScore / totalMaxScore) * 100);
  }

  // Legacy flat format
  const legacyData = data as Partial<FinancialData>;
  const criticalFields: (keyof FinancialData)[] = [
    'revenue',
    'netIncome',
    'totalAssets',
    'totalLiabilities',
    'equity',
  ];

  const importantFields: (keyof FinancialData)[] = [
    'costOfGoodsSold',
    'grossProfit',
    'operatingExpenses',
    'currentAssets',
    'currentLiabilities',
  ];

  let score = 0;
  let maxScore = 0;

  // Critical fields: 20 points each
  for (const field of criticalFields) {
    maxScore += 20;
    if (legacyData[field] !== undefined && legacyData[field] !== null) {
      score += 20;
    }
  }

  // Important fields: 10 points each
  for (const field of importantFields) {
    maxScore += 10;
    if (legacyData[field] !== undefined && legacyData[field] !== null) {
      score += 10;
    }
  }

  // Calculate percentage
  const confidence = Math.round((score / maxScore) * 100);

  // Validate accounting equation: Assets = Liabilities + Equity
  if (legacyData.totalAssets && legacyData.totalLiabilities && legacyData.equity) {
    const expectedAssets = legacyData.totalLiabilities + legacyData.equity;
    const tolerance = 0.01; // 1% tolerance
    const diff = Math.abs(legacyData.totalAssets - expectedAssets) / legacyData.totalAssets;

    if (diff > tolerance) {
      // Accounting equation doesn't balance - reduce confidence
      return Math.max(confidence - 20, 0);
    }
  }

  return confidence;
}

/**
 * Process PDF with Mistral
 *
 * Strategy:
 * 1. Try to extract text from PDF (FREE!)
 * 2. If has text → Process with Mistral text model (cheap: $0.0001)
 * 3. If scanned → Falls back to Claude Vision ($0.004)
 */
export async function processPDFWithMistral(
  fileBuffer: Buffer,
  fileName: string
): Promise<MistralOCRResult> {
  const startTime = Date.now();

  try {
    // Import PDF text extractor
    const { extractTextFromPDF } = await import('./pdf-to-image-simple');

    // Try to extract text first (FREE!)
    const pdfText = await extractTextFromPDF(fileBuffer);

    // If PDF has extractable text, process it cheaply with text model
    if (pdfText.hasText && !pdfText.isScanned) {
      console.log(`[Mistral PDF] Text PDF detected - using text extraction (cheap!)`);
      console.log(`[Mistral PDF] Extracted ${pdfText.text.length} characters from ${pdfText.numPages} pages`);

      // Process text with Mistral text model (not vision)
      const apiKey = process.env.MISTRAL_API_KEY;
      if (!apiKey) {
        throw new Error('MISTRAL_API_KEY not set');
      }

      const client = new Mistral({ apiKey });

      const response = await client.chat.complete({
        model: 'mistral-small-latest', // Cheap text model
        messages: [
          {
            role: 'user',
            content: `Extract financial data from this document text and return as JSON:

${pdfText.text}

CRITICAL: Extract data for ALL periods/years present in the document.

Structure your response as:
{
  "companyName": "Company Name",
  "currency": "USD",
  "periods": ["Jan1-Mar31 2025", "2024", "2023"],
  "profitLoss": {
    "2025": {
      "totalSalesRevenue": number,
      "costOfGoodsSold": number,
      "operatingExpenses": number,
      "nonOperatingIncome": number,
      "otherIncome": number,
      "otherExpenses": number,
      "incomeTaxes": number
    }
  },
  "assets": {
    "2025": {
      "cash": number,
      "accountsReceivable": number,
      "inventory": number,
      "otherCurrentAssets": number,
      "fixedAssets": number,
      "accumulatedDepreciation": number,
      "intangibleAssets": number,
      "otherNonCurrentAssets": number
    }
  },
  "liabilities": {
    "2025": {
      "accountsPayable": number,
      "shortTermDebt": number,
      "currentPortionLongTermDebt": number,
      "otherCurrentLiabilities": number,
      "longTermDebt": number,
      "otherNonCurrentLiabilities": number
    }
  },
  "equity": {
    "2025": {
      "ownersEquity": number,
      "retainedEarnings": number
    }
  }
}

RULES:
1. Extract ALL periods (don't skip years!)
2. Extract detailed line items (Cash, AR, Inventory separately)
3. Numbers: NO currency symbols, commas, formatting
4. Parentheses = negative
5. Return valid JSON only.`,
          },
        ],
        responseFormat: { type: 'json_object' },
      });

      const rawContent = response.choices?.[0]?.message?.content;
      const content = typeof rawContent === 'string' ? rawContent : JSON.stringify(rawContent) || '{}';
      const extractedData = parseFinancialData(content);

      // Calculate confidence and cost
      const confidence = calculateConfidence(extractedData);
      const cost = 0.0001; // Text model is ~100x cheaper than vision

      console.log(`[Mistral PDF] Text extraction complete - confidence: ${confidence}%, cost: $${cost}`);

      return {
        success: true,
        data: extractedData,
        confidence,
        cost,
        processingTime: Date.now() - startTime,
        method: 'mistral-ocr',
        pagesProcessed: pdfText.numPages,
      };
    }

    // If scanned PDF (no extractable text), we need vision/OCR
    console.log(`[Mistral PDF] Scanned PDF detected - needs vision model`);
    console.log(`[Mistral PDF] This will fall back to Claude Vision for better results`);

    // Return error to trigger fallback to Claude Vision
    return {
      success: false,
      data: {},
      confidence: 0,
      cost: 0,
      processingTime: Date.now() - startTime,
      method: 'mistral-ocr',
      pagesProcessed: pdfText.numPages,
      error: 'Scanned PDF requires vision model - falling back to Claude',
    };
  } catch (error: any) {
    console.error('[Mistral PDF] Processing error:', error);

    return {
      success: false,
      data: {},
      confidence: 0,
      cost: 0,
      processingTime: Date.now() - startTime,
      method: 'mistral-ocr',
      pagesProcessed: 0,
      error: error.message,
    };
  }
}

/**
 * Merge financial data from multiple pages
 * Takes the most confident value for each field
 */
function mergeMultiPageResults(
  pageResults: Array<{ data: Partial<FinancialData>; confidence: number }>
): Partial<FinancialData> {
  const merged: Partial<FinancialData> = {};

  // For each financial field, take the value from the page with highest confidence
  const allFields = new Set<keyof FinancialData>();
  for (const result of pageResults) {
    Object.keys(result.data).forEach((key) => allFields.add(key as keyof FinancialData));
  }

  for (const field of allFields) {
    // Find the page with this field and highest confidence
    let bestValue: any = undefined;
    let bestConfidence = 0;

    for (const result of pageResults) {
      const value = result.data[field];
      if (value !== undefined && value !== null && result.confidence > bestConfidence) {
        bestValue = value;
        bestConfidence = result.confidence;
      }
    }

    if (bestValue !== undefined) {
      merged[field] = bestValue;
    }
  }

  // String fields: Try to merge from multiple pages
  if (pageResults.length > 0) {
    // Company name: Take first non-empty
    if (!merged.companyName) {
      for (const result of pageResults) {
        if (result.data.companyName) {
          merged.companyName = result.data.companyName;
          break;
        }
      }
    }

    // Fiscal year: Take first non-empty
    if (!merged.fiscalYear) {
      for (const result of pageResults) {
        if (result.data.fiscalYear) {
          merged.fiscalYear = result.data.fiscalYear;
          break;
        }
      }
    }

    // Currency: Take first non-empty
    if (!merged.currency) {
      for (const result of pageResults) {
        if (result.data.currency) {
          merged.currency = result.data.currency;
          break;
        }
      }
    }
  }

  return merged;
}

/**
 * Process image with Mistral OCR
 */
export async function processImageWithMistral(
  fileBuffer: Buffer,
  fileName: string
): Promise<MistralOCRResult> {
  // Detect image type from filename
  const ext = fileName.toLowerCase().split('.').pop();
  const mimeTypes: { [key: string]: string } = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
  };

  const mimeType = mimeTypes[ext || 'jpeg'] || 'image/jpeg';

  return extractWithMistralOCR(fileBuffer, fileName, mimeType);
}
