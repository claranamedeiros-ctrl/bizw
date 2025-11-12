"""
BizWorth Logo & Brand Extraction Service (Python/FastAPI)
Replaces the 1000+ line Next.js heuristics with AI models.
"""

import asyncio
import io
import base64
from typing import Dict, Any, Optional, List
from PIL import Image
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from playwright.async_api import async_playwright, Page, Browser
import torch

# Import extraction modules (we'll create these)
from logo_detector import LogoDetector
from color_extractor import ColorExtractor
from text_extractor import TextExtractor

app = FastAPI(title="BizWorth Brand Extractor", version="2.0.0")

# Global instances (loaded once at startup)
logo_detector: Optional[LogoDetector] = None
color_extractor: Optional[ColorExtractor] = None
text_extractor: Optional[TextExtractor] = None
browser: Optional[Browser] = None


class ExtractionRequest(BaseModel):
    url: str


class ExtractionResponse(BaseModel):
    logo: Optional[str]
    logoRaw: Optional[str]
    colors: Dict[str, Any]
    about: Optional[str]
    disclaimer: Optional[str]
    error: Optional[str] = None


@app.on_event("startup")
async def startup_event():
    """Initialize models and browser once at startup"""
    global logo_detector, color_extractor, text_extractor, browser

    print("[STARTUP] Initializing models...")

    # Initialize AI models
    logo_detector = LogoDetector()
    color_extractor = ColorExtractor()
    text_extractor = TextExtractor()

    # Initialize Playwright browser
    playwright = await async_playwright().start()
    browser = await playwright.chromium.launch(headless=True)

    print("[STARTUP] Ready!")


@app.on_event("shutdown")
async def shutdown_event():
    """Clean up resources"""
    global browser
    if browser:
        await browser.close()
    print("[SHUTDOWN] Complete")


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "models_loaded": logo_detector is not None,
        "browser_ready": browser is not None
    }


@app.post("/extract", response_model=ExtractionResponse)
async def extract_brand_data(request: ExtractionRequest):
    """
    Extract logo, colors, and text from a website URL.

    Returns same JSON structure as the old Next.js endpoint:
    {
        "logo": "data:image/png;base64,...",
        "logoRaw": "https://...",
        "colors": {"primary": "#...", "secondary": "#...", "palette": [...]},
        "about": "...",
        "disclaimer": "..."
    }
    """
    url = request.url

    if not url:
        raise HTTPException(status_code=400, detail="URL is required")

    if not browser:
        raise HTTPException(status_code=503, detail="Browser not initialized")

    print(f"[REQUEST] Extracting from: {url}")

    try:
        # Step 1: Render page with Playwright
        page = await browser.new_page()
        await page.goto(url, wait_until="domcontentloaded", timeout=15000)
        await page.wait_for_timeout(1000)  # Let JS/images load

        # Step 2: Get screenshot and HTML
        screenshot_bytes = await page.screenshot(full_page=False)
        html_content = await page.content()

        # Step 3: Run three extractions in parallel
        logo_task = extract_logo(page, screenshot_bytes, url)
        color_task = extract_colors(screenshot_bytes, html_content)
        text_task = extract_text(html_content)

        logo_result, colors_result, text_result = await asyncio.gather(
            logo_task, color_task, text_task, return_exceptions=True
        )

        await page.close()

        # Handle any exceptions
        if isinstance(logo_result, Exception):
            print(f"[ERROR] Logo extraction failed: {logo_result}")
            logo_result = {"logo": None, "logoRaw": None}

        if isinstance(colors_result, Exception):
            print(f"[ERROR] Color extraction failed: {colors_result}")
            colors_result = {"primary": "#000000", "secondary": "#FFFFFF", "palette": ["#000000", "#FFFFFF"]}

        if isinstance(text_result, Exception):
            print(f"[ERROR] Text extraction failed: {text_result}")
            text_result = {"about": None, "disclaimer": None}

        return ExtractionResponse(
            logo=logo_result.get("logo"),
            logoRaw=logo_result.get("logoRaw"),
            colors=colors_result,
            about=text_result.get("about"),
            disclaimer=text_result.get("disclaimer")
        )

    except Exception as e:
        print(f"[ERROR] Extraction failed: {e}")
        raise HTTPException(status_code=500, detail=f"Extraction failed: {str(e)}")


async def extract_logo(page: Page, screenshot_bytes: bytes, base_url: str) -> Dict[str, Optional[str]]:
    """
    Use OWLv2 to detect the logo in the screenshot.
    Returns: {"logo": data_url_of_cropped_logo, "logoRaw": original_url_if_found}
    """
    print("[LOGO] Detecting logo with OWLv2...")

    try:
        screenshot_image = Image.open(io.BytesIO(screenshot_bytes))

        # Use OWLv2 to detect "company logo" or "brand logo"
        logo_bbox, confidence = await logo_detector.detect_logo(screenshot_image)

        if logo_bbox and confidence > 0.15:  # Confidence threshold
            # Crop the detected logo region
            cropped_logo = screenshot_image.crop(logo_bbox)

            # Convert to base64 PNG
            buffered = io.BytesIO()
            cropped_logo.save(buffered, format="PNG")
            logo_b64 = base64.b64encode(buffered.getvalue()).decode()
            logo_data_url = f"data:image/png;base64,{logo_b64}"

            print(f"[LOGO] Detected logo with confidence {confidence:.2f}")

            # Try to find the original logo URL from HTML (as logoRaw)
            logo_raw = await find_logo_url_from_dom(page, logo_bbox)

            return {"logo": logo_data_url, "logoRaw": logo_raw}
        else:
            print("[LOGO] No logo detected with sufficient confidence")
            return {"logo": None, "logoRaw": None}

    except Exception as e:
        print(f"[LOGO] Detection failed: {e}")
        return {"logo": None, "logoRaw": None}


async def find_logo_url_from_dom(page: Page, bbox: tuple) -> Optional[str]:
    """
    Try to find the original logo URL by checking DOM elements at the detected coordinates.
    This provides the logoRaw field for debugging.
    """
    try:
        # Get element at the center of detected bbox
        x = (bbox[0] + bbox[2]) / 2
        y = (bbox[1] + bbox[3]) / 2

        element = await page.evaluate(f"""
            () => {{
                const el = document.elementFromPoint({x}, {y});
                if (!el) return null;

                // Check if it's an img
                if (el.tagName === 'IMG') return el.src;

                // Check if it has background-image
                const bgImg = window.getComputedStyle(el).backgroundImage;
                if (bgImg && bgImg !== 'none') {{
                    const match = bgImg.match(/url\\(['"]?(.+?)['"]?\\)/);
                    if (match) return match[1];
                }}

                // Check for nested img
                const img = el.querySelector('img');
                if (img) return img.src;

                return null;
            }}
        """)

        return element if element else None

    except Exception as e:
        print(f"[LOGO] Failed to find DOM URL: {e}")
        return None


async def extract_colors(screenshot_bytes: bytes, html_content: str) -> Dict[str, Any]:
    """
    Extract brand colors from screenshot or CSS.
    Returns: {"primary": "#...", "secondary": "#...", "palette": ["#...", ...]}
    """
    print("[COLOR] Extracting colors...")

    try:
        screenshot_image = Image.open(io.BytesIO(screenshot_bytes))

        # Simple approach: get dominant colors from screenshot
        colors = await color_extractor.extract_colors(screenshot_image, html_content)

        print(f"[COLOR] Extracted colors: primary={colors['primary']}, secondary={colors['secondary']}")
        return colors

    except Exception as e:
        print(f"[COLOR] Extraction failed: {e}")
        return {
            "primary": "#000000",
            "secondary": "#FFFFFF",
            "palette": ["#000000", "#FFFFFF"]
        }


async def extract_text(html_content: str) -> Dict[str, Optional[str]]:
    """
    Extract about and disclaimer text from HTML.
    Returns: {"about": "...", "disclaimer": "..."}
    """
    print("[TEXT] Extracting text blocks...")

    try:
        text_blocks = await text_extractor.extract_text(html_content)

        print(f"[TEXT] About: {len(text_blocks.get('about', '') or '')} chars, "
              f"Disclaimer: {len(text_blocks.get('disclaimer', '') or '')} chars")

        return text_blocks

    except Exception as e:
        print(f"[TEXT] Extraction failed: {e}")
        return {"about": None, "disclaimer": None}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
