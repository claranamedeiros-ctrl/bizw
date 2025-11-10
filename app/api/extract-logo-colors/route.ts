import { NextRequest, NextResponse } from 'next/server';
import { chromium } from 'playwright';
import * as Vibrant from 'node-vibrant';

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      );
    }

    // Validate URL format
    try {
      new URL(url);
    } catch {
      return NextResponse.json(
        { error: 'Invalid URL format' },
        { status: 400 }
      );
    }

    let browser;
    try {
      // Launch browser
      browser = await chromium.launch({
        headless: true,
      });

      const context = await browser.newContext({
        viewport: { width: 1920, height: 1080 },
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
      });

      const page = await context.newPage();

      // Navigate to the page with timeout
      await page.goto(url, {
        waitUntil: 'networkidle',
        timeout: 30000,
      });

      // Extract logo URL
      let logoUrl: string | null = null;

      // Try multiple methods to find the logo
      // 1. Look for og:image meta tag
      const ogImage = await page.$eval(
        'meta[property="og:image"]',
        (el) => el.getAttribute('content')
      ).catch(() => null);

      // 2. Look for logo in common selectors
      const logoSelectors = [
        'img[alt*="logo" i]',
        'img[class*="logo" i]',
        'img[id*="logo" i]',
        'a[class*="logo" i] img',
        'header img:first-of-type',
        '.header img:first-of-type',
        '.navbar img:first-of-type',
        'nav img:first-of-type',
      ];

      for (const selector of logoSelectors) {
        if (logoUrl) break;
        logoUrl = await page.$eval(selector, (el) => {
          if (el instanceof HTMLImageElement) {
            return el.src;
          }
          return null;
        }).catch(() => null);
      }

      // Fallback to og:image if no logo found
      if (!logoUrl && ogImage) {
        logoUrl = ogImage;
      }

      // Make logo URL absolute if it's relative
      if (logoUrl && !logoUrl.startsWith('http')) {
        const baseUrl = new URL(url);
        logoUrl = new URL(logoUrl, baseUrl.origin).href;
      }

      // Take screenshot for color extraction
      const screenshotBuffer = await page.screenshot({
        type: 'png',
        fullPage: false, // Just capture viewport
      });

      await browser.close();

      // Extract colors using Vibrant
      const palette = await Vibrant.from(screenshotBuffer).getPalette();

      // Get color swatches sorted by population (dominance)
      const swatches = Object.values(palette)
        .filter((swatch) => swatch !== null && swatch !== undefined)
        .sort((a, b) => (b?.population || 0) - (a?.population || 0));

      // Extract primary and secondary colors
      const primary = swatches[0]?.hex || '#000000';
      const secondary = swatches[1]?.hex || '#FFFFFF';

      // Get full palette (top 6 colors)
      const colorPalette = swatches
        .slice(0, 6)
        .map((swatch) => swatch?.hex || '#000000');

      return NextResponse.json({
        logo: logoUrl,
        colors: {
          primary,
          secondary,
          palette: colorPalette,
        },
      });

    } catch (error) {
      if (browser) {
        await browser.close().catch(() => {});
      }

      console.error('Extraction error:', error);

      return NextResponse.json(
        {
          error: error instanceof Error
            ? `Failed to extract: ${error.message}`
            : 'Failed to extract logo and colors'
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Request error:', error);
    return NextResponse.json(
      { error: 'Invalid request' },
      { status: 400 }
    );
  }
}
