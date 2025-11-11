import { NextRequest, NextResponse } from 'next/server';
import { DocumentProcessor } from '@/lib/document-processor';
import { calculateFinancialFields, validateFinancialData } from '@/lib/financial-data-types';

/**
 * POST /api/extract/document-real
 * Real document extraction using the master router
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // File size limit
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size exceeds 50MB limit' },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const fileBuffer = Buffer.from(arrayBuffer);

    // Use DocumentProcessor (the master router!)
    const processor = new DocumentProcessor();
    const result = await processor.processDocument(file.name, fileBuffer);

    // If extraction successful, apply calculations and validations
    let calculations: any[] = [];
    let validations: any[] = [];
    let finalData = result.data;

    if (result.success && result.data) {
      // Apply automatic calculations (Gross Profit, Total Assets, etc.)
      const calculated = calculateFinancialFields(result.data);
      finalData = calculated.data;
      calculations = calculated.calculations;

      console.log(`[API] Applied ${calculations.length} automatic calculations`);

      // Validate accounting rules (Assets = Liabilities + Equity, etc.)
      validations = validateFinancialData(finalData);

      const errors = validations.filter(v => !v.passed && v.severity === 'error');
      const warnings = validations.filter(v => !v.passed && v.severity === 'warning');

      console.log(`[API] Validation results: ${errors.length} errors, ${warnings.length} warnings`);
    }

    // Format response for UI
    return NextResponse.json({
      success: result.success,
      fileType: result.fileType,
      fileName: file.name,
      fileSize: file.size,
      method: result.method,
      fallbackUsed: result.fallbackUsed,
      confidence: result.confidence,
      cost: result.cost,
      processingTime: result.processingTime,
      data: finalData,
      error: result.error,

      // Calculations applied
      calculations,

      // Validations performed
      validations,

      // For UI display
      routing: {
        detected: result.fileType,
        strategy: getStrategyDescription(result.fileType, result.method),
        whyThisMethod: getMethodReasoning(result.fileType, result.method, result.fallbackUsed),
      },
    });
  } catch (error: any) {
    console.error('[API] Document extraction error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error during document extraction',
        message: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * Get human-readable strategy description
 */
function getStrategyDescription(fileType: string, method: string): string {
  const strategies: { [key: string]: string } = {
    'csv': 'FREE Text Parsing',
    'excel': 'FREE Excel Library',
    'pdf': method.includes('mistral') ? 'Mistral OCR/Text' : 'Vision Model',
    'image': 'Mistral OCR',
    'word': 'Text Extraction + LLM',
  };

  return strategies[fileType] || 'Unknown';
}

/**
 * Explain why this method was chosen
 */
function getMethodReasoning(fileType: string, method: string, fallbackUsed: boolean): string {
  if (method === 'free-csv' || method === 'free-excel') {
    return `CSV/Excel are structured text - no AI needed! Parsed directly for $0.`;
  }

  if (method === 'mistral-ocr') {
    if (fileType === 'pdf') {
      return `Text PDF detected - extracted text and processed with Mistral text model ($0.0001). Much cheaper than vision models!`;
    }
    return `Image file - using Mistral vision model for OCR ($0.001/page). 100× cheaper than GPT-4 Vision.`;
  }

  if (method === 'claude-bedrock') {
    if (fallbackUsed) {
      return `Primary method had low confidence. Fell back to Claude Vision for validation ($0.004). Better safe than sorry!`;
    }
    return `Using Claude Vision via AWS Bedrock ($0.004). Good balance of accuracy and cost.`;
  }

  if (method === 'gpt4-vision') {
    return `Most expensive option ($0.30) but highest accuracy. Used for complex/scanned documents.`;
  }

  return `Method: ${method}`;
}
