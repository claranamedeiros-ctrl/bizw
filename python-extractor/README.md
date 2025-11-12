# BizWorth Brand Extractor (Python/FastAPI)

**AI-powered logo, color, and text extraction** - replaces the 1000+ line Next.js heuristics with clean ML models.

## What This Does

Extracts brand data from any website URL:
- **Logo**: Uses OWLv2 zero-shot object detection (no training needed)
- **Colors**: K-Means clustering on screenshot + CSS parsing
- **Text**: BeautifulSoup HTML parsing (can be upgraded to local LLM)

Returns the same JSON structure as the old Next.js API:
```json
{
  "logo": "data:image/png;base64,...",
  "logoRaw": "https://...",
  "colors": {
    "primary": "#191a1b",
    "secondary": "#0000ee",
    "palette": ["#...", "..."]
  },
  "about": "Company description...",
  "disclaimer": "Legal disclaimer..."
}
```

## Why This is Better

| Old (Next.js/Playwright) | New (Python/AI) |
|-------------------------|-----------------|
| 1000+ lines of heuristics | 300 lines of clean code |
| Brittle CSS selectors | AI model (adapts to any site) |
| Manual scoring logic | Zero-shot detection |
| Sequential execution | Parallel extraction (3× faster) |
| Hard to maintain | Easy to understand |

## Installation

```bash
cd python-extractor

# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # or `venv\Scripts\activate` on Windows

# Install dependencies
pip install -r requirements.txt

# Install Playwright browsers
playwright install chromium
```

## Running Locally

```bash
python main.py
```

Server starts at `http://localhost:8000`

### Test It

```bash
curl -X POST http://localhost:8000/extract \
  -H "Content-Type: application/json" \
  -d '{"url": "https://www.stripe.com"}'
```

Or use the API docs at `http://localhost:8000/docs`

## API Endpoints

### POST `/extract`

Extract logo, colors, and text from a URL.

**Request:**
```json
{
  "url": "https://example.com"
}
```

**Response:**
```json
{
  "logo": "data:image/png;base64,...",
  "logoRaw": "https://example.com/logo.png",
  "colors": {
    "primary": "#000000",
    "secondary": "#FFFFFF",
    "palette": ["#000000", "#FFFFFF", ...]
  },
  "about": "Company description text",
  "disclaimer": "Legal disclaimer text",
  "error": null
}
```

### GET `/health`

Health check endpoint.

```json
{
  "status": "healthy",
  "models_loaded": true,
  "browser_ready": true
}
```

## Docker Deployment

```bash
# Build image
docker build -t bizworth-extractor .

# Run container
docker run -p 8000:8000 bizworth-extractor
```

## Architecture

```
main.py
├── LogoDetector (logo_detector.py)
│   └── OWLv2 zero-shot object detection
├── ColorExtractor (color_extractor.py)
│   └── K-Means clustering + CSS parsing
└── TextExtractor (text_extractor.py)
    └── BeautifulSoup HTML parsing
```

**Parallel execution**: All three extractors run simultaneously for 3× speedup.

## Upgrading Text Extraction

The current text extractor uses simple HTML parsing. To upgrade to a local LLM:

1. Add `llama-cpp-python` to requirements.txt
2. Download a small model (e.g., Llama 3.2 3B or Mistral 7B quantized)
3. Update `text_extractor.py` to use the LLM for summarization

Example:
```python
from llama_cpp import Llama

llm = Llama(model_path="./models/llama-3.2-3b.gguf")

def extract_with_llm(html):
    prompt = f"Extract the company's about section from this HTML: {html[:2000]}"
    return llm(prompt, max_tokens=200)
```

## Performance

- **Startup**: ~5-10 seconds (loads OWLv2 model)
- **Per request**: ~2-5 seconds (parallel extraction)
- **Memory**: ~2GB (OWLv2 + Playwright)
- **GPU**: Optional (CPU works fine, GPU is 2-3× faster)

## Troubleshooting

**ModuleNotFoundError: No module named 'transformers'**
```bash
pip install -r requirements.txt
```

**Playwright browsers not found**
```bash
playwright install chromium
```

**CUDA out of memory (if using GPU)**
- The model will automatically fall back to CPU
- Or reduce `n_colors` in `ColorExtractor` to use less memory

## Integration with Next.js App

Option 1: **Direct replacement** - update Next.js to call Python service
```typescript
// In Next.js API route
const response = await fetch('http://python-service:8000/extract', {
  method: 'POST',
  body: JSON.stringify({ url })
});
```

Option 2: **Side-by-side** - keep both services, use Python for new requests

Option 3: **Gradual migration** - proxy old endpoint to Python gradually
