/**
 * The site's canonical origin.
 *
 * Canonical tags, the sitemap, `og:url` and the JSON-LD `url` all have to agree
 * with the domain the page is actually served from — a wrong absolute URL in
 * those places is worse than none at all, because search engines believe it.
 *
 * Resolution order:
 *   1. NEXT_PUBLIC_SITE_URL — set this the day a custom domain is added, and
 *      nothing else here needs to change.
 *   2. The current production domain.
 *   3. localhost for `next dev`, so local builds do not emit production URLs.
 */

const PRODUCTION = "https://muhammad-ibrahim-dev.vercel.app"

function resolve(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL
  if (explicit) return explicit.replace(/\/+$/, "")

  // NODE_ENV is "production" for `next build`, which is when the metadata,
  // sitemap and robots output are generated.
  if (process.env.NODE_ENV === "production") return PRODUCTION

  return "http://localhost:3000"
}

export const siteUrl = resolve()
