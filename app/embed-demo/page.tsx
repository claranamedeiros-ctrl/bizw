'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Code, Eye, Settings } from 'lucide-react';

export default function EmbedDemoPage() {
  const [brandColor, setBrandColor] = useState('#3b82f6');
  const [companyName, setCompanyName] = useState('Your Financial Advisory');

  const embedCode = `<!-- Bizworth Data Collection Widget -->
<div id="bizworth-widget"></div>
<script>
  (function() {
    const config = {
      companyName: "${companyName}",
      brandColor: "${brandColor}",
      apiKey: "your_api_key_here"
    };

    const script = document.createElement('script');
    script.src = 'https://bizworth.ai/widget.js';
    script.async = true;
    script.onload = function() {
      BizworthWidget.init('bizworth-widget', config);
    };
    document.head.appendChild(script);
  })();
</script>`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Embeddable Widget Demo</h1>
          <p className="text-gray-600">
            See how the data collection process can be embedded in advisor websites
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Configuration Panel */}
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Widget Configuration
                </CardTitle>
                <CardDescription>Customize the widget for your brand</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="companyName">Company Name</Label>
                  <Input
                    id="companyName"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="Your Financial Advisory"
                  />
                </div>

                <div>
                  <Label htmlFor="brandColor">Brand Color</Label>
                  <div className="flex gap-2">
                    <Input
                      id="brandColor"
                      type="color"
                      value={brandColor}
                      onChange={(e) => setBrandColor(e.target.value)}
                      className="w-20 h-10"
                    />
                    <Input
                      value={brandColor}
                      onChange={(e) => setBrandColor(e.target.value)}
                      placeholder="#3b82f6"
                      className="flex-1"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <h3 className="font-semibold mb-2">Features</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Badge variant="success">✓</Badge>
                      <span>Mobile responsive</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="success">✓</Badge>
                      <span>Secure file upload</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="success">✓</Badge>
                      <span>Progress tracking</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="success">✓</Badge>
                      <span>Session persistence</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="success">✓</Badge>
                      <span>Custom branding</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Code className="w-5 h-5" />
                  Integration Code
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
                  <pre className="text-xs">
                    <code>{embedCode}</code>
                  </pre>
                </div>
                <Button className="w-full mt-4" variant="outline" size="sm">
                  Copy Code
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Widget Preview */}
          <div className="lg:col-span-2">
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="w-5 h-5" />
                  Live Preview
                </CardTitle>
                <CardDescription>See how the widget looks on your website</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="desktop" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 mb-4">
                    <TabsTrigger value="desktop">Desktop</TabsTrigger>
                    <TabsTrigger value="mobile">Mobile</TabsTrigger>
                  </TabsList>

                  <TabsContent value="desktop">
                    <div className="border-4 border-gray-300 rounded-lg p-8 bg-white min-h-[600px]">
                      {/* Simulated Website Context */}
                      <div className="mb-6 pb-6 border-b">
                        <div className="flex items-center gap-3 mb-2">
                          <div
                            className="w-12 h-12 rounded-full"
                            style={{ backgroundColor: brandColor }}
                          />
                          <div>
                            <h2 className="text-2xl font-bold">{companyName}</h2>
                            <p className="text-gray-600 text-sm">Business Valuation Services</p>
                          </div>
                        </div>
                      </div>

                      {/* Widget */}
                      <div className="border rounded-lg p-6" style={{ borderColor: brandColor }}>
                        <div className="mb-6">
                          <h3 className="text-xl font-semibold mb-2" style={{ color: brandColor }}>
                            Business Information Collection
                          </h3>
                          <p className="text-sm text-gray-600">
                            Upload your financial documents and we'll extract the key data for your valuation report.
                          </p>
                        </div>

                        {/* Progress Steps */}
                        <div className="mb-6">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <div
                                  className="w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold"
                                  style={{ backgroundColor: brandColor }}
                                >
                                  1
                                </div>
                                <span className="text-sm font-medium">Company Info</span>
                              </div>
                            </div>
                            <div className="flex-1 h-1 bg-gray-200 mx-2"></div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full flex items-center justify-center bg-gray-200 text-gray-600 font-semibold">
                                  2
                                </div>
                                <span className="text-sm text-gray-600">Upload Documents</span>
                              </div>
                            </div>
                            <div className="flex-1 h-1 bg-gray-200 mx-2"></div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full flex items-center justify-center bg-gray-200 text-gray-600 font-semibold">
                                  3
                                </div>
                                <span className="text-sm text-gray-600">Review & Submit</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Form Fields */}
                        <div className="space-y-4">
                          <div>
                            <Label>Business Name</Label>
                            <Input placeholder="Enter your business name" />
                          </div>

                          <div>
                            <Label>Business Website</Label>
                            <Input placeholder="https://yourbusiness.com" />
                            <p className="text-xs text-gray-500 mt-1">
                              We'll attempt to extract your logo automatically
                            </p>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label>Industry</Label>
                              <select className="w-full p-2 border rounded-md">
                                <option>Select industry...</option>
                                <option>Manufacturing</option>
                                <option>Professional Services</option>
                                <option>Retail</option>
                                <option>Technology</option>
                              </select>
                            </div>
                            <div>
                              <Label>Annual Revenue</Label>
                              <select className="w-full p-2 border rounded-md">
                                <option>Select range...</option>
                                <option>Under $1M</option>
                                <option>$1M - $5M</option>
                                <option>$5M - $10M</option>
                                <option>Over $10M</option>
                              </select>
                            </div>
                          </div>

                          <Button className="w-full" style={{ backgroundColor: brandColor }}>
                            Continue to Document Upload
                          </Button>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="mobile">
                    <div className="max-w-sm mx-auto border-4 border-gray-800 rounded-3xl p-4 bg-white min-h-[600px]">
                      {/* Mobile Widget */}
                      <div className="mb-4 pb-4 border-b">
                        <div className="flex items-center gap-2 mb-2">
                          <div
                            className="w-10 h-10 rounded-full"
                            style={{ backgroundColor: brandColor }}
                          />
                          <div>
                            <h2 className="text-lg font-bold">{companyName}</h2>
                            <p className="text-gray-600 text-xs">Business Valuation</p>
                          </div>
                        </div>
                      </div>

                      <div className="border rounded-lg p-4" style={{ borderColor: brandColor }}>
                        <h3 className="text-lg font-semibold mb-2" style={{ color: brandColor }}>
                          Business Info
                        </h3>

                        <div className="space-y-3">
                          <div>
                            <Label className="text-xs">Business Name</Label>
                            <Input placeholder="Enter name" className="text-sm" />
                          </div>

                          <div>
                            <Label className="text-xs">Website</Label>
                            <Input placeholder="https://" className="text-sm" />
                          </div>

                          <div>
                            <Label className="text-xs">Industry</Label>
                            <select className="w-full p-2 border rounded-md text-sm">
                              <option>Select...</option>
                              <option>Manufacturing</option>
                              <option>Services</option>
                            </select>
                          </div>

                          <Button className="w-full text-sm" style={{ backgroundColor: brandColor }}>
                            Continue
                          </Button>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Technical Details */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Technical Implementation</CardTitle>
            <CardDescription>How the embeddable widget works</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <h3 className="font-semibold mb-2">Security</h3>
                <ul className="space-y-1 text-sm text-gray-600">
                  <li>• HTTPS-only connections</li>
                  <li>• API key authentication</li>
                  <li>• CORS policy enforcement</li>
                  <li>• Encrypted file uploads</li>
                  <li>• Session token validation</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Performance</h3>
                <ul className="space-y-1 text-sm text-gray-600">
                  <li>• Lazy loading (~15KB initial)</li>
                  <li>• CDN delivery worldwide</li>
                  <li>• Progressive enhancement</li>
                  <li>• Optimistic UI updates</li>
                  <li>• Offline support (PWA)</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Compatibility</h3>
                <ul className="space-y-1 text-sm text-gray-600">
                  <li>• All modern browsers</li>
                  <li>• Mobile responsive</li>
                  <li>• WordPress plugin available</li>
                  <li>• React/Vue components</li>
                  <li>• No jQuery dependency</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Integration Guide */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Integration Steps</CardTitle>
            <CardDescription>How to add this to your website</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold">
                  1
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Get Your API Key</h4>
                  <p className="text-sm text-gray-600">
                    Sign up for a Bizworth account and generate your API key from the dashboard.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold">
                  2
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Add the Widget Code</h4>
                  <p className="text-sm text-gray-600">
                    Copy the embed code and paste it into your website where you want the widget to appear.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold">
                  3
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Customize Branding</h4>
                  <p className="text-sm text-gray-600">
                    Configure colors, company name, and other settings to match your brand.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold">
                  4
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Test & Deploy</h4>
                  <p className="text-sm text-gray-600">
                    Test the widget in your staging environment, then deploy to production.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
