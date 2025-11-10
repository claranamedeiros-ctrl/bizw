import { FinancialData, ValidationError } from './types';

/**
 * Financial validation rules that catch common errors
 * These demonstrate the value of AI-powered validation
 */

export function validateBalanceSheet(data: Partial<FinancialData>): ValidationError[] {
  const errors: ValidationError[] = [];

  // Assets = Liabilities + Equity (fundamental accounting equation)
  if (data.totalAssets && data.totalLiabilities && data.equity) {
    const sum = data.totalLiabilities + data.equity;
    const diff = Math.abs(data.totalAssets - sum);
    const tolerance = data.totalAssets * 0.01; // 1% tolerance for rounding

    if (diff > tolerance) {
      errors.push({
        field: 'totalAssets',
        rule: 'accounting-equation',
        message: `Assets ($${data.totalAssets.toLocaleString()}) should equal Liabilities + Equity ($${sum.toLocaleString()}). Difference: $${diff.toLocaleString()}`,
        severity: 'error',
      });
    }
  }

  // Current Assets should be less than Total Assets
  if (data.currentAssets && data.totalAssets && data.currentAssets > data.totalAssets) {
    errors.push({
      field: 'currentAssets',
      rule: 'current-assets-range',
      message: `Current Assets cannot exceed Total Assets`,
        severity: 'error',
    });
  }

  // Current Liabilities should be less than Total Liabilities
  if (data.currentLiabilities && data.totalLiabilities && data.currentLiabilities > data.totalLiabilities) {
    errors.push({
      field: 'currentLiabilities',
      rule: 'current-liabilities-range',
      message: `Current Liabilities cannot exceed Total Liabilities`,
      severity: 'error',
    });
  }

  return errors;
}

export function validateProfitLoss(data: Partial<FinancialData>): ValidationError[] {
  const errors: ValidationError[] = [];

  // Gross Profit = Revenue - COGS
  if (data.revenue && data.cogs && data.grossProfit) {
    const calculated = data.revenue - data.cogs;
    const diff = Math.abs(data.grossProfit - calculated);
    const tolerance = data.revenue * 0.01;

    if (diff > tolerance) {
      errors.push({
        field: 'grossProfit',
        rule: 'gross-profit-calculation',
        message: `Gross Profit should be Revenue - COGS. Expected: $${calculated.toLocaleString()}, Got: $${data.grossProfit.toLocaleString()}`,
        severity: 'error',
      });
    }
  }

  // Revenue should be positive
  if (data.revenue && data.revenue < 0) {
    errors.push({
      field: 'revenue',
      rule: 'positive-revenue',
      message: `Revenue should typically be positive`,
      severity: 'warning',
    });
  }

  // COGS should be positive (or zero)
  if (data.cogs && data.cogs < 0) {
    errors.push({
      field: 'cogs',
      rule: 'positive-cogs',
      message: `Cost of Goods Sold should be positive`,
      severity: 'warning',
    });
  }

  // Operating expenses should be positive
  if (data.operatingExpenses && data.operatingExpenses < 0) {
    errors.push({
      field: 'operatingExpenses',
      rule: 'positive-expenses',
      message: `Operating Expenses should be positive`,
      severity: 'warning',
    });
  }

  // Sanity check: COGS shouldn't exceed revenue by too much
  if (data.revenue && data.cogs && data.cogs > data.revenue * 2) {
    errors.push({
      field: 'cogs',
      rule: 'cogs-sanity',
      message: `COGS is more than 2x revenue, which is unusual. Please verify.`,
      severity: 'warning',
    });
  }

  return errors;
}

export function validateCashFlow(data: Partial<FinancialData>): ValidationError[] {
  const errors: ValidationError[] = [];

  // Net Cash Change should equal sum of all activities
  if (
    data.operatingCashFlow &&
    data.investingCashFlow &&
    data.financingCashFlow &&
    data.netCashChange
  ) {
    const calculated =
      data.operatingCashFlow + data.investingCashFlow + data.financingCashFlow;
    const diff = Math.abs(data.netCashChange - calculated);
    const tolerance = Math.abs(data.netCashChange) * 0.01;

    if (diff > tolerance) {
      errors.push({
        field: 'netCashChange',
        rule: 'cash-flow-reconciliation',
        message: `Net Cash Change should equal sum of all activities. Expected: $${calculated.toLocaleString()}, Got: $${data.netCashChange.toLocaleString()}`,
        severity: 'error',
      });
    }
  }

  return errors;
}

/**
 * Comprehensive validation for all extracted financial data
 */
export function validateFinancialData(data: Partial<FinancialData>): ValidationError[] {
  const allErrors: ValidationError[] = [];

  // Run all applicable validations
  allErrors.push(...validateProfitLoss(data));
  allErrors.push(...validateBalanceSheet(data));
  allErrors.push(...validateCashFlow(data));

  return allErrors;
}

/**
 * Calculate confidence adjustment based on validation results
 * More errors = lower confidence
 */
export function calculateConfidenceAdjustment(errors: ValidationError[]): number {
  let adjustment = 0;

  errors.forEach((error) => {
    if (error.severity === 'error') {
      adjustment -= 15; // Errors significantly reduce confidence
    } else {
      adjustment -= 5; // Warnings moderately reduce confidence
    }
  });

  return Math.max(adjustment, -50); // Cap at -50%
}
