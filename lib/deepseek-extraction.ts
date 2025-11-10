/**
 * DeepSeek OCR Integration
 * Uses DeepSeek's compression-first approach for document extraction
 *
 * Key advantages:
 * - 10× cheaper than GPT-4 Vision ($0.03 vs $0.30)
 * - 10× faster (<1s vs 5-10s)
 * - 97.2% fidelity with structure preservation
 * - Compresses to 100-200 tokens (vs 10,000+ traditional)
 */

// NOTE: DeepSeek OCR is not yet publicly available as API
// This is a placeholder implementation showing how it would work

export interface DeepSeekExtractionResult {
  success: boolean;
  data: Partial<FinancialData>;
  confidence: number;
  compressionTokens: number; // How many tokens it compressed to
  originalTokens: number;    // Estimated original token count
  compressionRatio: number;  // How much compression achieved
  cost: number;              // USD
  processingTime: number;    // milliseconds
  method: 'deepseek-ocr';
  preservedStructure: {
    tables: number;
    headings: number;
    paragraphs: number;
  };
  error?: string;
}

export interface FinancialData {
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
 * DeepSeek OCR extraction (API version)
 * This would be the implementation if DeepSeek provides an API
 */
export async function extractWithDeepSeekAPI(
  fileBuffer: Buffer,
  fileName: string
): Promise<DeepSeekExtractionResult> {
  const startTime = Date.now();

  // NOTE: This is a PLACEHOLDER - DeepSeek API details TBD
  // Check: https://github.com/deepseek-ai for updates

  try {
    // Hypothetical API call structure
    const apiKey = process.env.DEEPSEEK_API_KEY;

    if (!apiKey) {
      return {
        success: false,
        data: {},
        confidence: 0,
        compressionTokens: 0,
        originalTokens: 0,
        compressionRatio: 0,
        cost: 0,
        processingTime: Date.now() - startTime,
        method: 'deepseek-ocr',
        preservedStructure: { tables: 0, headings: 0, paragraphs: 0 },
        error: 'DEEPSEEK_API_KEY not set. DeepSeek OCR not yet publicly available.'
      };
    }

    // Hypothetical API endpoint (commented out - API doesn't exist yet)
    // const response = await fetch('https://api.deepseek.com/v1/ocr', {
    //   method: 'POST',
    //   headers: {
    //     'Authorization': `Bearer ${apiKey}`,
    //     'Content-Type': 'application/pdf'
    //   },
    //   body: fileBuffer
    // });
    // const result = await response.json();

    // Return error since API doesn't exist yet
    throw new Error('DeepSeek OCR API is not yet publicly available. Use Claude or self-host Qwen2-VL instead.');

    // Below code is unreachable - would be used if API existed:
    // const extractedData = parseDeepSeekOutput(result.compressed_tokens);
    // return { success: true, data: extractedData, ... }

  } catch (error: any) {
    return {
      success: false,
      data: {},
      confidence: 0,
      compressionTokens: 0,
      originalTokens: 0,
      compressionRatio: 0,
      cost: 0,
      processingTime: Date.now() - startTime,
      method: 'deepseek-ocr',
      preservedStructure: { tables: 0, headings: 0, paragraphs: 0 },
      error: error.message
    };
  }
}

/**
 * DeepSeek OCR extraction (Self-hosted version)
 * This would run the model locally for complete privacy
 */
export async function extractWithDeepSeekLocal(
  fileBuffer: Buffer,
  fileName: string
): Promise<DeepSeekExtractionResult> {
  const startTime = Date.now();

  try {
    // This would use a local DeepSeek model
    // Requires:
    // 1. Download DeepSeek-VL model weights
    // 2. Setup Python environment with transformers
    // 3. Run inference locally

    // For now, return placeholder
    return {
      success: false,
      data: {},
      confidence: 0,
      compressionTokens: 0,
      originalTokens: 0,
      compressionRatio: 0,
      cost: 0, // Local = free after setup
      processingTime: Date.now() - startTime,
      method: 'deepseek-ocr',
      preservedStructure: { tables: 0, headings: 0, paragraphs: 0 },
      error: 'Self-hosted DeepSeek not yet implemented. Requires model download and Python setup.'
    };

  } catch (error: any) {
    return {
      success: false,
      data: {},
      confidence: 0,
      compressionTokens: 0,
      originalTokens: 0,
      compressionRatio: 0,
      cost: 0,
      processingTime: Date.now() - startTime,
      method: 'deepseek-ocr',
      preservedStructure: { tables: 0, headings: 0, paragraphs: 0 },
      error: error.message
    };
  }
}

/**
 * Parse DeepSeek compressed output
 * DeepSeek returns compressed visual tokens that need decoding
 */
function parseDeepSeekOutput(compressedTokens: any): Partial<FinancialData> {
  // This would parse DeepSeek's compressed representation
  // The actual format depends on DeepSeek's API spec

  // Placeholder implementation
  return {
    revenue: undefined,
    netIncome: undefined
  };
}

/**
 * Smart extraction pipeline: FREE → Claude → GPT-4
 * Tries methods in order of cost efficiency
 *
 * Note: DeepSeek OCR is not yet available. Using Claude via Bedrock instead.
 */
export async function smartExtraction(
  fileBuffer: Buffer,
  fileName: string
): Promise<{
  method: 'free' | 'claude' | 'deepseek' | 'gpt4';
  result: any;
  cost: number;
  confidence: number;
}> {

  // Step 1: Try FREE extraction (regex/parsing)
  const { extractFinancialDataFree } = await import('./free-document-extraction');
  const freeResult = await extractFinancialDataFree(fileBuffer, fileName);

  if (freeResult.confidence >= 80 && freeResult.success) {
    console.log('[Smart] FREE extraction sufficient (confidence: ' + freeResult.confidence + '%)');
    return {
      method: 'free',
      result: freeResult,
      cost: 0,
      confidence: freeResult.confidence
    };
  }

  // Step 2: Try Claude (if AWS credentials available)
  if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
    console.log('[Smart] Trying Claude via Bedrock...');
    const { extractFinancialDataWithClaude } = await import('./claude-document-extraction');
    const claudeResult = await extractFinancialDataWithClaude(fileBuffer, fileName);

    if (claudeResult.success && claudeResult.confidence >= 70) {
      console.log('[Smart] Claude extraction sufficient (confidence: ' + claudeResult.confidence + '%)');
      return {
        method: 'claude',
        result: claudeResult,
        cost: claudeResult.cost,
        confidence: claudeResult.confidence
      };
    }
  }

  // Step 2b: Try DeepSeek (if available - currently not public)
  const deepseekResult = await extractWithDeepSeekAPI(fileBuffer, fileName);

  if (deepseekResult.success && deepseekResult.confidence >= 70) {
    console.log('[Smart] DeepSeek extraction sufficient (confidence: ' + deepseekResult.confidence + '%)');
    return {
      method: 'deepseek',
      result: deepseekResult,
      cost: deepseekResult.cost,
      confidence: deepseekResult.confidence
    };
  }

  // Step 3: Fallback to GPT-4 Vision (if OpenAI key available)
  if (process.env.OPENAI_API_KEY) {
    console.log('[Smart] Using GPT-4 Vision as fallback...');
    const { extractFinancialData } = await import('./real-document-extraction');
    const gpt4Result = await extractFinancialData(fileBuffer, fileName);

    return {
      method: 'gpt4',
      result: gpt4Result,
      cost: gpt4Result.cost,
      confidence: gpt4Result.confidence
    };
  }

  // No paid methods available
  console.warn('[Smart] No paid extraction methods configured, returning FREE result');
  return {
    method: 'free',
    result: freeResult,
    cost: 0,
    confidence: freeResult.confidence
  };
}

/**
 * Get extraction strategy recommendation
 */
export function recommendStrategy(
  fileType: string,
  documentQuality: 'clean' | 'average' | 'poor'
): 'free' | 'deepseek' | 'gpt4' {

  // CSV/Excel: Always use FREE
  if (fileType === 'csv' || fileType === 'xlsx') {
    return 'free';
  }

  // Clean PDFs: Try DeepSeek
  if (fileType === 'pdf' && documentQuality === 'clean') {
    return 'deepseek';
  }

  // Scanned/poor quality: Use GPT-4 Vision
  if (documentQuality === 'poor') {
    return 'gpt4';
  }

  // Default: DeepSeek for good balance
  return 'deepseek';
}
