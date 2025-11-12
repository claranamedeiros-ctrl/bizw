/**
 * Logo & Brand Extraction API - Python Service Proxy
 *
 * This endpoint proxies requests to the Python/FastAPI service that uses:
 * - OWLv2 for AI-powered logo detection
 * - K-Means clustering for color extraction
 * - BeautifulSoup for text extraction
 *
 * The old 1,200-line Next.js implementation has been replaced with a clean
 * Python service using modern AI models. See python-extractor/README.md
 *
 * Old code backed up to: route.ts.backup
 */

import { NextRequest, NextResponse } from 'next/server';

const PYTHON_SERVICE_URL = process.env.PYTHON_SERVICE_URL || 'http://localhost:8000';

interface ExtractionRequest {
  url: string;
}

interface ExtractionResponse {
  logo: string | null;
  logoRaw?: string | null;
  colors: {
    primary: string;
    secondary: string;
    palette: string[];
  };
  about?: string | null;
  disclaimer?: string | null;
  error?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: ExtractionRequest = await request.json();
    const { url } = body;

    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      );
    }

    console.log(`[PROXY] Forwarding request to Python service: ${url}`);

    // Forward request to Python service
    const response = await fetch(`${PYTHON_SERVICE_URL}/extract`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url }),
      signal: AbortSignal.timeout(30000), // 30 second timeout
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[PROXY] Python service error (${response.status}): ${errorText}`);

      return NextResponse.json(
        { error: `Python service error: ${response.status}` },
        { status: response.status }
      );
    }

    const data: ExtractionResponse = await response.json();

    console.log(`[PROXY] Success - logo: ${!!data.logo}, colors: ${data.colors.primary}, about: ${data.about ? data.about.length + ' chars' : 'null'}`);

    return NextResponse.json(data);

  } catch (error: any) {
    console.error('[PROXY] Request failed:', error);

    // Check if it's a timeout
    if (error.name === 'AbortError' || error.message?.includes('timeout')) {
      return NextResponse.json(
        { error: 'Request timeout - Python service took too long' },
        { status: 504 }
      );
    }

    // Check if Python service is unreachable
    if (error.cause?.code === 'ECONNREFUSED') {
      return NextResponse.json(
        {
          error: 'Python service is not running. Please start it with: cd python-extractor && python main.py',
          pythonServiceUrl: PYTHON_SERVICE_URL
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: `Proxy error: ${error.message}` },
      { status: 500 }
    );
  }
}

/**
 * Health check endpoint to verify Python service connectivity
 */
export async function GET() {
  try {
    const response = await fetch(`${PYTHON_SERVICE_URL}/health`, {
      signal: AbortSignal.timeout(5000),
    });

    const data = await response.json();

    return NextResponse.json({
      status: 'healthy',
      pythonService: data,
      pythonServiceUrl: PYTHON_SERVICE_URL,
    });

  } catch (error: any) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        error: error.message,
        pythonServiceUrl: PYTHON_SERVICE_URL,
        hint: 'Start Python service with: cd python-extractor && python main.py'
      },
      { status: 503 }
    );
  }
}
