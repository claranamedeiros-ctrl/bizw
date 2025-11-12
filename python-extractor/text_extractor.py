"""
Text Extraction using Simple HTML Parsing
Extracts "about" and "disclaimer" text from HTML.
Can be extended with local LLM (Llama/Mistral) in the future.
"""

from bs4 import BeautifulSoup
from typing import Dict, Optional, List
import re


class TextExtractor:
    def __init__(self):
        """Initialize text extractor"""
        print("[TextExtractor] Initialized (using HTML parsing)")

    async def extract_text(self, html_content: str) -> Dict[str, Optional[str]]:
        """
        Extract about and disclaimer text from HTML.

        Returns:
            {"about": "...", "disclaimer": "..."}
        """
        soup = BeautifulSoup(html_content, 'html.parser')

        # Remove script, style, and nav elements
        for tag in soup(['script', 'style', 'nav', 'header', 'footer']):
            tag.decompose()

        # Extract about text
        about = self._extract_about(soup)

        # Extract disclaimer
        disclaimer = self._extract_disclaimer(soup)

        return {
            "about": about,
            "disclaimer": disclaimer
        }

    def _extract_about(self, soup: BeautifulSoup) -> Optional[str]:
        """
        Extract "about" text using multiple strategies.

        Priority:
        1. Meta description (fast, accurate for most sites)
        2. Elements with "about" in id/class
        3. Hero section (h1 + first paragraphs)
        4. Main content area
        """
        # Strategy 1: Meta description (most reliable)
        meta_desc = (
            soup.find('meta', attrs={'name': 'description'}) or
            soup.find('meta', attrs={'property': 'og:description'}) or
            soup.find('meta', attrs={'name': 'twitter:description'})
        )

        if meta_desc and meta_desc.get('content'):
            desc = meta_desc['content'].strip()
            if 60 <= len(desc) <= 400:
                # Filter out obvious junk
                junk_keywords = ['cookie', 'privacy policy', 'terms and conditions']
                if not any(kw in desc.lower() for kw in junk_keywords):
                    return desc

        # Strategy 2: Elements with "about" in id/class
        about_selectors = ['#about', '.about', '[class*="about"]', '[id*="about"]']
        for selector in about_selectors:
            try:
                elements = soup.select(selector)
                for el in elements:
                    text = self._get_clean_text(el)
                    if 100 <= len(text) <= 1000:
                        return text[:1000]
            except:
                continue

        # Strategy 3: Hero section (h1 + first paragraphs)
        main_area = soup.find('main') or soup.find('body')
        if main_area:
            h1 = main_area.find('h1')
            if h1:
                hero_text = h1.get_text(strip=True)

                # Get next 1-3 paragraphs
                next_el = h1.find_next_sibling()
                para_count = 0
                while next_el and para_count < 3:
                    if next_el.name == 'p':
                        para_text = next_el.get_text(strip=True)
                        if len(para_text) > 50:
                            hero_text += '. ' + para_text
                            para_count += 1
                    next_el = next_el.find_next_sibling()

                if 80 <= len(hero_text) <= 600:
                    return hero_text

        # Strategy 4: First substantial paragraph in main
        if main_area:
            paragraphs = main_area.find_all('p')
            for p in paragraphs[:10]:
                text = p.get_text(strip=True)
                # Filter out navigation/CTA paragraphs
                if len(text) > 100 and self._link_density(p) < 0.3:
                    # Check for business-related keywords
                    keywords = ['company', 'business', 'service', 'team', 'professional', 'experience']
                    if any(kw in text.lower() for kw in keywords):
                        return text[:1000]

        return None

    def _extract_disclaimer(self, soup: BeautifulSoup) -> Optional[str]:
        """
        Extract disclaimer text from footer or small print.

        Looks for legal disclaimers like:
        - "not investment advice"
        - "for informational purposes only"
        - "no guarantee"
        - etc.
        """
        disclaimer_keywords = [
            'disclaimer',
            'not investment advice',
            'not constitute',
            'no guarantee',
            'for informational purposes only',
            'no representation',
            'securities offered through'
        ]

        # Search in footer
        footer = soup.find('footer')
        if footer:
            elements = footer.find_all(['p', 'div', 'small'])
            for el in elements:
                text = self._get_clean_text(el)

                # Must contain at least one disclaimer keyword
                if any(kw in text.lower() for kw in disclaimer_keywords):
                    # Length filter
                    if 60 <= len(text) <= 1500:
                        # Filter out high link density (probably nav)
                        if self._link_density(el) < 0.5:
                            return text[:1000]

        # Fallback: search all small tags
        small_tags = soup.find_all('small')
        for tag in small_tags:
            text = self._get_clean_text(tag)
            if any(kw in text.lower() for kw in disclaimer_keywords):
                if 60 <= len(text) <= 1500:
                    return text[:1000]

        return None

    def _get_clean_text(self, element) -> str:
        """Get text from element, cleaned of extra whitespace"""
        # Get text
        text = element.get_text(separator=' ', strip=True)

        # Normalize whitespace
        text = re.sub(r'\s+', ' ', text)

        return text.strip()

    def _link_density(self, element) -> float:
        """Calculate ratio of link text to total text"""
        total_text = len(element.get_text(strip=True))
        if total_text == 0:
            return 1.0

        link_text = sum(len(a.get_text(strip=True)) for a in element.find_all('a'))

        return link_text / total_text
