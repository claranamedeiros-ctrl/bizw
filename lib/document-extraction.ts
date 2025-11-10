import { DocumentExtractionResult, ExtractionResult, FinancialData } from './types';
import { validateFinancialData, calculateConfidenceAdjustment } from './validation-rules';

/**
 * Document extraction using multiple AI strategies
 * This demonstrates the REALITY of AI extraction:
 * - Different accuracy rates for different document types
 * - Clear failure modes
 * - Validation to catch errors
 * - Realistic costs and processing times
 */

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Strategy 1: PDF Parsing with pdf-parse
 * Works well for text-based PDFs with clear structure
 */
async function extractWithPDFParse(
  fileName: string,
  documentType: string
): Promise<ExtractionResult[]> {
  const startTime = Date.now();
  await delay(1000 + Math.random() * 2000);

  // Simulate different accuracy based on document quality
  const quality = Math.random();
  let accuracy = 0.5;

  if (fileName.includes('clean') || fileName.includes('quickbooks')) {
    accuracy = 0.95; // Clean exports work great
  } else if (fileName.includes('scan')) {
    accuracy = 0.3; // Scanned docs are terrible
  } else {
    accuracy = 0.75; // Average case
  }

  const results: ExtractionResult[] = [];
  const extractionTime = Date.now() - startTime;

  // Simulate extracting key fields based on document type
  if (documentType === 'profit-loss') {
    results.push(
      {
        field: 'revenue',
        value: accuracy > 0.5 ? 1543565.29 : null,
        confidence: Math.round(accuracy * 100),
        source: 'regex',
        extractionTime,
        cost: 0.01,
      },
      {
        field: 'cogs',
        value: accuracy > 0.6 ? 774918.56 : null,
        confidence: Math.round(accuracy * 90),
        source: 'regex',
        extractionTime,
        cost: 0.01,
      },
      {
        field: 'grossProfit',
        value: accuracy > 0.5 ? 768646.73 : null,
        confidence: Math.round(accuracy * 85),
        source: 'regex',
        extractionTime,
        cost: 0.01,
      },
      {
        field: 'operatingExpenses',
        value: accuracy > 0.7 ? 293480.78 : null,
        confidence: Math.round(accuracy * 80),
        source: 'regex',
        extractionTime,
        cost: 0.01,
      },
      {
        field: 'ebitda',
        value: accuracy > 0.6 ? 498622.73 : null,
        confidence: Math.round(accuracy * 95),
        source: 'regex',
        extractionTime,
        cost: 0.01,
      },
      {
        field: 'netIncome',
        value: accuracy > 0.5 ? 340594.73 : null,
        confidence: Math.round(accuracy * 90),
        source: 'regex',
        extractionTime,
        cost: 0.01,
      }
    );
  } else if (documentType === 'balance-sheet') {
    results.push(
      {
        field: 'totalAssets',
        value: accuracy > 0.5 ? 1816147.46 : null,
        confidence: Math.round(accuracy * 100),
        source: 'regex',
        extractionTime,
        cost: 0.01,
      },
      {
        field: 'currentAssets',
        value: accuracy > 0.6 ? 780481.35 : null,
        confidence: Math.round(accuracy * 85),
        source: 'regex',
        extractionTime,
        cost: 0.01,
      },
      {
        field: 'fixedAssets',
        value: accuracy > 0.7 ? 821432.11 : null,
        confidence: Math.round(accuracy * 80),
        source: 'regex',
        extractionTime,
        cost: 0.01,
      },
      {
        field: 'totalLiabilities',
        value: accuracy > 0.6 ? 803390.9 : null,
        confidence: Math.round(accuracy * 90),
        source: 'regex',
        extractionTime,
        cost: 0.01,
      },
      {
        field: 'currentLiabilities',
        value: accuracy > 0.7 ? 300923.9 : null,
        confidence: Math.round(accuracy * 75),
        source: 'regex',
        extractionTime,
        cost: 0.01,
      },
      {
        field: 'equity',
        value: accuracy > 0.5 ? 1012756.56 : null,
        confidence: Math.round(accuracy * 95),
        source: 'regex',
        extractionTime,
        cost: 0.01,
      }
    );
  } else if (documentType === 'cashflow') {
    results.push(
      {
        field: 'operatingCashFlow',
        value: accuracy > 0.5 ? 285050.17 : null,
        confidence: Math.round(accuracy * 90),
        source: 'regex',
        extractionTime,
        cost: 0.01,
      },
      {
        field: 'investingCashFlow',
        value: accuracy > 0.6 ? -80000.0 : null,
        confidence: Math.round(accuracy * 75),
        source: 'regex',
        extractionTime,
        cost: 0.01,
      },
      {
        field: 'financingCashFlow',
        value: accuracy > 0.6 ? 25000.0 : null,
        confidence: Math.round(accuracy * 80),
        source: 'regex',
        extractionTime,
        cost: 0.01,
      },
      {
        field: 'netCashChange',
        value: accuracy > 0.5 ? 230050.17 : null,
        confidence: Math.round(accuracy * 95),
        source: 'regex',
        extractionTime,
        cost: 0.01,
      }
    );
  }

  return results;
}

/**
 * Strategy 2: GPT-4 Vision for complex documents
 * More expensive but handles complex layouts better
 */
async function extractWithGPT4Vision(
  fileName: string,
  documentType: string
): Promise<ExtractionResult[]> {
  const startTime = Date.now();
  await delay(3000 + Math.random() * 4000); // GPT-4 is slower

  const quality = Math.random();
  let accuracy = 0.6;

  if (fileName.includes('scan')) {
    accuracy = 0.4; // Still struggles with poor scans
  } else if (fileName.includes('complex')) {
    accuracy = 0.8; // Better at complex layouts
  } else {
    accuracy = 0.75;
  }

  const results: ExtractionResult[] = [];
  const extractionTime = Date.now() - startTime;

  // GPT-4 can extract more contextual information
  if (documentType === 'profit-loss') {
    results.push(
      {
        field: 'revenue',
        value: accuracy > 0.4 ? 1543565.29 : null,
        confidence: Math.round(accuracy * 100),
        source: 'gpt4-vision',
        extractionTime,
        cost: 0.35,
      },
      {
        field: 'cogs',
        value: accuracy > 0.5 ? 774918.56 : null,
        confidence: Math.round(accuracy * 95),
        source: 'gpt4-vision',
        extractionTime,
        cost: 0.35,
      },
      {
        field: 'grossProfit',
        value: accuracy > 0.4 ? 768646.73 : null,
        confidence: Math.round(accuracy * 90),
        source: 'gpt4-vision',
        extractionTime,
        cost: 0.35,
      },
      {
        field: 'operatingExpenses',
        value: accuracy > 0.5 ? 293480.78 : null,
        confidence: Math.round(accuracy * 85),
        source: 'gpt4-vision',
        extractionTime,
        cost: 0.35,
      },
      {
        field: 'ebitda',
        value: accuracy > 0.4 ? 498622.73 : null,
        confidence: Math.round(accuracy * 100),
        source: 'gpt4-vision',
        extractionTime,
        cost: 0.35,
      },
      {
        field: 'netIncome',
        value: accuracy > 0.4 ? 340594.73 : null,
        confidence: Math.round(accuracy * 95),
        source: 'gpt4-vision',
        extractionTime,
        cost: 0.35,
      }
    );
  } else if (documentType === 'balance-sheet') {
    results.push(
      {
        field: 'totalAssets',
        value: accuracy > 0.4 ? 1816147.46 : null,
        confidence: Math.round(accuracy * 100),
        source: 'gpt4-vision',
        extractionTime,
        cost: 0.35,
      },
      {
        field: 'currentAssets',
        value: accuracy > 0.5 ? 780481.35 : null,
        confidence: Math.round(accuracy * 90),
        source: 'gpt4-vision',
        extractionTime,
        cost: 0.35,
      },
      {
        field: 'fixedAssets',
        value: accuracy > 0.5 ? 821432.11 : null,
        confidence: Math.round(accuracy * 85),
        source: 'gpt4-vision',
        extractionTime,
        cost: 0.35,
      },
      {
        field: 'totalLiabilities',
        value: accuracy > 0.4 ? 803390.9 : null,
        confidence: Math.round(accuracy * 95),
        source: 'gpt4-vision',
        extractionTime,
        cost: 0.35,
      },
      {
        field: 'currentLiabilities',
        value: accuracy > 0.5 ? 300923.9 : null,
        confidence: Math.round(accuracy * 80),
        source: 'gpt4-vision',
        extractionTime,
        cost: 0.35,
      },
      {
        field: 'equity',
        value: accuracy > 0.4 ? 1012756.56 : null,
        confidence: Math.round(accuracy * 100),
        source: 'gpt4-vision',
        extractionTime,
        cost: 0.35,
      }
    );
  }

  return results;
}

/**
 * Strategy 3: AWS Textract simulation
 * Good for scanned documents
 */
async function extractWithTextract(
  fileName: string,
  documentType: string
): Promise<ExtractionResult[]> {
  const startTime = Date.now();
  await delay(2000 + Math.random() * 3000);

  const quality = Math.random();
  let accuracy = 0.65;

  if (fileName.includes('scan')) {
    accuracy = 0.7; // Better at OCR
  } else if (fileName.includes('handwritten')) {
    accuracy = 0.25; // Terrible at handwriting
  }

  const extractionTime = Date.now() - startTime;
  const results: ExtractionResult[] = [];

  // Textract returns structured data
  if (documentType === 'profit-loss') {
    results.push(
      {
        field: 'revenue',
        value: accuracy > 0.5 ? 1543565.29 : null,
        confidence: Math.round(accuracy * 95),
        source: 'textract',
        extractionTime,
        cost: 0.10,
      },
      {
        field: 'netIncome',
        value: accuracy > 0.5 ? 340594.73 : null,
        confidence: Math.round(accuracy * 85),
        source: 'textract',
        extractionTime,
        cost: 0.10,
      }
    );
  }

  return results;
}

/**
 * Main document extraction function
 * Combines multiple strategies and validates results
 */
export async function extractDocument(
  fileName: string,
  documentType: 'profit-loss' | 'balance-sheet' | 'cashflow' | 'csv' | 'other',
  strategies: ('pdf-parse' | 'gpt4-vision' | 'textract')[] = ['pdf-parse', 'gpt4-vision']
): Promise<DocumentExtractionResult> {
  const documentId = Math.random().toString(36).substring(7);
  const allResults: ExtractionResult[] = [];

  // Run all strategies
  for (const strategy of strategies) {
    let results: ExtractionResult[] = [];

    switch (strategy) {
      case 'pdf-parse':
        results = await extractWithPDFParse(fileName, documentType);
        break;
      case 'gpt4-vision':
        results = await extractWithGPT4Vision(fileName, documentType);
        break;
      case 'textract':
        results = await extractWithTextract(fileName, documentType);
        break;
    }

    allResults.push(...results);
  }

  // Merge duplicate fields (take highest confidence)
  const mergedResults = mergeExtractionResults(allResults);

  // Convert to FinancialData for validation
  const financialData: Partial<FinancialData> = {};
  mergedResults.forEach((result) => {
    if (result.value !== null) {
      financialData[result.field as keyof FinancialData] = result.value as number;
    }
  });

  // Validate the extracted data
  const validationErrors = validateFinancialData(financialData);

  // Adjust confidence based on validation
  const confidenceAdjustment = calculateConfidenceAdjustment(validationErrors);
  const adjustedResults = mergedResults.map((r) => ({
    ...r,
    confidence: Math.max(0, Math.min(100, r.confidence + confidenceAdjustment)),
  }));

  // Calculate overall metrics
  const overallConfidence =
    adjustedResults.reduce((sum, r) => sum + r.confidence, 0) / adjustedResults.length;
  const extractionTime = allResults.reduce((sum, r) => sum + (r.extractionTime || 0), 0);
  const totalCost = allResults.reduce((sum, r) => sum + (r.cost || 0), 0);

  // Determine if manual review is needed
  const requiresManualReview =
    overallConfidence < 70 || validationErrors.some((e) => e.severity === 'error');

  return {
    documentId,
    documentType,
    fileName,
    extractedFields: adjustedResults,
    validationErrors,
    overallConfidence: Math.round(overallConfidence),
    extractionTime,
    totalCost,
    requiresManualReview,
  };
}

/**
 * Merge extraction results from multiple sources
 * Takes highest confidence value for each field
 */
function mergeExtractionResults(results: ExtractionResult[]): ExtractionResult[] {
  const fieldMap = new Map<string, ExtractionResult>();

  results.forEach((result) => {
    const existing = fieldMap.get(result.field);

    if (!existing || result.confidence > existing.confidence) {
      fieldMap.set(result.field, result);
    }
  });

  return Array.from(fieldMap.values());
}

/**
 * Simulate processing of different document types
 * Returns realistic scenarios based on document quality
 */
export function getDocumentScenario(fileName: string): {
  expectedAccuracy: number;
  description: string;
  challenges: string[];
} {
  if (fileName.includes('quickbooks') || fileName.includes('clean')) {
    return {
      expectedAccuracy: 95,
      description: 'Clean QuickBooks export',
      challenges: ['Minimal - well-structured data', 'Clear labels and formatting'],
    };
  }

  if (fileName.includes('scan') || fileName.includes('poor')) {
    return {
      expectedAccuracy: 40,
      description: 'Poor quality scan or handwritten',
      challenges: [
        'OCR errors',
        'Unclear text',
        'Inconsistent formatting',
        'Requires significant manual review',
      ],
    };
  }

  return {
    expectedAccuracy: 75,
    description: 'Typical PDF financial statement',
    challenges: [
      'Inconsistent number formats',
      'Mixed terminology',
      'Subtotals that confuse parsers',
      'Some manual review needed',
    ],
  };
}
