import { NextRequest, NextResponse } from 'next/server';
import { extractDocument, getDocumentScenario } from '@/lib/document-extraction';

/**
 * POST /api/extract/document
 * Extract financial data from uploaded documents
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const documentType = formData.get('documentType') as string;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!documentType || !['profit-loss', 'balance-sheet', 'cashflow', 'csv', 'other'].includes(documentType)) {
      return NextResponse.json({ error: 'Invalid document type' }, { status: 400 });
    }

    // Get file size
    const fileSize = file.size;
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (fileSize > maxSize) {
      return NextResponse.json(
        { error: 'File size exceeds 10MB limit' },
        { status: 400 }
      );
    }

    // Check file type
    const allowedTypes = ['application/pdf', 'text/csv', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only PDF, CSV, and DOCX files are supported.' },
        { status: 400 }
      );
    }

    // Get document scenario (for demo purposes)
    const scenario = getDocumentScenario(file.name);

    // Extract document data
    const result = await extractDocument(
      file.name,
      documentType as any,
      ['pdf-parse', 'gpt4-vision']
    );

    return NextResponse.json({
      success: true,
      result,
      scenario,
      message: result.requiresManualReview
        ? 'Extraction completed but requires manual review due to low confidence or validation errors'
        : 'Extraction completed successfully',
    });
  } catch (error) {
    console.error('Document extraction error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error during document extraction',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
