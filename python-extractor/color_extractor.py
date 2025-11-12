"""
Color Extraction using K-Means Clustering
Simple, fast, and effective - no complex CSS parsing needed.
"""

import numpy as np
from PIL import Image
from sklearn.cluster import KMeans
from typing import Dict, List, Any
from bs4 import BeautifulSoup
import re


class ColorExtractor:
    def __init__(self, n_colors=8):
        """Initialize color extractor with number of dominant colors to find"""
        self.n_colors = n_colors
        print(f"[ColorExtractor] Initialized with n_colors={n_colors}")

    async def extract_colors(self, image: Image.Image, html_content: str) -> Dict[str, Any]:
        """
        Extract brand colors from image using K-Means clustering.
        Also tries to find colors from CSS/HTML as backup.

        Returns:
            {"primary": "#...", "secondary": "#...", "palette": ["#...", ...]}
        """
        # Method 1: Extract from screenshot using K-Means
        screenshot_colors = self._extract_from_screenshot(image)

        # Method 2: Try to find colors from CSS/HTML
        css_colors = self._extract_from_css(html_content)

        # Combine: prefer screenshot colors, but use CSS as hints
        all_colors = screenshot_colors + css_colors

        # Remove duplicates and filter
        unique_colors = self._deduplicate_colors(all_colors)
        filtered_colors = self._filter_colors(unique_colors)

        if len(filtered_colors) < 2:
            # Fallback to black/white
            return {
                "primary": "#000000",
                "secondary": "#FFFFFF",
                "palette": ["#000000", "#FFFFFF"]
            }

        # Primary = most saturated or darkest
        # Secondary = second most saturated
        primary, secondary = self._select_primary_secondary(filtered_colors)

        return {
            "primary": primary,
            "secondary": secondary,
            "palette": filtered_colors[:8]  # Top 8 colors
        }

    def _extract_from_screenshot(self, image: Image.Image) -> List[str]:
        """Extract dominant colors from screenshot using K-Means"""
        # Resize image for faster processing
        img = image.copy()
        img.thumbnail((400, 400))

        # Convert to numpy array
        img_array = np.array(img)

        # Reshape to (n_pixels, 3)
        pixels = img_array.reshape(-1, 3)

        # Remove pure white/black pixels (likely background noise)
        mask = ~((pixels.sum(axis=1) > 250 * 3) | (pixels.sum(axis=1) < 10 * 3))
        pixels = pixels[mask]

        if len(pixels) < 100:
            return []

        # K-Means clustering
        kmeans = KMeans(n_clusters=min(self.n_colors, len(pixels)), random_state=42, n_init=10)
        kmeans.fit(pixels)

        # Get cluster centers (dominant colors)
        colors = kmeans.cluster_centers_.astype(int)

        # Convert to hex
        hex_colors = [self._rgb_to_hex(color) for color in colors]

        return hex_colors

    def _extract_from_css(self, html_content: str) -> List[str]:
        """Extract colors mentioned in CSS/inline styles"""
        soup = BeautifulSoup(html_content, 'html.parser')
        colors = []

        # Find style tags
        for style_tag in soup.find_all('style'):
            css = style_tag.string
            if css:
                colors.extend(self._find_hex_colors(css))

        # Find inline styles
        for element in soup.find_all(style=True):
            style = element.get('style', '')
            colors.extend(self._find_hex_colors(style))

        return colors

    def _find_hex_colors(self, text: str) -> List[str]:
        """Find all hex colors in text"""
        # Match #RGB or #RRGGBB
        pattern = r'#[0-9a-fA-F]{3,6}\b'
        matches = re.findall(pattern, text)

        # Normalize to 6 digits
        normalized = []
        for match in matches:
            if len(match) == 4:  # #RGB
                normalized.append('#' + ''.join([c*2 for c in match[1:]]))
            else:  # #RRGGBB
                normalized.append(match.upper())

        return normalized

    def _rgb_to_hex(self, rgb: np.ndarray) -> str:
        """Convert RGB array to hex string"""
        return '#{:02x}{:02x}{:02x}'.format(int(rgb[0]), int(rgb[1]), int(rgb[2])).upper()

    def _deduplicate_colors(self, colors: List[str]) -> List[str]:
        """Remove duplicate colors (within a tolerance)"""
        seen = []
        for color in colors:
            if not any(self._color_distance(color, seen_color) < 20 for seen_color in seen):
                seen.append(color)
        return seen

    def _color_distance(self, hex1: str, hex2: str) -> float:
        """Calculate Euclidean distance between two hex colors"""
        rgb1 = self._hex_to_rgb(hex1)
        rgb2 = self._hex_to_rgb(hex2)
        if rgb1 is None or rgb2 is None:
            return 999
        return np.linalg.norm(np.array(rgb1) - np.array(rgb2))

    def _hex_to_rgb(self, hex_color: str) -> tuple:
        """Convert hex to RGB tuple"""
        hex_color = hex_color.lstrip('#')
        if len(hex_color) != 6:
            return None
        return tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4))

    def _filter_colors(self, colors: List[str]) -> List[str]:
        """Filter out near-white, near-black, and very gray colors"""
        filtered = []

        for color in colors:
            rgb = self._hex_to_rgb(color)
            if rgb is None:
                continue

            brightness = sum(rgb) / 3
            saturation = self._get_saturation(rgb)

            # Filter very bright (near-white)
            if brightness > 240:
                continue

            # Filter very dark (near-black)
            if brightness < 20:
                continue

            # Filter very gray (low saturation)
            if saturation < 0.1:
                continue

            filtered.append(color)

        return filtered

    def _get_saturation(self, rgb: tuple) -> float:
        """Calculate saturation of RGB color"""
        r, g, b = rgb
        max_val = max(r, g, b)
        min_val = min(r, g, b)
        return 0 if max_val == 0 else (max_val - min_val) / max_val

    def _select_primary_secondary(self, colors: List[str]) -> tuple:
        """Select primary and secondary colors based on saturation and brightness"""
        if len(colors) == 0:
            return "#000000", "#FFFFFF"

        if len(colors) == 1:
            return colors[0], colors[0]

        # Score colors by saturation (more saturated = better brand color)
        scored = []
        for color in colors:
            rgb = self._hex_to_rgb(color)
            if rgb:
                saturation = self._get_saturation(rgb)
                brightness = sum(rgb) / 3
                # Prefer medium brightness, high saturation
                score = saturation * (1 - abs(brightness - 128) / 128)
                scored.append((color, score))

        # Sort by score
        scored.sort(key=lambda x: x[1], reverse=True)

        primary = scored[0][0]
        secondary = scored[1][0] if len(scored) > 1 else primary

        return primary, secondary
