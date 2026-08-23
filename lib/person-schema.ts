import { profile } from "@/data/profile"
import { experiences } from "@/data/experience"
import { siteUrl } from "@/lib/site-url"

/**
 * schema.org JSON-LD for the person, and nothing else.
 *
 * Scope is deliberate: who this is, what they are called, and where they work.
 * No project or portfolio entities — a `CreativeWork` graph invites search
 * engines to surface individual pieces of work as results in their own right,
 * which is not what this site is for.
 *
 * `@id` is a stable fragment URI so the Person node can be referenced from
 * elsewhere in the graph rather than duplicated.
 */

const PERSON_ID = `${siteUrl}/#person`

/** Employment history as schema.org roles, most recent first. */
function occupations() {
  return experiences
    // The freelance entry overlaps every other role and has no single employer,
    // so listing it as an OrganizationRole would assert overlapping employment.
    .filter((role) => role.company !== "Independent · Remote")
    .map((role) => {
      const [start, end] = role.period.split("—").map((s) => s.trim())
      // A single-year period like "2024" has no end half. Omitting endDate
      // there would assert the role is still ongoing, which is only true of
      // the current one — so a closed role falls back to its start year.
      const finished = role.current ? null : (end && end !== "Present" ? end : start)
      return {
        "@type": "OrganizationRole",
        roleName: role.title,
        startDate: start,
        ...(finished ? { endDate: finished } : {}),
        worksFor: {
          "@type": "Organization",
          name: role.company,
          ...(role.companyUrl ? { url: role.companyUrl } : {}),
        },
      }
    })
}

export function personSchema() {
  const current = experiences.find((role) => role.current)
  const [city, country] = profile.location.split("·")[0].split(",").map((s) => s.trim())

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Person",
        "@id": PERSON_ID,
        name: profile.name,
        url: siteUrl,
        jobTitle: current ? [profile.title, current.title] : [profile.title],
        description: profile.intro,
        email: `mailto:${profile.email}`,
        telephone: profile.phoneTel,
        address: {
          "@type": "PostalAddress",
          addressLocality: city,
          addressCountry: country,
        },
        ...(current
          ? {
              worksFor: {
                "@type": "Organization",
                name: current.company,
                ...(current.companyUrl ? { url: current.companyUrl } : {}),
              },
            }
          : {}),
        hasOccupation: occupations(),
        alumniOf: {
          "@type": "CollegeOrUniversity",
          name: "FAST-NUCES",
        },
        // The profiles a search engine can use to confirm this is one identity.
        sameAs: [profile.githubUrl, profile.linkedinUrl],
      },
      {
        "@type": "WebSite",
        "@id": `${siteUrl}/#website`,
        url: siteUrl,
        name: `${profile.name} — ${profile.title}`,
        publisher: { "@id": PERSON_ID },
        inLanguage: "en",
      },
      {
        "@type": "ProfilePage",
        "@id": `${siteUrl}/#webpage`,
        url: siteUrl,
        name: `${profile.name} — ${profile.title}`,
        isPartOf: { "@id": `${siteUrl}/#website` },
        about: { "@id": PERSON_ID },
        mainEntity: { "@id": PERSON_ID },
        inLanguage: "en",
      },
    ],
  }
}
