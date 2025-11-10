/**
 * Test script for real document extraction
 * Run with: npx ts-node scripts/test-document-extraction.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { extractFinancialData, mapToFormFields } from '../lib/real-document-extraction';

async function testDocumentExtraction() {
  console.log('='.repeat(80));
  console.log('TESTING DOCUMENT EXTRACTION');
  console.log('='.repeat(80));

  // Check if OpenAI API key is set
  if (!process.env.OPENAI_API_KEY) {
    console.error('\n❌ ERROR: OPENAI_API_KEY environment variable is not set!');
    console.log('\nTo fix this:');
    console.log('1. Get your API key from: https://platform.openai.com/api-keys');
    console.log('2. Add to .env.local:');
    console.log('   OPENAI_API_KEY=sk-proj-...');
    console.log('\n');
    process.exit(1);
  }

  // Test with sample CSV file
  const sampleDataPath = path.join(__dirname, '../sample-data/financial_data_2023.csv');

  if (!fs.existsSync(sampleDataPath)) {
    console.error(`\n❌ ERROR: Sample file not found: ${sampleDataPath}`);
    console.log('\nRun this first: npm run generate-samples\n');
    process.exit(1);
  }

  console.log(`\n📄 Testing file: ${path.basename(sampleDataPath)}\n`);

  const fileBuffer = fs.readFileSync(sampleDataPath);

  console.log('🔄 Extracting financial data with GPT-4...\n');

  const result = await extractFinancialData(
    fileBuffer,
    'financial_data_2023.csv',
    'profit-loss'
  );

  console.log('--- EXTRACTION RESULTS ---\n');

  console.log(`Status: ${result.success ? '✓ SUCCESS' : '✗ FAILED'}`);
  console.log(`Method: ${result.extractionMethod}`);
  console.log(`Confidence: ${result.confidence}%`);
  console.log(`Processing Time: ${result.processingTime}ms`);
  console.log(`Cost: $${result.cost.toFixed(4)}`);
  console.log(`Fields Extracted: ${result.fieldsExtracted.length}`);

  if (result.fieldsExtracted.length > 0) {
    console.log('\n--- EXTRACTED DATA ---\n');

    for (const field of result.fieldsExtracted) {
      const value = result.data[field as keyof typeof result.data];
      console.log(`${field}: ${value}`);
    }
  }

  if (result.validationErrors.length > 0) {
    console.log('\n--- VALIDATION ERRORS ---\n');

    result.validationErrors.forEach((error, i) => {
      console.log(`${i + 1}. ${error}`);
    });
  }

  // Test field mapping
  console.log('\n--- FIELD MAPPING ---\n');

  const mappings = mapToFormFields(result.data);

  mappings.forEach((mapping) => {
    const confidenceEmoji =
      mapping.confidence >= 80 ? '🟢' :
      mapping.confidence >= 60 ? '🟡' :
      '🔴';

    console.log(
      `${confidenceEmoji} ${mapping.fieldName}: ${mapping.value} (${mapping.confidence}% confidence)`
    );
  });

  console.log('\n' + '='.repeat(80) + '\n');
}

async function main() {
  try {
    await testDocumentExtraction();
  } catch (error: any) {
    console.error('\n❌ Error:', error.message);
    console.error('\nStack:', error.stack);
    process.exit(1);
  }
}

main();
