import Link from "next/link";
import {
  GlobeAltIcon,
  TvIcon,
  LanguageIcon,
} from "@heroicons/react/24/outline";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 text-white">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-6xl font-bold mb-4">
          <span className="text-blue-400">
            VILO TV
          </span>
        </h1>
        <p className="text-xl text-gray-300 max-w-2xl mx-auto">
          Stream TV channels from around the world. Choose how you want to
          explore.
        </p>
      </div>

      {/* Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl w-full">
        {/* Countries Card */}
        <Link href="/countries" className="group">
          <div className="h-60 bg-white/10 rounded-xl p-6 text-center hover:bg-white/20 transition-all">
            <GlobeAltIcon className="w-12 h-12 mx-auto mb-4 text-blue-400" />
            <h2 className="text-xl font-bold text-white mb-2">By Countries</h2>
            <p className="text-gray-300 text-sm">
              Explore channels from 200+ countries
            </p>
          </div>
        </Link>

        {/* Categories Card */}
        <Link href="/categories" className="group">
          <div className="h-60 bg-white/10 rounded-xl p-6 text-center hover:bg-white/20 transition-all">
            <TvIcon className="w-12 h-12 mx-auto mb-4 text-purple-400" />
            <h2 className="text-xl font-bold text-white mb-2">By Categories</h2>
            <p className="text-gray-300 text-sm">
              Browse by content type and interests
            </p>
          </div>
        </Link>

        {/* Languages Card */}
        <Link href="/languages" className="group">
          <div className="h-60 bg-white/10 rounded-xl p-6 text-center hover:bg-white/20 transition-all">
            <LanguageIcon className="w-12 h-12 mx-auto mb-4 text-green-400" />
            <h2 className="text-xl font-bold text-white mb-2">By Languages</h2>
            <p className="text-gray-300 text-sm">
              Watch in 50+ languages
            </p>
          </div>
        </Link>
      </div>

      {/* Stats */}
      <div className="mt-16 text-center animate-fade-in">
        <div className="grid grid-cols-3 gap-8 text-white/70">
          <div>
            <div className="text-2xl font-bold text-blue-400">10,000+</div>
            <div className="text-sm">Channels</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-purple-400">200+</div>
            <div className="text-sm">Countries</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-400">50+</div>
            <div className="text-sm">Languages</div>
          </div>
        </div>
      </div>
    </div>
  );
}
