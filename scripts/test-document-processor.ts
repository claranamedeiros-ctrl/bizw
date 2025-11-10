/**
 * Test Master Document Processor
 *
 * Tests the router that automatically detects file types
 * and routes to the best extraction method
 *
 * Run with: npm run test:processor
 */

import * as fs from 'fs';
import * as path from 'path';
import { config } from 'dotenv';

// Load environment variables
const envPath = path.join(__dirname, '../.env.local');
config({ path: envPath });

import { DocumentProcessor, processDocumentFromFile } from '../lib/document-processor';

async function testDocumentProcessor() {
  console.log('='.repeat(80));
  console.log('TESTING MASTER DOCUMENT PROCESSOR');
  console.log('='.repeat(80));
  console.log('');

  // Check which APIs are configured
  console.log('Checking API configuration...');
  console.log('  Mistral OCR:', process.env.MISTRAL_API_KEY ? '✓ Configured' : '✗ Not configured');
  console.log('  Claude (Bedrock):', process.env.AWS_ACCESS_KEY_ID ? '✓ Configured' : '✗ Not configured');
  console.log('  OpenAI GPT-4:', process.env.OPENAI_API_KEY ? '✓ Configured' : '✗ Not configured');
  console.log('');

  // Test files
  const testFiles = [
    {
      name: 'CSV File',
      path: path.join(__dirname, '../sample-data/financial_data_2023.csv'),
      expectedMethod: 'free-csv',
      expectedCost: 0,
    },
    {
      name: 'PDF File',
      path: path.join(__dirname, '../sample-data/profit_loss_2023.pdf'),
      expectedMethod: 'mistral-ocr',
      expectedCost: 0.001,
    },
  ];

  const results = [];

  for (const testFile of testFiles) {
    console.log('─'.repeat(80));
    console.log(`Testing: ${testFile.name}`);
    console.log(`File: ${path.basename(testFile.path)}`);
    console.log('');

    if (!fs.existsSync(testFile.path)) {
      console.log(`⚠️  File not found: ${testFile.path}`);
      console.log('');
      continue;
    }

    try {
      const result = await processDocumentFromFile(testFile.path);

      console.log('--- RESULTS ---');
      console.log('Status:', result.success ? '✓ SUCCESS' : '✗ FAILED');
      console.log('File Type:', result.fileType.toUpperCase());
      console.log('Method Used:', result.method);
      console.log('Fallback Used:', result.fallbackUsed ? 'Yes' : 'No');
      console.log('Confidence:', result.confidence + '%');
      console.log('Processing Time:', result.processingTime + 'ms');
      console.log('Cost: $' + result.cost.toFixed(4));
      console.log('');

      if (result.error) {
        console.log('Error:', result.error);
        console.log('');
      }

      if (result.success) {
        console.log('--- EXTRACTED DATA ---');
        const fields = Object.entries(result.data).filter(([_, value]) => value !== undefined);
        console.log('Fields Extracted:', fields.length);

        if (fields.length > 0) {
          for (const [key, value] of fields) {
            console.log(`  ${key}: ${value}`);
          }
        } else {
          console.log('  (no fields extracted)');
        }
        console.log('');
      }

      // Compare with expected
      if (result.method !== testFile.expectedMethod) {
        console.log(`⚠️  Expected method: ${testFile.expectedMethod}, got: ${result.method}`);
      }

      results.push({
        file: testFile.name,
        success: result.success,
        method: result.method,
        cost: result.cost,
        confidence: result.confidence,
        time: result.processingTime,
      });
    } catch (error: any) {
      console.error('❌ Test failed:', error.message);
      console.log('');
    }
  }

  // Summary
  console.log('='.repeat(80));
  console.log('SUMMARY');
  console.log('='.repeat(80));
  console.log('');

  if (results.length === 0) {
    console.log('No tests completed.');
    return;
  }

  console.log('┌────────────────┬─────────┬────────────────┬──────────┬────────────┬──────────┐');
  console.log('│ File           │ Success │ Method         │ Cost     │ Confidence │ Time     │');
  console.log('├────────────────┼─────────┼────────────────┼──────────┼────────────┼──────────┤');

  for (const result of results) {
    const success = result.success ? '✓' : '✗';
    const file = result.file.padEnd(14).substring(0, 14);
    const method = result.method.padEnd(14).substring(0, 14);
    const cost = ('$' + result.cost.toFixed(4)).padStart(8);
    const confidence = (result.confidence + '%').padStart(10);
    const time = (result.time + 'ms').padStart(8);

    console.log(`│ ${file} │ ${success}       │ ${method} │ ${cost} │ ${confidence} │ ${time} │`);
  }

  console.log('└────────────────┴─────────┴────────────────┴──────────┴────────────┴──────────┘');
  console.log('');

  // Cost analysis
  const totalCost = results.reduce((sum, r) => sum + r.cost, 0);
  const avgCost = totalCost / results.length;

  console.log('--- COST ANALYSIS ---');
  console.log('Total Cost: $' + totalCost.toFixed(4));
  console.log('Average Cost per Document: $' + avgCost.toFixed(4));
  console.log('');

  // Projected costs
  console.log('--- PROJECTED COSTS (1,000 documents/month) ---');
  console.log('');

  const projections = [
    {
      name: 'All CSV (FREE only)',
      cost: 0,
    },
    {
      name: 'All PDFs (Mistral OCR)',
      cost: 0.001 * 1000,
    },
    {
      name: 'Current mix (' + results.map(r => r.method).join(', ') + ')',
      cost: avgCost * 1000,
    },
    {
      name: 'All Claude (fallback)',
      cost: 0.02 * 1000,
    },
    {
      name: 'All GPT-4 Vision',
      cost: 0.30 * 1000,
    },
  ];

  for (const proj of projections) {
    console.log(`${proj.name}:`);
    console.log(`  $${proj.cost.toFixed(2)}/month`);
    console.log('');
  }

  // Method breakdown
  console.log('--- METHOD BREAKDOWN ---');
  const methodCounts: { [key: string]: number } = {};
  for (const result of results) {
    methodCounts[result.method] = (methodCounts[result.method] || 0) + 1;
  }

  for (const [method, count] of Object.entries(methodCounts)) {
    const percentage = ((count / results.length) * 100).toFixed(1);
    console.log(`${method}: ${count} (${percentage}%)`);
  }
  console.log('');

  console.log('✓ Tests complete!');
}

// Run tests
testDocumentProcessor().catch(console.error);
