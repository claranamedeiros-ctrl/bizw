/**
 * Generate Diverse Test Data
 * Creates edge cases: poor quality, multi-sheet Excel, Spanish docs, etc.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

const OUTPUT_DIR = path.join(__dirname, '../sample-data/diverse-tests');

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

/**
 * 1. Clean CSV - QuickBooks Export (EASY - Should be FREE $0)
 */
function generateCleanCSV() {
  const csv = `Account,Type,Amount,Date
Revenue,Income,1543565.29,2023-12-31
Cost of Goods Sold,Expense,774918.56,2023-12-31
Gross Profit,Income,768646.73,2023-12-31
Operating Expenses,Expense,293480.78,2023-12-31
EBITDA,Income,498622.73,2023-12-31
Net Income,Income,340594.73,2023-12-31
Total Assets,Asset,2456789.00,2023-12-31
Current Assets,Asset,890234.00,2023-12-31
Total Liabilities,Liability,1234567.00,2023-12-31
Equity,Equity,1222222.00,2023-12-31`;

  fs.writeFileSync(path.join(OUTPUT_DIR, '1_clean_quickbooks.csv'), csv);
  console.log('✓ Generated: 1_clean_quickbooks.csv (EASY - should cost $0)');
}

/**
 * 2. Messy CSV - Inconsistent Formatting (MEDIUM - needs pattern matching)
 */
function generateMessyCSV() {
  const csv = `"Line Item","2023","Notes"
"Total Sales Revenue (USD)","$1,543,565.29","Includes Q4 adjustments"
"COGS","$(774,918.56)","Updated Oct 2023"
"Gross Margin","768646.73",""
"OpEx Total","293,480.78 USD","Excludes depreciation"
"Net Profit/(Loss)","340594.73","After tax"
"","",""
"Balance Sheet Items","",""
"Assets - Total","2456789","Rounded"
"Liabilities","1234567.00","Verified"
"Shareholder Equity","1,222,222","Calculated"`;

  fs.writeFileSync(path.join(OUTPUT_DIR, '2_messy_format.csv'), csv);
  console.log('✓ Generated: 2_messy_format.csv (MEDIUM - inconsistent formatting)');
}

/**
 * 3. Multi-Sheet Excel - Complex Structure (MEDIUM)
 */
function generateMultiSheetExcel() {
  const workbook = XLSX.utils.book_new();

  // Sheet 1: Summary
  const summaryData = [
    ['ACME Corp Financial Summary', '', '', '2023'],
    ['', '', '', ''],
    ['Metric', 'Value', 'Unit', 'Notes'],
    ['Revenue', 1543565.29, 'USD', 'Gross'],
    ['Net Income', 340594.73, 'USD', 'After tax'],
  ];
  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');

  // Sheet 2: Profit & Loss (hidden in sheet 2!)
  const plData = [
    ['Profit & Loss Statement'],
    ['For Year Ending 2023-12-31'],
    [''],
    ['Revenue', 1543565.29],
    ['Cost of Goods Sold', 774918.56],
    ['Gross Profit', 768646.73],
    ['Operating Expenses', 293480.78],
    ['EBITDA', 498622.73],
    ['Net Income', 340594.73],
  ];
  const plSheet = XLSX.utils.aoa_to_sheet(plData);
  XLSX.utils.book_append_sheet(workbook, plSheet, 'P&L Detail');

  // Sheet 3: Balance Sheet
  const bsData = [
    ['Balance Sheet', '', '2023-12-31'],
    ['Assets', '', ''],
    ['  Current Assets', 890234.0],
    ['  Fixed Assets', 1566555.0],
    ['Total Assets', 2456789.0],
    ['', '', ''],
    ['Liabilities', '', ''],
    ['  Current Liabilities', 456789.0],
    ['  Long-term Debt', 777778.0],
    ['Total Liabilities', 1234567.0],
    ['', '', ''],
    ['Equity', 1222222.0],
  ];
  const bsSheet = XLSX.utils.aoa_to_sheet(bsData);
  XLSX.utils.book_append_sheet(workbook, bsSheet, 'Balance Sheet');

  XLSX.writeFile(workbook, path.join(OUTPUT_DIR, '3_multisheet_excel.xlsx'));
  console.log('✓ Generated: 3_multisheet_excel.xlsx (MEDIUM - data in multiple sheets)');
}

/**
 * 4. Clean PDF - Generated from Accounting Software (EASY/MEDIUM)
 */
function generateCleanPDF() {
  const doc = new jsPDF();

  // Header
  doc.setFontSize(16);
  doc.text('ACME Manufacturing Inc.', 20, 20);
  doc.setFontSize(12);
  doc.text('Profit & Loss Statement', 20, 30);
  doc.text('Year Ending December 31, 2023', 20, 37);

  // Table
  (doc as any).autoTable({
    startY: 45,
    head: [['Account', 'Amount (USD)']],
    body: [
      ['Revenue', '$1,543,565.29'],
      ['Cost of Goods Sold', '$774,918.56'],
      ['Gross Profit', '$768,646.73'],
      ['Operating Expenses', '$293,480.78'],
      ['EBITDA', '$498,622.73'],
      ['Net Income', '$340,594.73'],
    ],
  });

  doc.save(path.join(OUTPUT_DIR, '4_clean_generated_pdf.pdf'));
  console.log('✓ Generated: 4_clean_generated_pdf.pdf (EASY - clean text PDF)');
}

/**
 * 5. Complex PDF - Multi-page with Tables (HARD)
 */
function generateComplexPDF() {
  const doc = new jsPDF();

  // Page 1: Cover
  doc.setFontSize(20);
  doc.text('Annual Financial Report', 105, 50, { align: 'center' });
  doc.setFontSize(14);
  doc.text('ACME Manufacturing Inc.', 105, 65, { align: 'center' });
  doc.text('Fiscal Year 2023', 105, 75, { align: 'center' });

  // Page 2: Income Statement
  doc.addPage();
  doc.setFontSize(16);
  doc.text('Statement of Comprehensive Income', 20, 20);
  doc.setFontSize(10);
  doc.text('For the year ended December 31, 2023', 20, 28);
  doc.text('(All amounts in USD)', 20, 34);

  (doc as any).autoTable({
    startY: 40,
    head: [['Line Item', '2023', '2022']],
    body: [
      ['Revenue', '1,543,565', '1,234,567'],
      ['Cost of Sales', '(774,919)', '(678,900)'],
      ['Gross Profit', '768,647', '555,667'],
      ['', '', ''],
      ['Operating Expenses', '(293,481)', '(234,567)'],
      ['EBITDA', '498,623', '321,100'],
      ['', '', ''],
      ['Net Income', '340,595', '198,765'],
    ],
  });

  // Page 3: Balance Sheet
  doc.addPage();
  doc.setFontSize(16);
  doc.text('Statement of Financial Position', 20, 20);
  doc.setFontSize(10);
  doc.text('As at December 31, 2023', 20, 28);

  (doc as any).autoTable({
    startY: 35,
    head: [['Assets', 'Amount']],
    body: [
      ['Current Assets', '890,234'],
      ['Property, Plant & Equipment', '1,200,000'],
      ['Intangible Assets', '366,555'],
      ['Total Assets', '2,456,789'],
    ],
  });

  (doc as any).autoTable({
    startY: (doc as any).lastAutoTable.finalY + 10,
    head: [['Liabilities & Equity', 'Amount']],
    body: [
      ['Current Liabilities', '456,789'],
      ['Long-term Debt', '777,778'],
      ['Total Liabilities', '1,234,567'],
      ['', ''],
      ['Shareholders Equity', '1,222,222'],
      ['Total Liabilities & Equity', '2,456,789'],
    ],
  });

  doc.save(path.join(OUTPUT_DIR, '5_complex_multipage_pdf.pdf'));
  console.log('✓ Generated: 5_complex_multipage_pdf.pdf (HARD - multiple pages, nested tables)');
}

/**
 * 6. Spanish Document (HARD - language barrier)
 */
function generateSpanishCSV() {
  const csv = `Cuenta,Tipo,Monto,Fecha
Ingresos Totales,Ingreso,"1.543.565,29",2023-12-31
Costo de Ventas,Gasto,"774.918,56",2023-12-31
Utilidad Bruta,Ingreso,"768.646,73",2023-12-31
Gastos Operativos,Gasto,"293.480,78",2023-12-31
EBITDA,Ingreso,"498.622,73",2023-12-31
Utilidad Neta,Ingreso,"340.594,73",2023-12-31
Activos Totales,Activo,"2.456.789,00",2023-12-31
Pasivos Totales,Pasivo,"1.234.567,00",2023-12-31
Patrimonio,Patrimonio,"1.222.222,00",2023-12-31`;

  fs.writeFileSync(path.join(OUTPUT_DIR, '6_spanish_document.csv'), csv);
  console.log('✓ Generated: 6_spanish_document.csv (HARD - Spanish + European number format)');
}

/**
 * 7. Poor Quality / Scanned-like PDF (VERY HARD)
 */
function generatePoorQualityPDF() {
  const doc = new jsPDF();

  doc.setFontSize(14);
  doc.text('Financial   Summary   (Scanned)', 20, 20); // Irregular spacing
  doc.setFontSize(9);
  doc.text('Year: 2023      Company: ACME Corp', 20, 30);

  // Simulate poor scanning with irregular layout
  doc.setFontSize(10);
  doc.text('Revenue..................... $1,543,565', 25, 50);
  doc.text('COGS........................ $774,918', 25, 60);
  doc.text('Profit(Gross)............... $768,647', 25, 70);
  doc.text('OpEx........................ $293,481', 25, 80);
  doc.text('Net Income.................. $340,595', 25, 90);

  doc.text('Assets:', 25, 110);
  doc.text('Total....... 2,456,789', 35, 120);
  doc.text('Liabilities:', 25, 135);
  doc.text('Total....... 1,234,567', 35, 145);

  // Add some "noise" - random text
  doc.setFontSize(8);
  doc.text('Page 1 of 1', 180, 280);
  doc.text('Confidential - Internal Use Only', 20, 280);

  doc.save(path.join(OUTPUT_DIR, '7_poor_quality_scan.pdf'));
  console.log('✓ Generated: 7_poor_quality_scan.pdf (VERY HARD - irregular format, noisy)');
}

/**
 * 8. Edge Case - Negative Numbers in Parentheses (MEDIUM)
 */
function generateNegativeNumbersCSV() {
  const csv = `Account,Amount
Revenue,1543565.29
Cost of Goods Sold,(774918.56)
Gross Profit,768646.73
Operating Expenses,(293480.78)
Net Income,340594.73
Total Assets,2456789.00
Total Liabilities,1234567.00
Retained Earnings,(123456.00)
Equity,1222222.00`;

  fs.writeFileSync(path.join(OUTPUT_DIR, '8_negative_parentheses.csv'), csv);
  console.log('✓ Generated: 8_negative_parentheses.csv (MEDIUM - parentheses = negative)');
}

/**
 * 9. Mixed Currency Document (HARD)
 */
function generateMixedCurrencyCSV() {
  const csv = `Item,Amount,Currency
Revenue,$1,543,565.29,USD
European Sales,€234567.89,EUR
UK Revenue,£123456.78,GBP
Cost of Goods Sold,$774918.56,USD
Net Income,$340594.73,USD`;

  fs.writeFileSync(path.join(OUTPUT_DIR, '9_mixed_currency.csv'), csv);
  console.log('✓ Generated: 9_mixed_currency.csv (HARD - multiple currencies)');
}

/**
 * 10. Minimal Data - Edge Case (EASY but low confidence expected)
 */
function generateMinimalCSV() {
  const csv = `Revenue,1543565
Net Income,340595`;

  fs.writeFileSync(path.join(OUTPUT_DIR, '10_minimal_data.csv'), csv);
  console.log('✓ Generated: 10_minimal_data.csv (EASY - but very minimal fields)');
}

// Generate all test files
console.log('Generating diverse test data...\n');

generateCleanCSV();
generateMessyCSV();
generateMultiSheetExcel();
generateCleanPDF();
generateComplexPDF();
generateSpanishCSV();
generatePoorQualityPDF();
generateNegativeNumbersCSV();
generateMixedCurrencyCSV();
generateMinimalCSV();

// Create README
const readme = `# Diverse Test Data

This directory contains 10 test documents representing real-world edge cases.

## Test Files & Expected Accuracy

| File | Type | Difficulty | Expected Accuracy | Expected Cost | Method |
|------|------|-----------|------------------|---------------|--------|
| 1_clean_quickbooks.csv | CSV | EASY | 95% | $0 | FREE parsing |
| 2_messy_format.csv | CSV | MEDIUM | 80% | $0 | FREE with cleanup |
| 3_multisheet_excel.xlsx | Excel | MEDIUM | 85% | $0 | FREE xlsx library |
| 4_clean_generated_pdf.pdf | PDF | EASY/MEDIUM | 90% | $0.0001 | Mistral text |
| 5_complex_multipage_pdf.pdf | PDF | HARD | 75% | $0.001 | Mistral OCR |
| 6_spanish_document.csv | CSV | HARD | 70% | $0 | FREE + language detect |
| 7_poor_quality_scan.pdf | PDF | VERY HARD | 40% | $0.004 | Claude Vision |
| 8_negative_parentheses.csv | CSV | MEDIUM | 90% | $0 | FREE with pattern |
| 9_mixed_currency.csv | CSV | HARD | 60% | $0.0001 | LLM for currency |
| 10_minimal_data.csv | CSV | EASY | 50% | $0 | FREE (low confidence) |

## Edge Cases Covered

1. ✅ Clean structured data (QuickBooks export)
2. ✅ Inconsistent formatting (mixed number formats)
3. ✅ Multi-sheet Excel (data hidden in different sheets)
4. ✅ Clean text PDF (accounting software output)
5. ✅ Complex multi-page PDF (nested tables, headers)
6. ✅ Spanish language + European number format (1.234,56)
7. ✅ Poor quality / scanned-like (irregular spacing, noise)
8. ✅ Negative numbers in parentheses (1234) = -1234
9. ✅ Multiple currencies (USD, EUR, GBP)
10. ✅ Minimal data (very few fields)

## Testing Strategy

\`\`\`bash
# Test all files
npm run test:diverse

# Test individual file
npm run test:processor -- --file sample-data/diverse-tests/1_clean_quickbooks.csv
\`\`\`

## Success Metrics

**For MVP Acceptance:**
- Clean files (1, 4, 8, 10): ≥90% accuracy
- Medium complexity (2, 3): ≥80% accuracy
- Hard cases (5, 6, 9): ≥65% accuracy
- Very hard (7): ≥40% accuracy (manual review expected)

**Blended Accuracy Target: ≥75% across all documents**

## Cost Analysis

| Scenario | FREE | Mistral | Claude | Total |
|----------|------|---------|--------|-------|
| **All 10 files** | 6 files ($0) | 2 files ($0.0011) | 2 files ($0.008) | **$0.0091** |
| **1,000 docs (same mix)** | 60% | 20% | 20% | **$9.10/month** |
| **AI-only approach** | 0% | 0% | 100% | **$400/month** |

**Savings: 98% vs AI-only approach**
`;

fs.writeFileSync(path.join(OUTPUT_DIR, 'README.md'), readme);

console.log('\n✓ All test files generated successfully!');
console.log(`\nLocation: ${OUTPUT_DIR}`);
console.log('\nNext steps:');
console.log('1. Run: npm run test:diverse');
console.log('2. Review accuracy vs expectations');
console.log('3. Document failures for proposal');
