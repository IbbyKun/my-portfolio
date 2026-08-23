import type { MetadataRoute } from "next"
import { siteUrl } from "@/lib/site-url"

/**
 * A single-page site. The sections are anchors on that page, not separate
 * URLs, so listing them here would be claiming pages that do not exist.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: siteUrl,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 1,
    },
  ]
}
