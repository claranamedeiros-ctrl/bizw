/**
 * Test FREE document extraction (no AI costs!)
 * Run with: npx ts-node scripts/test-free-extraction.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import {
  extractFinancialDataFree,
  hybridExtraction
} from '../lib/free-document-extraction';

async function testFreeExtraction() {
  console.log('='.repeat(80));
  console.log('TESTING FREE DOCUMENT EXTRACTION (No AI Costs!)');
  console.log('='.repeat(80));

  const sampleDataPath = path.join(__dirname, '../sample-data/financial_data_2023.csv');

  if (!fs.existsSync(sampleDataPath)) {
    console.error(`\n❌ ERROR: Sample file not found: ${sampleDataPath}`);
    console.log('\nRun this first: npm run generate-samples\n');
    process.exit(1);
  }

  console.log(`\n📄 Testing file: ${path.basename(sampleDataPath)}\n`);

  const fileBuffer = fs.readFileSync(sampleDataPath);

  console.log('🆓 Extracting with FREE regex/pattern matching...\n');

  const result = await extractFinancialDataFree(
    fileBuffer,
    'financial_data_2023.csv'
  );

  console.log('--- FREE EXTRACTION RESULTS ---\n');

  console.log(`Status: ${result.success ? '✓ SUCCESS' : '✗ FAILED'}`);
  console.log(`Method: ${result.method}`);
  console.log(`Confidence: ${result.confidence}%`);
  console.log(`Processing Time: ${result.processingTime}ms`);
  console.log(`Cost: $${result.cost.toFixed(4)} (FREE!) 🎉`);
  console.log(`Fields Extracted: ${result.fieldsExtracted.length}`);

  if (result.fieldsExtracted.length > 0) {
    console.log('\n--- EXTRACTED DATA ---\n');

    for (const field of result.fieldsExtracted) {
      const value = result.data[field as keyof typeof result.data];
      console.log(`${field}: ${value}`);
    }
  }

  if (result.error) {
    console.log(`\n❌ Error: ${result.error}`);
  }

  console.log('\n' + '='.repeat(80) + '\n');
}

async function testHybridExtraction() {
  console.log('='.repeat(80));
  console.log('TESTING HYBRID EXTRACTION (Free First, Paid if Needed)');
  console.log('='.repeat(80));

  const sampleDataPath = path.join(__dirname, '../sample-data/financial_data_2023.csv');

  if (!fs.existsSync(sampleDataPath)) {
    console.error(`\n❌ ERROR: Sample file not found`);
    process.exit(1);
  }

  console.log(`\n📄 Testing file: ${path.basename(sampleDataPath)}\n`);

  const fileBuffer = fs.readFileSync(sampleDataPath);

  console.log('🔄 Trying FREE method first...\n');

  const result = await hybridExtraction(
    fileBuffer,
    'financial_data_2023.csv',
    70 // Confidence threshold
  );

  console.log('--- HYBRID EXTRACTION RESULTS ---\n');

  console.log(`Free Method Confidence: ${result.freeResult.confidence}%`);
  console.log(`Used Paid Method: ${result.usedPaidMethod ? 'YES' : 'NO'}`);
  console.log(`Total Cost: $${result.totalCost.toFixed(4)}`);
  console.log(`Final Confidence: ${result.finalConfidence}%`);

  console.log('\n--- STRATEGY USED ---\n');

  if (!result.usedPaidMethod) {
    console.log('✅ FREE extraction was good enough!');
    console.log(`   Confidence ${result.freeResult.confidence}% >= 70% threshold`);
    console.log(`   Saved: $0.30-0.50 by not using AI`);
  } else {
    console.log('⚠️  FREE extraction below threshold, used paid AI');
    console.log(`   Free confidence: ${result.freeResult.confidence}%`);
    console.log(`   Paid confidence: ${result.finalConfidence}%`);
    console.log(`   Cost: $${result.totalCost.toFixed(4)}`);
  }

  console.log('\n--- FINAL EXTRACTED DATA ---\n');

  const fieldsExtracted = Object.keys(result.finalData).filter(
    key => result.finalData[key as keyof typeof result.finalData] !== undefined
  );

  fieldsExtracted.forEach(field => {
    const value = result.finalData[field as keyof typeof result.finalData];
    const emoji = result.finalConfidence >= 80 ? '🟢' : result.finalConfidence >= 60 ? '🟡' : '🔴';
    console.log(`${emoji} ${field}: ${value}`);
  });

  console.log('\n' + '='.repeat(80) + '\n');
}

async function compareFreevsPaid() {
  console.log('='.repeat(80));
  console.log('COMPARING FREE vs PAID EXTRACTION');
  console.log('='.repeat(80));

  const sampleDataPath = path.join(__dirname, '../sample-data/financial_data_2023.csv');

  if (!fs.existsSync(sampleDataPath)) {
    console.error(`\n❌ ERROR: Sample file not found`);
    process.exit(1);
  }

  const fileBuffer = fs.readFileSync(sampleDataPath);

  console.log('\n📊 Running both methods for comparison...\n');

  // Run free extraction
  console.log('1️⃣  Running FREE extraction...');
  const freeResult = await extractFinancialDataFree(fileBuffer, 'financial_data_2023.csv');

  // Run paid extraction
  console.log('2️⃣  Running PAID extraction (with OpenAI)...');

  let paidResult;
  let paidError = false;

  if (!process.env.OPENAI_API_KEY) {
    console.log('   ⚠️  OpenAI API key not set, skipping paid comparison');
    paidError = true;
  } else {
    try {
      const { extractFinancialData } = await import('../lib/real-document-extraction');
      paidResult = await extractFinancialData(fileBuffer, 'financial_data_2023.csv');
    } catch (error: any) {
      console.log(`   ❌ Paid extraction failed: ${error.message}`);
      paidError = true;
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log('COMPARISON RESULTS');
  console.log('='.repeat(80) + '\n');

  console.log('┌─────────────────────────┬─────────────┬─────────────┐');
  console.log('│ Metric                  │ FREE        │ PAID (AI)   │');
  console.log('├─────────────────────────┼─────────────┼─────────────┤');
  console.log(`│ Success                 │ ${freeResult.success ? '✓' : '✗'}           │ ${paidError ? '✗' : (paidResult?.success ? '✓' : '✗')}           │`);
  console.log(`│ Confidence              │ ${freeResult.confidence}%        │ ${paidError ? 'N/A' : paidResult?.confidence + '%'}        │`);
  console.log(`│ Fields Extracted        │ ${freeResult.fieldsExtracted.length}           │ ${paidError ? 'N/A' : paidResult?.fieldsExtracted.length}           │`);
  console.log(`│ Processing Time         │ ${freeResult.processingTime}ms      │ ${paidError ? 'N/A' : paidResult?.processingTime + 'ms'}     │`);
  console.log(`│ Cost                    │ $0.00       │ ${paidError ? 'N/A' : '$' + paidResult?.cost.toFixed(4)}    │`);
  console.log('└─────────────────────────┴─────────────┴─────────────┘');

  console.log('\n💡 RECOMMENDATION:\n');

  if (freeResult.confidence >= 70) {
    console.log('✅ FREE extraction is sufficient for this document!');
    console.log(`   Confidence: ${freeResult.confidence}%`);
    console.log(`   Savings: $0.30-0.50 per document`);
    console.log(`   For 1,000 docs/month: Save $300-500/month`);
  } else if (freeResult.confidence >= 50) {
    console.log('⚠️  FREE extraction is mediocre - consider hybrid approach');
    console.log(`   Use FREE for initial extraction`);
    console.log(`   Use AI only for validation/missing fields`);
    console.log(`   Blended cost: ~$0.10/document`);
  } else {
    console.log('❌ FREE extraction insufficient - use paid AI');
    console.log(`   Document too complex for pattern matching`);
    console.log(`   Cost: $0.30-0.50 per document`);
  }

  console.log('\n' + '='.repeat(80) + '\n');
}

async function main() {
  const args = process.argv.slice(2);

  if (args.includes('--free')) {
    await testFreeExtraction();
  } else if (args.includes('--hybrid')) {
    await testHybridExtraction();
  } else if (args.includes('--compare')) {
    await compareFreevsPaid();
  } else {
    console.log('Usage:');
    console.log('  npx ts-node scripts/test-free-extraction.ts --free      # Test FREE only');
    console.log('  npx ts-node scripts/test-free-extraction.ts --hybrid    # Test FREE-first hybrid');
    console.log('  npx ts-node scripts/test-free-extraction.ts --compare   # Compare FREE vs PAID');
    console.log('');

    // Run free test by default
    await testFreeExtraction();
  }
}

main().catch(console.error);
