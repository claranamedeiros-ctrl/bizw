/**
 * Complete Financial Data Structure
 * Matches Bizworth's actual form requirements
 */

export interface BizworthFinancialData {
  // Company & Period Info
  companyName?: string;
  fiscalYearDifferentFromCalendar?: boolean;
  fiscalYearEndMonth?: string;
  periods: string[]; // ["Jan1-Mar31 2025", "2024", "2023"]

  // Profit & Loss Statement (multi-period)
  profitLoss: {
    [period: string]: {
      totalSalesRevenue?: number;
      costOfGoodsSold?: number;
      grossProfit?: number; // Calculated
      operatingExpenses?: number;
      nonOperatingIncome?: number;
      otherIncome?: number;
      otherExpenses?: number;
      netOtherIncomeExpenses?: number; // Calculated
      netIncomeBeforeTaxes?: number; // Calculated
      incomeTaxes?: number;
      netIncome?: number; // Calculated
    };
  };

  // Balance Sheet - Assets (multi-period)
  assets: {
    [period: string]: {
      cash?: number;
      accountsReceivable?: number;
      inventory?: number;
      otherCurrentAssets?: number;
      totalCurrentAssets?: number; // Calculated
      fixedAssets?: number;
      accumulatedDepreciation?: number;
      netFixedAssets?: number; // Calculated
      intangibleAssets?: number;
      otherNonCurrentAssets?: number;
      totalAssets?: number; // Calculated
    };
  };

  // Balance Sheet - Liabilities (multi-period)
  liabilities: {
    [period: string]: {
      accountsPayable?: number;
      shortTermDebt?: number;
      currentPortionLongTermDebt?: number;
      otherCurrentLiabilities?: number;
      totalCurrentLiabilities?: number; // Calculated
      longTermDebt?: number;
      otherNonCurrentLiabilities?: number;
      totalLiabilities?: number; // Calculated
    };
  };

  // Balance Sheet - Equity (multi-period)
  equity: {
    [period: string]: {
      ownersEquity?: number;
      retainedEarnings?: number;
      totalEquity?: number; // Calculated
    };
  };

  // Owner Compensation (multi-period)
  ownerCompensation?: {
    [period: string]: {
      ownerSalary?: number;
      ownerBonuses?: number;
      ownerBenefits?: number;
      ownerPayrollTaxes?: number;
      totalOwnerComp?: number; // Calculated
    };
  };
}

/**
 * Extraction result with confidence per field
 */
export interface ExtractedField {
  field: string;
  value: number | string | null;
  confidence: number;
  sourcePage?: number;
  requiresReview: boolean;
  calculatedFrom?: string[]; // For calculated fields
}

/**
 * Validation results
 */
export interface ValidationResult {
  field: string;
  rule: string;
  passed: boolean;
  expected?: number;
  actual?: number;
  message: string;
  severity: 'error' | 'warning';
}

/**
 * Calculate derived fields
 */
export function calculateFinancialFields(data: Partial<BizworthFinancialData>): {
  data: Partial<BizworthFinancialData>;
  calculations: Array<{ field: string; formula: string; value: number }>;
} {
  const calculations: Array<{ field: string; formula: string; value: number }> = [];

  if (!data.periods) return { data, calculations };

  // For each period, calculate derived fields
  for (const period of data.periods) {
    // P&L Calculations
    if (data.profitLoss?.[period]) {
      const pl = data.profitLoss[period];

      // Gross Profit = Revenue - COGS
      if (pl.totalSalesRevenue !== undefined && pl.costOfGoodsSold !== undefined) {
        pl.grossProfit = pl.totalSalesRevenue - pl.costOfGoodsSold;
        calculations.push({
          field: `profitLoss.${period}.grossProfit`,
          formula: 'Revenue - COGS',
          value: pl.grossProfit,
        });
      }

      // Net Other Income/Expenses
      if (
        pl.nonOperatingIncome !== undefined &&
        pl.otherIncome !== undefined &&
        pl.otherExpenses !== undefined
      ) {
        pl.netOtherIncomeExpenses =
          (pl.nonOperatingIncome || 0) + (pl.otherIncome || 0) - (pl.otherExpenses || 0);
        calculations.push({
          field: `profitLoss.${period}.netOtherIncomeExpenses`,
          formula: 'Non-Op Income + Other Income - Other Expenses',
          value: pl.netOtherIncomeExpenses,
        });
      }

      // Net Income Before Taxes
      if (
        pl.grossProfit !== undefined &&
        pl.operatingExpenses !== undefined &&
        pl.netOtherIncomeExpenses !== undefined
      ) {
        pl.netIncomeBeforeTaxes =
          pl.grossProfit - (pl.operatingExpenses || 0) + (pl.netOtherIncomeExpenses || 0);
        calculations.push({
          field: `profitLoss.${period}.netIncomeBeforeTaxes`,
          formula: 'Gross Profit - OpEx + Net Other Income',
          value: pl.netIncomeBeforeTaxes,
        });
      }

      // Net Income
      if (pl.netIncomeBeforeTaxes !== undefined && pl.incomeTaxes !== undefined) {
        pl.netIncome = pl.netIncomeBeforeTaxes - (pl.incomeTaxes || 0);
        calculations.push({
          field: `profitLoss.${period}.netIncome`,
          formula: 'Net Income Before Taxes - Taxes',
          value: pl.netIncome,
        });
      }
    }

    // Asset Calculations
    if (data.assets?.[period]) {
      const assets = data.assets[period];

      // Total Current Assets
      const currentAssets = [
        assets.cash,
        assets.accountsReceivable,
        assets.inventory,
        assets.otherCurrentAssets,
      ].filter((v) => v !== undefined);

      if (currentAssets.length > 0) {
        assets.totalCurrentAssets = currentAssets.reduce((sum, v) => sum + (v || 0), 0);
        calculations.push({
          field: `assets.${period}.totalCurrentAssets`,
          formula: 'Cash + AR + Inventory + Other Current',
          value: assets.totalCurrentAssets,
        });
      }

      // Net Fixed Assets
      if (assets.fixedAssets !== undefined && assets.accumulatedDepreciation !== undefined) {
        assets.netFixedAssets = assets.fixedAssets - (assets.accumulatedDepreciation || 0);
        calculations.push({
          field: `assets.${period}.netFixedAssets`,
          formula: 'Fixed Assets - Accumulated Depreciation',
          value: assets.netFixedAssets,
        });
      }

      // Total Assets
      const totalComponents = [
        assets.totalCurrentAssets,
        assets.netFixedAssets,
        assets.intangibleAssets,
        assets.otherNonCurrentAssets,
      ].filter((v) => v !== undefined);

      if (totalComponents.length > 0) {
        assets.totalAssets = totalComponents.reduce((sum, v) => sum + (v || 0), 0);
        calculations.push({
          field: `assets.${period}.totalAssets`,
          formula: 'Current + Net Fixed + Intangible + Other Non-Current',
          value: assets.totalAssets,
        });
      }
    }

    // Liability Calculations
    if (data.liabilities?.[period]) {
      const liab = data.liabilities[period];

      // Total Current Liabilities
      const currentLiab = [
        liab.accountsPayable,
        liab.shortTermDebt,
        liab.currentPortionLongTermDebt,
        liab.otherCurrentLiabilities,
      ].filter((v) => v !== undefined);

      if (currentLiab.length > 0) {
        liab.totalCurrentLiabilities = currentLiab.reduce((sum, v) => sum + (v || 0), 0);
        calculations.push({
          field: `liabilities.${period}.totalCurrentLiabilities`,
          formula: 'AP + Short-term Debt + Current LTD + Other Current',
          value: liab.totalCurrentLiabilities,
        });
      }

      // Total Liabilities
      const totalLiab = [
        liab.totalCurrentLiabilities,
        liab.longTermDebt,
        liab.otherNonCurrentLiabilities,
      ].filter((v) => v !== undefined);

      if (totalLiab.length > 0) {
        liab.totalLiabilities = totalLiab.reduce((sum, v) => sum + (v || 0), 0);
        calculations.push({
          field: `liabilities.${period}.totalLiabilities`,
          formula: 'Current + LT Debt + Other Non-Current',
          value: liab.totalLiabilities,
        });
      }
    }

    // Equity Calculations
    if (data.equity?.[period]) {
      const eq = data.equity[period];

      if (eq.ownersEquity !== undefined && eq.retainedEarnings !== undefined) {
        eq.totalEquity = (eq.ownersEquity || 0) + (eq.retainedEarnings || 0);
        calculations.push({
          field: `equity.${period}.totalEquity`,
          formula: "Owner's Equity + Retained Earnings",
          value: eq.totalEquity,
        });
      }
    }
  }

  return { data, calculations };
}

/**
 * Validate financial data
 */
export function validateFinancialData(
  data: Partial<BizworthFinancialData>
): ValidationResult[] {
  const validations: ValidationResult[] = [];

  if (!data.periods) return validations;

  for (const period of data.periods) {
    // Balance Sheet Balance Check
    if (
      data.assets?.[period]?.totalAssets !== undefined &&
      data.liabilities?.[period]?.totalLiabilities !== undefined &&
      data.equity?.[period]?.totalEquity !== undefined
    ) {
      const assets = data.assets[period].totalAssets!;
      const liabPlusEquity =
        data.liabilities[period].totalLiabilities! + data.equity[period].totalEquity!;
      const diff = Math.abs(assets - liabPlusEquity);
      const tolerance = 0.01; // 1% tolerance

      validations.push({
        field: `balanceSheet.${period}`,
        rule: 'Assets = Liabilities + Equity',
        passed: diff / assets < tolerance,
        expected: assets,
        actual: liabPlusEquity,
        message:
          diff / assets < tolerance
            ? 'Balance sheet balances'
            : `Off by ${diff.toFixed(2)} (${((diff / assets) * 100).toFixed(1)}%)`,
        severity: diff / assets < tolerance ? 'warning' : 'error',
      });
    }

    // Gross Margin Sanity Check
    if (
      data.profitLoss?.[period]?.grossProfit !== undefined &&
      data.profitLoss?.[period]?.totalSalesRevenue !== undefined
    ) {
      const grossMargin =
        data.profitLoss[period].grossProfit! / data.profitLoss[period].totalSalesRevenue!;

      validations.push({
        field: `profitLoss.${period}.grossMargin`,
        rule: 'Gross Margin between 0% and 100%',
        passed: grossMargin > 0 && grossMargin < 1,
        expected: undefined,
        actual: grossMargin,
        message:
          grossMargin > 0 && grossMargin < 1
            ? `Gross margin: ${(grossMargin * 100).toFixed(1)}%`
            : `Unusual gross margin: ${(grossMargin * 100).toFixed(1)}%`,
        severity: grossMargin > 0 && grossMargin < 1 ? 'warning' : 'error',
      });
    }

    // Current Ratio Check
    if (
      data.assets?.[period]?.totalCurrentAssets !== undefined &&
      data.liabilities?.[period]?.totalCurrentLiabilities !== undefined &&
      data.liabilities[period].totalCurrentLiabilities! > 0
    ) {
      const currentRatio =
        data.assets[period].totalCurrentAssets! /
        data.liabilities[period].totalCurrentLiabilities!;

      validations.push({
        field: `ratios.${period}.currentRatio`,
        rule: 'Current Ratio > 0.5',
        passed: currentRatio > 0.5,
        expected: undefined,
        actual: currentRatio,
        message:
          currentRatio > 0.5
            ? `Healthy current ratio: ${currentRatio.toFixed(2)}`
            : `Low current ratio: ${currentRatio.toFixed(2)} (liquidity concern)`,
        severity: currentRatio > 0.5 ? 'warning' : 'error',
      });
    }
  }

  return validations;
}
