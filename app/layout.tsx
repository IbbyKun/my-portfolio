import type { Metadata, Viewport } from "next"
import localFont from "next/font/local"
import { Analytics } from "@vercel/analytics/next"

import { SmoothScroll } from "@/components/chrome/smooth-scroll"
import { FloatingNav } from "@/components/chrome/floating-nav"
import { Cursor } from "@/components/chrome/cursor"
import { Preloader } from "@/components/chrome/preloader"
import { Grain } from "@/components/chrome/grain"
import { CompanionMount } from "@/components/three/companion-mount"
import { profile } from "@/data/profile"
import { experiences } from "@/data/experience"
import { siteUrl } from "@/lib/site-url"
import { personSchema } from "@/lib/person-schema"

import "./globals.css"

/* --------------------------------------------------------------------------
 * Type
 *
 * Archivo   — display. A grotesk that holds up at 13rem uppercase without
 *             getting spindly, and has a real 800/900 to lean on.
 * Inter Tight — body. Tighter than Inter proper, which stops long-form copy
 *             from feeling loose next to the display face.
 * JetBrains Mono — meta labels, numbers, eyebrows.
 *
 * Self-hosted rather than fetched from Google at build time. `next/font/google`
 * hits fonts.googleapis.com during compilation, so a blocked or flaky network
 * silently swaps the whole typographic identity for Helvetica — which is what
 * the "Failed to download" build warnings were doing. These are the same files
 * Google serves (one variable woff2 per family, latin subset, 111KB total),
 * committed to the repo so the build is hermetic and there is no third-party
 * request on first paint.
 * ------------------------------------------------------------------------ */

const archivo = localFont({
  src: "./fonts/archivo-var.woff2",
  // A range, not a list: these are variable fonts, so one file covers every
  // weight the design uses.
  weight: "600 900",
  style: "normal",
  variable: "--font-archivo",
  display: "swap",
  fallback: ["Helvetica Neue", "Arial", "sans-serif"],
})

const interTight = localFont({
  src: "./fonts/inter-tight-var.woff2",
  weight: "400 600",
  style: "normal",
  variable: "--font-inter-tight",
  display: "swap",
  fallback: ["Inter", "system-ui", "sans-serif"],
})

const jetbrainsMono = localFont({
  src: "./fonts/jetbrains-mono-var.woff2",
  weight: "400 500",
  style: "normal",
  variable: "--font-jetbrains",
  display: "swap",
  fallback: ["ui-monospace", "SFMono-Regular", "monospace"],
})

const currentRole = experiences.find((role) => role.current)

/** One sentence, identity-first. Search engines truncate around 155 chars. */
const description = currentRole
  ? `${profile.name} — ${profile.title}, ${currentRole.title} at ${currentRole.company}. Multi-tenant platforms, applied AI and payments systems. ${profile.location}.`
  : `${profile.name} — ${profile.title}. ${profile.location}.`

const pageTitle = `${profile.name} — ${profile.title}`

export const metadata: Metadata = {
  // Everything relative below (canonical, og:image, twitter:image) resolves
  // against this, which is why it has to be set before any of them are useful.
  metadataBase: new URL(siteUrl),
  title: {
    default: pageTitle,
    template: `%s — ${profile.name}`,
  },
  description,
  applicationName: profile.name,
  // One page, one canonical. Without this, a link with a tracking parameter or
  // the *.vercel.app preview domain can be indexed as a separate document.
  alternates: { canonical: "/" },
  keywords: [
    profile.name,
    profile.title,
    ...(currentRole ? [currentRole.title, currentRole.company] : []),
    "Staff Engineer",
    "Software Engineer",
    "Lahore",
    "Pakistan",
  ],
  authors: [{ name: profile.name, url: siteUrl }],
  creator: profile.name,
  publisher: profile.name,
  openGraph: {
    type: "profile",
    firstName: profile.name.split(" ")[0],
    lastName: profile.name.split(" ").slice(1).join(" "),
    username: profile.githubDisplay,
    title: pageTitle,
    description,
    url: "/",
    siteName: pageTitle,
    locale: "en_GB",
  },
  twitter: {
    card: "summary_large_image",
    title: pageTitle,
    description,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  category: "technology",
}

export const viewport: Viewport = {
  themeColor: "#0a0a0a",
  colorScheme: "dark",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      className={`${archivo.variable} ${interTight.variable} ${jetbrainsMono.variable}`}
      suppressHydrationWarning
    >
      <body className="bg-ink text-paper antialiased">
        {/* Keyboard users get past the WebGL hero and the nav in one press. */}
        <a
          href="#work"
          className="label sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:rounded-md focus:bg-acid focus:px-5 focus:py-3 focus:text-ink"
        >
          Skip to work
        </a>

        {/* Identity graph. Rendered from the same data the page renders from,
            so the two can never disagree. */}
        <script
          type="application/ld+json"
          // The payload is built from local constants, never user input.
          dangerouslySetInnerHTML={{ __html: JSON.stringify(personSchema()) }}
        />

        <Preloader />
        <Cursor />
        <Grain />

        <SmoothScroll>
          <FloatingNav />
          {/* Fixed at z-0; every section is `relative z-10` with a transparent
              background, so the companion shows through behind the content. */}
          <CompanionMount />
          <main>{children}</main>
        </SmoothScroll>

        <Analytics />
      </body>
    </html>
  )
}
