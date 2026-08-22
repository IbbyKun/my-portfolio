/**
 * Selected work.
 *
 * Each entry is written as a case study, not a description: what the system
 * had to survive, what I owned, what changed as a result. `impact` entries
 * are the scannable proof — keep them to three, keep them concrete.
 *
 * Facts are carried over from the previous site. Where a claim was
 * qualitative there ("measurable lift", "sharp drop"), it stays qualitative
 * here rather than being invented into a number.
 */

export interface ProjectImpact {
  /** Short metric or outcome. Rendered large. */
  value: string
  /** What the metric refers to. Rendered small. */
  label: string
}

export interface Project {
  id: string
  title: string
  /** Rendered as the list-row eyebrow, e.g. "2025 — ENTERPRISE SAAS" */
  year: string
  category: string
  /** My scope on the project. This is the staff-level signal. */
  role: string
  /** One sentence. Used in the list row and as the card headline. */
  summary: string
  /** Two to three paragraphs for the expanded view. */
  body: string[]
  /** Up to three. Rendered as a metric row. */
  impact: ProjectImpact[]
  /** Ordered most-signal-first; the first 5 render, the rest collapse. */
  stack: string[]
  image: string
  githubUrl?: string
  liveUrl?: string
  /** Featured projects get a WebGL hover plane in the work list. */
  featured?: boolean
}

export const projects: Project[] = [
  {
    id: "crest-pet-system",
    title: "Crest Pet System",
    year: "2025",
    category: "Enterprise SaaS · MARS",
    role: "Lead — Super Admin & Consumer portals",
    summary:
      "Multi-tenant platform connecting pet clinics, consumers and administrators, with escrow payments and clinical AI in the loop.",
    body: [
      "Crest is a four-portal system built for MARS: clinics, consumers, enterprise operators and super admins, each with a different tenancy model and a different definition of \"correct\". The payments surface alone spans deposits, escrow, platform fees, marketplace commissions, subscriptions and multi-currency settlement — every one of which has an auditor attached to it.",
      "I led the Super Admin and Consumer portals end to end and contributed across Clinic and Enterprise. That meant owning the tenancy boundaries and the data model as much as the UI, plus the parts nobody demos: audit logging, GDPR-oriented data flows, DocuSign consent capture, and release discipline on AWS so a Thursday deploy did not become a Friday incident.",
      "On the AI side I shipped consumer-facing Tavus video consultations and a document pipeline that runs OCR into structured JSON — useful precisely because its output is validated rather than trusted. Alongside the build I gave technical direction and production release review to the engineering group delivering it.",
    ],
    impact: [
      { value: "4", label: "Tenant-isolated portals in one platform" },
      { value: "Multi-currency", label: "Escrow, commissions & subscriptions" },
      { value: "20", label: "Engineers supported through review" },
    ],
    stack: [
      "Next.js",
      "TypeScript",
      "AWS",
      "PostgreSQL",
      "Multi-tenant SaaS",
      "OpenAI API",
      "Tavus",
      "DocuSign",
    ],
    image: "/placeholder.svg",
    featured: true,
  },
  {
    id: "talkspresso",
    title: "Talkspresso",
    year: "2024",
    category: "Marketplace · Payments",
    role: "Full-stack — scheduling, billing, real-time",
    summary:
      "A product-led platform where professionals turn expertise into bookable, paid video sessions.",
    body: [
      "Three hard systems had to agree with each other for Talkspresso to work at all: a calendar that reflects reality, a billing flow that takes money exactly once, and a live video layer that connects on the first try. Any one of them failing quietly turns a paid booking into a support ticket.",
      "I worked across the stack to make scheduling, Stripe billing and Vonage sessions behave as a single flow, so hosts could onboard in one sitting and clients could book without friction. AI went in where it removed genuine toil — smarter messaging and assisted workflows — and stayed out of the conversation itself.",
      "The work moved both halves of the business metric: how often users came back, and how often they completed a paid booking.",
    ],
    impact: [
      { value: "Booking → payout", label: "Owned as one continuous flow" },
      { value: "6", label: "Third-party systems in the critical path" },
      { value: "Lift", label: "In repeat usage and completed bookings" },
    ],
    stack: [
      "Next.js",
      "Koa.js",
      "PostgreSQL",
      "Stripe",
      "Vonage",
      "Google Calendar",
      "Sequelize",
      "SendGrid",
      "OpenAI API",
    ],
    image: "/talkspresso.png",
    featured: true,
  },
  {
    id: "scrapeops",
    title: "ScrapeOps",
    year: "2024",
    category: "Developer Infrastructure",
    role: "Full-stack — polyglot services & monitoring",
    summary:
      "Scraping treated as production infrastructure: proxy aggregation, scheduling, live health and alerting before failures become outages.",
    body: [
      "The interesting problem in scraping is not extraction, it is operations. Sites change, proxies degrade, and jobs stall silently — so the failure you actually care about is the one nobody noticed for six hours. ScrapeOps is built around that: monitoring first, extraction second.",
      "The platform aggregates dozens of proxy providers with rotation and CAPTCHA-aware routing, schedules jobs, surfaces live health, and pushes alerts on degradation. Wiring user infrastructure and GitHub into one deploy-and-schedule path let teams centralise operations instead of babysitting one-off scripts.",
      "It is deliberately polyglot: Angular on the front, Express and Go for services, Python where the ecosystem wins, Rust for the performance-critical paths, PostgreSQL for durable state. Each choice earns its place at a boundary rather than being applied uniformly.",
    ],
    impact: [
      { value: "Dozens", label: "Proxy providers aggregated & rotated" },
      { value: "↓ Downtime", label: "Via live health and pre-failure alerting" },
      { value: "5", label: "Languages, each at a justified boundary" },
    ],
    stack: ["Go", "Rust", "Express.js", "Angular", "Python", "Django", "Flask", "PostgreSQL"],
    image: "/scrapeops.png",
    featured: true,
  },
  {
    id: "edoula",
    title: "Edoula",
    year: "2024",
    category: "Vertical SaaS · Operations",
    role: "Full-stack — scheduling, contracts, payments",
    summary:
      "An operations hub for doulas, replacing a stack of spreadsheets, invoices and ad hoc tools with one system.",
    body: [
      "Care work happens on the go, and the software had to admit that. Edoula brings scheduling, contracts, invoicing and expense tracking into one place, with maps and calendars wired in because a practitioner's day is a route, not a queue.",
      "Payments needed to be flexible rather than opinionated — PayPal and Square with configurable payout preferences — and paperwork still needs signatures, so HelloSign sits in the contract flow. The design constraint throughout was that a practitioner between appointments should be able to finish a task one-handed.",
      "The outcome was not just fewer clicks. Teams reported a sharp drop in repetitive office work, and retention improved because clients experienced a service that felt predictable and professional.",
    ],
    impact: [
      { value: "↓ Admin", label: "Sharp drop in repetitive office work" },
      { value: "↑ Retention", label: "Via a more predictable client experience" },
      { value: "2", label: "Payment providers with flexible payouts" },
    ],
    stack: ["Next.js", "Supabase", "PayPal", "Square", "HelloSign", "Google Maps", "Google Calendar"],
    image: "/edoula.png",
    featured: true,
  },
  {
    id: "ta-39",
    title: "TA-39",
    year: "2023",
    category: "EdTech",
    role: "Full-stack — Classroom integration & AI drafting",
    summary:
      "A command center for teachers: rosters, assignments and grading, bridged into Google Classroom.",
    body: [
      "Teachers do not need another tool; they need the tools they already use to stop disagreeing with each other. TA-39 pulls rosters, assignments and grading workflows into one surface and bridges into Google Classroom through the Classroom API, so planning, assessing and communicating stop requiring three tabs and two copies of the same data.",
      "AI assists drafting, feedback and repetitive text work — augmenting teacher judgement rather than substituting for it, which is the only version of this that survives contact with a real classroom.",
      "Teachers saw roughly half of the time lost to mechanical workflow steps come back, which shows up as calmer weeks and faster turnaround for students.",
    ],
    impact: [
      { value: "~50%", label: "Reduction in mechanical workflow time" },
      { value: "1", label: "Surface replacing three disconnected tools" },
      { value: "Assistive", label: "AI scoped to drafting, never grading" },
    ],
    stack: ["Next.js", "Python", "Google Classroom API", "OpenAI API"],
    image: "/ta39.png",
  },
  {
    id: "ssom",
    title: "SSOM",
    year: "2023",
    category: "Commerce · CMS",
    role: "Full-stack — storefront & fulfillment integration",
    summary:
      "A book marketing platform connecting campaigns, checkout and physical print fulfillment.",
    body: [
      "Authors and publishers were stitching together five disconnected services to promote a title and actually sell it. SSOM collapses that into one funnel: a fast Nuxt storefront, a Strapi content model so marketing pages evolve without redeploys, PayPal at checkout, and the Lulu API connecting print and distribution.",
      "The point of the integration work was coherence — a campaign, a checkout and a printed book arriving at a reader should be one traceable path, not three systems that happen to share a customer.",
      "Online book sales climbed substantially in the first quarter after launch.",
    ],
    impact: [
      { value: "↑ Sales", label: "Substantial Q1 lift post-launch" },
      { value: "5 → 1", label: "Disconnected services consolidated" },
      { value: "CMS-backed", label: "Marketing pages ship without redeploys" },
    ],
    stack: ["Vue", "Nuxt", "Strapi", "PayPal", "Lulu API"],
    image: "/placeholder.svg",
  },
]

export const featuredProjects = projects.filter((p) => p.featured)
