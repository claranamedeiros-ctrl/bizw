'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, CheckCircle2, Clock, DollarSign, FileText, AlertTriangle, Upload } from 'lucide-react';

interface ExtractionResult {
  field: string;
  value: string | number | null;
  confidence: number;
  source: string;
  extractionTime?: number;
  cost?: number;
}

interface ValidationError {
  field: string;
  rule: string;
  message: string;
  severity: 'error' | 'warning';
}

interface DocumentExtractionResponse {
  success: boolean;
  result: {
    documentId: string;
    documentType: string;
    fileName: string;
    extractedFields: ExtractionResult[];
    validationErrors: ValidationError[];
    overallConfidence: number;
    extractionTime: number;
    totalCost: number;
    requiresManualReview: boolean;
  };
  scenario: {
    expectedAccuracy: number;
    description: string;
    challenges: string[];
  };
  message: string;
}

export default function DocumentExtractionPage() {
  const [file, setFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState<string>('profit-loss');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DocumentExtractionResponse | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setResult(null);
    }
  };

  const handleExtract = async () => {
    if (!file) return;

    setLoading(true);
    setResult(null);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('documentType', documentType);

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 10, 90));
      }, 300);

      const response = await fetch('/api/extract/document', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 80) return <Badge variant="success">High: {confidence}%</Badge>;
    if (confidence >= 60) return <Badge variant="warning">Medium: {confidence}%</Badge>;
    return <Badge variant="error">Low: {confidence}%</Badge>;
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'bg-green-500';
    if (confidence >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const formatValue = (value: string | number | null) => {
    if (value === null) return 'Not extracted';
    if (typeof value === 'number') return `$${value.toLocaleString()}`;
    return value;
  };

  // Load sample files
  const handleLoadSample = (sampleType: string) => {
    const sampleFiles: { [key: string]: string } = {
      'profit-loss': 'profit_loss_2023.pdf',
      'balance-sheet': 'balance_sheet_2023.pdf',
      'cashflow': 'cashflow_2023.pdf',
      'csv': 'financial_data_2023.csv',
    };

    const fileName = sampleFiles[sampleType] || 'sample.pdf';

    // Create a mock file object
    const mockFile = new File([''], fileName, { type: 'application/pdf' });
    setFile(mockFile);
    setDocumentType(sampleType);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Financial Document Extraction</h1>
          <p className="text-gray-600">
            AI-powered extraction with realistic accuracy rates and comprehensive validation
          </p>
        </div>

        {/* Upload Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Upload Financial Document</CardTitle>
            <CardDescription>
              Upload a PDF, CSV, or DOCX file containing financial statements
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="documentType">Document Type</Label>
                <select
                  id="documentType"
                  value={documentType}
                  onChange={(e) => setDocumentType(e.target.value)}
                  className="w-full mt-1 p-2 border rounded-md"
                  disabled={loading}
                >
                  <option value="profit-loss">Profit & Loss Statement</option>
                  <option value="balance-sheet">Balance Sheet</option>
                  <option value="cashflow">Cash Flow Statement</option>
                  <option value="csv">CSV Export</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <Label htmlFor="file">Upload File</Label>
                <div className="mt-1 flex items-center gap-4">
                  <label
                    htmlFor="file"
                    className="flex items-center gap-2 px-4 py-2 border-2 border-dashed rounded-md cursor-pointer hover:border-blue-500 transition-colors"
                  >
                    <Upload className="w-5 h-5" />
                    <span>{file ? file.name : 'Choose file...'}</span>
                  </label>
                  <input
                    id="file"
                    type="file"
                    accept=".pdf,.csv,.docx"
                    onChange={handleFileChange}
                    className="hidden"
                    disabled={loading}
                  />
                  <Button onClick={handleExtract} disabled={loading || !file}>
                    {loading ? 'Extracting...' : 'Extract Data'}
                  </Button>
                </div>
              </div>

              <div>
                <p className="text-sm font-semibold mb-2">Or try our sample documents:</p>
                <div className="flex gap-2 flex-wrap">
                  {[
                    { type: 'profit-loss', label: 'P&L Statement' },
                    { type: 'balance-sheet', label: 'Balance Sheet' },
                    { type: 'cashflow', label: 'Cash Flow' },
                    { type: 'csv', label: 'CSV Export' },
                  ].map(({ type, label }) => (
                    <Button
                      key={type}
                      variant="outline"
                      size="sm"
                      onClick={() => handleLoadSample(type)}
                      disabled={loading}
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      {label}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Loading State */}
        {loading && (
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium mb-2">Processing document...</p>
                  <Progress value={uploadProgress} className="mb-2" />
                  <p className="text-xs text-gray-500">
                    Running multiple extraction strategies (PDF Parse + GPT-4 Vision)
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Results */}
        {result && !loading && (
          <div className="space-y-6">
            {/* Overview Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2">
                    {result.result.overallConfidence >= 70 ? (
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-yellow-500" />
                    )}
                    <div>
                      <p className="text-sm text-gray-600">Overall Confidence</p>
                      <p className="text-lg font-bold">{result.result.overallConfidence}%</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-blue-500" />
                    <div>
                      <p className="text-sm text-gray-600">Processing Time</p>
                      <p className="text-lg font-bold">{(result.result.extractionTime / 1000).toFixed(1)}s</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-green-500" />
                    <div>
                      <p className="text-sm text-gray-600">Extraction Cost</p>
                      <p className="text-lg font-bold">${result.result.totalCost.toFixed(2)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-purple-500" />
                    <div>
                      <p className="text-sm text-gray-600">Fields Extracted</p>
                      <p className="text-lg font-bold">{result.result.extractedFields.length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Manual Review Warning */}
            {result.result.requiresManualReview && (
              <Card className="border-2 border-yellow-400 bg-yellow-50">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="font-semibold text-yellow-900 mb-1">Manual Review Required</h3>
                      <p className="text-sm text-yellow-800">
                        {result.message}. Please review all extracted fields before using them.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Extracted Fields */}
            <Card>
              <CardHeader>
                <CardTitle>Extracted Financial Data</CardTitle>
                <CardDescription>
                  Fields extracted with confidence scores and source information
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {result.result.extractedFields.map((field, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <p className="font-medium capitalize">
                            {field.field.replace(/([A-Z])/g, ' $1').trim()}
                          </p>
                          {getConfidenceBadge(field.confidence)}
                          <Badge variant="outline">{field.source}</Badge>
                        </div>
                        <p className="text-lg font-bold text-gray-900">{formatValue(field.value)}</p>
                        <div className="mt-2">
                          <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${getConfidenceColor(field.confidence)} transition-all`}
                              style={{ width: `${field.confidence}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Validation Errors */}
            {result.result.validationErrors.length > 0 && (
              <Card className="border-2 border-red-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-red-500" />
                    Validation Errors ({result.result.validationErrors.length})
                  </CardTitle>
                  <CardDescription>
                    These errors were detected in the extracted data and require attention
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {result.result.validationErrors.map((error, idx) => (
                      <div
                        key={idx}
                        className={`p-4 rounded-lg ${
                          error.severity === 'error' ? 'bg-red-50 border border-red-200' : 'bg-yellow-50 border border-yellow-200'
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          <Badge variant={error.severity === 'error' ? 'error' : 'warning'}>
                            {error.severity.toUpperCase()}
                          </Badge>
                          <div className="flex-1">
                            <p className="font-medium text-sm capitalize mb-1">
                              {error.field.replace(/([A-Z])/g, ' $1').trim()}
                            </p>
                            <p className="text-sm text-gray-700">{error.message}</p>
                            <p className="text-xs text-gray-500 mt-1">Rule: {error.rule}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Expected vs Actual */}
            <Card className="border-2 border-blue-200 bg-blue-50">
              <CardHeader>
                <CardTitle>Document Quality Analysis</CardTitle>
                <CardDescription>{result.scenario.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Expected Accuracy</p>
                      <p className="text-2xl font-bold text-blue-600">{result.scenario.expectedAccuracy}%</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Actual Confidence</p>
                      <p className="text-2xl font-bold text-blue-600">{result.result.overallConfidence}%</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-semibold mb-2">Challenges with this document type:</p>
                    <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                      {result.scenario.challenges.map((challenge, idx) => (
                        <li key={idx}>{challenge}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Reality Check */}
            <Card className="border-2 border-yellow-200 bg-yellow-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  Reality Check
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <p>
                    <strong>Processing Time:</strong> {(result.result.extractionTime / 1000).toFixed(1)}s per document.
                    For 100 documents: ~{((result.result.extractionTime / 1000) * 100 / 60).toFixed(0)} minutes
                  </p>
                  <p>
                    <strong>Cost:</strong> ${result.result.totalCost.toFixed(2)} per document.
                    For 100 documents/month: ${(result.result.totalCost * 100).toFixed(2)}/month
                  </p>
                  <p>
                    <strong>Manual Review:</strong> {result.result.requiresManualReview ? 'Required' : 'Optional'}.
                    Estimated {result.result.requiresManualReview ? '10-15' : '2-5'} minutes of human review time.
                  </p>
                  <p>
                    <strong>Accuracy:</strong> {result.result.overallConfidence}% confidence means ~
                    {100 - result.result.overallConfidence}% of fields may need correction.
                  </p>
                  <p className="mt-3 pt-3 border-t">
                    <strong>Bottom Line:</strong> AI extraction saves time but ISN'T perfect. Budget for human review,
                    especially with {result.scenario.description.toLowerCase()}.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
