import { NextRequest, NextResponse } from 'next/server';
import { chromium } from 'playwright';
import { Vibrant } from 'node-vibrant/node';
import { execSync } from 'child_process';
import { readdirSync, existsSync } from 'fs';

export async function POST(request: NextRequest) {
  try {
    // DEBUG: Log filesystem state
    console.log('[DEBUG] HOME:', process.env.HOME);
    console.log('[DEBUG] USER:', process.env.USER);
    console.log('[DEBUG] PWD:', process.cwd());

    // Check what's in the expected location
    const expectedPath = '/opt/render/.cache/ms-playwright';
    if (existsSync(expectedPath)) {
      console.log('[DEBUG] Contents of', expectedPath, ':', readdirSync(expectedPath));
    } else {
      console.log('[DEBUG]', expectedPath, 'does NOT exist');
    }

    // Check what's in /ms-playwright (Playwright image location)
    if (existsSync('/ms-playwright')) {
      console.log('[DEBUG] Contents of /ms-playwright:', readdirSync('/ms-playwright'));
    } else {
      console.log('[DEBUG] /ms-playwright does NOT exist');
    }

    // Check what Playwright thinks its browser path is
    try {
      const browserPath = execSync('npx playwright --version', { encoding: 'utf-8' });
      console.log('[DEBUG] Playwright version:', browserPath);
    } catch (e) {
      console.log('[DEBUG] Could not get Playwright version');
    }

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
      const vibrant = new Vibrant(screenshotBuffer);
      const palette = await vibrant.getPalette();

      // Get color swatches sorted by population (dominance)
      // Filter out null/undefined values and sort by population
      const swatches = Object.values(palette)
        .filter((swatch) => swatch !== null && swatch !== undefined)
        .sort((a, b) => (b.population || 0) - (a.population || 0));

      // Extract primary and secondary colors
      const primary = swatches[0]?.hex || '#000000';
      const secondary = swatches[1]?.hex || '#FFFFFF';

      // Get full palette (top 6 colors)
      const colorPalette = swatches
        .slice(0, 6)
        .map((swatch) => swatch.hex);

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
