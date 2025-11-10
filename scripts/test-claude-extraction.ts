/**
 * Test Claude (AWS Bedrock) Document Extraction
 *
 * This tests the Claude integration using your AWS credentials
 * Run with: npm run test:claude
 */

import * as fs from 'fs';
import * as path from 'path';

// Load environment variables from .env.local
import { config } from 'dotenv';
const envPath = path.join(__dirname, '../.env.local');
config({ path: envPath });

async function testClaudeExtraction() {
  console.log('='.repeat(60));
  console.log('Testing Claude (AWS Bedrock) Document Extraction');
  console.log('='.repeat(60));
  console.log('');

  // Check credentials
  console.log('Checking AWS credentials...');
  if (!process.env.AWS_ACCESS_KEY_ID) {
    console.error('❌ AWS_ACCESS_KEY_ID not set in .env.local');
    return;
  }
  if (!process.env.AWS_SECRET_ACCESS_KEY) {
    console.error('❌ AWS_SECRET_ACCESS_KEY not set in .env.local');
    return;
  }
  console.log('✓ AWS credentials found');
  console.log('  Region:', process.env.AWS_REGION);
  console.log('  Model:', process.env.BEDROCK_MODEL_ID);
  console.log('');

  // Use sample data
  const sampleDataPath = path.join(__dirname, '../sample-data/financial_data_2023.csv');

  if (!fs.existsSync(sampleDataPath)) {
    console.error('❌ Sample data not found. Run: npm run generate-samples');
    return;
  }

  const fileBuffer = fs.readFileSync(sampleDataPath);
  const fileName = 'financial_data_2023.csv';

  console.log('Testing extraction with Claude...');
  console.log('File:', fileName);
  console.log('Size:', fileBuffer.length, 'bytes');
  console.log('');

  try {
    // Import the modules
    const { extractFinancialDataWithClaude } = await import('../lib/claude-document-extraction');

    const result = await extractFinancialDataWithClaude(fileBuffer, fileName);

    console.log('--- CLAUDE EXTRACTION RESULTS ---');
    console.log('Status:', result.success ? '✓ SUCCESS' : '✗ FAILED');
    console.log('Method:', result.method);
    console.log('Confidence:', result.confidence + '%');
    console.log('Processing Time:', result.processingTime + 'ms');
    console.log('Cost: $' + result.cost.toFixed(4));
    console.log('Tokens Used:', result.tokensUsed.input, 'in,', result.tokensUsed.output, 'out');
    console.log('');

    if (result.error) {
      console.error('Error:', result.error);
      console.log('');
    }

    if (result.success) {
      console.log('--- EXTRACTED DATA ---');
      const fields = Object.entries(result.data).filter(([_, value]) => value !== undefined);
      console.log('Fields Extracted:', fields.length);
      for (const [key, value] of fields) {
        console.log(`  ${key}: ${value}`);
      }
      console.log('');
    }

    // Test smart extraction pipeline
    console.log('='.repeat(60));
    console.log('Testing Smart Extraction Pipeline (FREE → Claude → GPT-4)');
    console.log('='.repeat(60));
    console.log('');

    const { smartExtraction } = await import('../lib/deepseek-extraction');
    const smartResult = await smartExtraction(fileBuffer, fileName);

    console.log('--- SMART EXTRACTION RESULTS ---');
    console.log('Method Used:', smartResult.method.toUpperCase());
    console.log('Confidence:', smartResult.confidence + '%');
    console.log('Cost: $' + smartResult.cost.toFixed(4));
    console.log('');

    if (smartResult.method === 'free') {
      console.log('💡 FREE extraction was sufficient!');
      console.log('   No AI costs incurred.');
      console.log('   Saved: ~$0.02-0.05 by not using Claude');
    } else if (smartResult.method === 'claude') {
      console.log('💡 Claude extraction used after FREE failed.');
      console.log('   Cost: $' + smartResult.cost.toFixed(4));
      console.log('   Cheaper than GPT-4 Vision (~$0.30-0.50)');
    }
    console.log('');

    console.log('--- COST COMPARISON ---');
    console.log('┌─────────────────────────┬─────────────┐');
    console.log('│ Method                  │ Cost        │');
    console.log('├─────────────────────────┼─────────────┤');
    console.log('│ FREE (regex/parsing)    │ $0.0000     │');
    console.log('│ Claude via Bedrock      │ $' + result.cost.toFixed(4).padEnd(7) + ' │');
    console.log('│ GPT-4 Vision (estimate) │ $0.3000     │');
    console.log('└─────────────────────────┴─────────────┘');
    console.log('');

    console.log('✓ Test complete!');

  } catch (error: any) {
    console.error('❌ Test failed:', error.message);
    console.error('');
    if (error.stack) {
      console.error('Stack trace:');
      console.error(error.stack);
    }
  }
}

// Run test
testClaudeExtraction().catch(console.error);
