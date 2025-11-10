/**
 * FREE Document Extraction Methods
 * These methods don't use any paid APIs - completely free!
 * Only fallback to paid APIs if these fail
 */

import * as XLSX from 'xlsx';

export interface FreeExtractionResult {
  success: boolean;
  data: Partial<FinancialData>;
  confidence: number;
  method: 'csv-regex' | 'excel-parse' | 'pdf-text' | 'pattern-match';
  fieldsExtracted: string[];
  cost: 0; // Always free!
  processingTime: number;
  error?: string;
}

export interface FinancialData {
  companyName?: string;
  fiscalYear?: string;
  currency?: string;
  revenue?: number;
  costOfGoodsSold?: number;
  grossProfit?: number;
  operatingExpenses?: number;
  ebitda?: number;
  netIncome?: number;
  totalAssets?: number;
  currentAssets?: number;
  fixedAssets?: number;
  totalLiabilities?: number;
  currentLiabilities?: number;
  equity?: number;
  operatingCashFlow?: number;
  investingCashFlow?: number;
  financingCashFlow?: number;
  netCashChange?: number;
}

/**
 * FREE CSV Parser - Uses regex and pattern matching
 * No AI needed for clean CSV files!
 */
export async function extractFromCSVFree(
  fileBuffer: Buffer
): Promise<FreeExtractionResult> {
  const startTime = Date.now();

  try {
    // Parse CSV to text
    const csvText = fileBuffer.toString('utf-8');
    const lines = csvText.split('\n').map(line => line.trim()).filter(line => line);

    if (lines.length < 2) {
      return {
        success: false,
        data: {},
        confidence: 0,
        method: 'csv-regex',
        fieldsExtracted: [],
        cost: 0,
        processingTime: Date.now() - startTime,
        error: 'CSV file too short (less than 2 lines)'
      };
    }

    // Parse header and data
    const headers = parseCSVLine(lines[0]);
    const dataRows = lines.slice(1).map(line => parseCSVLine(line));

    // Extract financial data using pattern matching
    const extractedData = extractFinancialDataFromCSV(headers, dataRows);

    // Calculate confidence based on how many fields we extracted
    let fieldsExtracted: string[] = [];
    let confidence = 0;

    // Check if multi-period format
    if (extractedData.periods && Array.isArray(extractedData.periods)) {
      // Multi-period: count fields across all periods
      let totalFields = 0;
      const periods = extractedData.periods;

      periods.forEach((period: string) => {
        if (extractedData.profitLoss?.[period]) {
          const plFields = Object.keys(extractedData.profitLoss[period]).length;
          totalFields += plFields;
          fieldsExtracted.push(`profitLoss.${period} (${plFields} fields)`);
        }
        if (extractedData.assets?.[period]) {
          const assetFields = Object.keys(extractedData.assets[period]).length;
          totalFields += assetFields;
          fieldsExtracted.push(`assets.${period} (${assetFields} fields)`);
        }
        if (extractedData.liabilities?.[period]) {
          const liabFields = Object.keys(extractedData.liabilities[period]).length;
          totalFields += liabFields;
          fieldsExtracted.push(`liabilities.${period} (${liabFields} fields)`);
        }
        if (extractedData.equity?.[period]) {
          const eqFields = Object.keys(extractedData.equity[period]).length;
          totalFields += eqFields;
          fieldsExtracted.push(`equity.${period} (${eqFields} fields)`);
        }
      });

      // For multi-period: 2 points per field (more data = higher confidence)
      confidence = Math.min(100, totalFields * 2);

      console.log(`[FREE CSV] Extracted ${totalFields} fields across ${periods.length} periods - confidence: ${confidence}%`);
    } else {
      // Single-period: original logic
      fieldsExtracted = Object.keys(extractedData).filter(
        key => extractedData[key as keyof FinancialData] !== undefined
      );
      confidence = Math.min(100, fieldsExtracted.length * 10); // 10 points per field
    }

    return {
      success: fieldsExtracted.length > 0,
      data: extractedData,
      confidence,
      method: 'csv-regex',
      fieldsExtracted,
      cost: 0,
      processingTime: Date.now() - startTime
    };
  } catch (error: any) {
    return {
      success: false,
      data: {},
      confidence: 0,
      method: 'csv-regex',
      fieldsExtracted: [],
      cost: 0,
      processingTime: Date.now() - startTime,
      error: error.message
    };
  }
}

/**
 * FREE Excel Parser - Uses xlsx library (free and local)
 */
export async function extractFromExcelFree(
  fileBuffer: Buffer
): Promise<FreeExtractionResult> {
  const startTime = Date.now();

  try {
    // Parse Excel file
    const workbook = XLSX.read(fileBuffer, { type: 'buffer' });

    console.log(`[FREE Excel] Found ${workbook.SheetNames.length} sheet(s): ${workbook.SheetNames.join(', ')}`);

    // Collect all rows from ALL sheets
    let allRows: any[][] = [];

    for (const sheetName of workbook.SheetNames) {
      console.log(`[FREE Excel] Processing sheet: ${sheetName}`);
      const worksheet = workbook.Sheets[sheetName];

      // Convert to JSON for easier parsing
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

      if (Array.isArray(jsonData) && jsonData.length > 0) {
        // Add all rows from this sheet
        allRows = allRows.concat(jsonData as any[][]);
        console.log(`[FREE Excel] Added ${jsonData.length} rows from sheet: ${sheetName}`);
      }
    }

    if (allRows.length < 2) {
      return {
        success: false,
        data: {},
        confidence: 0,
        method: 'excel-parse',
        fieldsExtracted: [],
        cost: 0,
        processingTime: Date.now() - startTime,
        error: 'Excel workbook is empty or too short'
      };
    }

    console.log(`[FREE Excel] Total rows collected: ${allRows.length}`);

    // Check if this looks like a CSV-style format (headers in first row, periods as columns)
    const firstRow = allRows[0];
    if (Array.isArray(firstRow) && firstRow.length > 1) {
      const headers = firstRow.map(h => String(h || '').trim());

      // Check if headers contain year/period patterns
      const hasYearColumns = headers.some((h, idx) =>
        idx > 0 && (/\d{4}/.test(h) || /jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec/i.test(h))
      );

      if (hasYearColumns) {
        console.log('[FREE Excel] Detected multi-period CSV-style format, using CSV parser');
        const dataRows = allRows.slice(1).map(row =>
          Array.isArray(row) ? row.map(cell => String(cell || '').trim()) : []
        );
        const extractedData = extractFinancialDataFromCSV(headers, dataRows);

        // Calculate confidence for multi-period data
        let fieldsExtracted: string[] = [];
        let confidence = 0;

        if (extractedData.periods && Array.isArray(extractedData.periods)) {
          let totalFields = 0;
          extractedData.periods.forEach((period: string) => {
            if (extractedData.profitLoss?.[period]) {
              totalFields += Object.keys(extractedData.profitLoss[period]).length;
            }
            if (extractedData.assets?.[period]) {
              totalFields += Object.keys(extractedData.assets[period]).length;
            }
            if (extractedData.liabilities?.[period]) {
              totalFields += Object.keys(extractedData.liabilities[period]).length;
            }
            if (extractedData.equity?.[period]) {
              totalFields += Object.keys(extractedData.equity[period]).length;
            }
          });
          confidence = Math.min(100, totalFields * 2);
          fieldsExtracted.push(`${totalFields} fields across ${extractedData.periods.length} periods`);
          console.log(`[FREE Excel] Extracted ${totalFields} fields across ${extractedData.periods.length} periods - confidence: ${confidence}%`);
        } else {
          fieldsExtracted = Object.keys(extractedData);
          confidence = Math.min(100, fieldsExtracted.length * 10);
        }

        return {
          success: fieldsExtracted.length > 0,
          data: extractedData,
          confidence,
          method: 'excel-parse',
          fieldsExtracted,
          cost: 0,
          processingTime: Date.now() - startTime
        };
      }
    }

    // Legacy format: Extract financial data from all rows
    console.log('[FREE Excel] Using row-based parser');
    const extractedData = extractFinancialDataFromRows(allRows);

    const fieldsExtracted = Object.keys(extractedData).filter(
      key => extractedData[key as keyof FinancialData] !== undefined
    );

    const confidence = Math.min(100, fieldsExtracted.length * 10);

    return {
      success: fieldsExtracted.length > 0,
      data: extractedData,
      confidence,
      method: 'excel-parse',
      fieldsExtracted,
      cost: 0,
      processingTime: Date.now() - startTime
    };
  } catch (error: any) {
    return {
      success: false,
      data: {},
      confidence: 0,
      method: 'excel-parse',
      fieldsExtracted: [],
      cost: 0,
      processingTime: Date.now() - startTime,
      error: error.message
    };
  }
}

/**
 * Parse CSV line handling quotes and commas
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  result.push(current.trim());
  return result;
}

/**
 * Extract financial data from CSV headers and rows
 * Uses pattern matching - NO AI needed!
 * Supports BOTH single-period and multi-period formats
 */
function extractFinancialDataFromCSV(
  headers: string[],
  dataRows: string[][]
): any {
  // Detect if this is a multi-period CSV
  // Multi-period has period names/years in columns (e.g., "Jan1-Mar31 2025", "2024", "2023")
  const periodColumns: number[] = [];
  const periodNames: string[] = [];

  headers.forEach((header, index) => {
    if (index === 0) return; // Skip first column (field names)

    const h = header.trim();
    // Check if this looks like a period/year: contains numbers, or year patterns
    if (/\d{4}/.test(h) || /\d{1,2}\s*-\s*\d{1,2}/.test(h) || /jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec/i.test(h)) {
      periodColumns.push(index);
      periodNames.push(h);
    }
  });

  // Multi-period format detected (row-based with field names in column 0)!
  if (periodColumns.length >= 1) {
    console.log(`[FREE CSV] Multi-period format detected: ${periodNames.length} period(s)`);
    return extractMultiPeriodData(headers, dataRows, periodColumns, periodNames);
  }

  // Single-period format (column-based with field names in headers) - RARE
  console.log(`[FREE CSV] Single-period format detected`);
  return extractSinglePeriodData(headers, dataRows);
}

/**
 * Extract multi-period data (Jan1-Mar31 2025, 2024, 2023, etc.)
 */
function extractMultiPeriodData(
  headers: string[],
  dataRows: string[][],
  periodColumns: number[],
  periodNames: string[]
): any {
  const result: any = {
    periods: periodNames,
    profitLoss: {},
    assets: {},
    liabilities: {},
    equity: {}
  };

  // Field mappings to multi-period structure
  const plFields: { [key: string]: string } = {
    'total sales revenue': 'totalSalesRevenue',
    'revenue': 'totalSalesRevenue',
    'sales': 'totalSalesRevenue',
    'cost of goods sold': 'costOfGoodsSold',
    'cogs': 'costOfGoodsSold',
    'operating expenses': 'operatingExpenses',
    'opex': 'operatingExpenses',
    'opex total': 'operatingExpenses',
    'gross margin': 'grossProfit',
    'gross profit': 'grossProfit',
    'net profit': 'netIncome',
    'net income': 'netIncome',
    'non-operating income': 'nonOperatingIncome',
    'other income': 'otherIncome',
    'other expenses': 'otherExpenses',
    'income taxes': 'incomeTaxes',
    'taxes': 'incomeTaxes'
  };

  const assetFields: { [key: string]: string } = {
    'cash': 'cash',
    'accounts receivable': 'accountsReceivable',
    'ar': 'accountsReceivable',
    'inventory': 'inventory',
    'other current assets': 'otherCurrentAssets',
    'fixed assets': 'fixedAssets',
    'ppe': 'fixedAssets',
    'accumulated depreciation': 'accumulatedDepreciation',
    'intangible assets': 'intangibleAssets',
    'other non-current assets': 'otherNonCurrentAssets',
    'assets': 'totalAssets',
    'total assets': 'totalAssets'
  };

  const liabilityFields: { [key: string]: string } = {
    'accounts payable': 'accountsPayable',
    'ap': 'accountsPayable',
    'short-term debt': 'shortTermDebt',
    'short term debt': 'shortTermDebt',
    'current portion long-term debt': 'currentPortionLongTermDebt',
    'current portion long term debt': 'currentPortionLongTermDebt',
    'other current liabilities': 'otherCurrentLiabilities',
    'long-term debt': 'longTermDebt',
    'long term debt': 'longTermDebt',
    'other non-current liabilities': 'otherNonCurrentLiabilities',
    'liabilities': 'totalLiabilities',
    'total liabilities': 'totalLiabilities'
  };

  const equityFields: { [key: string]: string } = {
    'owner\'s equity': 'ownersEquity',
    'owners equity': 'ownersEquity',
    'shareholder equity': 'ownersEquity',
    'shareholders equity': 'ownersEquity',
    'retained earnings': 'retainedEarnings',
    'equity': 'ownersEquity'
  };

  // Initialize period structures
  periodNames.forEach(period => {
    result.profitLoss[period] = {};
    result.assets[period] = {};
    result.liabilities[period] = {};
    result.equity[period] = {};
  });

  // Extract company name if present
  const companyRow = dataRows.find(row =>
    row[0]?.toLowerCase().includes('company') ||
    row[0]?.toLowerCase() === 'company name'
  );
  if (companyRow && companyRow[1]) {
    result.companyName = companyRow[1].trim();
  }

  // Process each row
  dataRows.forEach(row => {
    let fieldName = row[0]?.toLowerCase().trim();
    if (!fieldName) return;

    // Clean field name - remove common noise
    fieldName = fieldName
      .replace(/\(usd\)|\(cad\)|\(eur\)/gi, '') // Remove currency symbols
      .replace(/\s*-\s*total/gi, '') // "Assets - Total" → "Assets"
      .replace(/total\s*-\s*/gi, '') // "Total - Assets" → "Assets"
      .replace(/\(loss\)/gi, '') // "Net Profit/(Loss)" → "Net Profit"
      .replace(/\/loss/gi, '') // "Net Profit/Loss" → "Net Profit"
      .trim();

    // Check which category this field belongs to
    let targetObj: any = null;
    let mappedField: string | undefined;

    if (plFields[fieldName]) {
      targetObj = result.profitLoss;
      mappedField = plFields[fieldName];
    } else if (assetFields[fieldName]) {
      targetObj = result.assets;
      mappedField = assetFields[fieldName];
    } else if (liabilityFields[fieldName]) {
      targetObj = result.liabilities;
      mappedField = liabilityFields[fieldName];
    } else if (equityFields[fieldName]) {
      targetObj = result.equity;
      mappedField = equityFields[fieldName];
    }

    if (targetObj && mappedField) {
      // Extract values for each period
      periodColumns.forEach((colIndex, periodIndex) => {
        const value = parseFinancialNumber(row[colIndex]);
        if (value !== null) {
          const period = periodNames[periodIndex];
          targetObj[period][mappedField] = value;
        }
      });
    }
  });

  return result;
}

/**
 * Extract single-period data (legacy format)
 */
function extractSinglePeriodData(headers: string[], dataRows: string[][]): Partial<FinancialData> {
  const data: Partial<FinancialData> = {};

  // Common field name variations
  const fieldPatterns: { [key in keyof FinancialData]?: string[] } = {
    revenue: ['revenue', 'total revenue', 'sales', 'total sales', 'gross income', 'turnover', 'income'],
    costOfGoodsSold: ['cogs', 'cost of goods sold', 'cost of sales', 'cos'],
    grossProfit: ['gross profit', 'gross margin', 'gp'],
    operatingExpenses: ['operating expenses', 'opex', 'operating costs', 'operational expenses'],
    ebitda: ['ebitda', 'operating income', 'operating profit'],
    netIncome: ['net income', 'net profit', 'net earnings', 'bottom line', 'profit after tax'],
    totalAssets: ['total assets', 'assets'],
    currentAssets: ['current assets', 'ca'],
    fixedAssets: ['fixed assets', 'non-current assets', 'ppe', 'property plant equipment'],
    totalLiabilities: ['total liabilities', 'liabilities'],
    currentLiabilities: ['current liabilities', 'cl'],
    equity: ['equity', 'shareholders equity', 'owners equity', 'net worth'],
    operatingCashFlow: ['operating cash flow', 'cash from operations', 'ocf'],
    investingCashFlow: ['investing cash flow', 'cash from investing', 'icf'],
    financingCashFlow: ['financing cash flow', 'cash from financing', 'fcf'],
    netCashChange: ['net cash change', 'net change in cash', 'cash flow']
  };

  // Find matching columns
  const columnMap: { [key: string]: number } = {};

  headers.forEach((header, index) => {
    const normalizedHeader = header.toLowerCase().trim();

    for (const [field, patterns] of Object.entries(fieldPatterns)) {
      if (patterns.some(pattern => normalizedHeader.includes(pattern))) {
        columnMap[field] = index;
        break; // Found match, stop looking
      }
    }
  });

  // Extract values from first data row (usually the most recent year)
  if (dataRows.length > 0) {
    const firstRow = dataRows[0];

    for (const [field, columnIndex] of Object.entries(columnMap)) {
      const value = firstRow[columnIndex];
      if (value) {
        const numericValue = parseFinancialNumber(value);
        if (numericValue !== null) {
          data[field as keyof FinancialData] = numericValue as any;
        }
      }
    }
  }

  return data;
}

/**
 * Extract financial data from Excel rows (no headers)
 * Looks for patterns like "Revenue: $1,234,567"
 */
function extractFinancialDataFromRows(rows: any[][]): Partial<FinancialData> {
  const data: Partial<FinancialData> = {};

  const patterns: { [key in keyof FinancialData]?: RegExp[] } = {
    revenue: [/revenue/i, /total\s+sales/i, /gross\s+income/i],
    costOfGoodsSold: [/cogs/i, /cost\s+of\s+goods\s+sold/i, /cost\s+of\s+sales/i],
    grossProfit: [/gross\s+profit/i, /gross\s+margin/i],
    operatingExpenses: [/operating\s+expenses/i, /opex/i],
    ebitda: [/ebitda/i, /operating\s+income/i],
    netIncome: [/net\s+income/i, /net\s+profit/i, /net\s+earnings/i],
    totalAssets: [/total\s+assets/i, /^assets$/i],
    currentAssets: [/current\s+assets/i],
    totalLiabilities: [/total\s+liabilities/i, /^liabilities$/i],
    equity: [/equity/i, /shareholders\s+equity/i, /net\s+worth/i],
  };

  // Search through rows
  for (const row of rows) {
    if (!Array.isArray(row) || row.length < 2) continue;

    const firstCell = String(row[0]).trim();

    // Check if first cell matches any pattern
    for (const [field, regexList] of Object.entries(patterns)) {
      if (regexList.some((regex: RegExp) => regex.test(firstCell))) {
        // Look for numeric value in subsequent cells
        for (let i = 1; i < row.length; i++) {
          const value = parseFinancialNumber(String(row[i]));
          if (value !== null) {
            data[field as keyof FinancialData] = value as any;
            break; // Found value, move to next field
          }
        }
      }
    }
  }

  return data;
}

/**
 * Parse a financial number from string
 * Handles: "$1,234.56", "(1234)", "1.234,56", etc.
 */
function parseFinancialNumber(str: string): number | null {
  if (!str || typeof str !== 'string') return null;

  // Remove whitespace and common suffixes like "USD", "EUR"
  let cleaned = str.trim().replace(/\s+(USD|EUR|CAD|GBP)$/gi, '');

  // Check for empty or non-numeric
  if (!cleaned || !/[\d\(\)]/.test(cleaned)) return null;

  // Check for negative (parentheses) - handle both "(123)" and "$(123)"
  let isNegative = false;
  if (cleaned.match(/^[$€£¥₹]?\(.*\)$/)) {
    isNegative = true;
    // Remove outer parentheses
    cleaned = cleaned.replace(/^\(/, '').replace(/\)$/, '');
  }

  // Remove currency symbols
  cleaned = cleaned.replace(/[$€£¥₹]/g, '');

  // Remove thousands separators
  cleaned = cleaned.replace(/,/g, '');

  // Handle European format (1.234,56 → 1234.56)
  if (/^\d+\.\d{3},\d{2}$/.test(cleaned)) {
    cleaned = cleaned.replace(/\./g, '').replace(',', '.');
  }

  // Parse to number
  const num = parseFloat(cleaned);

  if (isNaN(num)) return null;

  return isNegative ? -num : num;
}

/**
 * Main free extraction function
 * Routes to appropriate parser based on file type
 */
export async function extractFinancialDataFree(
  fileBuffer: Buffer,
  fileName: string
): Promise<FreeExtractionResult> {
  const ext = fileName.split('.').pop()?.toLowerCase();

  switch (ext) {
    case 'csv':
      return await extractFromCSVFree(fileBuffer);

    case 'xlsx':
    case 'xls':
      return await extractFromExcelFree(fileBuffer);

    default:
      return {
        success: false,
        data: {},
        confidence: 0,
        method: 'csv-regex',
        fieldsExtracted: [],
        cost: 0,
        processingTime: 0,
        error: `Unsupported file type for free extraction: ${ext}`
      };
  }
}

/**
 * Compare free vs paid extraction
 * Use free first, only pay for AI if confidence is too low
 */
export interface HybridExtractionResult {
  freeResult: FreeExtractionResult;
  paidResult?: any; // From real-document-extraction.ts
  usedPaidMethod: boolean;
  totalCost: number;
  finalData: Partial<FinancialData>;
  finalConfidence: number;
}

export async function hybridExtraction(
  fileBuffer: Buffer,
  fileName: string,
  confidenceThreshold: number = 70
): Promise<HybridExtractionResult> {
  // Try FREE method first
  const freeResult = await extractFinancialDataFree(fileBuffer, fileName);

  // If confidence is high enough, use free result
  if (freeResult.confidence >= confidenceThreshold && freeResult.success) {
    return {
      freeResult,
      usedPaidMethod: false,
      totalCost: 0,
      finalData: freeResult.data,
      finalConfidence: freeResult.confidence
    };
  }

  // If free method failed or low confidence, THEN use paid method
  console.log(`[Hybrid] Free method confidence ${freeResult.confidence}% < ${confidenceThreshold}%, trying paid...`);

  // Import paid extraction (only when needed)
  const { extractFinancialData } = await import('./real-document-extraction');
  const paidResult = await extractFinancialData(fileBuffer, fileName);

  return {
    freeResult,
    paidResult,
    usedPaidMethod: true,
    totalCost: paidResult.cost,
    finalData: paidResult.data,
    finalConfidence: paidResult.confidence
  };
}
