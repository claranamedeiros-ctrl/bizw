"""
Test script for the BizWorth Brand Extractor API
"""

import requests
import json


def test_extract(url: str):
    """Test the /extract endpoint"""
    print(f"\n{'='*60}")
    print(f"Testing extraction for: {url}")
    print(f"{'='*60}\n")

    # Make request
    response = requests.post(
        "http://localhost:8000/extract",
        json={"url": url},
        timeout=30
    )

    # Print status
    print(f"Status: {response.status_code}")

    # Print response
    if response.status_code == 200:
        data = response.json()
        print(f"\n✓ Logo detected: {bool(data['logo'])}")
        if data['logoRaw']:
            print(f"  Raw URL: {data['logoRaw'][:60]}...")

        print(f"\n✓ Colors extracted:")
        print(f"  Primary: {data['colors']['primary']}")
        print(f"  Secondary: {data['colors']['secondary']}")
        print(f"  Palette: {', '.join(data['colors']['palette'][:5])}")

        print(f"\n✓ About text: {len(data['about'] or '')} chars")
        if data['about']:
            print(f"  Preview: {data['about'][:100]}...")

        print(f"\n✓ Disclaimer: {len(data['disclaimer'] or '')} chars")
        if data['disclaimer']:
            print(f"  Preview: {data['disclaimer'][:100]}...")

    else:
        print(f"\n✗ Error: {response.text}")


def test_health():
    """Test the /health endpoint"""
    print("\nTesting health check...")
    response = requests.get("http://localhost:8000/health")

    if response.status_code == 200:
        data = response.json()
        print(f"✓ Status: {data['status']}")
        print(f"  Models loaded: {data['models_loaded']}")
        print(f"  Browser ready: {data['browser_ready']}")
    else:
        print(f"✗ Health check failed: {response.status_code}")


if __name__ == "__main__":
    # Test health check first
    test_health()

    # Test with some example URLs
    test_urls = [
        "https://www.stripe.com",
        "https://www.rootstrap.com",
        "https://www.anthropic.com",
    ]

    for url in test_urls:
        try:
            test_extract(url)
        except Exception as e:
            print(f"\n✗ Test failed: {e}")

    print(f"\n{'='*60}")
    print("Tests complete!")
    print(f"{'='*60}\n")
