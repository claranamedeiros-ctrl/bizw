'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, FileText, DollarSign, Clock, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';

export default function DemoPage() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setResult(null); // Clear previous results
    }
  };

  const handleClear = () => {
    setFile(null);
    setResult(null);
    setLoading(false);
    // Reset file input
    const fileInput = document.getElementById('file-upload') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setLoading(true);
    setResult(null); // Clear old results before new upload

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/extract/document-real', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error('Upload error:', error);
      setResult({
        success: false,
        error: 'Failed to upload file',
      });
    } finally {
      setLoading(false);
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 90) return 'text-green-600 bg-green-50 border-green-200';
    if (confidence >= 70) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 90) return <Badge className="bg-green-500">Alta</Badge>;
    if (confidence >= 70) return <Badge className="bg-yellow-500">Media</Badge>;
    return <Badge className="bg-red-500">Baja</Badge>;
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Bizworth POC - Document Extraction Demo</h1>
        <p className="text-gray-600">
          Upload a financial document to see the intelligent routing and extraction in action
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Upload & Routing */}
        <div className="space-y-6">
          {/* Upload Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="w-5 h-5" />
                Step 1: Upload Document
              </CardTitle>
              <CardDescription>
                Upload CSV, Excel, PDF, or Word document
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors">
                  <input
                    type="file"
                    accept=".csv,.xlsx,.xls,.pdf,.doc,.docx"
                    onChange={handleFileChange}
                    className="hidden"
                    id="file-upload"
                  />
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <p className="text-sm text-gray-600">
                      {file ? file.name : 'Click to upload or drag and drop'}
                    </p>
                    {file && (
                      <p className="text-xs text-gray-500 mt-2">
                        {(file.size / 1024).toFixed(2)} KB
                      </p>
                    )}
                  </label>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={handleUpload}
                    disabled={!file || loading}
                    className="flex-1"
                    size="lg"
                  >
                    {loading ? 'Processing...' : 'Extract Data'}
                  </Button>

                  <Button
                    onClick={handleClear}
                    disabled={loading}
                    variant="outline"
                    size="lg"
                    className="px-6"
                  >
                    Clear
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Routing Info */}
          {result?.routing && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ArrowRight className="w-5 h-5" />
                  Step 2: Intelligent Routing
                </CardTitle>
                <CardDescription>
                  How the system processed your document
                </CardDescription>
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
                    {result.routing.strategy}
                  </p>
                </div>

                <div>
                  <Label className="text-sm font-semibold">Why This Method?</Label>
                  <Alert className="mt-2">
                    <AlertDescription className="text-sm">
                      {result.routing.whyThisMethod}
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
          )}

          {/* Cost & Performance */}
          {result && (
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
                    <p className="text-2xl font-bold">
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
                      <strong>Low Confidence ({result.confidence}%)</strong> - Please review extracted data carefully. Some fields may be missing or incorrect.
                    </AlertDescription>
                  </Alert>
                )}

                <div className="mt-4 pt-4 border-t">
                  <p className="text-sm text-gray-600">
                    <strong>Method:</strong> {result.method}
                  </p>
                  {result.fallbackUsed && (
                    <p className="text-sm text-orange-600 mt-1">
                      ⚠️ Fallback used for better accuracy
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column: Extracted Data Form */}
        <div>
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5" />
                Step 3: Extracted Financial Data
              </CardTitle>
              <CardDescription>
                Auto-filled from your document (editable)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!result && (
                <div className="text-center py-12 text-gray-400">
                  <FileText className="w-16 h-16 mx-auto mb-4 opacity-20" />
                  <p>Upload a document to see extracted data</p>
                </div>
              )}

              {result?.success && result?.data && (
                <div className="space-y-4 max-h-[600px] overflow-y-auto">
                  {/* Company Info */}
                  {result.data.companyName && (
                    <div>
                      <Label className="text-sm">Company Name</Label>
                      <Input
                        value={result.data.companyName}
                        readOnly
                        className="mt-1"
                      />
                    </div>
                  )}

                  {result.data.currency && (
                    <div>
                      <Label className="text-sm">Currency</Label>
                      <Input value={result.data.currency || 'USD'} readOnly className="mt-1" />
                    </div>
                  )}

                  {/* Multi-Period Table */}
                  {result.data.periods && result.data.periods.length > 0 && (
                    <div className="pt-4 border-t">
                      <h3 className="font-semibold mb-3">Multi-Period Financial Data</h3>

                      {/* Profit & Loss */}
                      {result.data.profitLoss && (
                        <div className="mb-6">
                          <h4 className="text-sm font-semibold mb-2 text-gray-700">Profit & Loss Statement</h4>
                          <FinancialTable
                            periods={result.data.periods}
                            data={result.data.profitLoss}
                            confidence={result.confidence}
                            fields={[
                              { key: 'totalSalesRevenue', label: 'Total Sales Revenue' },
                              { key: 'costOfGoodsSold', label: 'Cost of Goods Sold' },
                              { key: 'operatingExpenses', label: 'Operating Expenses' },
                              { key: 'incomeTaxes', label: 'Income Taxes' },
                            ]}
                          />
                        </div>
                      )}

                      {/* Assets */}
                      {result.data.assets && (
                        <div className="mb-6">
                          <h4 className="text-sm font-semibold mb-2 text-gray-700">Assets</h4>
                          <FinancialTable
                            periods={result.data.periods}
                            data={result.data.assets}
                            confidence={result.confidence}
                            fields={[
                              { key: 'cash', label: 'Cash' },
                              { key: 'accountsReceivable', label: 'Accounts Receivable' },
                              { key: 'inventory', label: 'Inventory' },
                              { key: 'fixedAssets', label: 'Fixed Assets' },
                            ]}
                          />
                        </div>
                      )}

                      {/* Liabilities */}
                      {result.data.liabilities && (
                        <div className="mb-6">
                          <h4 className="text-sm font-semibold mb-2 text-gray-700">Liabilities</h4>
                          <FinancialTable
                            periods={result.data.periods}
                            data={result.data.liabilities}
                            confidence={result.confidence}
                            fields={[
                              { key: 'accountsPayable', label: 'Accounts Payable' },
                              { key: 'shortTermDebt', label: 'Short-term Debt' },
                              { key: 'longTermDebt', label: 'Long-term Debt' },
                            ]}
                          />
                        </div>
                      )}

                      {/* Equity */}
                      {result.data.equity && (
                        <div className="mb-6">
                          <h4 className="text-sm font-semibold mb-2 text-gray-700">Equity</h4>
                          <FinancialTable
                            periods={result.data.periods}
                            data={result.data.equity}
                            confidence={result.confidence}
                            fields={[
                              { key: 'ownersEquity', label: "Owner's Equity" },
                              { key: 'retainedEarnings', label: 'Retained Earnings' },
                            ]}
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {/* Calculated Fields */}
                  {result.calculations && result.calculations.length > 0 && (
                    <div className="pt-4 border-t">
                      <h4 className="text-sm font-semibold mb-2 text-gray-700">
                        Auto-Calculated Fields ({result.calculations.length})
                      </h4>
                      <div className="space-y-1 text-xs">
                        {result.calculations.slice(0, 5).map((calc: any, idx: number) => (
                          <div key={idx} className="text-gray-600 font-mono">
                            {calc.field} = {calc.formula} = {calc.value.toLocaleString()}
                          </div>
                        ))}
                        {result.calculations.length > 5 && (
                          <div className="text-gray-500 italic">
                            + {result.calculations.length - 5} more calculations...
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Validation Results */}
                  {result.validations && result.validations.length > 0 && (
                    <div className="pt-4 border-t">
                      <h4 className="text-sm font-semibold mb-2 text-gray-700">
                        Validation Results
                      </h4>
                      <div className="space-y-2">
                        {result.validations.map((validation: any, idx: number) => (
                          <Alert
                            key={idx}
                            variant={validation.passed ? "default" : "destructive"}
                            className="py-2"
                          >
                            {!validation.passed && <AlertCircle className="h-4 w-4" />}
                            {validation.passed && <CheckCircle2 className="h-4 w-4" />}
                            <AlertDescription className="text-xs">
                              <strong>{validation.rule}:</strong> {validation.message}
                            </AlertDescription>
                          </Alert>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Legend */}
                  <div className="pt-4 border-t">
                    <Label className="text-sm mb-2 block">Confidence Legend</Label>
                    <div className="flex flex-wrap gap-2">
                      <Badge className="bg-green-500">Alta ≥90%</Badge>
                      <Badge className="bg-yellow-500">Media 70-89%</Badge>
                      <Badge className="bg-red-500">Baja &lt;70%</Badge>
                    </div>
                  </div>
                </div>
              )}

              {result && !result.success && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    {result.error || 'Extraction failed'}
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// Multi-period financial data table
function FinancialTable({
  periods,
  data,
  confidence,
  fields,
}: {
  periods: string[];
  data: { [period: string]: any };
  confidence: number;
  fields: Array<{ key: string; label: string }>;
}) {
  const getConfidenceColor = (conf: number) => {
    if (conf >= 90) return 'bg-green-50';
    if (conf >= 70) return 'bg-yellow-50';
    return 'bg-red-50';
  };

  const formatValue = (value: any) => {
    if (value === null || value === undefined) return '-';
    if (typeof value === 'number') {
      return value.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    }
    return value;
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b">
            <th className="text-left p-2 font-semibold bg-gray-50">Field</th>
            {periods.map((period) => (
              <th key={period} className="text-right p-2 font-semibold bg-gray-50">
                {period}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {fields.map((field) => (
            <tr key={field.key} className="border-b hover:bg-gray-50">
              <td className="p-2 text-gray-700">{field.label}</td>
              {periods.map((period) => {
                const value = data[period]?.[field.key];
                const hasValue = value !== null && value !== undefined;
                return (
                  <td
                    key={`${period}-${field.key}`}
                    className={`p-2 text-right font-mono ${hasValue ? getConfidenceColor(confidence) : ''}`}
                  >
                    {formatValue(value)}
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

// Helper component for fields with confidence coloring (legacy - for backward compatibility)
function FieldWithConfidence({
  label,
  value,
  confidence,
}: {
  label: string;
  value: number;
  confidence: number;
}) {
  const getColor = () => {
    if (confidence >= 90) return 'border-green-300 bg-green-50';
    if (confidence >= 70) return 'border-yellow-300 bg-yellow-50';
    return 'border-red-300 bg-red-50';
  };

  return (
    <div>
      <Label className="text-sm flex items-center justify-between">
        <span>{label}</span>
        {confidence < 90 && (
          <span className="text-xs text-gray-500">
            {confidence}% confidence
          </span>
        )}
      </Label>
      <Input
        value={typeof value === 'number' ? value.toLocaleString('en-US', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }) : value}
        readOnly
        className={`mt-1 ${getColor()}`}
      />
    </div>
  );
}
