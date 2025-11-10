// Common types for the POC

export interface ExtractionResult {
  field: string;
  value: string | number | null;
  confidence: number; // 0-100
  source: 'gpt4' | 'textract' | 'regex' | 'manual' | 'gpt4-vision';
  page?: number;
  boundingBox?: BoundingBox;
  extractionTime?: number; // milliseconds
  cost?: number; // USD
  error?: string;
}

export interface BoundingBox {
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface LogoExtractionResult {
  url: string;
  logoUrl: string | null;
  strategy: 'playwright' | 'gpt4-vision' | 'favicon-api' | 'clearbit' | 'iconhorse';
  confidence: number; // 0-100
  quality: {
    resolution: string;
    hasTransparency: boolean;
    format: string;
  } | null;
  extractionTime: number; // milliseconds
  cost: number; // USD
  error?: string;
  alternativeLogos?: Array<{
    url: string;
    confidence: number;
    strategy: string;
  }>;
}

export interface DocumentExtractionResult {
  documentId: string;
  documentType: 'profit-loss' | 'balance-sheet' | 'cashflow' | 'csv' | 'other';
  fileName: string;
  extractedFields: ExtractionResult[];
  validationErrors: ValidationError[];
  overallConfidence: number; // 0-100
  extractionTime: number; // milliseconds
  totalCost: number; // USD
  requiresManualReview: boolean;
}

export interface ValidationError {
  field: string;
  rule: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface FinancialData {
  // Profit & Loss
  revenue?: number;
  cogs?: number;
  grossProfit?: number;
  operatingExpenses?: number;
  ebitda?: number;
  netIncome?: number;

  // Balance Sheet
  totalAssets?: number;
  currentAssets?: number;
  fixedAssets?: number;
  totalLiabilities?: number;
  currentLiabilities?: number;
  equity?: number;

  // Cash Flow
  operatingCashFlow?: number;
  investingCashFlow?: number;
  financingCashFlow?: number;
  netCashChange?: number;
}

export interface PerformanceMetrics {
  documentType: string;
  totalProcessed: number;
  successful: number;
  failed: number;
  avgConfidence: number;
  avgProcessingTime: number;
  avgCost: number;
  errorBreakdown: {
    [key: string]: number;
  };
}

export interface ROICalculation {
  manualEntryTime: number; // minutes
  aiProcessingTime: number; // minutes
  accuracyManual: number; // 0-1
  accuracyAI: number; // 0-1
  costPerDocument: {
    gpt4Vision: number;
    textract: number;
    humanReview: number;
  };
  timeSaved: number;
  costSaved: number;
  netBenefit: number;
}
