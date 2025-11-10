/**
 * Generate realistic sample financial documents for testing AI extraction
 * These documents intentionally include:
 * - Different number formats
 * - Inconsistent terminology
 * - Multiple fonts and styles
 * - Subtotals that could confuse parsers
 * - Realistic business data with noise
 */

import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import * as fs from 'fs';
import * as path from 'path';

// Extend jsPDF type to include autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => void;
    lastAutoTable: { finalY: number };
  }
}

const SAMPLE_DATA_DIR = path.join(process.cwd(), 'sample-data');

// Ensure sample-data directory exists
if (!fs.existsSync(SAMPLE_DATA_DIR)) {
  fs.mkdirSync(SAMPLE_DATA_DIR, { recursive: true });
}

// ============ PROFIT & LOSS STATEMENT PDF ============
function generateProfitLoss() {
  const doc = new jsPDF();

  // Add company header with varied formatting
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('ACME Manufacturing Inc.', 105, 20, { align: 'center' });

  doc.setFontSize(14);
  doc.setFont('helvetica', 'normal');
  doc.text('Statement of Profit and Loss', 105, 30, { align: 'center' });

  doc.setFontSize(11);
  doc.text('For the Year Ended December 31, 2023', 105, 38, { align: 'center' });

  // Add some "realistic" noise - a note
  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.text('(Amounts in USD - Unaudited)', 105, 44, { align: 'center' });

  // Revenue Section with INCONSISTENT formatting
  const revenueData = [
    ['', 'Q1 2023', 'Q2 2023', 'Q3 2023', 'Q4 2023', 'Total'],
    ['Product Sales', '$245,890.00', '$ 289,234.56', '312,890', '$298,456.78', '$1,146,471.34'],
    ['Service Revenue', '89234.50', '$92,100.00', '$ 95,678', '$98,234.00', '$375,246.50'],
    ['Other Income', '5,600', '$ 4,890.00', '6,234', '5,123.45', '$21,847.45'],
    ['Total Revenue', '$340,724.50', '$386,224.56', '$414,802', '$401,814.23', '$1,543,565.29'],
  ];

  doc.autoTable({
    startY: 52,
    head: [revenueData[0]],
    body: revenueData.slice(1),
    theme: 'striped',
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: [66, 139, 202], fontStyle: 'bold' },
  });

  // Cost of Goods Sold - using different terminology
  const cogsY = doc.lastAutoTable.finalY + 10;

  const cogsData = [
    ['Cost of Revenue', ''],
    ['Raw Materials', '($487,234.00)'],
    ['Direct Labor Costs', '($ 198,450)'],
    ['Manufacturing Overhead', '($89,234.56)'],
    ['Gross Margin', '$768,646.73'], // Should be Revenue - COGS
  ];

  doc.autoTable({
    startY: cogsY,
    body: cogsData,
    theme: 'plain',
    styles: { fontSize: 9 },
    columnStyles: {
      0: { cellWidth: 140 },
      1: { cellWidth: 40, halign: 'right' },
    },
  });

  // Operating Expenses with more variety
  const opexY = doc.lastAutoTable.finalY + 8;

  const opexData = [
    ['Operating Expenses', ''],
    ['Sales & Marketing', '($125,890)'],
    ['General and Administrative', '($ 98,456.78)'],
    ['R&D Expenses', '$45,678.00'], // Oops, wrong sign!
    ['Depreciation', '($23,456)'],
    ['Total Operating Exp.', '($293,480.78)'],
  ];

  doc.autoTable({
    startY: opexY,
    body: opexData,
    theme: 'plain',
    styles: { fontSize: 9 },
    columnStyles: {
      0: { cellWidth: 140 },
      1: { cellWidth: 40, halign: 'right' },
    },
  });

  // Bottom line with bold formatting
  const bottomY = doc.lastAutoTable.finalY + 8;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('EBITDA:', 20, bottomY);
  doc.text('$498,622.73', 160, bottomY, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('Interest Expense', 20, bottomY + 7);
  doc.text('($12,345.00)', 160, bottomY + 7, { align: 'right' });

  doc.text('Tax Expense', 20, bottomY + 14);
  doc.text('($ 145,683)', 160, bottomY + 14, { align: 'right' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('Net Income:', 20, bottomY + 24);
  doc.text('$340,594.73', 160, bottomY + 24, { align: 'right' });

  // Add footer note
  doc.setFontSize(7);
  doc.setFont('helvetica', 'italic');
  doc.text('Note: Some line items may include rounding differences', 20, 280);
  doc.text('Prepared by QuickBooks Online - Exported Jan 15, 2024', 20, 285);

  doc.save(path.join(SAMPLE_DATA_DIR, 'profit_loss_2023.pdf'));
  console.log('✓ Generated profit_loss_2023.pdf');
}

// ============ BALANCE SHEET PDF ============
function generateBalanceSheet() {
  const doc = new jsPDF();

  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('ACME Manufacturing Inc.', 105, 20, { align: 'center' });

  doc.setFontSize(14);
  doc.setFont('helvetica', 'normal');
  doc.text('Balance Sheet', 105, 30, { align: 'center' });

  doc.setFontSize(11);
  doc.text('As of December 31, 2023', 105, 38, { align: 'center' });

  // ASSETS
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('ASSETS', 20, 50);

  const assetsData = [
    ['Current Assets', ''],
    ['  Cash and Cash Equivalents', '$ 245,678.90'],
    ['  Accounts Receivable', '$198,456'],
    ['  Inventory', '$ 312,890.45'],
    ['  Prepaid Expenses', '23456.00'],
    ['    Total Current Assets', '$780,481.35'],
    ['', ''],
    ['Fixed Assets', ''],
    ['  Property, Plant & Equipment', '$1,245,000'],
    ['  Less: Accumulated Depreciation', '($423,567.89)'],
    ['    Net PP&E', '$ 821,432.11'],
    ['', ''],
    ['Other Assets', ''],
    ['  Intangible Assets', '$125,000.00'],
    ['  Goodwill', '$ 89,234'],
    ['    Total Other Assets', '$214,234.00'],
    ['', ''],
    ['TOTAL ASSETS', '$1,816,147.46'],
  ];

  doc.autoTable({
    startY: 55,
    body: assetsData,
    theme: 'plain',
    styles: { fontSize: 9, cellPadding: 2 },
    columnStyles: {
      0: { cellWidth: 130 },
      1: { cellWidth: 50, halign: 'right' },
    },
  });

  // LIABILITIES & EQUITY
  const liabilitiesY = doc.lastAutoTable.finalY + 10;

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('LIABILITIES AND EQUITY', 20, liabilitiesY);

  const liabilitiesData = [
    ['Current Liabilities', ''],
    ['  Accounts Payable', '$ 156,789.00'],
    ['  Accrued Expenses', '45678.90'],
    ['  Short-term Debt', '$98,456'],
    ['    Total Current Liabilities', '$ 300,923.90'],
    ['', ''],
    ['Long-term Liabilities', ''],
    ['  Long-term Debt', '$456,789.00'],
    ['  Deferred Tax Liability', '$ 45,678'],
    ['    Total Long-term Liabilities', '$502,467.00'],
    ['', ''],
    ['TOTAL LIABILITIES', '$ 803,390.90'],
    ['', ''],
    ['Shareholders\' Equity', ''],
    ['  Common Stock', '$ 500,000.00'],
    ['  Retained Earnings', '$512,756.56'],
    ['    Total Equity', '$1,012,756.56'],
    ['', ''],
    ['TOTAL LIABILITIES & EQUITY', '$1,816,147.46'],
  ];

  doc.autoTable({
    startY: liabilitiesY + 5,
    body: liabilitiesData,
    theme: 'plain',
    styles: { fontSize: 9, cellPadding: 2 },
    columnStyles: {
      0: { cellWidth: 130 },
      1: { cellWidth: 50, halign: 'right' },
    },
  });

  doc.setFontSize(7);
  doc.setFont('helvetica', 'italic');
  doc.text('Figures shown in USD. Prepared using Xero Accounting Software.', 20, 280);

  doc.save(path.join(SAMPLE_DATA_DIR, 'balance_sheet_2023.pdf'));
  console.log('✓ Generated balance_sheet_2023.pdf');
}

// ============ CASH FLOW STATEMENT PDF ============
function generateCashFlow() {
  const doc = new jsPDF();

  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('ACME Manufacturing Inc.', 105, 20, { align: 'center' });

  doc.setFontSize(14);
  doc.setFont('helvetica', 'normal');
  doc.text('Statement of Cash Flows', 105, 30, { align: 'center' });

  doc.setFontSize(11);
  doc.text('Year Ended December 31, 2023', 105, 38, { align: 'center' });

  const cashFlowData = [
    ['Operating Activities', ''],
    ['Net Income', '$340,594.73'],
    ['Adjustments to reconcile net income:', ''],
    ['  Depreciation and Amortization', '$ 23,456.00'],
    ['  Changes in working capital:', ''],
    ['    Accounts Receivable', '($45,678)'],
    ['    Inventory', '($ 67,890.45)'],
    ['    Accounts Payable', '34567.89'],
    ['Net Cash from Operating Activities', '$ 285,050.17'],
    ['', ''],
    ['Investing Activities', ''],
    ['Purchase of Equipment', '($125,000)'],
    ['Sale of Investments', '45000'],
    ['Net Cash from Investing Activities', '($ 80,000.00)'],
    ['', ''],
    ['Financing Activities', ''],
    ['Proceeds from Long-term Debt', '$ 100,000.00'],
    ['Repayment of Short-term Debt', '($50,000)'],
    ['Dividends Paid', '($ 25,000.00)'],
    ['Net Cash from Financing Activities', '$25,000.00'],
    ['', ''],
    ['Net Change in Cash', '$230,050.17'],
    ['Cash at Beginning of Year', '15628.73'],
    ['Cash at End of Year', '$ 245,678.90'],
  ];

  doc.autoTable({
    startY: 45,
    body: cashFlowData,
    theme: 'striped',
    styles: { fontSize: 9, cellPadding: 3 },
    columnStyles: {
      0: { cellWidth: 130 },
      1: { cellWidth: 50, halign: 'right' },
    },
  });

  doc.save(path.join(SAMPLE_DATA_DIR, 'cashflow_2023.pdf'));
  console.log('✓ Generated cashflow_2023.pdf');
}

// ============ CSV FILE WITH INCONSISTENT FORMATS ============
function generateCSV() {
  const csvContent = `Category,Item,Q1 2023,Q2 2023,Q3 2023,Q4 2023,Annual Total
Revenue,Product Sales,$245890.00,$ 289234.56,312890,$298456.78,"$1,146,471.34"
Revenue,Service Revenue,89234.50,$92100.00,$ 95678,$98234.00,$375246.50
Revenue,Other Revenue,5600,$ 4890.00,6234,5123.45,$21847.45
TOTAL REVENUE,,340724.50,386224.56,414802,401814.23,"$1,543,565.29"
,,,,,
Cost of Sales,Raw Materials,487234.00,,,,$487234.00
Cost of Sales,Direct Labor,198450,,,,$198450
Cost of Sales,Overhead,89234.56,,,,$89234.56
TOTAL COGS,,"$774,918.56",,,,"$774,918.56"
,,,,,
Operating Expenses,Sales and Marketing,125890,,,,$125890
Operating Expenses,G&A,98456.78,,,,$98456.78
Operating Expenses,Research & Development,45678.00,,,,$45678.00
Operating Expenses,Depreciation & Amortization,23456,,,,$23456
TOTAL OPEX,,"$293,480.78",,,,"$293,480.78"
,,,,,
Bottom Line,EBITDA,"$498,622.73",,,,"$498,622.73"
Bottom Line,Interest Expense,12345.00,,,,$12345.00
Bottom Line,Tax Expense,145683,,,,$145683
Bottom Line,Net Profit,"$340,594.73",,,,"$340,594.73"
,,,,,
Notes:,,,,,,
"Some values may not sum exactly due to rounding",,,,,,
"Exported from QuickBooks on 2024-01-15",,,,,,
`;

  fs.writeFileSync(path.join(SAMPLE_DATA_DIR, 'financial_data_2023.csv'), csvContent);
  console.log('✓ Generated financial_data_2023.csv');
}

// ============ README FOR SAMPLE DATA ============
function generateREADME() {
  const readme = `# Sample Financial Documents

These documents are intentionally messy to demonstrate real-world AI extraction challenges.

## Documents Included:

1. **profit_loss_2023.pdf** - Profit & Loss Statement
   - Inconsistent number formatting ($1,234.56 vs 1234 vs $ 1234)
   - Mixed terminology (Revenue vs Income, COGS vs Cost of Revenue)
   - Quarterly breakdown with totals
   - Extraction difficulty: MEDIUM (75% accuracy expected)

2. **balance_sheet_2023.pdf** - Balance Sheet
   - Nested categories (Current Assets > Cash, etc.)
   - Calculation validation needed (Assets = Liabilities + Equity)
   - Different accounting software format (Xero)
   - Extraction difficulty: MEDIUM (70% accuracy expected)

3. **cashflow_2023.pdf** - Cash Flow Statement
   - Three activity categories (Operating, Investing, Financing)
   - Reconciliation from Net Income
   - Positive/negative number handling
   - Extraction difficulty: HARD (65% accuracy expected)

4. **financial_data_2023.csv** - CSV Export
   - Inconsistent header names
   - Mixed delimiters and formats
   - Notes and empty rows
   - Extraction difficulty: EASY (90% accuracy expected)

## Realistic Issues Demonstrated:

- Number format variations (with/without $, commas, spaces)
- Terminology inconsistencies (Total Revenue vs Revenue Total)
- Software-specific formatting (QuickBooks vs Xero)
- Subtotals that could confuse parsers
- Notes and footnotes mixed with data
- Calculation errors AI should catch
- Sign inconsistencies (positive expense instead of negative)

## Expected AI Behavior:

✓ SHOULD extract: Main line items, totals, clear numbers
⚠ MIGHT struggle: Nested categories, footnotes, unusual formats
✗ WILL fail: Handwritten notes, severely damaged scans, complex merged cells

Generated: ${new Date().toISOString()}
`;

  fs.writeFileSync(path.join(SAMPLE_DATA_DIR, 'README.md'), readme);
  console.log('✓ Generated README.md');
}

// Run all generators
console.log('Generating sample financial documents...\n');
generateProfitLoss();
generateBalanceSheet();
generateCashFlow();
generateCSV();
generateREADME();
console.log('\n✓ All sample documents generated successfully!');
console.log(`\nLocation: ${SAMPLE_DATA_DIR}`);
