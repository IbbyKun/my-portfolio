export interface Project {
  id: string
  title: string
  description: string
  image: string
  technologies: string[]
  githubUrl?: string
  liveUrl?: string
  featured?: boolean
}

export const projects: Project[] = [
  {
    id: "talkspresso",
    title: "Talkspresso",
    description:
      "Talkspresso is a product-led platform where professionals turn expertise into bookable, paid video sessions: calendaring, payments, and live calls in one cohesive flow. I worked across the stack to connect scheduling, billing, and real-time communication so hosts can onboard quickly and clients can book without friction. The product leans on AI where it genuinely removes toil: smarter messaging, assisted workflows, and integrations that keep the human conversation at the center. On the business side, the work contributed to measurable lift in how often users return and complete paid bookings, helping move both engagement and revenue in the right direction.",
    image: "/placeholder.svg",
    technologies: [
      "Next.js",
      "Koa.js",
      "PostgreSQL",
      "Sequelize",
      "SendGrid",
      "Stripe",
      "Vonage",
      "Google Calendar",
      "OpenAI API",
    ],
    featured: true,
  },
  {
    id: "edoula",
    title: "Edoula",
    description:
      "Edoula is an operations hub built for doulas who were juggling spreadsheets, invoices, and ad hoc tools. The app brings scheduling, contracts, invoicing, and expense tracking into a single place so practitioners spend less time on admin and more time with clients. Integrations with maps, calendars, and payment providers (PayPal, Square) reflect how real-world care work happens on the go, with flexible payout preferences and paperwork that still needs signatures (HelloSign). The outcome wasn’t just “fewer clicks”: teams reported a sharp drop in repetitive office work and stronger retention because clients experienced a more professional, predictable service.",
    image: "/placeholder.svg",
    technologies: [
      "Next.js",
      "Supabase",
      "Google Maps",
      "Google Calendar",
      "PayPal",
      "Square",
      "HelloSign",
    ],
    featured: true,
  },
  {
    id: "scrapeops",
    title: "ScrapeOps",
    description:
      "ScrapeOps targets a hard problem: running web scraping reliably when sites change, proxies fail, and jobs silently stall. The platform treats scraping like production infrastructure, aggregating proxies, scheduling jobs, surfacing live health, and pushing alerts before failures become outages. By wiring user infrastructure and GitHub into one deploy-and-schedule path, teams could centralize operations instead of babysitting one-off scripts. Monitoring and dashboards cut downtime dramatically, while smarter proxy routing (dozens of providers, rotation, and CAPTCHA-aware paths) pushed success rates up. The stack spans Angular on the front end, Express.js and Go for services, Python with Django and Flask where it fits, Rust for performance-critical work, and PostgreSQL for durable state.",
    image: "/placeholder.svg",
    technologies: [
      "Angular",
      "Express.js",
      "Go",
      "Rust",
      "Python",
      "Django",
      "Flask",
      "PostgreSQL",
    ],
    featured: true,
  },
  {
    id: "ta-39",
    title: "TA-39",
    description:
      "TA-39 is an education management product aimed at teachers who need a practical command center: rosters, assignments, grading workflows, and a bridge into tools they already use every day, especially Google Classroom through the Classroom API. The goal was to reduce context switching and duplicate data entry so educators could plan, assess, and communicate from one surface. Where it made sense, the OpenAI API augments drafting, feedback, and repetitive text work without replacing teacher judgment. Teachers saw a roughly halving of time lost to mechanical workflow steps, which is the kind of metric that shows up as calmer weeks and faster turnaround for students.",
    image: "/placeholder.svg",
    technologies: ["Next.js", "Python", "OpenAI API", "Google Classroom API"],
  },
  {
    id: "ssom",
    title: "SSOM",
    description:
      "SSOM is a web-based book marketing platform: authors and publishers promote titles, sell online, and plug into fulfillment without stitching together five disconnected services. Built with Vue, Nuxt, and Strapi, it pairs a fast storefront experience with a CMS-backed content model so marketing pages can evolve without redeploys. PayPal handles payments; the Lulu API connects printing and distribution so digital marketing translates into physical fulfillment. In the first quarter after launch, online book sales climbed substantially, a sign that the funnel from campaign through checkout to fulfillment was finally coherent for the business.",
    image: "/placeholder.svg",
    technologies: ["Vue", "Nuxt", "Strapi", "PayPal", "Lulu API"],
  },
  {
    id: "crest-pet-system",
    title: "Crest Pet System",
    description:
      "Multi-tenant enterprise SaaS for MARS linking pet clinics, consumers, and admins with modular portals, complex payments (deposits, escrow, fees, commissions, subscriptions, multi-currency), and consumer AI such as Tavus consults plus document pipelines (OCR and OpenAI structured into JSON). Customer-facing and admin surfaces included Next.js alongside TypeScript on AWS. I led the Super Admin and Consumer portals, contributed to Clinic and Enterprise, and prioritized AWS stability, release quality, GDPR-oriented flows, audit logging, and DocuSign consent. I also supported a team of four to five engineers with technical direction and code review for production releases.",
    image: "/placeholder.svg",
    technologies: [
      "Next.js",
      "TypeScript",
      "AWS",
      "OpenAI API",
      "Tavus",
      "DocuSign",
      "PostgreSQL",
      "Multi-tenant SaaS",
    ],
    featured: true,
  },
]
