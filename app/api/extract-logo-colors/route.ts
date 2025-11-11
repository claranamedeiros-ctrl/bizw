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

      // OPTIMIZATION: Try to extract colors from CSS first (FAST - no screenshot needed)
      console.log('[LOGO] Attempting fast CSS color extraction...');
      const cssColorStart = Date.now();

      const cssColors = await page.evaluate(() => {
        const colors = new Set<string>();

        // Strategy 1: Get colors from header/nav elements
        const headerElements = document.querySelectorAll('header, nav, .header, .navbar, [role="banner"], .site-header, #header');

        headerElements.forEach(el => {
          const computed = window.getComputedStyle(el);

          if (computed.backgroundColor && computed.backgroundColor !== 'rgba(0, 0, 0, 0)') {
            colors.add(computed.backgroundColor);
          }
          if (computed.color) {
            colors.add(computed.color);
          }

          // Check ALL child elements in header (not just first 20)
          const children = el.querySelectorAll('*');
          Array.from(children).forEach(child => {
            const childComputed = window.getComputedStyle(child);
            if (childComputed.backgroundColor && childComputed.backgroundColor !== 'rgba(0, 0, 0, 0)') {
              colors.add(childComputed.backgroundColor);
            }
            if (childComputed.color) {
              colors.add(childComputed.color);
            }
            // Also get border colors
            if (childComputed.borderColor && childComputed.borderColor !== 'rgba(0, 0, 0, 0)') {
              colors.add(childComputed.borderColor);
            }
          });
        });

        // Strategy 2: Get CSS variables (modern sites often use these for brand colors)
        const rootStyles = window.getComputedStyle(document.documentElement);
        const cssVars = ['--primary', '--primary-color', '--brand-color', '--accent', '--secondary', '--theme-color'];
        cssVars.forEach(varName => {
          const value = rootStyles.getPropertyValue(varName).trim();
          if (value && value !== '') {
            colors.add(value);
          }
        });

        // Strategy 3: Get colors from buttons/links (often use brand colors)
        const buttons = document.querySelectorAll('a, button, .btn, .button');
        Array.from(buttons).slice(0, 30).forEach(btn => {
          const computed = window.getComputedStyle(btn);
          if (computed.backgroundColor && computed.backgroundColor !== 'rgba(0, 0, 0, 0)') {
            colors.add(computed.backgroundColor);
          }
          if (computed.color) {
            colors.add(computed.color);
          }
        });

        return Array.from(colors);
      }).catch(() => []);

      console.log(`[LOGO] CSS extraction found ${cssColors.length} colors in ${Date.now() - cssColorStart}ms`);

      // Convert rgb/rgba to hex
      const rgbToHex = (rgb: string): string | null => {
        const match = rgb.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
        if (!match) return null;
        const r = parseInt(match[1]);
        const g = parseInt(match[2]);
        const b = parseInt(match[3]);
        return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
      };

      const hexColors = cssColors
        .map(rgbToHex)
        .filter((c): c is string => c !== null)
        .filter(c => {
          // Filter out white/black/gray
          const r = parseInt(c.slice(1, 3), 16);
          const g = parseInt(c.slice(3, 5), 16);
          const b = parseInt(c.slice(5, 7), 16);
          const brightness = (r + g + b) / 3;
          if (brightness > 240 || brightness < 20) return false;
          const max = Math.max(r, g, b);
          const min = Math.min(r, g, b);
          const saturation = max === 0 ? 0 : (max - min) / max;
          return saturation > 0.15;
        });

      console.log(`[LOGO] After filtering: ${hexColors.length} colorful CSS colors`);

      let primary: string;
      let secondary: string;
      let colorPalette: string[];

      // If we found ANY colors in CSS, use them (FAST PATH - no screenshot!)
      // Even 1 color is better than timing out on screenshot
      if (hexColors.length >= 1) {
        console.log(`[LOGO] ✓ Using ${hexColors.length} CSS color(s) (no screenshot needed)`);
        primary = hexColors[0];
        secondary = hexColors[1] || hexColors[0]; // Use primary again if only one color found
        colorPalette = hexColors.slice(0, 6);

        // Pad palette if needed
        while (colorPalette.length < 2) {
          colorPalette.push(primary);
        }

        await browser.close();

        // Proxy the logo through our API to avoid CORS and broken links
        const proxiedLogoUrl = logoUrl ? `/api/proxy-image?url=${encodeURIComponent(logoUrl)}` : null;

        return NextResponse.json({
          logo: proxiedLogoUrl,
          logoOriginal: logoUrl, // Keep original for reference
          colors: {
            primary,
            secondary,
            palette: colorPalette,
          },
        });
      }

      // FALLBACK: Not enough CSS colors found, take screenshot (SLOW PATH)
      console.log('[LOGO] Not enough CSS colors, falling back to screenshot analysis...');
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
      primary = sortedSwatches[0]?.hex || allSwatches[0]?.hex || '#000000';
      secondary = sortedSwatches[1]?.hex || allSwatches[1]?.hex || '#FFFFFF';

      // Get full palette (top 6 colors) - prefer colorful, but include all if not enough
      colorPalette = [
        ...sortedSwatches.slice(0, 6),
        ...allSwatches.slice(0, 6)
      ]
        .filter((swatch, index, self) =>
          index === self.findIndex((s) => s.hex === swatch.hex) // Remove duplicates
        )
        .slice(0, 6)
        .map((swatch) => swatch.hex);

      // Proxy the logo through our API to avoid CORS and broken links
      const proxiedLogoUrl = logoUrl ? `/api/proxy-image?url=${encodeURIComponent(logoUrl)}` : null;

      return NextResponse.json({
        logo: proxiedLogoUrl,
        logoOriginal: logoUrl, // Keep original for reference
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
