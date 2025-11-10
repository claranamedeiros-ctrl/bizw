'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, CheckCircle2, Clock, DollarSign, Zap } from 'lucide-react';

interface LogoExtractionResult {
  url: string;
  logoUrl: string | null;
  strategy: string;
  confidence: number;
  quality: {
    resolution: string;
    hasTransparency: boolean;
    format: string;
  } | null;
  extractionTime: number;
  cost: number;
  error?: string;
  alternativeLogos?: Array<{
    url: string;
    confidence: number;
    strategy: string;
  }>;
}

interface ExtractionResponse {
  success: boolean;
  bestResult: LogoExtractionResult;
  allResults: LogoExtractionResult[];
  stats: {
    totalTime: number;
    totalCost: number;
    avgConfidence: number;
    successRate: number;
    strategiesUsed: number;
  };
}

export default function LogoExtractionPage() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ExtractionResponse | null>(null);

  const handleExtract = async () => {
    if (!url) return;

    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/extract/logo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Logo Extraction System</h1>
          <p className="text-gray-600">
            Multi-strategy AI-powered logo extraction with real success rates and costs
          </p>
        </div>

        {/* Input Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Extract Logo from Website</CardTitle>
            <CardDescription>
              We'll try multiple strategies: Playwright scraping, GPT-4 Vision, and Favicon APIs
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Input
                type="url"
                placeholder="https://example.com"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="flex-1"
                disabled={loading}
              />
              <Button onClick={handleExtract} disabled={loading || !url}>
                {loading ? 'Extracting...' : 'Extract Logo'}
              </Button>
            </div>

            <div className="mt-4 text-sm text-gray-600">
              <p className="font-semibold mb-2">Try these examples:</p>
              <div className="flex gap-2 flex-wrap">
                {['https://stripe.com', 'https://openai.com', 'https://anthropic.com'].map(
                  (exampleUrl) => (
                    <Button
                      key={exampleUrl}
                      variant="outline"
                      size="sm"
                      onClick={() => setUrl(exampleUrl)}
                      disabled={loading}
                    >
                      {exampleUrl}
                    </Button>
                  )
                )}
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
                  <p className="text-sm font-medium mb-2">Extracting logo...</p>
                  <Progress value={33} className="mb-2" />
                  <p className="text-xs text-gray-500">
                    This may take 5-15 seconds depending on strategies used
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Results Section */}
        {result && !loading && (
          <div className="space-y-6">
            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2">
                    {result.success ? (
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-red-500" />
                    )}
                    <div>
                      <p className="text-sm text-gray-600">Status</p>
                      <p className="text-lg font-bold">
                        {result.success ? 'Success' : 'Failed'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-blue-500" />
                    <div>
                      <p className="text-sm text-gray-600">Total Time</p>
                      <p className="text-lg font-bold">{(result.stats.totalTime / 1000).toFixed(1)}s</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-green-500" />
                    <div>
                      <p className="text-sm text-gray-600">Total Cost</p>
                      <p className="text-lg font-bold">${result.stats.totalCost.toFixed(3)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2">
                    <Zap className="w-5 h-5 text-yellow-500" />
                    <div>
                      <p className="text-sm text-gray-600">Avg Confidence</p>
                      <p className="text-lg font-bold">{result.stats.avgConfidence}%</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Best Result */}
            {result.success && result.bestResult.logoUrl && (
              <Card>
                <CardHeader>
                  <CardTitle>Best Result</CardTitle>
                  <CardDescription>
                    Extracted using {result.bestResult.strategy} strategy
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-start gap-6">
                    <div className="w-32 h-32 bg-gray-100 rounded-lg flex items-center justify-center border-2 border-gray-200">
                      <img
                        src={result.bestResult.logoUrl}
                        alt="Extracted logo"
                        className="max-w-full max-h-full object-contain p-2"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><text x="50%" y="50%" text-anchor="middle" dy=".3em" font-family="sans-serif" font-size="14" fill="%23666">Logo</text></svg>';
                        }}
                      />
                    </div>

                    <div className="flex-1 space-y-3">
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Confidence</p>
                        {getConfidenceBadge(result.bestResult.confidence)}
                      </div>

                      {result.bestResult.quality && (
                        <div>
                          <p className="text-sm text-gray-600 mb-1">Quality</p>
                          <div className="flex gap-2 flex-wrap">
                            <Badge variant="outline">{result.bestResult.quality.resolution}</Badge>
                            <Badge variant="outline">{result.bestResult.quality.format}</Badge>
                            {result.bestResult.quality.hasTransparency && (
                              <Badge variant="outline">Transparency</Badge>
                            )}
                          </div>
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600">Extraction Time</p>
                          <p className="font-medium">
                            {(result.bestResult.extractionTime / 1000).toFixed(2)}s
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-600">Cost</p>
                          <p className="font-medium">${result.bestResult.cost.toFixed(3)}</p>
                        </div>
                      </div>

                      <div>
                        <p className="text-sm text-gray-600 mb-1">Logo URL</p>
                        <code className="text-xs bg-gray-100 p-2 rounded block break-all">
                          {result.bestResult.logoUrl}
                        </code>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* All Attempts */}
            <Card>
              <CardHeader>
                <CardTitle>All Extraction Attempts</CardTitle>
                <CardDescription>
                  Showing results from all strategies ({result.allResults.length} attempted)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="0" className="w-full">
                  <TabsList>
                    {result.allResults.map((_, idx) => (
                      <TabsTrigger key={idx} value={idx.toString()}>
                        Attempt {idx + 1}
                      </TabsTrigger>
                    ))}
                  </TabsList>

                  {result.allResults.map((attempt, idx) => (
                    <TabsContent key={idx} value={idx.toString()}>
                      <div className="space-y-4">
                        <div className="flex items-center gap-2">
                          <Badge>{attempt.strategy}</Badge>
                          {getConfidenceBadge(attempt.confidence)}
                          {attempt.error && <Badge variant="error">Failed</Badge>}
                        </div>

                        {attempt.error ? (
                          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                            <p className="font-semibold text-red-900 mb-2">Why This Failed:</p>
                            <p className="text-sm text-red-800">{attempt.error}</p>
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-sm text-gray-600">Time</p>
                              <p className="font-medium">
                                {(attempt.extractionTime / 1000).toFixed(2)}s
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">Cost</p>
                              <p className="font-medium">${attempt.cost.toFixed(3)}</p>
                            </div>
                          </div>
                        )}

                        {attempt.alternativeLogos && attempt.alternativeLogos.length > 0 && (
                          <div>
                            <p className="text-sm font-semibold mb-2">Alternative Logos Found:</p>
                            <div className="space-y-2">
                              {attempt.alternativeLogos.map((alt, altIdx) => (
                                <div key={altIdx} className="flex justify-between items-center text-sm">
                                  <span className="text-gray-600">{alt.strategy}</span>
                                  {getConfidenceBadge(alt.confidence)}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </TabsContent>
                  ))}
                </Tabs>
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
                    <strong>Success Rate:</strong> {result.stats.successRate}% - This is realistic for
                    production systems.
                  </p>
                  <p>
                    <strong>Why failures happen:</strong> Complex websites, dynamic loading, unusual DOM
                    structures, SVG logos without proper metadata, or missing branding elements.
                  </p>
                  <p>
                    <strong>Cost per extraction:</strong> ${result.stats.totalCost.toFixed(3)} - This adds
                    up! Processing 1000 logos/month = ${(result.stats.totalCost * 1000).toFixed(2)}/month
                  </p>
                  <p>
                    <strong>Manual fallback needed:</strong> For the {100 - result.stats.successRate}% that
                    fail, you need a human to manually upload the logo.
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
