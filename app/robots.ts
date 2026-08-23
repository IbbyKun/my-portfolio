import type { MetadataRoute } from "next"
import { siteUrl } from "@/lib/site-url"

/**
 * There is one page and nothing to hide, so this is deliberately permissive.
 * Its real job is to publish the sitemap location.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/" }],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  }
}
