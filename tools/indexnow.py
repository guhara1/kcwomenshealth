#!/usr/bin/env python3
"""
IndexNow API client for submitting URLs to Bing and Naver search engines.
Supports bulk URL submission and automatic updates when content changes.
"""

import requests
import json
import sys
from datetime import datetime
from pathlib import Path
from typing import List, Optional
import logging

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class IndexNowClient:
    def __init__(self, domain: str, indexnow_key: str):
        """Initialize IndexNow client with domain and API key."""
        self.domain = domain
        self.indexnow_key = indexnow_key
        self.bing_endpoint = "https://www.bing.com/indexnow"
        self.naver_endpoint = "https://api.indexnow.org/indexnow"

    def submit_urls(self, urls: List[str], key_location: Optional[str] = None) -> dict:
        """
        Submit URLs to IndexNow (Bing and Naver).

        Args:
            urls: List of URLs to submit
            key_location: Optional location of the key file (e.g., https://domain.com/indexnow-key.txt)

        Returns:
            Dictionary with submission results for each endpoint
        """
        payload = {
            "host": self.domain,
            "key": self.indexnow_key,
            "keyLocation": key_location or f"https://{self.domain}/indexnow-key.txt",
            "urlList": urls[:10000]  # IndexNow limits to 10k per request
        }

        results = {}

        # Submit to Bing
        logger.info(f"Submitting {len(urls)} URLs to Bing IndexNow...")
        try:
            response = requests.post(
                self.bing_endpoint,
                json=payload,
                timeout=10
            )
            results['bing'] = {
                'status': response.status_code,
                'success': response.status_code in [200, 202],
                'message': response.text if response.text else 'Accepted'
            }
            logger.info(f"Bing: {response.status_code}")
        except Exception as e:
            logger.error(f"Bing submission failed: {e}")
            results['bing'] = {'success': False, 'error': str(e)}

        # Submit to Naver (alternative IndexNow endpoint)
        logger.info(f"Submitting {len(urls)} URLs to Naver IndexNow...")
        try:
            response = requests.post(
                self.naver_endpoint,
                json=payload,
                timeout=10
            )
            results['naver'] = {
                'status': response.status_code,
                'success': response.status_code in [200, 202],
                'message': response.text if response.text else 'Accepted'
            }
            logger.info(f"Naver: {response.status_code}")
        except Exception as e:
            logger.error(f"Naver submission failed: {e}")
            results['naver'] = {'success': False, 'error': str(e)}

        return results

    def batch_submit(self, urls: List[str], batch_size: int = 10000) -> List[dict]:
        """
        Submit large URL lists in batches.

        Args:
            urls: List of all URLs to submit
            batch_size: URLs per batch (max 10k per IndexNow spec)

        Returns:
            List of results for each batch
        """
        results = []
        total_batches = (len(urls) + batch_size - 1) // batch_size

        for i in range(0, len(urls), batch_size):
            batch = urls[i:i + batch_size]
            batch_num = i // batch_size + 1
            logger.info(f"Submitting batch {batch_num}/{total_batches} ({len(batch)} URLs)...")

            batch_result = self.submit_urls(batch)
            batch_result['batch'] = batch_num
            batch_result['count'] = len(batch)
            results.append(batch_result)

        return results


def extract_urls_from_sitemap(sitemap_url: str, domain: str) -> List[str]:
    """Extract all URLs from sitemap."""
    try:
        response = requests.get(sitemap_url, timeout=10)
        response.raise_for_status()

        # Parse XML sitemap
        import xml.etree.ElementTree as ET
        root = ET.fromstring(response.content)

        # Handle sitemap index (multiple sitemaps)
        if 'sitemapindex' in root.tag:
            urls = []
            for sitemap in root.findall('.//{http://www.sitemaps.org/schemas/sitemap/0.9}loc'):
                child_sitemap_url = sitemap.text
                logger.info(f"Found sitemap: {child_sitemap_url}")
                urls.extend(extract_urls_from_sitemap(child_sitemap_url, domain))
            return urls

        # Extract URLs from regular sitemap
        urls = []
        for url_elem in root.findall('.//{http://www.sitemaps.org/schemas/sitemap/0.9}loc'):
            url = url_elem.text
            if url.startswith('http'):
                urls.append(url)

        return urls

    except Exception as e:
        logger.error(f"Failed to extract URLs from sitemap: {e}")
        return []


def load_config(config_file: str = '.env.local') -> dict:
    """Load configuration from .env file."""
    config = {}
    config_path = Path(config_file)

    if config_path.exists():
        with open(config_path, 'r') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    key, value = line.split('=', 1)
                    config[key.strip()] = value.strip().strip('"\'')

    return config


def main():
    """Main entry point for IndexNow submission."""
    import argparse

    parser = argparse.ArgumentParser(description='IndexNow URL submission tool')
    parser.add_argument('--domain', help='Domain to submit (e.g., example.com)')
    parser.add_argument('--key', help='IndexNow API key')
    parser.add_argument('--sitemap', help='Sitemap URL to extract URLs from')
    parser.add_argument('--urls', nargs='+', help='URLs to submit')
    parser.add_argument('--batch', type=int, default=10000, help='Batch size for submissions')
    parser.add_argument('--config', default='.env.local', help='Config file path')

    args = parser.parse_args()

    # Load config
    config = load_config(args.config)

    domain = args.domain or config.get('INDEXNOW_DOMAIN', '').replace('https://', '').replace('http://', '')
    key = args.key or config.get('INDEXNOW_KEY', '')

    if not domain or not key:
        logger.error("Domain and IndexNow key are required.")
        logger.error("Provide via --domain/--key or set INDEXNOW_DOMAIN/INDEXNOW_KEY in .env.local")
        sys.exit(1)

    client = IndexNowClient(domain, key)

    # Get URLs
    urls = []
    if args.sitemap:
        logger.info(f"Extracting URLs from sitemap: {args.sitemap}")
        urls = extract_urls_from_sitemap(args.sitemap, domain)
    elif args.urls:
        urls = args.urls
    else:
        logger.error("Please provide --sitemap or --urls")
        sys.exit(1)

    if not urls:
        logger.error("No URLs found to submit")
        sys.exit(1)

    logger.info(f"Found {len(urls)} URLs to submit")

    # Submit URLs
    results = client.batch_submit(urls, batch_size=args.batch)

    # Print summary
    logger.info("\n=== Submission Summary ===")
    total_success = 0
    for result in results:
        batch_num = result.get('batch', '?')
        count = result.get('count', 0)
        bing_ok = result.get('bing', {}).get('success', False)
        naver_ok = result.get('naver', {}).get('success', False)

        if bing_ok and naver_ok:
            total_success += count
            logger.info(f"Batch {batch_num}: ✓ {count} URLs ({bing_ok=}, {naver_ok=})")
        else:
            logger.warning(f"Batch {batch_num}: ✗ {count} URLs ({bing_ok=}, {naver_ok=})")

    logger.info(f"Total successful URLs: {total_success}/{len(urls)}")

    # Save results
    timestamp = datetime.now().isoformat()
    results_file = Path('indexnow-results.json')
    with open(results_file, 'w') as f:
        json.dump({
            'timestamp': timestamp,
            'domain': domain,
            'total_urls': len(urls),
            'results': results
        }, f, indent=2)

    logger.info(f"Results saved to {results_file}")


if __name__ == '__main__':
    main()
