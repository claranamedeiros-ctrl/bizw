/**
 * Test script for real logo extraction
 * Run with: npx ts-node scripts/test-logo-extraction.ts
 */

import { extractLogoFromWebsite, batchExtractLogos } from '../lib/real-logo-extraction';

const testWebsites = [
  // Financial Services
  { url: 'https://stripe.com', type: 'fintech', backend: 'react' },
  { url: 'https://mercury.com', type: 'fintech', backend: 'next.js' },

  // SaaS
  { url: 'https://notion.so', type: 'saas', backend: 'react' },
  { url: 'https://airtable.com', type: 'saas', backend: 'custom' },
  { url: 'https://vercel.com', type: 'saas', backend: 'next.js' },

  // E-commerce
  { url: 'https://shopify.com', type: 'ecommerce', backend: 'custom' },

  // Website Builders
  { url: 'https://webflow.com', type: 'website-builder', backend: 'webflow' },
  { url: 'https://wix.com', type: 'website-builder', backend: 'wix' },

  // Small Business (examples)
  { url: 'https://example.com', type: 'small-business', backend: 'html' },

  // Tech Companies
  { url: 'https://github.com', type: 'tech', backend: 'react' },
];

async function testSingleWebsite() {
  console.log('='.repeat(80));
  console.log('TESTING SINGLE WEBSITE EXTRACTION');
  console.log('='.repeat(80));

  const testUrl = 'https://stripe.com';
  console.log(`\nTesting: ${testUrl}\n`);

  const result = await extractLogoFromWebsite(testUrl);

  console.log('\n--- RESULTS ---');
  console.log(`Success: ${result.logoUrl ? 'YES' : 'NO'}`);
  console.log(`Logo URL: ${result.logoUrl || 'Not found'}`);
  console.log(`Strategy: ${result.strategy}`);
  console.log(`Confidence: ${result.confidence}%`);
  console.log(`Processing Time: ${result.extractionTime}ms`);

  if (result.quality) {
    console.log(`Quality: ${result.quality.width}x${result.quality.height} ${result.quality.format}`);
  }

  if (result.alternativeLogos.length > 0) {
    console.log(`\nAlternative Logos Found: ${result.alternativeLogos.length}`);
    result.alternativeLogos.slice(0, 3).forEach((alt, i) => {
      console.log(`  ${i + 1}. ${alt.url.slice(0, 80)}`);
      console.log(`     Source: ${alt.source}`);
    });
  }

  if (result.error) {
    console.log(`\nError: ${result.error}`);
  }

  console.log('\n' + '='.repeat(80) + '\n');
}

async function testBatchWebsites() {
  console.log('='.repeat(80));
  console.log('TESTING BATCH WEBSITE EXTRACTION');
  console.log('='.repeat(80));

  const urls = testWebsites.slice(0, 5).map(w => w.url); // Test first 5

  console.log(`\nTesting ${urls.length} websites:\n`);
  urls.forEach((url, i) => {
    console.log(`  ${i + 1}. ${url}`);
  });

  console.log('\n');

  const results = await batchExtractLogos(urls, { concurrency: 2, timeout: 15000 });

  console.log('\n' + '='.repeat(80));
  console.log('BATCH RESULTS SUMMARY');
  console.log('='.repeat(80) + '\n');

  const successful = results.filter(r => r.logoUrl !== null);
  const successRate = (successful.length / results.length) * 100;

  console.log(`Total Tested: ${results.length}`);
  console.log(`Successful: ${successful.length}`);
  console.log(`Failed: ${results.length - successful.length}`);
  console.log(`Success Rate: ${successRate.toFixed(1)}%`);

  console.log('\n--- INDIVIDUAL RESULTS ---\n');

  results.forEach((result, i) => {
    const website = testWebsites.find(w => w.url === result.url);

    console.log(`${i + 1}. ${website?.type || 'unknown'} (${website?.backend || 'unknown'})`);
    console.log(`   URL: ${result.url}`);
    console.log(`   Status: ${result.logoUrl ? '✓ SUCCESS' : '✗ FAILED'}`);
    console.log(`   Strategy: ${result.strategy}`);
    console.log(`   Confidence: ${result.confidence}%`);
    console.log(`   Time: ${result.extractionTime}ms`);

    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }

    console.log('');
  });

  // Strategy analysis
  console.log('--- STRATEGY ANALYSIS ---\n');

  const strategyStats: { [key: string]: number } = {};
  successful.forEach(r => {
    strategyStats[r.strategy] = (strategyStats[r.strategy] || 0) + 1;
  });

  Object.entries(strategyStats).forEach(([strategy, count]) => {
    console.log(`${strategy}: ${count} (${((count / successful.length) * 100).toFixed(1)}%)`);
  });

  // Average metrics
  console.log('\n--- AVERAGE METRICS ---\n');

  const avgConfidence = successful.reduce((sum, r) => sum + r.confidence, 0) / successful.length;
  const avgTime = results.reduce((sum, r) => sum + r.extractionTime, 0) / results.length;

  console.log(`Average Confidence: ${avgConfidence.toFixed(1)}%`);
  console.log(`Average Processing Time: ${avgTime.toFixed(0)}ms`);

  console.log('\n' + '='.repeat(80) + '\n');
}

async function main() {
  const args = process.argv.slice(2);

  if (args.includes('--single')) {
    await testSingleWebsite();
  } else if (args.includes('--batch')) {
    await testBatchWebsites();
  } else {
    console.log('Usage:');
    console.log('  npx ts-node scripts/test-logo-extraction.ts --single');
    console.log('  npx ts-node scripts/test-logo-extraction.ts --batch');
    console.log('');

    // Run single test by default
    await testSingleWebsite();
  }
}

main().catch(console.error);
