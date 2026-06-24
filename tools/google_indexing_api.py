#!/usr/bin/env python3
"""
Google Indexing API client for instant URL indexing.
Requires Google Cloud credentials with Indexing API enabled.
"""

import json
import sys
import logging
from pathlib import Path
from typing import List, Optional
from datetime import datetime

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class GoogleIndexingAPIClient:
    """Google Indexing API client for submitting URLs."""

    def __init__(self, credentials_file: str):
        """
        Initialize with Google Cloud credentials.

        Args:
            credentials_file: Path to service account JSON credentials
        """
        self.credentials_file = credentials_file
        self.access_token = None
        self._auth_initialized = False

        if not Path(credentials_file).exists():
            raise FileNotFoundError(f"Credentials file not found: {credentials_file}")

    def _get_access_token(self) -> str:
        """Get access token using service account credentials."""
        try:
            from google.oauth2 import service_account
        except ImportError:
            logger.error("google-auth library not installed. Run: pip install google-auth")
            sys.exit(1)

        try:
            credentials = service_account.Credentials.from_service_account_file(
                self.credentials_file,
                scopes=['https://www.googleapis.com/auth/indexing']
            )
            self.access_token = credentials.token
            logger.info("Google authentication successful")
            return self.access_token
        except Exception as e:
            logger.error(f"Google authentication failed: {e}")
            raise

    def submit_url(self, url: str, operation: str = 'URL_UPDATED') -> dict:
        """
        Submit a single URL to Google Indexing API.

        Args:
            url: URL to submit
            operation: 'URL_UPDATED' or 'URL_DELETED'

        Returns:
            API response
        """
        try:
            import requests
        except ImportError:
            logger.error("requests library not installed. Run: pip install requests")
            sys.exit(1)

        if not self.access_token:
            self._get_access_token()

        endpoint = 'https://indexing.googleapis.com/batch'
        headers = {
            'Authorization': f'Bearer {self.access_token}',
            'Content-Type': 'application/json'
        }

        body = {
            'url': url,
            'type': operation
        }

        try:
            response = requests.post(
                endpoint,
                headers=headers,
                json=body,
                timeout=10
            )

            result = {
                'url': url,
                'status': response.status_code,
                'success': response.status_code in [200, 204]
            }

            if response.text:
                try:
                    result['response'] = response.json()
                except:
                    result['response'] = response.text

            return result

        except Exception as e:
            logger.error(f"Failed to submit {url}: {e}")
            return {
                'url': url,
                'success': False,
                'error': str(e)
            }

    def submit_urls(self, urls: List[str], operation: str = 'URL_UPDATED') -> List[dict]:
        """
        Submit multiple URLs to Google Indexing API.

        Args:
            urls: List of URLs to submit
            operation: 'URL_UPDATED' or 'URL_DELETED'

        Returns:
            List of API responses
        """
        logger.info(f"Submitting {len(urls)} URLs to Google Indexing API...")

        results = []
        for i, url in enumerate(urls, 1):
            logger.info(f"[{i}/{len(urls)}] Submitting: {url}")
            result = self.submit_url(url, operation)
            results.append(result)

            if not result['success']:
                logger.warning(f"  Failed: {result.get('error', 'Unknown error')}")
            else:
                logger.info(f"  Success")

        return results

    def batch_submit(self, urls: List[str], batch_size: int = 100, operation: str = 'URL_UPDATED') -> List[List[dict]]:
        """
        Submit URLs in batches with rate limiting.

        Args:
            urls: List of URLs to submit
            batch_size: URLs per batch
            operation: 'URL_UPDATED' or 'URL_DELETED'

        Returns:
            List of batch results
        """
        import time

        results = []
        total_batches = (len(urls) + batch_size - 1) // batch_size

        for i in range(0, len(urls), batch_size):
            batch = urls[i:i + batch_size]
            batch_num = i // batch_size + 1

            logger.info(f"\nBatch {batch_num}/{total_batches}")
            batch_results = self.submit_urls(batch, operation)
            results.append(batch_results)

            # Rate limiting between batches
            if batch_num < total_batches:
                logger.info("Waiting 2 seconds before next batch...")
                time.sleep(2)

        return results


def extract_urls_from_sitemap(sitemap_url: str) -> List[str]:
    """Extract all URLs from sitemap."""
    try:
        import requests
        import xml.etree.ElementTree as ET
    except ImportError:
        logger.error("requests library not installed. Run: pip install requests")
        sys.exit(1)

    try:
        response = requests.get(sitemap_url, timeout=10)
        response.raise_for_status()

        root = ET.fromstring(response.content)

        # Handle sitemap index
        if 'sitemapindex' in root.tag:
            urls = []
            for sitemap in root.findall('.//{http://www.sitemaps.org/schemas/sitemap/0.9}loc'):
                child_url = sitemap.text
                logger.info(f"Found sitemap: {child_url}")
                urls.extend(extract_urls_from_sitemap(child_url))
            return urls

        # Extract URLs
        urls = []
        for url_elem in root.findall('.//{http://www.sitemaps.org/schemas/sitemap/0.9}loc'):
            url = url_elem.text
            if url and url.startswith('http'):
                urls.append(url)

        return urls

    except Exception as e:
        logger.error(f"Failed to extract URLs from sitemap: {e}")
        return []


def main():
    """Main entry point for Google Indexing API submission."""
    import argparse

    parser = argparse.ArgumentParser(description='Google Indexing API URL submission tool')
    parser.add_argument('--credentials', required=True, help='Path to Google Cloud service account JSON')
    parser.add_argument('--sitemap', help='Sitemap URL to extract URLs from')
    parser.add_argument('--urls', nargs='+', help='URLs to submit')
    parser.add_argument('--operation', default='URL_UPDATED', choices=['URL_UPDATED', 'URL_DELETED'],
                       help='Operation type')
    parser.add_argument('--batch-size', type=int, default=100, help='Batch size for submissions')

    args = parser.parse_args()

    try:
        client = GoogleIndexingAPIClient(args.credentials)
    except FileNotFoundError as e:
        logger.error(str(e))
        sys.exit(1)

    # Get URLs
    urls = []
    if args.sitemap:
        logger.info(f"Extracting URLs from sitemap: {args.sitemap}")
        urls = extract_urls_from_sitemap(args.sitemap)
    elif args.urls:
        urls = args.urls
    else:
        logger.error("Please provide --sitemap or --urls")
        sys.exit(1)

    if not urls:
        logger.error("No URLs found to submit")
        sys.exit(1)

    logger.info(f"Found {len(urls)} URLs to submit\n")

    # Submit URLs
    results = client.batch_submit(urls, batch_size=args.batch_size, operation=args.operation)

    # Print summary
    logger.info("\n=== Submission Summary ===")
    total_success = 0
    total_failed = 0

    for batch_num, batch_results in enumerate(results, 1):
        batch_success = sum(1 for r in batch_results if r['success'])
        batch_failed = len(batch_results) - batch_success
        total_success += batch_success
        total_failed += batch_failed

        logger.info(f"Batch {batch_num}: {batch_success} succeeded, {batch_failed} failed")

    logger.info(f"\nTotal: {total_success} succeeded, {total_failed} failed")

    # Save results
    timestamp = datetime.now().isoformat()
    results_file = Path('google-indexing-results.json')

    flat_results = [r for batch in results for r in batch]
    with open(results_file, 'w') as f:
        json.dump({
            'timestamp': timestamp,
            'operation': args.operation,
            'total_urls': len(urls),
            'success_count': total_success,
            'failed_count': total_failed,
            'results': flat_results
        }, f, indent=2)

    logger.info(f"Results saved to {results_file}")

    sys.exit(0 if total_failed == 0 else 1)


if __name__ == '__main__':
    main()
