import { NextRequest, NextResponse } from 'next/server';
import { chromium, Browser, Page } from 'playwright';
import { Vibrant } from 'node-vibrant/node';

// ============================================================================
// TYPES
// ============================================================================

interface LogoCandidate {
  src: string;
  source: 'explicit-logo' | 'header-img' | 'favicon' | 'screenshot';
  score: number;
}

interface ColorSignals {
  themeColor?: string;
  cssVars: Record<string, string>;
  backgrounds: string[];
  accents: string[];
}

interface BrandColors {
  primary: string;
  secondary: string;
  palette: string[];
}

interface TextBlocks {
  about: string | null;
  disclaimer: string | null;
}

// ============================================================================
// HELPERS
// ============================================================================

function rgbToHex(rgb: string): string | null {
  const match = rgb.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (!match) return null;
  const [_, r, g, b] = match.map(Number);
  return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
}

function hexToRgb(hex: string): [number, number, number] | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? [
    parseInt(result[1], 16),
    parseInt(result[2], 16),
    parseInt(result[3], 16)
  ] : null;
}

function getBrightness(hex: string): number {
  const rgb = hexToRgb(hex);
  if (!rgb) return 0;
  return (rgb[0] + rgb[1] + rgb[2]) / 3;
}

function getSaturation(hex: string): number {
  const rgb = hexToRgb(hex);
  if (!rgb) return 0;
  const [r, g, b] = rgb;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  return max === 0 ? 0 : (max - min) / max;
}

function isGoodBackgroundColor(hex: string): boolean {
  const brightness = getBrightness(hex);

  // For backgrounds, only filter extreme white/black
  // Allow grays - they're valid brand colors!
  if (brightness > 250) return false; // Near-pure white
  if (brightness < 5) return false;   // Absolute black

  return true;
}

function isGoodAccentColor(hex: string): boolean {
  const brightness = getBrightness(hex);
  const saturation = getSaturation(hex);

  // For accents, filter out near-white, near-black, and grays
  if (brightness > 240 || brightness < 20) return false;
  if (saturation < 0.15) return false;

  return true;
}

function scoreColor(hex: string, weight: number, frequency: number): number {
  const saturation = getSaturation(hex);
  return weight * frequency * (1 + saturation);
}

// ============================================================================
// LOGO EXTRACTION
// ============================================================================

async function extractLogo(page: Page, baseUrl: string): Promise<string | null> {
  console.log('[LOGO] Extracting logo...');

  const logoUrl = await page.evaluate((domain) => {
    interface LogoCandidate {
      element: HTMLElement | SVGElement;
      url: string | null;
      score: number;
    }

    const candidates: LogoCandidate[] = [];
    const headers = document.querySelectorAll('header, nav, [role="banner"], .site-header, .navbar');

    // Collect all potential logo candidates
    for (const header of Array.from(headers)) {
      // Check all images
      const images = header.querySelectorAll('img');
      for (const img of Array.from(images)) {
        if (!(img instanceof HTMLImageElement) || !img.src) continue;

        let score = 0;

        // In header = +3
        score += 3;

        // Alt/class/id contains "logo" = +5
        const alt = img.alt?.toLowerCase() || '';
        const className = img.className?.toLowerCase() || '';
        const id = img.id?.toLowerCase() || '';
        if (alt.includes('logo') || className.includes('logo') || id.includes('logo')) {
          score += 5;
        }

        // Filename contains "logo" or domain = +4
        const filename = img.src.split('/').pop()?.toLowerCase() || '';
        if (filename.includes('logo') || filename.includes(domain)) {
          score += 4;
        }

        // Size check: reasonable logo size (>= 400px²) = +1
        if (img.naturalWidth * img.naturalHeight >= 400) {
          score += 1;
        }

        candidates.push({ element: img, url: img.src, score });
      }

      // Check all SVGs
      const svgs = header.querySelectorAll('svg');
      for (const svg of Array.from(svgs)) {
        let score = 0;

        // In header = +3
        score += 3;

        // Class/id/aria-label contains "logo" = +5
        const className = svg.getAttribute('class')?.toLowerCase() || '';
        const id = svg.getAttribute('id')?.toLowerCase() || '';
        const ariaLabel = svg.getAttribute('aria-label')?.toLowerCase() || '';
        if (className.includes('logo') || id.includes('logo') || ariaLabel.includes('logo')) {
          score += 5;
        }

        // Try to get href from <image> inside SVG first
        const svgImg = svg.querySelector('image');
        if (svgImg instanceof SVGImageElement && svgImg.href.baseVal) {
          candidates.push({ element: svg, url: svgImg.href.baseVal, score: score + 2 });
          continue;
        }

        // For inline SVG, serialize to data URL
        const serializer = new XMLSerializer();
        const svgString = serializer.serializeToString(svg);
        const dataUrl = 'data:image/svg+xml;base64,' + btoa(svgString);

        candidates.push({ element: svg, url: dataUrl, score });
      }

      // Check elements with background-image
      const logoElements = header.querySelectorAll('[class*="logo" i], [id*="logo" i]');
      for (const el of Array.from(logoElements)) {
        const bgImg = window.getComputedStyle(el).backgroundImage;
        if (bgImg && bgImg !== 'none') {
          const urlMatch = bgImg.match(/url\(['"]?(.+?)['"]?\)/);
          if (urlMatch) {
            let score = 3; // In header
            const className = (el as HTMLElement).className?.toLowerCase() || '';
            const id = (el as HTMLElement).id?.toLowerCase() || '';
            if (className.includes('logo') || id.includes('logo')) {
              score += 5;
            }
            candidates.push({ element: el as HTMLElement, url: urlMatch[1], score });
          }
        }
      }
    }

    // Sort by score and return best candidate
    candidates.sort((a, b) => b.score - a.score);

    console.log('[LOGO] Found', candidates.length, 'candidates, best score:', candidates[0]?.score);

    // Only return if we have a reasonable candidate (score >= 3)
    if (candidates.length > 0 && candidates[0].score >= 3) {
      return candidates[0].url;
    }

    return null;
  }, new URL(baseUrl).hostname.split('.')[0]).catch(() => null);

  if (logoUrl) {
    // Data URLs (from inline SVG) can be used as-is
    if (logoUrl.startsWith('data:')) {
      return logoUrl;
    }

    // Make absolute
    if (!logoUrl.startsWith('http')) {
      const base = new URL(baseUrl);
      return new URL(logoUrl, base.origin).href;
    }
    return logoUrl;
  }

  // Priority 4: Favicon fallback
  const favicon = await page.$eval(
    'link[rel*="icon"], link[rel="mask-icon"]',
    (el) => el.getAttribute('href')
  ).catch(() => null);

  if (favicon) {
    if (!favicon.startsWith('http')) {
      const base = new URL(baseUrl);
      return new URL(favicon, base.origin).href;
    }
    return favicon;
  }

  // Priority 5: Screenshot header (last resort)
  console.log('[LOGO] No logo found in DOM, screenshotting header...');
  try {
    const headerEl = await page.$('header, nav, [role="banner"]').catch(() => null);
    let screenshot: Buffer;

    if (headerEl) {
      screenshot = await headerEl.screenshot({ type: 'png' });
    } else {
      screenshot = await page.screenshot({
        type: 'png',
        clip: { x: 0, y: 0, width: 800, height: 200 }
      });
    }

    return `data:image/png;base64,${screenshot.toString('base64')}`;
  } catch (error) {
    console.error('[LOGO] Screenshot failed:', error);
    return null;
  }
}

// ============================================================================
// COLOR EXTRACTION - STAGE 1: CSS SIGNALS
// ============================================================================

async function collectDomColorSignals(page: Page): Promise<ColorSignals> {
  console.log('[COLOR] Collecting CSS/DOM signals...');

  return await page.evaluate(() => {
    const signals: ColorSignals = {
      cssVars: {},
      backgrounds: [],
      accents: []
    };

    // 1. Meta theme-color (highest priority)
    const themeMeta = document.querySelector('meta[name="theme-color"]');
    if (themeMeta) {
      const content = themeMeta.getAttribute('content');
      if (content) signals.themeColor = content;
    }

    // 2. CSS custom properties on :root
    const rootStyles = window.getComputedStyle(document.documentElement);
    const varNames = [
      '--primary', '--primary-color', '--brand', '--brand-color',
      '--accent', '--accent-color', '--theme', '--theme-color',
      '--bg', '--background', '--text-color'
    ];

    varNames.forEach(varName => {
      const value = rootStyles.getPropertyValue(varName).trim();
      if (value && value !== '' && !value.includes('var(')) {
        signals.cssVars[varName] = value;
      }
    });

    // 3. Background colors from structural elements
    const structuralSelectors = [
      'body', 'html',
      'header', 'nav', '[role="banner"]',
      '.header', '.navbar', '.site-header',
      '.hero', '[class*="hero"]', 'main > section:first-child'
    ];

    structuralSelectors.forEach(selector => {
      const els = document.querySelectorAll(selector);
      els.forEach(el => {
        const bg = window.getComputedStyle(el).backgroundColor;
        if (bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') {
          signals.backgrounds.push(bg);
        }
      });
    });

    // 4. Accent colors from interactive elements
    const interactiveSelectors = [
      'a', 'button',
      '.btn', '.button', '[class*="btn"]',
      '.cta', '[class*="cta"]',
      '[class*="primary"]', '[class*="accent"]'
    ];

    const accentSet = new Set<string>();
    interactiveSelectors.forEach(selector => {
      const els = Array.from(document.querySelectorAll(selector)).slice(0, 40);
      els.forEach(el => {
        const computed = window.getComputedStyle(el);
        const bg = computed.backgroundColor;
        const color = computed.color;

        if (bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') {
          accentSet.add(bg);
        }
        if (color && color !== 'rgba(0, 0, 0, 0)' && color !== 'transparent') {
          accentSet.add(color);
        }
      });
    });

    signals.accents = Array.from(accentSet);

    return signals;
  });
}

function deriveBrandColorsFromSignals(signals: ColorSignals): BrandColors | null {
  console.log('[COLOR] Deriving brand colors from CSS signals...');

  // Separate background and accent colors
  const backgroundScores = new Map<string, { hex: string, score: number }>();
  const accentScores = new Map<string, { hex: string, score: number }>();

  const addBackgroundColor = (rgb: string, weight: number) => {
    const hex = rgbToHex(rgb);
    if (!hex || !isGoodBackgroundColor(hex)) return;

    const existing = backgroundScores.get(hex);
    if (existing) {
      existing.score += weight;
    } else {
      backgroundScores.set(hex, { hex, score: weight });
    }
  };

  const addAccentColor = (rgb: string, weight: number) => {
    const hex = rgbToHex(rgb);
    if (!hex || !isGoodAccentColor(hex)) return;

    const existing = accentScores.get(hex);
    if (existing) {
      existing.score += weight;
    } else {
      accentScores.set(hex, { hex, score: weight });
    }
  };

  // Meta theme-color: can be either background or accent, check saturation
  if (signals.themeColor) {
    const hex = signals.themeColor.startsWith('#')
      ? signals.themeColor
      : rgbToHex(signals.themeColor);

    if (hex) {
      const sat = getSaturation(hex);
      if (sat < 0.15) {
        // Low saturation = background color
        if (isGoodBackgroundColor(hex)) {
          backgroundScores.set(hex, { hex, score: 100 });
        }
      } else {
        // High saturation = accent color
        if (isGoodAccentColor(hex)) {
          accentScores.set(hex, { hex, score: 100 });
        }
      }
    }
  }

  // CSS variables: check saturation to categorize
  Object.values(signals.cssVars).forEach(value => {
    const hex = rgbToHex(value);
    if (!hex) return;

    const sat = getSaturation(hex);
    if (sat < 0.15) {
      addBackgroundColor(value, 50);
    } else {
      addAccentColor(value, 50);
    }
  });

  // Backgrounds: always backgrounds
  signals.backgrounds.forEach(bg => addBackgroundColor(bg, 20));

  // Accents: always accents
  signals.accents.forEach(accent => addAccentColor(accent, 30));

  // Sort both lists
  const sortedBackgrounds = Array.from(backgroundScores.values())
    .sort((a, b) => b.score - a.score);
  const sortedAccents = Array.from(accentScores.values())
    .sort((a, b) => b.score - a.score);

  console.log(`[COLOR] Found ${sortedBackgrounds.length} backgrounds, ${sortedAccents.length} accents`);

  if (sortedBackgrounds.length === 0 && sortedAccents.length === 0) {
    return null;
  }

  // Primary: best background (or best accent if no backgrounds)
  const primary = sortedBackgrounds.length > 0
    ? sortedBackgrounds[0].hex
    : sortedAccents[0]?.hex || '#000000';

  // Secondary: best accent (or second background if no accents)
  const secondary = sortedAccents.length > 0
    ? sortedAccents[0].hex
    : sortedBackgrounds[1]?.hex || primary;

  // Palette: mix of both, prioritizing high scores
  const allColors = [...sortedBackgrounds, ...sortedAccents]
    .sort((a, b) => b.score - a.score)
    .slice(0, 6)
    .map(c => c.hex);

  console.log(`[COLOR] CSS-derived: primary=${primary} (bg), secondary=${secondary} (accent)`);

  return { primary, secondary, palette: allColors };
}

// ============================================================================
// COLOR EXTRACTION - STAGE 2: SCREENSHOT FALLBACK
// ============================================================================

async function extractColorsFromScreenshot(page: Page): Promise<BrandColors> {
  console.log('[COLOR] Falling back to screenshot + Vibrant...');

  let screenshot: Buffer;

  try {
    const headerEl = await page.$('header, .header, nav, .navbar').catch(() => null);
    if (headerEl) {
      screenshot = await headerEl.screenshot({ type: 'jpeg', quality: 60 });
    } else {
      screenshot = await page.screenshot({
        type: 'jpeg',
        quality: 60,
        clip: { x: 0, y: 0, width: 600, height: 200 }
      });
    }
  } catch (error) {
    console.error('[COLOR] Screenshot failed:', error);
    // Return defaults
    return {
      primary: '#000000',
      secondary: '#FFFFFF',
      palette: ['#000000', '#FFFFFF']
    };
  }

  const vibrant = new Vibrant(screenshot);
  const palette = await vibrant.getPalette();

  // Categorize swatches: Muted = backgrounds, Vibrant = accents
  const backgroundSwatches = [
    palette.Muted,
    palette.DarkMuted,
    palette.LightMuted
  ].filter(s => s !== null && s !== undefined);

  const accentSwatches = [
    palette.Vibrant,
    palette.DarkVibrant,
    palette.LightVibrant
  ].filter(s => s !== null && s !== undefined);

  const goodBackgrounds = backgroundSwatches
    .map(s => s!.hex)
    .filter(isGoodBackgroundColor);

  const goodAccents = accentSwatches
    .map(s => s!.hex)
    .filter(isGoodAccentColor);

  if (goodBackgrounds.length === 0 && goodAccents.length === 0) {
    // Absolute fallback
    const allSwatches = Object.values(palette).filter(s => s !== null);
    const primary = allSwatches[0]?.hex || '#000000';
    const secondary = allSwatches[1]?.hex || '#FFFFFF';
    return {
      primary,
      secondary,
      palette: allSwatches.slice(0, 6).map(s => s!.hex)
    };
  }

  // Primary from background, secondary from accent
  const primary = goodBackgrounds.length > 0
    ? goodBackgrounds[0]
    : goodAccents[0] || '#000000';

  const secondary = goodAccents.length > 0
    ? goodAccents[0]
    : goodBackgrounds[1] || primary;

  const allGoodColors = [...goodBackgrounds, ...goodAccents];

  return {
    primary,
    secondary,
    palette: allGoodColors.slice(0, 6)
  };
}

// ============================================================================
// TEXT EXTRACTION - ABOUT & DISCLAIMER
// ============================================================================

/**
 * Extract "About" and "Disclaimer" text from the page
 * Best-effort heuristics for Brand Center defaults
 *
 * NOTE: Logo rendering issues (white/washed-out appearance) are front-end CSS problems
 * (background color, opacity, filters), not backend extraction issues. The logo URL
 * returned here is correct - any display issues should be fixed in the Brand Center UI.
 */
async function extractTextBlocks(page: Page): Promise<TextBlocks> {
  console.log('[TEXT] Extracting about and disclaimer text...');

  try {
    const textBlocks = await page.evaluate(() => {
      // Helper: normalize whitespace
      const normalize = (text: string): string => {
        return text.replace(/\s+/g, ' ').trim();
      };

      // Helper: check if text contains keywords (case-insensitive)
      const containsKeywords = (text: string, keywords: string[]): boolean => {
        const lower = text.toLowerCase();
        return keywords.some(kw => lower.includes(kw.toLowerCase()));
      };

      // Helper: check if element is inside navigation/header (likely not content)
      const isInNavigation = (el: Element): boolean => {
        let parent = el.parentElement;
        let depth = 0;
        while (parent && depth < 10) {
          const tag = parent.tagName.toLowerCase();
          if (tag === 'nav' || tag === 'header' || parent.getAttribute('role') === 'navigation') {
            return true;
          }
          parent = parent.parentElement;
          depth++;
        }
        return false;
      };

      // Helper: calculate link density (ratio of link text to total text)
      const getLinkDensity = (el: Element): number => {
        const totalText = el.textContent?.length || 0;
        if (totalText === 0) return 1;

        const links = el.querySelectorAll('a');
        let linkText = 0;
        links.forEach(link => {
          linkText += link.textContent?.length || 0;
        });

        return linkText / totalText;
      };

      // Helper: check if element is in main content area
      const isInMainContent = (el: Element): boolean => {
        let parent = el.parentElement;
        let depth = 0;
        while (parent && depth < 10) {
          const tag = parent.tagName.toLowerCase();
          if (tag === 'main' || tag === 'article' || parent.getAttribute('role') === 'main') {
            return true;
          }
          parent = parent.parentElement;
          depth++;
        }
        return false;
      };

      // ========================================================================
      // ABOUT TEXT EXTRACTION
      // ========================================================================

      interface AboutCandidate {
        text: string;
        score: number;
      }

      const aboutCandidates: AboutCandidate[] = [];

      // Strategy 1: Look for elements with "about" in id/class
      const aboutSelectors = [
        '[id*="about" i]',
        '[class*="about" i]',
        '[id*="our-firm" i]',
        '[class*="our-firm" i]',
        '[id*="our-company" i]',
        '[class*="our-company" i]',
        '[id*="who-we-are" i]',
        '[class*="who-we-are" i]'
      ];

      aboutSelectors.forEach(selector => {
        try {
          const elements = document.querySelectorAll(selector);
          Array.from(elements).slice(0, 10).forEach(el => {
            // Skip if in navigation/header
            if (isInNavigation(el)) {
              return;
            }

            const text = normalize(el.textContent || '');

            // Filter: minimum/maximum length
            if (text.length < 80 || text.length > 2000) {
              return;
            }

            // Filter: too much link density (probably navigation)
            const linkDensity = getLinkDensity(el);
            if (linkDensity > 0.4) { // More than 40% links = probably nav
              return;
            }

            // Score based on multiple factors
            let score = text.length / 10; // Base score from length

            // Keyword bonus
            if (containsKeywords(text, ['clients', 'firm', 'company', 'advisory', 'valuation', 'financial', 'services', 'experience', 'team', 'professionals', 'expertise'])) {
              score += 50;
            }

            // Main content bonus
            if (isInMainContent(el)) {
              score += 30;
            }

            // Low link density bonus (more content, less navigation)
            if (linkDensity < 0.15) {
              score += 20;
            }

            // Multiple paragraphs bonus (real content)
            const paragraphs = el.querySelectorAll('p');
            if (paragraphs.length >= 2) {
              score += 30;
            }

            aboutCandidates.push({ text, score });
          });
        } catch (e) {
          // Skip if selector fails
        }
      });

      // Strategy 2: Look for headings with "about" keywords followed by content
      const headings = document.querySelectorAll('h1, h2, h3');
      Array.from(headings).slice(0, 20).forEach(heading => {
        const headingText = normalize(heading.textContent || '');

        if (containsKeywords(headingText, ['About', 'About Us', 'Our Firm', 'Who We Are', 'Our Company', 'Our Story', 'Our Team'])) {
          // Skip if heading is in navigation
          if (isInNavigation(heading)) {
            return;
          }

          // Find the next sibling section/div/article
          let nextEl = heading.nextElementSibling;
          let attempts = 0;

          while (nextEl && attempts < 5) {
            if (nextEl.tagName === 'SECTION' || nextEl.tagName === 'DIV' || nextEl.tagName === 'ARTICLE') {
              const text = normalize(nextEl.textContent || '');

              if (text.length < 80 || text.length > 2000) {
                nextEl = nextEl.nextElementSibling;
                attempts++;
                continue;
              }

              const linkDensity = getLinkDensity(nextEl);
              if (linkDensity > 0.4) {
                nextEl = nextEl.nextElementSibling;
                attempts++;
                continue;
              }

              let score = text.length / 10 + 100; // Bonus for following heading

              if (containsKeywords(text, ['clients', 'firm', 'company', 'advisory', 'valuation', 'financial', 'services', 'experience', 'team', 'professionals', 'expertise'])) {
                score += 50;
              }

              if (isInMainContent(nextEl)) {
                score += 30;
              }

              if (linkDensity < 0.15) {
                score += 20;
              }

              const paragraphs = nextEl.querySelectorAll('p');
              if (paragraphs.length >= 2) {
                score += 30;
              }

              aboutCandidates.push({ text, score });
              break;
            }
            nextEl = nextEl.nextElementSibling;
            attempts++;
          }
        }
      });

      // Strategy 3: Look in main content areas for substantial text blocks
      const mainAreas = document.querySelectorAll('main, article, [role="main"]');
      Array.from(mainAreas).slice(0, 3).forEach(area => {
        const sections = area.querySelectorAll('section, div');
        Array.from(sections).slice(0, 20).forEach(section => {
          const text = normalize(section.textContent || '');

          if (text.length < 150 || text.length > 2000) {
            return;
          }

          const linkDensity = getLinkDensity(section);
          if (linkDensity > 0.3) {
            return;
          }

          // Must have business-related content
          if (!containsKeywords(text, ['clients', 'firm', 'company', 'advisory', 'valuation', 'financial', 'services', 'experience', 'team', 'professionals', 'expertise', 'business', 'industry'])) {
            return;
          }

          let score = text.length / 10 + 20; // Base score

          // Multiple paragraphs
          const paragraphs = section.querySelectorAll('p');
          if (paragraphs.length >= 3) {
            score += 40;
          }

          if (linkDensity < 0.1) {
            score += 30;
          }

          aboutCandidates.push({ text, score });
        });
      });

      // Pick best about candidate
      aboutCandidates.sort((a, b) => b.score - a.score);
      const aboutText = aboutCandidates.length > 0
        ? aboutCandidates[0].text.substring(0, 1000) // Truncate to 1000 chars
        : null;

      // ========================================================================
      // DISCLAIMER TEXT EXTRACTION
      // ========================================================================

      interface DisclaimerCandidate {
        text: string;
        score: number;
      }

      const disclaimerCandidates: DisclaimerCandidate[] = [];

      // Disclaimer keywords
      const disclaimerKeywords = [
        'disclaimer',
        'not investment advice',
        'does not constitute',
        'no guarantee',
        'for informational purposes only',
        'no representation',
        'securities offered through'
      ];

      // Look in footer, small, and p tags
      const disclaimerElements = [
        ...Array.from(document.querySelectorAll('footer')),
        ...Array.from(document.querySelectorAll('footer *')), // All elements inside footer
        ...Array.from(document.querySelectorAll('small')),
        ...Array.from(document.querySelectorAll('p'))
      ];

      disclaimerElements.slice(0, 100).forEach(el => {
        const text = normalize(el.textContent || '');

        // Must contain at least one disclaimer keyword
        if (!containsKeywords(text, disclaimerKeywords)) {
          return;
        }

        // Length filter
        if (text.length < 60 || text.length > 3000) {
          return;
        }

        let score = 0;

        // Large bonus for literal "disclaimer"
        if (text.toLowerCase().includes('disclaimer')) {
          score += 100;
        }

        // Bonus if inside footer
        let parent = el.parentElement;
        let depth = 0;
        while (parent && depth < 5) {
          if (parent.tagName === 'FOOTER') {
            score += 30;
            break;
          }
          parent = parent.parentElement;
          depth++;
        }

        // Length bonus (prefer mid-range)
        if (text.length >= 200 && text.length <= 1500) {
          score += 20;
        }

        // Count disclaimer keywords
        const keywordCount = disclaimerKeywords.filter(kw =>
          text.toLowerCase().includes(kw.toLowerCase())
        ).length;
        score += keywordCount * 10;

        disclaimerCandidates.push({ text, score });
      });

      // Pick best disclaimer candidate
      disclaimerCandidates.sort((a, b) => b.score - a.score);
      const disclaimerText = disclaimerCandidates.length > 0
        ? disclaimerCandidates[0].text.substring(0, 1000) // Truncate to 1000 chars
        : null;

      return { aboutText, disclaimerText };
    });

    console.log(`[TEXT] About length: ${textBlocks.aboutText?.length || 0} chars`);
    console.log(`[TEXT] Disclaimer length: ${textBlocks.disclaimerText?.length || 0} chars`);

    return {
      about: textBlocks.aboutText,
      disclaimer: textBlocks.disclaimerText
    };
  } catch (error) {
    console.error('[TEXT] Extraction failed:', error);
    return {
      about: null,
      disclaimer: null
    };
  }
}

// ============================================================================
// MAIN API HANDLER
// ============================================================================

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const MAX_TIME = 28000; // 28 second hard limit (Render has 30s timeout, leave 2s buffer)

  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    // Validate URL
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
    } catch {
      return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 });
    }

    // Wrap extraction in a timeout promise to prevent 502 errors
    const extractionPromise = performExtraction(url, startTime, MAX_TIME);
    const timeoutPromise = new Promise<NextResponse>((_, reject) => {
      setTimeout(() => reject(new Error('Extraction timeout')), MAX_TIME);
    });

    return await Promise.race([extractionPromise, timeoutPromise]);
  } catch (error) {
    console.error('[ERROR] Request error:', error);
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}

async function performExtraction(url: string, startTime: number, MAX_TIME: number): Promise<NextResponse> {
  let browser: Browser | undefined;

  try {
    console.log('[REQUEST] Starting extraction for:', url);

    // Launch browser
    console.log('[BROWSER] Launching...');
    browser = await chromium.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--single-process',
        '--no-zygote',
        '--force-color-profile=srgb' // Better color accuracy
      ]
    });

    const context = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
    });

    const page = await context.newPage();

    // Navigate with timeout
    console.log('[NAV] Navigating to', url);
    await page.goto(url, {
      waitUntil: 'domcontentloaded',
      timeout: 20000 // Reduced to 20s to leave more time for extraction
    });

    await page.waitForTimeout(500); // Let images load

    const elapsed = Date.now() - startTime;
    console.log(`[TIME] Navigation complete in ${elapsed}ms`);

    // Extract logo
    const logo = await extractLogo(page, url);

    // Extract colors - Stage 1: CSS signals (fast)
    const signals = await collectDomColorSignals(page);
    let colors = deriveBrandColorsFromSignals(signals);

    const elapsedAfterCSS = Date.now() - startTime;
    console.log(`[TIME] After CSS extraction: ${elapsedAfterCSS}ms`);

    // Stage 2: Screenshot fallback (only if needed and time permits)
    if (!colors && elapsedAfterCSS < MAX_TIME - 5000) {
      colors = await extractColorsFromScreenshot(page);
    } else if (!colors) {
      console.log('[COLOR] Skipping screenshot due to time budget');
      colors = {
        primary: '#000000',
        secondary: '#FFFFFF',
        palette: ['#000000', '#FFFFFF']
      };
    }

    // Extract text blocks (about & disclaimer)
    const textBlocks = await extractTextBlocks(page);

    await browser.close();

    const totalTime = Date.now() - startTime;
    console.log(`[SUCCESS] Extraction complete in ${totalTime}ms`);

    return NextResponse.json({
      logo,
      colors,
      about: textBlocks.about,
      disclaimer: textBlocks.disclaimer
    });
  } catch (error) {
    if (browser) {
      await browser.close().catch(() => {});
    }

    console.error('[ERROR]', error);

    return NextResponse.json(
      {
        error: error instanceof Error
          ? `Extraction failed: ${error.message}`
          : 'Extraction failed'
      },
      { status: 500 }
    );
  }
}
