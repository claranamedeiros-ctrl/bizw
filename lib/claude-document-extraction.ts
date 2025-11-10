/**
 * Claude (via AWS Bedrock) Document Extraction
 * Alternative to OpenAI GPT-4 Vision
 *
 * Advantages:
 * - Similar accuracy to GPT-4
 * - Better privacy (AWS infrastructure)
 * - Lower latency in some regions
 * - Cost: ~$0.015 per document (cheaper than GPT-4 Vision)
 */

import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';

interface ClaudeExtractionResult {
  success: boolean;
  data: Partial<FinancialData>;
  confidence: number;
  cost: number;
  processingTime: number;
  method: 'claude-bedrock';
  tokensUsed: {
    input: number;
    output: number;
  };
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
 * Extract financial data using Claude via AWS Bedrock
 */
export async function extractWithClaude(
  text: string,
  sourceType: 'csv' | 'excel' | 'pdf' | 'unknown'
): Promise<ClaudeExtractionResult> {
  const startTime = Date.now();

  try {
    // Initialize Bedrock client
    const client = new BedrockRuntimeClient({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    });

    const prompt = buildExtractionPrompt(text, sourceType);

    // Invoke Claude via Bedrock
    const command = new InvokeModelCommand({
      modelId: process.env.BEDROCK_MODEL_ID || 'anthropic.claude-3-sonnet-20240229-v1:0',
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify({
        anthropic_version: 'bedrock-2023-05-31',
        max_tokens: 2000,
        temperature: 0.1,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      }),
    });

    const response = await client.send(command);
    const responseBody = JSON.parse(new TextDecoder().decode(response.body));

    // Parse Claude's response
    const content = responseBody.content[0].text;
    const extractedData = parseClaudeResponse(content);

    // Calculate cost (Claude Sonnet: $3/M input, $15/M output)
    const inputTokens = responseBody.usage.input_tokens;
    const outputTokens = responseBody.usage.output_tokens;
    const cost = (inputTokens / 1_000_000) * 3 + (outputTokens / 1_000_000) * 15;

    // Calculate confidence based on data completeness
    const confidence = calculateConfidence(extractedData);

    return {
      success: true,
      data: extractedData,
      confidence,
      cost,
      processingTime: Date.now() - startTime,
      method: 'claude-bedrock',
      tokensUsed: {
        input: inputTokens,
        output: outputTokens,
      },
    };
  } catch (error: any) {
    console.error('[Claude] Extraction error:', error);

    return {
      success: false,
      data: {},
      confidence: 0,
      cost: 0,
      processingTime: Date.now() - startTime,
      method: 'claude-bedrock',
      tokensUsed: { input: 0, output: 0 },
      error: error.message,
    };
  }
}

/**
 * Build extraction prompt for Claude
 */
function buildExtractionPrompt(text: string, sourceType: string): string {
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
 * Parse Claude's JSON response
 * Now supports multi-period data structure
 */
function parseClaudeResponse(content: string): any {
  try {
    // Try to find JSON in the response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.warn('[Claude] No JSON found in response');
      return {};
    }

    const parsed = JSON.parse(jsonMatch[0]);

    // Check if this is the new multi-period format
    if (parsed.periods && Array.isArray(parsed.periods)) {
      // New multi-period format - return as is (already structured correctly)
      console.log('[Claude] Multi-period data detected:', parsed.periods.length, 'periods');
      return parsed;
    }

    // Legacy format - convert to old structure for backward compatibility
    const cleaned: Partial<FinancialData> = {};

    // String fields
    if (parsed.companyName) cleaned.companyName = String(parsed.companyName);
    if (parsed.fiscalYear) cleaned.fiscalYear = String(parsed.fiscalYear);
    if (parsed.currency) cleaned.currency = String(parsed.currency);

    // Numeric fields
    const numericFields = [
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
    console.error('[Claude] Failed to parse response:', error);
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
  const criticalFields = [
    'revenue',
    'netIncome',
    'totalAssets',
    'totalLiabilities',
    'equity',
  ];

  const importantFields = [
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
    if ((legacyData as any)[field] !== undefined && (legacyData as any)[field] !== null) {
      score += 20;
    }
  }

  // Important fields: 10 points each
  for (const field of importantFields) {
    maxScore += 10;
    if ((legacyData as any)[field] !== undefined && (legacyData as any)[field] !== null) {
      score += 10;
    }
  }

  // Calculate percentage
  const confidence = Math.round((score / maxScore) * 100);

  // Validate accounting equation: Assets = Liabilities + Equity
  if (
    legacyData.totalAssets &&
    legacyData.totalLiabilities &&
    legacyData.equity
  ) {
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
 * Extract from file buffer (wrapper for different file types)
 */
export async function extractFinancialDataWithClaude(
  fileBuffer: Buffer,
  fileName: string
): Promise<ClaudeExtractionResult> {
  const startTime = Date.now();

  try {
    // Determine file type
    const ext = fileName.split('.').pop()?.toLowerCase();
    let text = '';
    let sourceType: 'csv' | 'excel' | 'pdf' | 'unknown' = 'unknown';

    if (ext === 'csv') {
      text = fileBuffer.toString('utf-8');
      sourceType = 'csv';
    } else if (ext === 'xlsx' || ext === 'xls') {
      const XLSX = require('xlsx');
      const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      text = XLSX.utils.sheet_to_csv(workbook.Sheets[sheetName]);
      sourceType = 'excel';
    } else if (ext === 'pdf') {
      const pdf = require('pdf-parse');
      const data = await pdf(fileBuffer);
      text = data.text;
      sourceType = 'pdf';
    } else {
      text = fileBuffer.toString('utf-8');
    }

    // Limit text size (Claude has token limits)
    const maxChars = 50000;
    if (text.length > maxChars) {
      console.warn(`[Claude] Text too long (${text.length} chars), truncating to ${maxChars}`);
      text = text.substring(0, maxChars);
    }

    return await extractWithClaude(text, sourceType);
  } catch (error: any) {
    console.error('[Claude] File processing error:', error);

    return {
      success: false,
      data: {},
      confidence: 0,
      cost: 0,
      processingTime: Date.now() - startTime,
      method: 'claude-bedrock',
      tokensUsed: { input: 0, output: 0 },
      error: error.message,
    };
  }
}
