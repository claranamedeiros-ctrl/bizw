"""
Text Extraction using Mistral API
Extracts "about" and "disclaimer" text using AI instead of brittle heuristics.
"""

from bs4 import BeautifulSoup
from typing import Dict, Optional
import re
import json
from mistralai.client import MistralClient
from mistralai.models.chat_completion import ChatMessage


class TextExtractor:
    def __init__(self, mistral_api_key: str):
        """
        Initialize text extractor with Mistral API.

        Args:
            mistral_api_key: Mistral API key for LLM-based extraction
        """
        self.mistral_client = MistralClient(api_key=mistral_api_key)
        print("[TextExtractor] Initialized with Mistral API")

    async def extract_text(self, html_content: str) -> Dict[str, Optional[str]]:
        """
        Extract about and disclaimer text from HTML using Mistral API.

        Args:
            html_content: Raw HTML content

        Returns:
            {"about": "...", "disclaimer": "..."}
        """
        # First, clean HTML to get plain text
        cleaned_text = self._clean_html(html_content)

        if not cleaned_text or len(cleaned_text) < 100:
            print("[TextExtractor] Insufficient text content")
            return {"about": None, "disclaimer": None}

        # Truncate if too long (Mistral API limits)
        if len(cleaned_text) > 8000:
            cleaned_text = cleaned_text[:8000]

        print(f"[TextExtractor] Extracted {len(cleaned_text)} chars from HTML, sending to Mistral...")

        # Use Mistral API to extract structured information
        try:
            result = await self._extract_with_mistral(cleaned_text)
            print(f"[TextExtractor] Mistral extracted: about={bool(result.get('about'))}, "
                  f"disclaimer={bool(result.get('disclaimer'))}")
            return result

        except Exception as e:
            print(f"[TextExtractor] Mistral API error: {e}, falling back to heuristics")
            # Fallback to simple heuristics if API fails
            return self._extract_fallback(html_content)

    def _clean_html(self, html_content: str) -> str:
        """
        Clean HTML to extract meaningful text content.

        Args:
            html_content: Raw HTML

        Returns:
            Cleaned plain text
        """
        soup = BeautifulSoup(html_content, 'html.parser')

        # Remove non-content elements
        for tag in soup(['script', 'style', 'nav', 'header', 'footer', 'meta', 'link']):
            tag.decompose()

        # Get text
        text = soup.get_text(separator=' ', strip=True)

        # Normalize whitespace
        text = re.sub(r'\s+', ' ', text)

        return text.strip()

    async def _extract_with_mistral(self, text: str) -> Dict[str, Optional[str]]:
        """
        Use Mistral API to extract about and disclaimer from text.

        Args:
            text: Cleaned text content

        Returns:
            {"about": "...", "disclaimer": "..."}
        """
        # Create prompt for Mistral
        prompt = f"""You are analyzing website content. Extract the following information:

1. **Company description ("about")**: A concise 2-3 sentence summary of what the company does, their products/services, or their mission. Look for hero text, meta descriptions, or main content.

2. **Legal disclaimer**: Any legal disclaimers, investment warnings, or regulatory notices (e.g., "not investment advice", "for informational purposes only", "securities offered through", etc.)

Website text:
{text}

Return ONLY a JSON object with this exact structure:
{{
  "about": "company description here or null",
  "disclaimer": "legal disclaimer here or null"
}}

Rules:
- If you cannot find information, return null for that field
- Keep descriptions concise (max 300 characters each)
- For "about", focus on the main value proposition or what the company does
- For "disclaimer", look for legal or regulatory language
- Return ONLY valid JSON, no other text"""

        # Call Mistral API
        messages = [
            ChatMessage(role="user", content=prompt)
        ]

        response = self.mistral_client.chat(
            model="mistral-small-latest",  # Fast and cost-effective
            messages=messages,
            temperature=0.1,  # Low temperature for consistent extraction
            max_tokens=500
        )

        # Parse response
        response_text = response.choices[0].message.content.strip()

        # Extract JSON from response (in case model adds extra text)
        json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
        if json_match:
            result = json.loads(json_match.group())
        else:
            result = json.loads(response_text)

        # Validate structure
        if not isinstance(result, dict):
            raise ValueError("Response is not a dict")

        return {
            "about": result.get("about"),
            "disclaimer": result.get("disclaimer")
        }

    def _extract_fallback(self, html_content: str) -> Dict[str, Optional[str]]:
        """
        Fallback extraction using simple heuristics if Mistral API fails.

        Args:
            html_content: Raw HTML

        Returns:
            {"about": "...", "disclaimer": "..."}
        """
        soup = BeautifulSoup(html_content, 'html.parser')

        # Remove script, style, and nav elements
        for tag in soup(['script', 'style', 'nav', 'header', 'footer']):
            tag.decompose()

        # Extract about (use meta description as simple fallback)
        about = None
        meta_desc = (
            soup.find('meta', attrs={'name': 'description'}) or
            soup.find('meta', attrs={'property': 'og:description'})
        )
        if meta_desc and meta_desc.get('content'):
            desc = meta_desc['content'].strip()
            if 60 <= len(desc) <= 400:
                about = desc

        # Extract disclaimer (look for common disclaimer keywords)
        disclaimer = None
        disclaimer_keywords = [
            'disclaimer',
            'not investment advice',
            'not constitute',
            'no guarantee',
            'for informational purposes only',
            'no representation'
        ]

        footer = soup.find('footer')
        if footer:
            elements = footer.find_all(['p', 'div', 'small'])
            for el in elements:
                text = el.get_text(separator=' ', strip=True)
                text = re.sub(r'\s+', ' ', text).strip()

                if any(kw in text.lower() for kw in disclaimer_keywords):
                    if 60 <= len(text) <= 1500:
                        disclaimer = text[:1000]
                        break

        return {
            "about": about,
            "disclaimer": disclaimer
        }
