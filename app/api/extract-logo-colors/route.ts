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

      // Wait a moment for page to settle
      await page.waitForTimeout(1000);
      console.log('[LOGO] Page settled');

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

      // Take screenshot for color extraction - try header element first, fallback to top of viewport
      console.log('[LOGO] Taking screenshot for color analysis...');
      const screenshotStart = Date.now();

      let screenshotBuffer: Buffer;

      // Try to screenshot just the header element (much smaller and faster)
      const headerElement = await page.$('header, .header, nav, .navbar').catch(() => null);

      if (headerElement) {
        console.log('[LOGO] Found header element, taking targeted screenshot');
        screenshotBuffer = await headerElement.screenshot({
          type: 'jpeg',
          quality: 40,
        });
      } else {
        console.log('[LOGO] No header found, taking small viewport screenshot');
        screenshotBuffer = await page.screenshot({
          type: 'jpeg',
          quality: 40,
          fullPage: false,
          clip: { x: 0, y: 0, width: 600, height: 200 }
        });
      }

      console.log(`[LOGO] Screenshot taken in ${Date.now() - screenshotStart}ms, size: ${screenshotBuffer.length} bytes`);

      await browser.close();

      // Extract colors using Vibrant
      console.log('[LOGO] Extracting colors...');
      const colorStart = Date.now();

      const vibrant = new Vibrant(screenshotBuffer);
      const palette = await vibrant.getPalette();

      console.log(`[LOGO] Colors extracted in ${Date.now() - colorStart}ms`);

      // Get color swatches sorted by population (dominance)
      // Filter out null/undefined values
      const allSwatches = Object.values(palette)
        .filter((swatch) => swatch !== null && swatch !== undefined);

      // Filter out white/black/gray (low-saturation noise)
      const colorfulSwatches = allSwatches.filter((swatch) => {
        const rgb = swatch.rgb;
        const r = rgb[0], g = rgb[1], b = rgb[2];

        // Calculate brightness (0-255)
        const brightness = (r + g + b) / 3;

        // Filter out too bright (white-ish) or too dark (black-ish)
        if (brightness > 240 || brightness < 20) {
          return false;
        }

        // Calculate saturation to filter out grays
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        const saturation = max === 0 ? 0 : (max - min) / max;

        // Filter out low saturation (grays) - keep only colorful
        return saturation > 0.15; // 15% minimum saturation
      });

      // Sort by population (most dominant first)
      const sortedSwatches = colorfulSwatches.sort((a, b) =>
        (b.population || 0) - (a.population || 0)
      );

      // Extract primary and secondary colors from filtered swatches
      // Fallback to any swatch if no colorful ones found
      const primary = sortedSwatches[0]?.hex || allSwatches[0]?.hex || '#000000';
      const secondary = sortedSwatches[1]?.hex || allSwatches[1]?.hex || '#FFFFFF';

      // Get full palette (top 6 colors) - prefer colorful, but include all if not enough
      const colorPalette = [
        ...sortedSwatches.slice(0, 6),
        ...allSwatches.slice(0, 6)
      ]
        .filter((swatch, index, self) =>
          index === self.findIndex((s) => s.hex === swatch.hex) // Remove duplicates
        )
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
