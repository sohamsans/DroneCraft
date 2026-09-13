"""
Catalog Scraper & Live Retail Spec Fetcher for DroneCraft.
"""

import httpx
from typing import Dict, Any, Optional
from app.scraper.parser import SpecParser

class CatalogScraper:
    @staticmethod
    async def fetch_and_parse_url(url: str, category: str) -> Dict[str, Any]:
        """
        Fetches web page content and sanitizes spec sheet table.
        """
        try:
            async with httpx.AsyncClient(timeout=10.0, follow_redirects=True) as client:
                resp = await client.get(url, headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"})
                html = resp.text

            cat = category.lower()
            if "motor" in cat:
                specs = SpecParser.parse_motor_specs(html)
            elif "prop" in cat:
                specs = SpecParser.parse_propeller_specs(html)
            elif "bat" in cat:
                specs = SpecParser.parse_battery_specs(html)
            else:
                specs = {}

            return {
                "success": True,
                "url": url,
                "category": category,
                "extracted_specs": specs
            }
        except Exception as e:
            return {
                "success": False,
                "url": url,
                "error": str(e),
                "extracted_specs": {}
            }
