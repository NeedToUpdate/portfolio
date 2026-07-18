import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono, Space_Grotesk } from "next/font/google";
import Nav from "@/components/composites/Nav";
import Footer from "@/components/composites/Footer";
import StarField from "@/components/composites/StarField";
import AgentTools from "@/components/composites/AgentTools";
import { site } from "@/lib/site";
import "@/styles/globals.css";

// Space Grotesk carries the space theme in the display sizes;
// Inter keeps body copy plain and legible for long reads.
const display = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
});

const body = Inter({
  subsets: ["latin"],
  variable: "--font-body",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: `${site.name} · ${site.tagline}`,
    template: `%s · ${site.name}`,
  },
  description: site.description,
  applicationName: site.name,
  authors: [{ name: site.name, url: site.url }],
  creator: site.name,
  alternates: {
    canonical: "/",
  },
  robots: {
    index: true,
    follow: true,
    // Large image previews make insights eligible for the big-thumbnail
    // treatment in Discover and image-led result layouts. Snippet length
    // is capped near our authored description length so that if Google
    // does generate its own snippet instead of using ours, it can't run
    // on indefinitely (e.g. scooping up unrelated on-page text).
    "max-image-preview": "large",
    "max-snippet": 160,
  },
  openGraph: {
    type: "website",
    siteName: site.name,
    url: site.url,
    title: `${site.name} · ${site.tagline}`,
    description: site.description,
    locale: "en_CA",
  },
  twitter: {
    card: "summary_large_image",
    title: `${site.name} · ${site.tagline}`,
    description: site.description,
  },
  icons: {
    // Versioned filenames (bump the suffix by hand next redesign):
    // browsers cache favicons far more stubbornly than ordinary
    // assets, and a query-string bust is known not to reliably clear
    // it — a new path is the only dependable way to force a refresh.
    // /favicon.ico itself stays in place, unversioned, since browsers
    // also probe that literal path directly regardless of <link>.
    icon: [
      { url: "/favicon-v2.ico", sizes: "48x48" },
      { url: "/favicon-v2.svg", type: "image/svg+xml" },
      { url: "/favicon-96x96-v2.png", sizes: "96x96", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon-v2.png", sizes: "180x180", type: "image/png" },
    ],
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0c0e",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${display.variable} ${body.variable} ${mono.variable}`}
    >
      <body className="flex min-h-screen flex-col font-body">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-md focus:bg-base focus:px-4 focus:py-2 focus:text-sm focus:text-ink"
        >
          Skip to content
        </a>
        <StarField />
        <AgentTools />
        <Nav />
        <main id="main" className="flex-1">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
