'use client';

import { useState } from 'react';

interface ExtractionResult {
  logo: string | null;
  colors: {
    primary: string;
    secondary: string;
    palette: string[];
  };
  error?: string;
}

export default function LogoExtraction() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ExtractionResult | null>(null);
  const [progress, setProgress] = useState('');

  const handleExtract = async () => {
    if (!url) return;

    setLoading(true);
    setResult(null);
    setProgress('Launching browser...');

    try {
      // Progress simulation
      setTimeout(() => setProgress('Navigating to website...'), 1000);
      setTimeout(() => setProgress('Extracting logo...'), 3000);
      setTimeout(() => setProgress('Analyzing colors from CSS...'), 5000);

      const response = await fetch('/api/extract-logo-colors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });

      const data = await response.json();

      if (!response.ok) {
        setResult({
          logo: null,
          colors: { primary: '', secondary: '', palette: [] },
          error: data.error
        });
      } else {
        setProgress('Complete!');
        setResult(data);
      }
    } catch (error) {
      setResult({
        logo: null,
        colors: { primary: '', secondary: '', palette: [] },
        error: 'Failed to extract logo and colors'
      });
    } finally {
      setLoading(false);
      setTimeout(() => setProgress(''), 1000);
    }
  };

  // Auto-detect logo background based on primary color brightness
  const getLogoBgClass = () => {
    if (!result?.colors.primary) return 'bg-gray-100';

    const hex = result.colors.primary;
    const rgb = parseInt(hex.slice(1), 16);
    const r = (rgb >> 16) & 255;
    const g = (rgb >> 8) & 255;
    const b = rgb & 255;
    const brightness = (r + g + b) / 3;

    // If primary is dark, use light background for logo
    return brightness < 128 ? 'bg-gray-100' : 'bg-slate-900';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-xl p-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Logo + Color Extraction
          </h1>
          <p className="text-gray-600 mb-6">
            Extract logo and brand colors (primary/secondary) from any website
          </p>

          {/* URL Input */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Website URL
            </label>
            <div className="flex gap-4">
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                onKeyDown={(e) => e.key === 'Enter' && handleExtract()}
              />
              <button
                onClick={handleExtract}
                disabled={loading || !url}
                className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Extracting...' : 'Extract'}
              </button>
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
              <p className="text-gray-800 font-semibold text-lg mb-2">{progress}</p>
              <p className="text-gray-500 text-sm">This may take 10-15 seconds...</p>
            </div>
          )}

          {/* Error State */}
          {result?.error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-800">{result.error}</p>
            </div>
          )}

          {/* Results */}
          {result && !result.error && (
            <div className="space-y-6">
              {/* Logo */}
              {result.logo && (
                <div className="bg-gray-50 rounded-lg p-6">
                  <h2 className="text-xl font-semibold text-gray-800 mb-4">Logo</h2>
                  <div className={`flex items-center justify-center p-8 rounded-lg border-2 border-gray-300 min-h-[150px] ${getLogoBgClass()}`}>
                    <img
                      src={result.logo}
                      alt="Extracted logo"
                      style={{ maxWidth: '500px', maxHeight: '200px', width: 'auto', height: 'auto' }}
                      crossOrigin="anonymous"
                    />
                  </div>
                </div>
              )}

              {/* Brand Colors */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Brand Colors</h2>

                {/* Primary and Secondary */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Primary Color</p>
                    <div className="flex items-center gap-3">
                      <div
                        className="w-20 h-20 rounded-lg border-2 border-gray-300 shadow-md"
                        style={{ backgroundColor: result.colors.primary }}
                      ></div>
                      <div>
                        <p className="font-mono text-lg font-semibold">{result.colors.primary}</p>
                        <p className="text-sm text-gray-600">Most dominant</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Secondary Color</p>
                    <div className="flex items-center gap-3">
                      <div
                        className="w-20 h-20 rounded-lg border-2 border-gray-300 shadow-md"
                        style={{ backgroundColor: result.colors.secondary }}
                      ></div>
                      <div>
                        <p className="font-mono text-lg font-semibold">{result.colors.secondary}</p>
                        <p className="text-sm text-gray-600">Second most dominant</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Color Palette */}
                {result.colors.palette && result.colors.palette.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-3">Full Color Palette</p>
                    <div className="flex flex-wrap gap-3">
                      {result.colors.palette.map((color, idx) => (
                        <div key={idx} className="text-center">
                          <div
                            className="w-16 h-16 rounded-lg border-2 border-gray-300 shadow-sm mb-2"
                            style={{ backgroundColor: color }}
                          ></div>
                          <p className="font-mono text-xs text-gray-600">{color}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Copy JSON */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">JSON Output</h2>
                <pre className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto text-sm">
{JSON.stringify(result, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
