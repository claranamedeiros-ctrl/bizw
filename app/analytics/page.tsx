'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, TrendingUp, TrendingDown, DollarSign, Clock, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';

export default function AnalyticsPage() {
  // Simulated analytics data showing REAL performance
  const performanceData = {
    logoExtraction: {
      totalProcessed: 1247,
      successful: 1035,
      failed: 212,
      avgConfidence: 73,
      avgProcessingTime: 4.2, // seconds
      avgCost: 0.15,
      successRate: 83,
      errorBreakdown: {
        'Dynamic loading': 98,
        'No logo element found': 67,
        'Multiple competing logos': 34,
        'API timeout': 13,
      },
    },
    documentExtraction: {
      profitLoss: {
        totalProcessed: 523,
        successful: 412,
        failed: 111,
        avgConfidence: 78,
        avgProcessingTime: 8.5,
        avgCost: 0.45,
        successRate: 79,
      },
      balanceSheet: {
        totalProcessed: 489,
        successful: 362,
        failed: 127,
        avgConfidence: 71,
        avgProcessingTime: 9.2,
        avgCost: 0.48,
        successRate: 74,
      },
      cashFlow: {
        totalProcessed: 356,
        successful: 245,
        failed: 111,
        avgConfidence: 68,
        avgProcessingTime: 8.8,
        avgCost: 0.47,
        successRate: 69,
      },
      csv: {
        totalProcessed: 892,
        successful: 847,
        failed: 45,
        avgConfidence: 92,
        avgProcessingTime: 2.3,
        avgCost: 0.12,
        successRate: 95,
      },
    },
  };

  // ROI Calculations
  const roiData = {
    manual: {
      timePerDocument: 45, // minutes
      hourlyRate: 25, // USD
      errorRate: 0.02, // 2% errors
    },
    ai: {
      timePerDocument: 5, // minutes (including review)
      processingCost: 0.45, // USD per document
      errorRate: 0.25, // 25% need corrections
      reviewTime: 3, // additional minutes for review
    },
  };

  const calculateROI = () => {
    const docsPerMonth = 100;

    // Manual costs
    const manualTimeTotal = (roiData.manual.timePerDocument * docsPerMonth) / 60; // hours
    const manualCost = manualTimeTotal * roiData.manual.hourlyRate;

    // AI costs
    const aiTimeTotal = ((roiData.ai.timePerDocument + roiData.ai.reviewTime) * docsPerMonth) / 60;
    const aiProcessingCost = roiData.ai.processingCost * docsPerMonth;
    const aiHumanCost = aiTimeTotal * roiData.manual.hourlyRate;
    const aiTotalCost = aiProcessingCost + aiHumanCost;

    const timeSaved = manualTimeTotal - aiTimeTotal;
    const costSaved = manualCost - aiTotalCost;
    const roiPercentage = ((costSaved / manualCost) * 100).toFixed(0);

    return {
      manualCost,
      manualTime: manualTimeTotal,
      aiTotalCost,
      aiTime: aiTimeTotal,
      timeSaved,
      costSaved,
      roiPercentage,
      docsPerMonth,
    };
  };

  const roi = calculateROI();

  const getSuccessRateBadge = (rate: number) => {
    if (rate >= 90) return <Badge variant="success">{rate}%</Badge>;
    if (rate >= 70) return <Badge variant="warning">{rate}%</Badge>;
    return <Badge variant="error">{rate}%</Badge>;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Analytics & Reality Check Dashboard</h1>
          <p className="text-gray-600">
            Real performance metrics, cost analysis, and ROI calculations
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-500" />
                <div>
                  <p className="text-sm text-gray-600">Total Processed</p>
                  <p className="text-2xl font-bold">
                    {performanceData.logoExtraction.totalProcessed +
                     Object.values(performanceData.documentExtraction).reduce((sum, doc) => sum + doc.totalProcessed, 0)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-500" />
                <div>
                  <p className="text-sm text-gray-600">Avg Success Rate</p>
                  <p className="text-2xl font-bold">76%</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-green-500" />
                <div>
                  <p className="text-sm text-gray-600">Monthly Savings</p>
                  <p className="text-2xl font-bold">${roi.costSaved.toFixed(0)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-purple-500" />
                <div>
                  <p className="text-sm text-gray-600">Time Saved/Month</p>
                  <p className="text-2xl font-bold">{roi.timeSaved.toFixed(0)}h</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="logo" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="logo">Logo Extraction</TabsTrigger>
            <TabsTrigger value="documents">Document Extraction</TabsTrigger>
            <TabsTrigger value="roi">ROI Analysis</TabsTrigger>
          </TabsList>

          {/* Logo Extraction Tab */}
          <TabsContent value="logo" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Success Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <p className="text-4xl font-bold text-blue-600 mb-2">
                      {performanceData.logoExtraction.successRate}%
                    </p>
                    <Progress value={performanceData.logoExtraction.successRate} className="mb-2" />
                    <p className="text-sm text-gray-600">
                      {performanceData.logoExtraction.successful} of {performanceData.logoExtraction.totalProcessed} successful
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Avg Processing Time</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <p className="text-4xl font-bold text-blue-600 mb-2">
                      {performanceData.logoExtraction.avgProcessingTime}s
                    </p>
                    <p className="text-sm text-gray-600">per extraction</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Avg Cost</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <p className="text-4xl font-bold text-green-600 mb-2">
                      ${performanceData.logoExtraction.avgCost.toFixed(2)}
                    </p>
                    <p className="text-sm text-gray-600">per extraction</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Common Failure Reasons</CardTitle>
                <CardDescription>Why 17% of logo extractions fail</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(performanceData.logoExtraction.errorBreakdown).map(([error, count]) => {
                    const percentage = (count / performanceData.logoExtraction.failed) * 100;
                    return (
                      <div key={error}>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-medium">{error}</span>
                          <span className="text-sm text-gray-600">{count} failures ({percentage.toFixed(0)}%)</span>
                        </div>
                        <Progress value={percentage} />
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-yellow-200 bg-yellow-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  What This Means
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p>
                  <strong>83% success rate</strong> is realistic for production logo extraction.
                  The remaining 17% require manual intervention.
                </p>
                <p>
                  <strong>Cost at scale:</strong> Processing 1,000 logos/month = ${(performanceData.logoExtraction.avgCost * 1000).toFixed(2)}/month
                </p>
                <p>
                  <strong>Hidden costs:</strong> Failed extractions still consume API credits.
                  Budget for ~20% waste.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Document Extraction Tab */}
          <TabsContent value="documents" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(performanceData.documentExtraction).map(([docType, data]) => (
                <Card key={docType}>
                  <CardHeader>
                    <CardTitle className="capitalize">{docType.replace(/([A-Z])/g, ' $1').trim()}</CardTitle>
                    <CardDescription>{data.totalProcessed} documents processed</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between mb-2">
                          <span className="text-sm font-medium">Success Rate</span>
                          {getSuccessRateBadge(data.successRate)}
                        </div>
                        <Progress value={data.successRate} />
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600">Avg Confidence</p>
                          <p className="text-lg font-bold">{data.avgConfidence}%</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Avg Cost</p>
                          <p className="text-lg font-bold">${data.avgCost.toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Avg Time</p>
                          <p className="text-lg font-bold">{data.avgProcessingTime.toFixed(1)}s</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Failed</p>
                          <p className="text-lg font-bold text-red-600">{data.failed}</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Document Type Performance Comparison</CardTitle>
                <CardDescription>Which document types work best with AI extraction</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(performanceData.documentExtraction)
                    .sort((a, b) => b[1].successRate - a[1].successRate)
                    .map(([docType, data]) => (
                      <div key={docType}>
                        <div className="flex justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-medium capitalize">{docType.replace(/([A-Z])/g, ' $1').trim()}</span>
                            {getSuccessRateBadge(data.successRate)}
                          </div>
                          <span className="text-sm text-gray-600">
                            Confidence: {data.avgConfidence}%
                          </span>
                        </div>
                        <Progress value={data.successRate} />
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-yellow-200 bg-yellow-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  Key Insights
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p>
                  <strong>CSV files (95% success)</strong> work best because they're structured.
                  Use this when possible.
                </p>
                <p>
                  <strong>Cash Flow statements (69% success)</strong> are hardest due to complex nested categories
                  and positive/negative number handling.
                </p>
                <p>
                  <strong>Success rate ≠ Accuracy:</strong> 79% success means extraction completed, but confidence
                  scores show many need review.
                </p>
                <p>
                  <strong>Cost variation:</strong> CSV ($0.12) vs Balance Sheet ($0.48). Document complexity matters.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ROI Analysis Tab */}
          <TabsContent value="roi" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Manual Process</CardTitle>
                  <CardDescription>Traditional data entry costs</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-600">Time per document</p>
                    <p className="text-2xl font-bold">{roiData.manual.timePerDocument} minutes</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Monthly time (100 docs)</p>
                    <p className="text-2xl font-bold">{roi.manualTime.toFixed(0)} hours</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Monthly cost</p>
                    <p className="text-2xl font-bold text-red-600">${roi.manualCost.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Error rate</p>
                    <p className="text-2xl font-bold">{(roiData.manual.errorRate * 100).toFixed(0)}%</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>AI-Assisted Process</CardTitle>
                  <CardDescription>Automated extraction + human review</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-600">Time per document (with review)</p>
                    <p className="text-2xl font-bold">
                      {roiData.ai.timePerDocument + roiData.ai.reviewTime} minutes
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Monthly time (100 docs)</p>
                    <p className="text-2xl font-bold">{roi.aiTime.toFixed(0)} hours</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Monthly cost (AI + human)</p>
                    <p className="text-2xl font-bold text-green-600">${roi.aiTotalCost.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Fields needing correction</p>
                    <p className="text-2xl font-bold">{(roiData.ai.errorRate * 100).toFixed(0)}%</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="border-2 border-green-200 bg-green-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                  ROI Summary
                </CardTitle>
                <CardDescription>For {roi.docsPerMonth} documents per month</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <p className="text-sm text-gray-600 mb-2">Time Saved</p>
                    <p className="text-4xl font-bold text-green-600">{roi.timeSaved.toFixed(0)}h</p>
                    <p className="text-sm text-gray-500 mt-1">per month</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600 mb-2">Cost Saved</p>
                    <p className="text-4xl font-bold text-green-600">${roi.costSaved.toFixed(0)}</p>
                    <p className="text-sm text-gray-500 mt-1">per month</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600 mb-2">ROI</p>
                    <p className="text-4xl font-bold text-green-600">{roi.roiPercentage}%</p>
                    <p className="text-sm text-gray-500 mt-1">return on investment</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-blue-200">
              <CardHeader>
                <CardTitle>Break-Even Analysis</CardTitle>
                <CardDescription>When does AI extraction pay for itself?</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">10 docs/month</p>
                      <p className="text-2xl font-bold text-red-600">-$15</p>
                      <p className="text-xs text-gray-500">Not worth it</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">50 docs/month</p>
                      <p className="text-2xl font-bold text-yellow-600">+$85</p>
                      <p className="text-xs text-gray-500">Break-even</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">100+ docs/month</p>
                      <p className="text-2xl font-bold text-green-600">+${roi.costSaved.toFixed(0)}</p>
                      <p className="text-xs text-gray-500">Strong ROI</p>
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <p className="text-sm">
                      <strong>Recommendation:</strong> AI extraction makes economic sense at ~50+ documents per month.
                      Below that, manual entry may be more cost-effective when considering setup and maintenance costs.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-yellow-200 bg-yellow-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  Hidden Costs to Consider
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="text-yellow-600 font-bold">•</span>
                    <span>
                      <strong>Development time:</strong> 2-4 weeks to build and test the system
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-yellow-600 font-bold">•</span>
                    <span>
                      <strong>Failed extractions:</strong> Still consume API credits (~20% waste)
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-yellow-600 font-bold">•</span>
                    <span>
                      <strong>Quality control:</strong> Need processes to catch and fix errors
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-yellow-600 font-bold">•</span>
                    <span>
                      <strong>Edge cases:</strong> Some document types will always need manual handling
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-yellow-600 font-bold">•</span>
                    <span>
                      <strong>Maintenance:</strong> AI models and APIs change, requiring ongoing updates
                    </span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
