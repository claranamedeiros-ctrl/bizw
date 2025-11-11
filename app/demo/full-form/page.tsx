'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, FileText, Sparkles, Clock, CheckCircle2, ArrowRight, DollarSign, AlertCircle } from 'lucide-react';

export default function FullFormDemo() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [extractedData, setExtractedData] = useState<any>(null);
  const [showAnimation, setShowAnimation] = useState(false);
  const [result, setResult] = useState<any>(null);

  // Default periods
  const periods = ['Jan1-Mar31 2025', '2024', '2023'];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const handleAutoFill = async () => {
    if (!file) return;

    setLoading(true);
    setShowAnimation(false);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/extract/document', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        setResult(data);
        setExtractedData(data.data);
        setShowAnimation(true);

        // Scroll to routing info first, then form
        setTimeout(() => {
          document.getElementById('routing-section')?.scrollIntoView({ behavior: 'smooth' });
        }, 300);
        setTimeout(() => {
          document.getElementById('form-section')?.scrollIntoView({ behavior: 'smooth' });
        }, 2000);
      }
    } catch (error) {
      console.error('Extraction error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setFile(null);
    setResult(null);
    setExtractedData(null);
    setShowAnimation(false);
    setLoading(false);
    const fileInput = document.getElementById('file-upload-full') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  };

  const getFieldValue = (section: string, period: string, field: string) => {
    if (!extractedData) return '';
    const value = extractedData[section]?.[period]?.[field];
    return value !== null && value !== undefined ? value : '';
  };

  const isFieldAutoFilled = (section: string, period: string, field: string) => {
    if (!extractedData) return false;
    const value = extractedData[section]?.[period]?.[field];
    return value !== null && value !== undefined;
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Complete Bizworth Valuation Form</h1>
        <p className="text-gray-600">
          See the FULL form, then watch it auto-fill from your documents
        </p>
      </div>

      {/* Upload Section - Always at top */}
      <Card className="mb-8 border-2 border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Step 1: Upload Your Financial Documents
          </CardTitle>
          <CardDescription>
            Upload PDF, Excel, or CSV to auto-fill the form below
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="border-2 border-dashed border-blue-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors bg-white">
              <input
                type="file"
                accept=".csv,.xlsx,.xls,.pdf"
                onChange={handleFileChange}
                className="hidden"
                id="file-upload-full"
              />
              <label htmlFor="file-upload-full" className="cursor-pointer">
                <FileText className="w-12 h-12 mx-auto mb-4 text-blue-500" />
                <p className="text-sm text-gray-600">
                  {file ? file.name : 'Click to upload financial documents'}
                </p>
              </label>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Button
                onClick={handleAutoFill}
                disabled={!file || loading}
                className="w-full"
                size="lg"
              >
                {loading ? (
                  <>
                    <Clock className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Auto-Fill Form with AI
                  </>
                )}
              </Button>
              <Button
                onClick={handleClear}
                variant="outline"
                disabled={loading}
                className="w-full"
                size="lg"
              >
                Clear
              </Button>
            </div>

            {showAnimation && (
              <Alert className="border-green-300 bg-green-50">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  <strong>Success!</strong> Auto-filled {
                    Object.values(extractedData?.profitLoss || {}).reduce((acc: number, period: any) =>
                      acc + Object.keys(period || {}).length, 0
                    ) +
                    Object.values(extractedData?.assets || {}).reduce((acc: number, period: any) =>
                      acc + Object.keys(period || {}).length, 0
                    )
                  } fields across {periods.length} periods. Review below!
                </AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Routing & Processing Info */}
      {result && (
        <div id="routing-section" className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Routing Decision */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ArrowRight className="w-5 h-5" />
                Step 2: Intelligent Routing
              </CardTitle>
              <CardDescription>How the system processed your document</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-semibold">File Type Detected</Label>
                <div className="mt-1">
                  <Badge variant="outline" className="text-lg">
                    {result.fileType.toUpperCase()}
                  </Badge>
                </div>
              </div>

              <div>
                <Label className="text-sm font-semibold">Extraction Strategy</Label>
                <p className="text-sm text-gray-600 mt-1">
                  {result.routing?.strategy}
                </p>
              </div>

              <div>
                <Label className="text-sm font-semibold">Why This Method?</Label>
                <Alert className="mt-2">
                  <AlertDescription className="text-sm">
                    {result.routing?.whyThisMethod}
                  </AlertDescription>
                </Alert>
              </div>

              {result.fallbackUsed && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Fallback method used - primary method had low confidence
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Cost & Performance */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Cost & Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label className="text-xs text-gray-500">Cost</Label>
                  <p className="text-2xl font-bold text-green-600">
                    ${result.cost?.toFixed(4) || '0.0000'}
                  </p>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Time</Label>
                  <p className="text-2xl font-bold">
                    {((result.processingTime || 0) / 1000).toFixed(1)}s
                  </p>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Confidence</Label>
                  <p className={`text-2xl font-bold ${
                    result.confidence >= 90 ? 'text-green-600' :
                    result.confidence >= 70 ? 'text-yellow-600' :
                    'text-orange-600'
                  }`}>
                    {result.confidence || 0}%
                  </p>
                </div>
              </div>

              {/* Low confidence warning */}
              {result.confidence < 70 && (
                <Alert variant="default" className="mt-4 border-orange-300 bg-orange-50">
                  <AlertCircle className="h-4 w-4 text-orange-600" />
                  <AlertDescription className="text-sm text-orange-800">
                    <strong>Low Confidence ({result.confidence}%)</strong> - Please review extracted data carefully.
                  </AlertDescription>
                </Alert>
              )}

              <div className="mt-4 pt-4 border-t">
                <p className="text-sm text-gray-600">
                  <strong>Method:</strong> {result.method}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  <strong>Fields Extracted:</strong> {
                    Object.values(extractedData?.profitLoss || {}).reduce((acc: number, period: any) =>
                      acc + Object.keys(period || {}).length, 0
                    ) +
                    Object.values(extractedData?.assets || {}).reduce((acc: number, period: any) =>
                      acc + Object.keys(period || {}).length, 0
                    ) +
                    Object.values(extractedData?.liabilities || {}).reduce((acc: number, period: any) =>
                      acc + Object.keys(period || {}).length, 0
                    ) +
                    Object.values(extractedData?.equity || {}).reduce((acc: number, period: any) =>
                      acc + Object.keys(period || {}).length, 0
                    )
                  } across {extractedData?.periods?.length || 0} periods
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* The Complete Form */}
      <div id="form-section" className="space-y-6">

        {/* Company Info */}
        <Card>
          <CardHeader>
            <CardTitle>Step 3: Company Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Company Name</Label>
              <Input
                value={extractedData?.companyName || ''}
                placeholder="Enter company name"
                className={isFieldAutoFilled('root', 'companyName', 'companyName') ? 'border-green-300 bg-green-50' : ''}
              />
            </div>
            <div>
              <Label>Currency</Label>
              <Input
                value={extractedData?.currency || 'USD'}
                placeholder="USD"
                className={isFieldAutoFilled('root', 'currency', 'currency') ? 'border-green-300 bg-green-50' : ''}
              />
            </div>
          </CardContent>
        </Card>

        {/* Step 3: Reporting Period Configuration */}
        <Card>
          <CardHeader>
            <CardTitle>Step 3: Reporting Period Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Fiscal Year Different from Calendar?</Label>
                <select className="w-full border rounded p-2">
                  <option value="false">No - Use Calendar Year</option>
                  <option value="true">Yes - Specify End Month</option>
                </select>
              </div>
              <div>
                <Label>Fiscal Year End Month</Label>
                <select className="w-full border rounded p-2">
                  <option>December</option>
                  <option>March</option>
                  <option>June</option>
                  <option>September</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Number of Full Years</Label>
                <select className="w-full border rounded p-2" defaultValue="3">
                  <option>1</option>
                  <option>2</option>
                  <option>3</option>
                  <option>4</option>
                  <option>5</option>
                </select>
              </div>
              <div>
                <Label>Include Partial Current Year?</Label>
                <select className="w-full border rounded p-2">
                  <option value="true">Yes</option>
                  <option value="false">No</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Step 4: Profit & Loss Statement */}
        <Card>
          <CardHeader>
            <CardTitle>Step 4: Profit & Loss Statement</CardTitle>
            <CardDescription>Multi-period income statement data</CardDescription>
          </CardHeader>
          <CardContent>
            <FinancialTable
              title="Income Statement"
              periods={periods}
              extractedData={extractedData}
              section="profitLoss"
              fields={[
                { key: 'totalSalesRevenue', label: 'Total Sales Revenue', required: true },
                { key: 'costOfGoodsSold', label: 'Cost of Goods Sold', required: true },
                { key: 'grossProfit', label: 'Gross Profit', calculated: true },
                { key: 'operatingExpenses', label: 'Operating Expenses', required: true },
                { key: 'nonOperatingIncome', label: 'Non-Operating Income' },
                { key: 'otherIncome', label: 'Other Income' },
                { key: 'otherExpenses', label: 'Other Expenses' },
                { key: 'netOtherIncomeExpenses', label: 'Net Other Income/Expenses', calculated: true },
                { key: 'netIncomeBeforeTaxes', label: 'Net Income Before Taxes', calculated: true },
                { key: 'incomeTaxes', label: 'Income Taxes' },
                { key: 'netIncome', label: 'Net Income', calculated: true },
              ]}
            />
          </CardContent>
        </Card>

        {/* Step 5: Balance Sheet - Assets */}
        <Card>
          <CardHeader>
            <CardTitle>Step 5: Balance Sheet - Assets</CardTitle>
            <CardDescription>Multi-period asset breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <FinancialTable
              title="Assets"
              periods={periods}
              extractedData={extractedData}
              section="assets"
              fields={[
                { key: 'cash', label: 'Cash', required: true },
                { key: 'accountsReceivable', label: 'Accounts Receivable', required: true },
                { key: 'inventory', label: 'Inventory' },
                { key: 'otherCurrentAssets', label: 'Other Current Assets' },
                { key: 'totalCurrentAssets', label: 'Total Current Assets', calculated: true },
                { key: 'fixedAssets', label: 'Fixed Assets (PP&E)' },
                { key: 'accumulatedDepreciation', label: 'Accumulated Depreciation' },
                { key: 'netFixedAssets', label: 'Net Fixed Assets', calculated: true },
                { key: 'intangibleAssets', label: 'Intangible Assets' },
                { key: 'otherNonCurrentAssets', label: 'Other Non-Current Assets' },
                { key: 'totalAssets', label: 'Total Assets', calculated: true, highlight: true },
              ]}
            />
          </CardContent>
        </Card>

        {/* Step 5: Balance Sheet - Liabilities */}
        <Card>
          <CardHeader>
            <CardTitle>Step 5: Balance Sheet - Liabilities</CardTitle>
            <CardDescription>Multi-period liability breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <FinancialTable
              title="Liabilities"
              periods={periods}
              extractedData={extractedData}
              section="liabilities"
              fields={[
                { key: 'accountsPayable', label: 'Accounts Payable' },
                { key: 'shortTermDebt', label: 'Short-term Debt' },
                { key: 'currentPortionLongTermDebt', label: 'Current Portion of Long-term Debt' },
                { key: 'otherCurrentLiabilities', label: 'Other Current Liabilities' },
                { key: 'totalCurrentLiabilities', label: 'Total Current Liabilities', calculated: true },
                { key: 'longTermDebt', label: 'Long-term Debt' },
                { key: 'otherNonCurrentLiabilities', label: 'Other Non-Current Liabilities' },
                { key: 'totalLiabilities', label: 'Total Liabilities', calculated: true, highlight: true },
              ]}
            />
          </CardContent>
        </Card>

        {/* Step 5: Balance Sheet - Equity */}
        <Card>
          <CardHeader>
            <CardTitle>Step 5: Balance Sheet - Equity</CardTitle>
            <CardDescription>Multi-period equity breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <FinancialTable
              title="Equity"
              periods={periods}
              extractedData={extractedData}
              section="equity"
              fields={[
                { key: 'ownersEquity', label: "Owner's Equity" },
                { key: 'retainedEarnings', label: 'Retained Earnings' },
                { key: 'totalEquity', label: 'Total Equity', calculated: true, highlight: true },
              ]}
            />
          </CardContent>
        </Card>

        {/* Step 6: Owner Compensation */}
        <Card>
          <CardHeader>
            <CardTitle>Step 6: Owner Compensation Adjustments</CardTitle>
            <CardDescription>Owner compensation for normalized cash flow</CardDescription>
          </CardHeader>
          <CardContent>
            <FinancialTable
              title="Owner Compensation"
              periods={periods}
              extractedData={extractedData}
              section="ownerCompensation"
              fields={[
                { key: 'ownerSalary', label: 'Owner Salary' },
                { key: 'ownerBonuses', label: 'Owner Bonuses' },
                { key: 'ownerBenefits', label: 'Owner Benefits (Health, Retirement, etc.)' },
                { key: 'ownerPayrollTaxes', label: 'Owner Payroll Taxes' },
                { key: 'totalOwnerComp', label: 'Total Owner Compensation', calculated: true },
              ]}
            />
          </CardContent>
        </Card>

        {/* Legend */}
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-4 items-center">
              <Label className="font-semibold">Field Types:</Label>
              <Badge className="bg-green-500">Auto-Filled by AI</Badge>
              <Badge variant="outline">Manual Entry Required</Badge>
              <Badge className="bg-blue-500">Calculated Automatically</Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Reusable table component
function FinancialTable({
  title,
  periods,
  extractedData,
  section,
  fields,
}: {
  title: string;
  periods: string[];
  extractedData: any;
  section: string;
  fields: Array<{
    key: string;
    label: string;
    required?: boolean;
    calculated?: boolean;
    highlight?: boolean;
  }>;
}) {
  const getFieldValue = (period: string, field: string) => {
    if (!extractedData) return '';
    const value = extractedData[section]?.[period]?.[field];
    return value !== null && value !== undefined ? value : '';
  };

  const isAutoFilled = (period: string, field: string) => {
    if (!extractedData) return false;
    const value = extractedData[section]?.[period]?.[field];
    return value !== null && value !== undefined;
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b bg-gray-50">
            <th className="text-left p-3 font-semibold min-w-[200px]">Field</th>
            {periods.map((period) => (
              <th key={period} className="text-right p-3 font-semibold">
                {period}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {fields.map((field) => (
            <tr key={field.key} className="border-b hover:bg-gray-50">
              <td className="p-3">
                <div className="flex items-center gap-2">
                  <span className={field.highlight ? 'font-semibold' : ''}>
                    {field.label}
                  </span>
                  {field.required && <Badge variant="outline" className="text-xs">Required</Badge>}
                  {field.calculated && <Badge className="bg-blue-500 text-xs">Calculated</Badge>}
                </div>
              </td>
              {periods.map((period) => {
                const value = getFieldValue(period, field.key);
                const autoFilled = isAutoFilled(period, field.key);

                return (
                  <td key={`${period}-${field.key}`} className="p-2">
                    <Input
                      type="number"
                      value={value}
                      placeholder={field.calculated ? 'Auto' : '0.00'}
                      readOnly={field.calculated}
                      className={`text-right ${
                        autoFilled
                          ? 'border-green-300 bg-green-50 animate-pulse'
                          : field.calculated
                          ? 'bg-blue-50'
                          : ''
                      }`}
                    />
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
