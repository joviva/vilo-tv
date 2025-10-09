import { Metadata } from "next";
import "./globals.css";
import ErrorBoundary from "@/components/ErrorBoundary";
import { PageErrorFallback } from "@/components/ErrorFallbacks";
import FloatingFavoritesButton from "@/components/FloatingFavoritesButton";
import GlobalErrorSetup from "./GlobalErrorSetup";

export const metadata: Metadata = {
  title: "VILO TV - Stream TV Channels Worldwide",
  description:
    "Watch free IPTV channels from around the world. Browse by country, category, or language.",
  keywords: "IPTV, TV channels, streaming, free TV, international TV, live TV",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
          <ErrorBoundary fallback={PageErrorFallback}>
            <GlobalErrorSetup />
            {children}
            <FloatingFavoritesButton />
          </ErrorBoundary>
        </div>
      </body>
    </html>
  );
}
