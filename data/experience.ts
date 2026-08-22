/**
 * Track record.
 *
 * Written to show trajectory: each entry states the scope owned, not the
 * tasks performed. `scope` is the one-line answer to "what were you
 * responsible for that could break?".
 */

export interface Experience {
  id: string
  period: string
  /** Rendered as the accordion row title. */
  title: string
  company: string
  companyUrl?: string
  /** One line, rendered next to the title. The staff-level signal. */
  scope: string
  body: string[]
  /** Three bullets max — the things that would go on a promo packet. */
  highlights: string[]
  stack: string[]
  /** Marks the current role for the "PRESENT" indicator. */
  current?: boolean
}

export const experiences: Experience[] = [
  {
    id: "athgadlang",
    period: "2026 — Present",
    title: "Lead AI Solutions Engineer",
    company: "athGADLANG",
    scope: "Staff-level ownership of how AI shows up in the product",
    current: true,
    body: [
      "Joined in July 2026 at staff level, with the company title Lead AI Solutions Engineer. The remit is AI solutions architecture rather than feature delivery: deciding where a model genuinely belongs in a product and where it is an expensive way to be wrong, then designing the system around it so its output can be measured, observed and safely overridden.",
      "The other half of the job is direction — setting the technical shape other engineers build against, and keeping the bar on evaluation and release discipline where it was in the payments work that preceded it.",
    ],
    highlights: [
      "Own AI solutions architecture at staff level",
      "Set technical direction for AI-facing product work",
    ],
    stack: [
      "TypeScript",
      "Next.js",
      "Python",
      "LLM systems",
      "RAG patterns",
      "Evaluation & observability",
      "Solution architecture",
    ],
  },
  {
    id: "divescale",
    period: "2025 — 2026",
    title: "Senior Software Engineer · Team Lead",
    company: "Divescale",
    scope: "Two portals end to end, the payments surface, and 20 engineers",
    body: [
      "Joined as an engineer and was promoted twice — first to Team Lead, then to Senior. For a stretch I also carried the project management outright: running delivery with the client, sequencing the roadmap, and absorbing the scope conversations so the engineers behind me did not have to.",
      "Across that I led 20 engineers while staying close to the code — shaping technical direction with the client, reviewing pull requests, and building the thing myself when that was genuinely the fastest path. Ownership spanned the Super Admin and Consumer experiences end to end: release discipline, post-deploy verification, and the decisions where product constraints meet system design.",
      "I owned the story around customer-facing AI — guided consultations, a symptom checker, care guidance — and the full payments picture: escrow-style flows, subscriptions, marketplace commissions and multi-currency behaviour. Beyond those surfaces I contributed across the Clinic and Enterprise portals, shared platform work, and the occasional production firefight.",
    ],
    highlights: [
      "Promoted twice — engineer to Team Lead to Senior — and covered project management through a delivery crunch",
      "Led 20 engineers across two of four portals in a multi-tenant enterprise platform",
      "Designed escrow, commission, subscription and multi-currency payment flows",
    ],
    stack: [
      "Next.js",
      "TypeScript",
      "NestJS",
      "Node.js",
      "PostgreSQL",
      "AWS",
      "Cloudflare",
      "Multi-tenant SaaS",
      "Payments",
      "AI integrations",
      "Extractor pipelines",
    ],
  },
  {
    id: "devsarch",
    period: "2024 — 2025",
    title: "Full Stack AI Engineer",
    company: "Devsarch",
    scope: "Production integrations where a third-party outage is your outage",
    body: [
      "Built and evolved multi-tenant SaaS products where the frontend had to feel polished and the backend had to survive real traffic. Next.js and TypeScript on the app layer, Supabase for rapid data modelling and auth-adjacent workflows, Docker so environments stayed repeatable across the team.",
      "A large part of the role was stitching serious third parties into production flows rather than demo wiring: OpenAI for AI-native product behaviour, Stripe for billing reality, Vonage for communications, Google Calendar where scheduling had to be trustworthy. Each one is a dependency with its own failure modes, rate limits and reconciliation story.",
    ],
    highlights: [
      "Integrated Stripe, OpenAI, Vonage and Google Calendar into production critical paths",
      "Standardised environments on Docker across a distributed team",
      "Shipped across Next.js, Nuxt, Django, Flask, Go and Rust as the boundary demanded",
    ],
    stack: [
      "Next.js",
      "TypeScript",
      "Vue.js",
      "Nuxt.js",
      "Supabase",
      "Django",
      "Flask",
      "Go",
      "Rust",
      "Docker",
      "OpenAI API",
      "Stripe",
      "Vonage",
    ],
  },
  {
    id: "semation-labs",
    period: "2024",
    title: "Full Stack Software Engineer",
    company: "Semation Labs",
    scope: "Data-heavy dashboards that stay legible under load",
    body: [
      "Worked remotely on AI-augmented SaaS: dense operational dashboards on the front, reliable HTTP and real-time APIs behind them. The focus was making analytics views survive scale — pagination that holds, caching instincts applied at the right layer, and clear contracts between client and service — while still moving quickly on feature iteration for a growing user base.",
    ],
    highlights: [
      "Built real-time and HTTP APIs behind dense analytics surfaces",
      "Kept operational views performant under growing data volume",
    ],
    stack: ["React", "Next.js", "Node.js", "REST APIs", "AI dashboards", "SaaS"],
  },
  {
    id: "freelance",
    period: "2022 — Present",
    title: "Freelance Software Engineer",
    company: "Independent · Remote",
    scope: "Greenfield MVPs and hardening work, across time zones",
    body: [
      "Alongside full-time roles I have partnered with teams around the world on Next.js and MERN builds, early-stage SaaS MVPs, and integration work where scope shifts weekly. That mix taught me to document assumptions before they become arguments, ship thin vertical slices, and leave handoffs the next engineer can actually pick up — whether the brief was a greenfield UI or hardening something already in the wild.",
    ],
    highlights: [
      "Delivered early-stage SaaS MVPs from brief to production",
      "Built a habit of documented assumptions and clean handoffs under shifting scope",
    ],
    stack: ["Next.js", "React", "Node.js", "MongoDB", "REST APIs", "SaaS MVPs"],
  },
]
