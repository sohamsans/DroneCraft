"""
Scraper package for DroneCraft.
"""

from app.scraper.parser import SpecParser
from app.scraper.catalog_scraper import CatalogScraper

__all__ = ["SpecParser", "CatalogScraper"]
