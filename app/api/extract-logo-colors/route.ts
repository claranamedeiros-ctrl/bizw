import { NextRequest, NextResponse } from 'next/server';
import { chromium } from 'playwright';
import { Vibrant } from 'node-vibrant/node';

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
      console.log('[LOGO] Launching browser...');
      const startTime = Date.now();

      // Launch browser with args for better compatibility in Docker/Render
      browser = await chromium.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--single-process', // Use single process to save memory
          '--no-zygote' // Don't use zygote process
        ]
      });
      console.log(`[LOGO] Browser launched in ${Date.now() - startTime}ms`);

      const context = await browser.newContext({
        viewport: { width: 1920, height: 1080 },
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
      });

      const page = await context.newPage();
      console.log('[LOGO] New page created');

      // Navigate to the page with more lenient settings
      console.log(`[LOGO] Navigating to ${url}...`);
      const navStart = Date.now();

      await page.goto(url, {
        waitUntil: 'domcontentloaded',
        timeout: 60000, // Increased to 60 seconds
      });

      console.log(`[LOGO] Navigation completed in ${Date.now() - navStart}ms`);

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
      console.log('[LOGO] Taking screenshot for color analysis...');
      const screenshotStart = Date.now();

      const screenshotBuffer = await page.screenshot({
        type: 'jpeg',  // JPEG is much smaller than PNG
        quality: 60,   // Lower quality = smaller size, faster
        fullPage: false,
        timeout: 15000, // 15 second timeout for screenshot
        clip: {  // Only capture top portion of page (where logos usually are)
          x: 0,
          y: 0,
          width: 1200,  // Reduced from 1920
          height: 600   // Reduced from 1080
        }
      });

      console.log(`[LOGO] Screenshot taken in ${Date.now() - screenshotStart}ms, size: ${screenshotBuffer.length} bytes`);

      await browser.close();

      // Extract colors using Vibrant
      console.log('[LOGO] Extracting colors...');
      const colorStart = Date.now();

      const vibrant = new Vibrant(screenshotBuffer);
      const palette = await vibrant.getPalette();

      console.log(`[LOGO] Colors extracted in ${Date.now() - colorStart}ms`);

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
