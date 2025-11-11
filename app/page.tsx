'use client';

import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <div className="pt-12 pb-8 text-center">
        <h1 className="text-5xl font-bold text-gray-900 mb-3">
          Bizworth AI Services
        </h1>
        <p className="text-xl text-gray-600">
          Powered by cutting-edge AI extraction technology
        </p>
      </div>

      {/* Service Cards */}
      <div className="max-w-6xl mx-auto px-6 pb-16">
        <div className="grid md:grid-cols-2 gap-8">
          {/* Service 1: Financial Document Extraction */}
          <Link href="/demo/full-form" className="group">
            <div className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 p-8 h-full border-2 border-transparent hover:border-blue-500">
              <div className="flex items-center justify-between mb-4">
                <div className="w-16 h-16 bg-blue-100 rounded-xl flex items-center justify-center group-hover:bg-blue-600 transition-colors">
                  <svg className="w-8 h-8 text-blue-600 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                  LIVE
                </span>
              </div>

              <h2 className="text-2xl font-bold text-gray-900 mb-3">
                Financial Document Extraction
              </h2>

              <p className="text-gray-600 mb-6">
                Extract financial data from PDFs, Excel, and CSV files using multi-vendor AI routing. Handles P&L statements, balance sheets, and multi-period data.
              </p>

              <div className="space-y-2 mb-6">
                <div className="flex items-center text-sm text-gray-700">
                  <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  140+ pre-built financial fields
                </div>
                <div className="flex items-center text-sm text-gray-700">
                  <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Multi-period extraction (3+ years)
                </div>
                <div className="flex items-center text-sm text-gray-700">
                  <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Cost: $0 (FREE) to $0.004 per doc
                </div>
                <div className="flex items-center text-sm text-gray-700">
                  <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Auto-calculations & validations
                </div>
              </div>

              <div className="flex items-center text-blue-600 font-semibold group-hover:text-blue-700">
                Launch Demo
                <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </div>
            </div>
          </Link>

          {/* Service 2: Logo + Color Extraction */}
          <Link href="/logo-extraction" className="group">
            <div className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 p-8 h-full border-2 border-transparent hover:border-purple-500">
              <div className="flex items-center justify-between mb-4">
                <div className="w-16 h-16 bg-purple-100 rounded-xl flex items-center justify-center group-hover:bg-purple-600 transition-colors">
                  <svg className="w-8 h-8 text-purple-600 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                  </svg>
                </div>
                <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                  LIVE
                </span>
              </div>

              <h2 className="text-2xl font-bold text-gray-900 mb-3">
                Logo + Color Extraction
              </h2>

              <p className="text-gray-600 mb-6">
                Extract brand logos and color palettes from any website. Get primary, secondary, and full color palette with hex codes for brand analysis.
              </p>

              <div className="space-y-2 mb-6">
                <div className="flex items-center text-sm text-gray-700">
                  <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Automatic logo detection
                </div>
                <div className="flex items-center text-sm text-gray-700">
                  <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Primary & secondary colors
                </div>
                <div className="flex items-center text-sm text-gray-700">
                  <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Full color palette (top 6)
                </div>
                <div className="flex items-center text-sm text-gray-700">
                  <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  JSON export for easy integration
                </div>
              </div>

              <div className="flex items-center text-purple-600 font-semibold group-hover:text-purple-700">
                Launch Demo
                <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </div>
            </div>
          </Link>
        </div>

        {/* Technical Info */}
        <div className="mt-12 bg-white rounded-xl shadow-md p-6 border-l-4 border-indigo-600">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            🚀 Powered by State-of-the-Art AI
          </h3>
          <p className="text-gray-600 text-sm mb-3">
            Multi-vendor AI orchestration with intelligent cost optimization. Free tier → Mistral → Claude → OpenAI fallback chain increases success rate while minimizing costs.
          </p>
          <div className="flex flex-wrap gap-2">
            <span className="px-3 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-full">Mistral AI</span>
            <span className="px-3 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-full">AWS Bedrock (Claude)</span>
            <span className="px-3 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-full">Playwright</span>
            <span className="px-3 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-full">Node Vibrant</span>
            <span className="px-3 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-full">Next.js 14</span>
          </div>
        </div>
      </div>
    </div>
  );
}
