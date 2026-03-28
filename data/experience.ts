export interface Experience {
  id: string
  period: string
  title: string
  company: string
  companyUrl?: string
  description: string
  technologies: string[]
}

export const experiences: Experience[] = [
  {
    id: "divescale",
    period: "2025 — PRESENT",
    title: "Software Engineer · Team Lead",
    company: "Divescale",
    description:
      "I lead a squad of five engineers while staying close to the code: shaping technical direction with the client, reviewing pull requests, and shipping features when the fastest path is to build it myself. Ownership spans the Super Admin and Consumer experiences end to end—from release discipline and post-deploy checks to decisions where product constraints meet system design. I also own the story around customer-facing AI (guided consultations, a symptom checker, and care guidance) and the full payments picture: escrow-style flows, subscriptions, marketplace commissions, and multi-currency behavior. Beyond those surfaces I contribute across Clinic and Enterprise portals, shared platform work, and the occasional production firefight to keep everything stable.",
    technologies: [
      "Next.js",
      "TypeScript",
      "Node.js",
      "NestJS",
      "PostgreSQL",
      "AWS",
      "Cloudflare",
      "AI integrations",
      "Payments",
      "Third-party integrations",
      "Extractor pipelines",
      "Multi-tenant SaaS",
      "Multi-tenant scheduler",
    ],
  },
  {
    id: "devsarch",
    period: "2024 — 2025",
    title: "Full Stack AI Engineer",
    company: "Devsarch",
    description:
      "Built and evolved multi-tenant SaaS products where the frontend had to feel polished and the backend had to survive real traffic. Day to day that meant Next.js and TypeScript on the app layer, Supabase for rapid data modeling and auth-adjacent workflows, and Docker so environments stayed repeatable for the team. A large part of the role was stitching serious third parties into production flows—OpenAI for AI-native product behavior, Stripe for billing reality, Vonage for communications, and Google Calendar where scheduling had to be trustworthy—not just demo wiring.",
    technologies: [
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
    companyUrl: undefined,
    description:
      "Worked remotely on AI-augmented SaaS: dense, data-heavy dashboards on the front and reliable HTTP and real-time APIs behind them. The focus was making analytics and operational views legible under load—pagination, caching instincts, and clear contracts—while still moving quickly on feature iteration for a growing user base.",
    technologies: ["React", "Next.js", "Node.js", "REST APIs", "AI dashboards", "SaaS"],
  },
  {
    id: "freelance",
    period: "2022 — PRESENT",
    title: "Freelance Software Engineer",
    company: "Independent · Remote",
    description:
      "Alongside full-time roles I’ve partnered with teams around the world on Next.js and MERN-stack builds, early-stage SaaS MVPs, and integrations where scope shifts fast. That mix taught me to document assumptions, ship thin vertical slices, and leave maintainable handoffs—whether the brief was a greenfield UI or hardening something already in the wild.",
    technologies: ["Next.js", "React", "Node.js", "MongoDB", "SaaS MVPs", "REST APIs"],
  },
]
