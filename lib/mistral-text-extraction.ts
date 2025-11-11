/**
 * Mistral Text-Based Financial Extraction
 * Uses Mistral's text/chat models for CSV/Excel extraction
 *
 * Advantages:
 * - Cost: ~$0.0001 per document (100× cheaper than Claude, 3000× cheaper than GPT-4)
 * - Speed: Fast text-only processing
 * - Good for structured CSV/Excel data that doesn't need OCR
 * - Fallback between FREE and Claude/GPT-4
 */

import { Mistral } from '@mistralai/mistralai';

export interface MistralExtractionResult {
  success: boolean;
  data: any;
  confidence: number;
  cost: number;
  processingTime: number;
  method: 'mistral-text';
  tokensUsed?: {
    input: number;
    output: number;
  };
  error?: string;
}

/**
 * Extract financial data from CSV/Excel using Mistral text model
 */
export async function extractFinancialDataWithMistral(
  fileBuffer: Buffer,
  fileName: string
): Promise<MistralExtractionResult> {
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
        method: 'mistral-text',
        error: 'MISTRAL_API_KEY not set',
      };
    }

    // Step 1: Convert file to text
    const { text, sourceType } = await fileToText(fileBuffer, fileName);

    // Limit text size (Mistral has token limits)
    const maxChars = 50000;
    let processedText = text;
    if (text.length > maxChars) {
      console.warn(`[Mistral] Text too long (${text.length} chars), truncating to ${maxChars}`);
      processedText = text.substring(0, maxChars);
    }

    // Step 2: Build extraction prompt (reuse Claude's approach)
    const prompt = buildMistralExtractionPrompt(processedText, sourceType);

    // Step 3: Call Mistral API
    const client = new Mistral({ apiKey });

    const response = await client.chat.complete({
      model: process.env.MISTRAL_TEXT_MODEL || 'mistral-large-latest',
      temperature: 0.1,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    // Step 4: Parse response
    const rawContent = response.choices?.[0]?.message?.content || '';
    const content = typeof rawContent === 'string' ? rawContent : JSON.stringify(rawContent);
    const extractedData = parseMistralResponse(content);

    // Step 5: Calculate confidence
    const confidence = calculateMistralConfidence(extractedData);

    // Step 6: Calculate cost (Mistral Large: $2/M input, $6/M output)
    // TODO: Get actual token usage from response when available
    const inputTokens = response.usage?.promptTokens || 0;
    const outputTokens = response.usage?.completionTokens || 0;
    const cost = (inputTokens / 1_000_000) * 2 + (outputTokens / 1_000_000) * 6;

    console.log(`[Mistral] Text extraction complete - confidence: ${confidence}%, cost: $${cost.toFixed(4)}`);

    return {
      success: true,
      data: extractedData,
      confidence,
      cost,
      processingTime: Date.now() - startTime,
      method: 'mistral-text',
      tokensUsed: {
        input: inputTokens,
        output: outputTokens,
      },
    };
  } catch (error: any) {
    console.error('[Mistral] Extraction error:', error);

    return {
      success: false,
      data: {},
      confidence: 0,
      cost: 0,
      processingTime: Date.now() - startTime,
      method: 'mistral-text',
      error: error.message,
    };
  }
}

/**
 * Convert file buffer to text
 */
async function fileToText(
  fileBuffer: Buffer,
  fileName: string
): Promise<{ text: string; sourceType: 'csv' | 'excel' | 'pdf' | 'unknown' }> {
  const ext = fileName.split('.').pop()?.toLowerCase();

  // CSV
  if (ext === 'csv') {
    return {
      text: fileBuffer.toString('utf-8'),
      sourceType: 'csv',
    };
  }

  // Excel
  if (ext === 'xlsx' || ext === 'xls') {
    const XLSX = require('xlsx');
    const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const csvText = XLSX.utils.sheet_to_csv(workbook.Sheets[sheetName]);
    return {
      text: csvText,
      sourceType: 'excel',
    };
  }

  // PDF (optional - extract text)
  if (ext === 'pdf') {
    try {
      const pdf = require('pdf-parse');
      const data = await pdf(fileBuffer);
      return {
        text: data.text,
        sourceType: 'pdf',
      };
    } catch (error) {
      console.error('[Mistral] PDF text extraction failed:', error);
      return {
        text: '',
        sourceType: 'pdf',
      };
    }
  }

  // Fallback
  return {
    text: fileBuffer.toString('utf-8'),
    sourceType: 'unknown',
  };
}

/**
 * Build extraction prompt (same structure as Claude)
 */
function buildMistralExtractionPrompt(text: string, sourceType: string): string {
  return `You are a financial data extraction expert. Extract financial data from the following ${sourceType} document and return it as valid JSON.

Document content:
${text}

CRITICAL: Extract data for ALL periods/years present in the document (e.g., "Jan 1-Mar 31 2025", "2024", "2023").

Structure your response exactly as:
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
2. Extract DETAILED line items (Cash, AR, Inventory separately - NOT just "Total Current Assets")
3. Numbers: NO currency symbols, commas, or formatting
4. Parentheses = negative: (1234) → -1234
5. "K" or "000s" → multiply by 1,000
6. "M" or "millions" → multiply by 1,000,000
7. Return null for fields not found in the document
8. Return valid JSON only, no explanations`;
}

/**
 * Parse Mistral's JSON response (same logic as Claude)
 */
function parseMistralResponse(content: string): any {
  try {
    // Try to find JSON in the response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.warn('[Mistral] No JSON found in response');
      return {};
    }

    const parsed = JSON.parse(jsonMatch[0]);

    // Check if this is the multi-period format
    if (parsed.periods && Array.isArray(parsed.periods)) {
      console.log('[Mistral] Multi-period data detected:', parsed.periods.length, 'periods');
      return parsed;
    }

    // Legacy format - return as is
    return parsed;
  } catch (error) {
    console.error('[Mistral] Failed to parse response:', error);
    return {};
  }
}

/**
 * Calculate confidence score based on data completeness (same logic as Claude)
 */
function calculateMistralConfidence(data: any): number {
  // Check if multi-period format
  if (data.periods && Array.isArray(data.periods) && data.periods.length > 0) {
    let totalScore = 0;
    let totalMaxScore = 0;

    for (const period of data.periods) {
      // Check P&L fields
      if (data.profitLoss?.[period]) {
        const pl = data.profitLoss[period];
        const plFields = [
          'totalSalesRevenue',
          'costOfGoodsSold',
          'operatingExpenses',
          'incomeTaxes',
        ];
        plFields.forEach((field) => {
          if (pl[field] !== null && pl[field] !== undefined) totalScore += 10;
          totalMaxScore += 10;
        });
      } else {
        totalMaxScore += 40; // 4 fields × 10
      }

      // Check Asset fields
      if (data.assets?.[period]) {
        const assets = data.assets[period];
        const assetFields = ['cash', 'accountsReceivable', 'inventory', 'fixedAssets'];
        assetFields.forEach((field) => {
          if (assets[field] !== null && assets[field] !== undefined) totalScore += 5;
          totalMaxScore += 5;
        });
      } else {
        totalMaxScore += 20; // 4 fields × 5
      }

      // Check Liability fields
      if (data.liabilities?.[period]) {
        const liabilities = data.liabilities[period];
        const liabFields = ['accountsPayable', 'shortTermDebt', 'longTermDebt'];
        liabFields.forEach((field) => {
          if (liabilities[field] !== null && liabilities[field] !== undefined)
            totalScore += 5;
          totalMaxScore += 5;
        });
      } else {
        totalMaxScore += 15; // 3 fields × 5
      }

      // Check Equity fields
      if (data.equity?.[period]) {
        const equity = data.equity[period];
        if (equity.ownersEquity !== null && equity.ownersEquity !== undefined) totalScore += 5;
        totalMaxScore += 5;
      } else {
        totalMaxScore += 5;
      }
    }

    const confidence = totalMaxScore > 0 ? Math.round((totalScore / totalMaxScore) * 100) : 0;
    console.log(
      `[Mistral] Confidence calculation: ${totalScore}/${totalMaxScore} = ${confidence}%`
    );
    return confidence;
  }

  // Legacy format - basic confidence
  let score = 0;
  const criticalFields = ['revenue', 'totalAssets', 'equity', 'netIncome'];
  criticalFields.forEach((field) => {
    if (data[field] !== null && data[field] !== undefined) score += 25;
  });

  return score;
}
