import { NextRequest, NextResponse } from 'next/server';
import { extractLogo, selectBestLogo, calculateLogoExtractionStats } from '@/lib/logo-extraction';

/**
 * POST /api/extract/logo
 * Extract logo from a website URL using multiple strategies
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url, strategies } = body;

    // Validate URL
    if (!url || typeof url !== 'string') {
      return NextResponse.json(
        { error: 'Invalid URL provided' },
        { status: 400 }
      );
    }

    // Validate URL format
    try {
      new URL(url);
    } catch (e) {
      return NextResponse.json(
        { error: 'Invalid URL format. Please provide a valid HTTP/HTTPS URL' },
        { status: 400 }
      );
    }

    // Extract logos using all strategies
    const results = await extractLogo(url, strategies);
    const bestResult = selectBestLogo(results);
    const stats = calculateLogoExtractionStats(results);

    return NextResponse.json({
      success: bestResult.logoUrl !== null,
      bestResult,
      allResults: results,
      stats,
    });
  } catch (error) {
    console.error('Logo extraction error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error during logo extraction',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/extract/logo?url=...
 * Quick logo extraction with default settings
 */
export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url');

  if (!url) {
    return NextResponse.json(
      { error: 'URL parameter is required' },
      { status: 400 }
    );
  }

  try {
    new URL(url);
  } catch (e) {
    return NextResponse.json(
      { error: 'Invalid URL format' },
      { status: 400 }
    );
  }

  const results = await extractLogo(url);
  const bestResult = selectBestLogo(results);

  return NextResponse.json({
    success: bestResult.logoUrl !== null,
    logoUrl: bestResult.logoUrl,
    confidence: bestResult.confidence,
    strategy: bestResult.strategy,
  });
}
