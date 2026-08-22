/**
 * Capabilities.
 *
 * Replaces the previous thirteen-category skill dump. At staff level the
 * interesting information is not *which* tools, it is *how the domain is
 * reasoned about* — so each domain leads with a thesis, then lists tools as
 * supporting evidence. `core` renders by default; `extended` sits behind a
 * disclosure so the page stays scannable.
 */

export interface Capability {
  id: string
  index: string
  name: string
  /** One line on how this domain is approached. Rendered at lead size. */
  thesis: string
  /** The five-or-so that genuinely represent depth. */
  core: string[]
  /** Everything else, behind a disclosure. */
  extended: string[]
}

export const capabilities: Capability[] = [
  {
    id: "architecture",
    index: "01",
    name: "Platform Architecture",
    thesis:
      "Tenancy boundaries and data models are the decisions you cannot cheaply reverse. I make those first, in writing, before anything renders.",
    core: [
      "Multi-tenant SaaS",
      "Microservices",
      "API lifecycle design",
      "Asynchronous workflows",
      "Event-driven systems",
    ],
    extended: ["Domain modelling", "Audit logging", "GDPR-oriented data flows", "Access control design"],
  },
  {
    id: "product",
    index: "02",
    name: "Product Engineering",
    thesis:
      "Interfaces are where system design becomes visible. If the model is wrong, no amount of motion design will hide it — and if it is right, restraint is enough.",
    core: ["React", "Next.js", "TypeScript", "Tailwind CSS", "Motion / Framer Motion"],
    extended: [
      "Vue.js",
      "Nuxt.js",
      "React Native",
      "Expo",
      "Three.js / WebGL",
      "Radix UI",
      "TanStack Query",
      "Zustand",
      "Vite",
      "Webpack",
    ],
  },
  {
    id: "backend",
    index: "03",
    name: "Backend & Data",
    thesis:
      "Correctness under retry, concurrency and partial failure. Most production incidents are a transaction boundary somebody drew optimistically.",
    core: ["Node.js", "NestJS", "PostgreSQL", "Python", "Redis"],
    extended: [
      "Express.js",
      "Koa.js",
      "Django",
      "FastAPI",
      "Flask",
      "Go",
      "Rust",
      "GraphQL",
      "tRPC",
      "WebSockets",
      "Kafka",
      "RabbitMQ",
      "Supabase",
      "MongoDB",
      "MySQL",
      "Elasticsearch",
      "Sequelize",
    ],
  },
  {
    id: "ai",
    index: "04",
    name: "Applied AI",
    thesis:
      "Models are dependencies with unusually soft failure modes. Ship them with evaluation, observability and a defined behaviour for when they are wrong.",
    core: ["OpenAI API", "RAG patterns", "Vector databases", "Document extraction (OCR → JSON)", "LangChain"],
    extended: [
      "Hugging Face",
      "Transformers / BERT",
      "Mistral",
      "PyTorch",
      "TensorFlow",
      "MLflow",
      "Classical ML (ensembles, SVM, PCA, K-Means)",
      "Tavus",
    ],
  },
  {
    id: "infra",
    index: "05",
    name: "Infrastructure & Delivery",
    thesis:
      "Release discipline is a feature. Deploys should be boring, reversible, and verified after the fact — not celebrated.",
    core: ["AWS", "Docker", "CI/CD", "GitHub Actions", "Cloudflare"],
    extended: [
      "Kubernetes",
      "Terraform",
      "Jenkins",
      "Ansible",
      "Vagrant",
      "Nginx",
      "Linux",
      "Vercel",
      "Playwright",
      "Vitest",
      "Jest",
      "pytest",
      "k6",
      "SonarQube",
    ],
  },
]

/**
 * Integration surface — rendered as a marquee strip rather than a list,
 * because the point is breadth, not detail.
 */
export const integrations: string[] = [
  "Stripe",
  "PayPal",
  "Square",
  "Vonage",
  "Twilio",
  "SendGrid",
  "DocuSign",
  "HelloSign",
  "Google Calendar",
  "Google Classroom",
  "Google Maps",
  "OpenAI",
  "Tavus",
  "Lulu",
]
