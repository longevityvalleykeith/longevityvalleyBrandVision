export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-6xl font-bold text-white mb-4">
            Longevity Valley
          </h1>
          <p className="text-xl text-purple-200 mb-2">
            Brand Content Factory
          </p>
          <p className="text-sm text-purple-300">
            Phase 3B: Brand Analysis + Phase 3C: Video Director Mode
          </p>
        </div>

        <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-8">
          {/* Phase 3B Card */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
            <div className="text-4xl mb-4">🎨</div>
            <h2 className="text-2xl font-bold text-white mb-3">
              Brand Analysis
            </h2>
            <p className="text-purple-200 mb-4">
              Upload your brand assets and let Gemini AI extract your visual DNA,
              quality scores, and brand attributes.
            </p>
            <ul className="text-sm text-purple-300 space-y-2 mb-6">
              <li>✓ AI-powered brand extraction</li>
              <li>✓ Integrity scoring</li>
              <li>✓ Style reference generation</li>
            </ul>
            <a
              href="/studio"
              className="block w-full text-center bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold py-3 px-6 rounded-lg hover:from-purple-600 hover:to-pink-600 transition"
            >
              Start Analysis
            </a>
          </div>

          {/* Phase 3C Card */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
            <div className="text-4xl mb-4">🎬</div>
            <h2 className="text-2xl font-bold text-white mb-3">
              Video Director Mode
            </h2>
            <p className="text-purple-200 mb-4">
              Transform your brand into stunning video ads with DeepSeek's
              cinematography and production routing.
            </p>
            <ul className="text-sm text-purple-300 space-y-2 mb-6">
              <li>✓ AI storyboard generation</li>
              <li>✓ Traffic light approval system</li>
              <li>✓ Multi-engine production (Kling/Luma/Gemini)</li>
            </ul>
            <a
              href="/lounge"
              className="block w-full text-center bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold py-3 px-6 rounded-lg hover:from-blue-600 hover:to-cyan-600 transition"
            >
              Launch Director
            </a>
          </div>
        </div>

        {/* Status Footer */}
        <div className="mt-16 text-center">
          <div className="inline-flex items-center gap-2 bg-green-500/20 border border-green-500/30 rounded-full px-6 py-3">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-green-300 text-sm font-medium">
              System Online • Supabase Connected • Edge Functions Deployed
            </span>
          </div>
        </div>

        {/* Tech Stack Footer */}
        <div className="mt-8 text-center text-purple-400 text-xs">
          <p>
            Powered by Next.js 14 • tRPC v11 • Supabase • Gemini 2.0 • DeepSeek V3 • Flux • Kling • Luma
          </p>
        </div>
      </div>
    </main>
  );
}
