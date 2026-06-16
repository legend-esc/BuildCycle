import type { AppProps } from "next/app";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";
import WalletConnector from "@/components/WalletConnector";
import "@/styles/globals.css";

export default function App({ Component, pageProps }: AppProps) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-buildcycle-gray-50 text-buildcycle-gray-900">
        <header className="sticky top-0 z-50 bg-white border-b border-buildcycle-gray-200 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <span className="text-xl font-bold text-buildcycle-orange-600">BuildCycle</span>
              <span className="hidden sm:inline text-sm text-buildcycle-gray-400">|</span>
              <span className="hidden sm:inline text-sm text-buildcycle-gray-500">Material Marketplace</span>
            </Link>
            <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-buildcycle-gray-700">
              <Link href="/" className="hover:text-buildcycle-orange-600 transition">Map</Link>
              <Link href="/browse" className="hover:text-buildcycle-orange-600 transition">Browse</Link>
              <Link href="/sell" className="hover:text-buildcycle-orange-600 transition">Sell</Link>
              <Link href="/scan" className="hover:text-buildcycle-orange-600 transition">Scan</Link>
              <Link href="/disputes" className="hover:text-buildcycle-orange-600 transition">Disputes</Link>
              <Link href="/pool" className="hover:text-buildcycle-orange-600 transition">Pool</Link>
              <Link href="/dashboard" className="hover:text-buildcycle-orange-600 transition">Dashboard</Link>
            </nav>
            <WalletConnector />
          </div>
        </header>
        <main>
          <Component {...pageProps} />
        </main>
      </div>
    </QueryClientProvider>
  );
}
