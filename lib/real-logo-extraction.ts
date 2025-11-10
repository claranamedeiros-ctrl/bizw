/**
 * REAL Logo Extraction using Playwright
 * This actually scrapes live websites - not a simulation
 */

import { chromium, Browser, Page } from 'playwright';

export interface LogoExtractionResult {
  url: string;
  logoUrl: string | null;
  strategy: 'meta-tags' | 'img-elements' | 'svg' | 'favicon';
  confidence: number;
  quality: {
    width: number;
    height: number;
    format: string;
    hasTransparency: boolean;
  } | null;
  alternativeLogos: Array<{
    url: string;
    source: string;
    dimensions?: { width: number; height: number };
  }>;
  extractionTime: number;
  error?: string;
}

/**
 * Main logo extraction function
 * Tests multiple strategies on a real website
 */
export async function extractLogoFromWebsite(
  websiteUrl: string,
  options: {
    timeout?: number;
    strategies?: Array<'meta-tags' | 'img-elements' | 'svg' | 'favicon'>;
  } = {}
): Promise<LogoExtractionResult> {
  const startTime = Date.now();
  const { timeout = 15000, strategies = ['meta-tags', 'img-elements', 'svg', 'favicon'] } = options;

  let browser: Browser | null = null;
  let page: Page | null = null;

  try {
    // Launch browser
    browser = await chromium.launch({
      headless: true,
      timeout: 30000,
    });

    // Create context with realistic user agent
    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      viewport: { width: 1920, height: 1080 },
      locale: 'en-US',
    });

    page = await context.newPage();

    // Navigate to website
    console.log(`[Logo Extraction] Navigating to: ${websiteUrl}`);
    await page.goto(websiteUrl, {
      waitUntil: 'domcontentloaded',
      timeout,
    });

    // Wait a bit for dynamic content
    await page.waitForTimeout(2000);

    const allLogos: Array<{
      url: string;
      source: string;
      dimensions?: { width: number; height: number };
    }> = [];

    // Strategy 1: Meta tags (Open Graph, Twitter Cards)
    if (strategies.includes('meta-tags')) {
      console.log('[Logo Extraction] Trying meta tags strategy...');
      const metaLogos = await extractFromMetaTags(page, websiteUrl);
      allLogos.push(...metaLogos);
    }

    // Strategy 2: Image elements with logo-related attributes
    if (strategies.includes('img-elements')) {
      console.log('[Logo Extraction] Trying img elements strategy...');
      const imgLogos = await extractFromImageElements(page, websiteUrl);
      allLogos.push(...imgLogos);
    }

    // Strategy 3: SVG elements in header/nav
    if (strategies.includes('svg')) {
      console.log('[Logo Extraction] Trying SVG strategy...');
      const svgLogos = await extractFromSVG(page);
      allLogos.push(...svgLogos);
    }

    // Strategy 4: Favicon as fallback
    if (strategies.includes('favicon')) {
      console.log('[Logo Extraction] Trying favicon strategy...');
      const faviconLogos = await extractFavicon(page, websiteUrl);
      allLogos.push(...faviconLogos);
    }

    await browser.close();

    // Select best logo
    const bestLogo = selectBestLogo(allLogos);

    const extractionTime = Date.now() - startTime;

    if (!bestLogo) {
      return {
        url: websiteUrl,
        logoUrl: null,
        strategy: 'meta-tags', // default
        confidence: 0,
        quality: null,
        alternativeLogos: allLogos,
        extractionTime,
        error: 'No logo found with any strategy',
      };
    }

    // Determine strategy used
    let strategy: 'meta-tags' | 'img-elements' | 'svg' | 'favicon' = 'img-elements';
    if (bestLogo.source.includes('meta')) strategy = 'meta-tags';
    if (bestLogo.source.includes('svg')) strategy = 'svg';
    if (bestLogo.source.includes('favicon')) strategy = 'favicon';

    // Calculate confidence based on source and dimensions
    let confidence = 50;
    if (bestLogo.dimensions) {
      const area = bestLogo.dimensions.width * bestLogo.dimensions.height;
      if (area > 10000) confidence += 30; // Large logo
      else if (area > 5000) confidence += 20;
      else if (area > 2000) confidence += 10;
    }
    if (strategy === 'img-elements' || strategy === 'svg') confidence += 20;
    confidence = Math.min(confidence, 100);

    return {
      url: websiteUrl,
      logoUrl: bestLogo.url,
      strategy,
      confidence,
      quality: bestLogo.dimensions
        ? {
            width: bestLogo.dimensions.width,
            height: bestLogo.dimensions.height,
            format: bestLogo.url.endsWith('.svg') ? 'SVG' : 'PNG',
            hasTransparency: true,
          }
        : null,
      alternativeLogos: allLogos.filter((l) => l.url !== bestLogo.url),
      extractionTime,
    };
  } catch (error: any) {
    if (browser) await browser.close();

    return {
      url: websiteUrl,
      logoUrl: null,
      strategy: 'meta-tags',
      confidence: 0,
      quality: null,
      alternativeLogos: [],
      extractionTime: Date.now() - startTime,
      error: error.message || 'Unknown error',
    };
  }
}

/**
 * Extract logo from meta tags (og:image, twitter:image)
 */
async function extractFromMetaTags(
  page: Page,
  baseUrl: string
): Promise<Array<{ url: string; source: string }>> {
  const logos: Array<{ url: string; source: string }> = [];

  try {
    // Open Graph image
    const ogImage = await page
      .locator('meta[property="og:image"], meta[property="og:image:secure_url"]')
      .first()
      .getAttribute('content');

    if (ogImage) {
      const absoluteUrl = new URL(ogImage, baseUrl).href;
      logos.push({ url: absoluteUrl, source: 'meta-og-image' });
      console.log(`  ✓ Found OG image: ${absoluteUrl}`);
    }

    // Twitter card image
    const twitterImage = await page
      .locator('meta[name="twitter:image"], meta[property="twitter:image"]')
      .first()
      .getAttribute('content');

    if (twitterImage && twitterImage !== ogImage) {
      const absoluteUrl = new URL(twitterImage, baseUrl).href;
      logos.push({ url: absoluteUrl, source: 'meta-twitter-image' });
      console.log(`  ✓ Found Twitter image: ${absoluteUrl}`);
    }
  } catch (error) {
    console.log('  ✗ Meta tags extraction failed');
  }

  return logos;
}

/**
 * Extract logo from img elements with logo-related attributes
 */
async function extractFromImageElements(
  page: Page,
  baseUrl: string
): Promise<Array<{ url: string; source: string; dimensions?: { width: number; height: number } }>> {
  const logos: Array<{ url: string; source: string; dimensions?: { width: number; height: number } }> = [];

  try {
    // Find images with logo-related attributes
    const logoImages = await page
      .locator('img[alt*="logo" i], img[class*="logo" i], img[id*="logo" i], header img, nav img')
      .all();

    console.log(`  Found ${logoImages.length} potential logo images`);

    for (const img of logoImages.slice(0, 10)) {
      // Limit to first 10
      try {
        const src = await img.getAttribute('src');
        if (!src) continue;

        const absoluteUrl = new URL(src, baseUrl).href;

        // Get dimensions
        const box = await img.boundingBox();

        // Filter out very small images (likely icons, not logos)
        if (box && (box.width < 30 || box.height < 30)) {
          continue;
        }

        const alt = (await img.getAttribute('alt')) || '';
        const className = (await img.getAttribute('class')) || '';

        logos.push({
          url: absoluteUrl,
          source: `img-element (alt: ${alt}, class: ${className})`,
          dimensions: box ? { width: box.width, height: box.height } : undefined,
        });

        console.log(`  ✓ Found image: ${absoluteUrl} (${box?.width}x${box?.height})`);
      } catch (err) {
        // Skip this image
      }
    }
  } catch (error) {
    console.log('  ✗ Image elements extraction failed');
  }

  return logos;
}

/**
 * Extract SVG logos from header/nav
 */
async function extractFromSVG(
  page: Page
): Promise<Array<{ url: string; source: string; dimensions?: { width: number; height: number } }>> {
  const logos: Array<{ url: string; source: string; dimensions?: { width: number; height: number } }> = [];

  try {
    const svgElements = await page
      .locator('header svg, nav svg, .logo svg, [class*="logo" i] svg')
      .all();

    console.log(`  Found ${svgElements.length} SVG elements`);

    for (const svg of svgElements.slice(0, 5)) {
      // Limit to first 5
      try {
        const box = await svg.boundingBox();

        // Filter out very small SVGs
        if (box && (box.width < 30 || box.height < 30)) {
          continue;
        }

        // Get SVG content
        const svgContent = await svg.innerHTML();

        // Convert to data URL
        const dataUrl = `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg">${svgContent}</svg>`)}`;

        logos.push({
          url: dataUrl,
          source: 'svg-element',
          dimensions: box ? { width: box.width, height: box.height } : undefined,
        });

        console.log(`  ✓ Found SVG (${box?.width}x${box?.height})`);
      } catch (err) {
        // Skip this SVG
      }
    }
  } catch (error) {
    console.log('  ✗ SVG extraction failed');
  }

  return logos;
}

/**
 * Extract favicon as fallback
 */
async function extractFavicon(
  page: Page,
  baseUrl: string
): Promise<Array<{ url: string; source: string }>> {
  const logos: Array<{ url: string; source: string }> = [];

  try {
    // Try different favicon selectors
    const selectors = [
      'link[rel="icon"]',
      'link[rel="shortcut icon"]',
      'link[rel="apple-touch-icon"]',
      'link[rel="apple-touch-icon-precomposed"]',
    ];

    for (const selector of selectors) {
      try {
        const href = await page.locator(selector).first().getAttribute('href');
        if (href) {
          const absoluteUrl = new URL(href, baseUrl).href;
          logos.push({ url: absoluteUrl, source: `favicon (${selector})` });
          console.log(`  ✓ Found favicon: ${absoluteUrl}`);
        }
      } catch (err) {
        // Try next selector
      }
    }

    // Fallback to standard /favicon.ico
    if (logos.length === 0) {
      const domain = new URL(baseUrl);
      const faviconUrl = `${domain.origin}/favicon.ico`;
      logos.push({ url: faviconUrl, source: 'favicon (default)' });
      console.log(`  ✓ Using default favicon: ${faviconUrl}`);
    }
  } catch (error) {
    console.log('  ✗ Favicon extraction failed');
  }

  return logos;
}

/**
 * Select the best logo from candidates
 * Prioritizes larger, more prominent logos
 */
function selectBestLogo(
  logos: Array<{ url: string; source: string; dimensions?: { width: number; height: number } }>
): { url: string; source: string; dimensions?: { width: number; height: number } } | null {
  if (logos.length === 0) return null;

  // Score each logo
  const scored = logos.map((logo) => {
    let score = 0;

    // Prioritize based on source
    if (logo.source.includes('img-element')) score += 50;
    if (logo.source.includes('svg')) score += 40;
    if (logo.source.includes('meta')) score += 30;
    if (logo.source.includes('favicon')) score += 10;

    // Prioritize based on size
    if (logo.dimensions) {
      const area = logo.dimensions.width * logo.dimensions.height;
      score += Math.min(area / 100, 50); // Cap at 50 points
    }

    // Penalize data URLs (inline SVGs) slightly
    if (logo.url.startsWith('data:')) score -= 5;

    return { ...logo, score };
  });

  // Sort by score descending
  scored.sort((a, b) => b.score - a.score);

  return scored[0];
}

/**
 * Batch extract logos from multiple websites
 */
export async function batchExtractLogos(
  urls: string[],
  options?: {
    concurrency?: number;
    timeout?: number;
  }
): Promise<LogoExtractionResult[]> {
  const { concurrency = 3, timeout = 15000 } = options || {};

  console.log(`\n[Batch Extraction] Processing ${urls.length} websites with concurrency ${concurrency}\n`);

  const results: LogoExtractionResult[] = [];

  // Process in batches to avoid overwhelming the system
  for (let i = 0; i < urls.length; i += concurrency) {
    const batch = urls.slice(i, i + concurrency);

    const batchResults = await Promise.all(
      batch.map((url) => extractLogoFromWebsite(url, { timeout }))
    );

    results.push(...batchResults);

    console.log(`\n[Batch Extraction] Completed ${Math.min(i + concurrency, urls.length)}/${urls.length}\n`);
  }

  return results;
}
