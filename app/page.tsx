import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold text-gray-900 mb-4">
              Bizworth AI Extraction POC
            </h1>
            <p className="text-xl text-gray-600 mb-2">
              AI-powered data extraction for business valuations
            </p>
            <p className="text-sm text-gray-500 italic">
              Demonstrating both capabilities AND limitations of current AI technology
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-12">
            <Link href="/logo-extraction" className="block">
              <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow cursor-pointer border-2 border-transparent hover:border-blue-500">
                <h2 className="text-2xl font-semibold text-gray-900 mb-3">
                  Logo Extraction
                </h2>
                <p className="text-gray-600 mb-4">
                  Multi-strategy logo extraction from advisor websites using Playwright, GPT-4 Vision, and fallback APIs.
                </p>
                <div className="text-sm text-gray-500">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    <span>Success Rate: 65-85%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                    <span>Avg Time: 3-8 seconds</span>
                  </div>
                </div>
              </div>
            </Link>

            <Link href="/document-extraction" className="block">
              <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow cursor-pointer border-2 border-transparent hover:border-blue-500">
                <h2 className="text-2xl font-semibold text-gray-900 mb-3">
                  Document Extraction
                </h2>
                <p className="text-gray-600 mb-4">
                  Extract financial data from P&L, balance sheets, and cash flow statements with AI-powered validation.
                </p>
                <div className="text-sm text-gray-500">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                    <span>Accuracy: 40-95% (doc dependent)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                    <span>Requires manual review</span>
                  </div>
                </div>
              </div>
            </Link>

            <Link href="/analytics" className="block">
              <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow cursor-pointer border-2 border-transparent hover:border-blue-500">
                <h2 className="text-2xl font-semibold text-gray-900 mb-3">
                  Reality Check Dashboard
                </h2>
                <p className="text-gray-600 mb-4">
                  Real performance metrics, cost analysis, and ROI calculator showing actual economics.
                </p>
                <div className="text-sm text-gray-500">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                    <span>True success rates</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                    <span>Cost per extraction</span>
                  </div>
                </div>
              </div>
            </Link>

            <Link href="/embed-demo" className="block">
              <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow cursor-pointer border-2 border-transparent hover:border-blue-500">
                <h2 className="text-2xl font-semibold text-gray-900 mb-3">
                  Embeddable Widget
                </h2>
                <p className="text-gray-600 mb-4">
                  See how the data collection process can be embedded in advisor websites.
                </p>
                <div className="text-sm text-gray-500">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    <span>Mobile responsive</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    <span>Custom branding</span>
                  </div>
                </div>
              </div>
            </Link>
          </div>

          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-6 rounded">
            <h3 className="text-lg font-semibold text-yellow-900 mb-2">
              Transparency First
            </h3>
            <p className="text-yellow-800 text-sm">
              This POC demonstrates real-world AI performance, including failures. We show actual success rates,
              processing times, and costs. When extraction fails, we explain why and show manual fallbacks.
              The goal is to set realistic expectations about AI capabilities in 2025.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
