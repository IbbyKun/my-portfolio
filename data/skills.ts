/** Skills & stats — merged from resume + extra tools you still want highlighted on the site. */

export interface Stat {
  value: string
  label: string
}

export interface SkillCategory {
  id: string
  name: string
  skills: string[]
}

export const stats: Stat[] = [
  { value: "4+", label: "Years shipping production software" },
  { value: "20+", label: "Product milestones & client deliverables" },
  { value: "15", label: "Engineers led (current squad)" },
  { value: "12+", label: "Vendor & API integrations live" },
]

export const skillCategories: SkillCategory[] = [
  {
    id: "languages",
    name: "Languages",
    skills: [
      "JavaScript",
      "TypeScript",
      "Python",
      "C",
      "C++",
      "HTML",
      "CSS",
      "SQL",
      "Shell",
      "YAML",
      "Go",
      "Rust",
    ],
  },
  {
    id: "frontend",
    name: "Frontend",
    skills: [
      "React",
      "Next.js",
      "Vue.js",
      "Nuxt.js",
      "React Native",
      "Expo CLI",
      "Tailwind CSS",
      "Bootstrap",
      "Framer Motion",
      "Radix UI",
      "Zustand",
      "TanStack Query",
      "Vite",
      "Webpack",
    ],
  },
  {
    id: "backend",
    name: "Backend",
    skills: [
      "Node.js",
      "Express.js",
      "Nest.js",
      "Koa.js",
      "Django",
      "Strapi",
      "Python (APIs)",
      "REST APIs",
      "GraphQL",
      "tRPC",
      "WebSockets",
      "Socket.io",
      "FastAPI",
      "OAuth 2.0",
    ],
  },
  {
    id: "messaging",
    name: "Messaging & events",
    skills: ["Apache Kafka", "RabbitMQ", "WebSockets", "Socket.io", "Async processing"],
  },
  {
    id: "data",
    name: "Databases & persistence",
    skills: [
      "PostgreSQL",
      "Sequelize",
      "Supabase",
      "MongoDB",
      "MySQL",
      "Firebase",
      "Redis",
      "Elasticsearch",
    ],
  },
  {
    id: "devops",
    name: "DevOps & delivery",
    skills: [
      "Docker",
      "Vagrant",
      "Ansible",
      "Jenkins",
      "Git",
      "GitHub",
      "GitHub Actions",
      "Vercel",
      "Kubernetes",
      "Terraform",
      "CI/CD",
      "Nginx",
      "Linux",
    ],
  },
  {
    id: "cloud-comms",
    name: "Cloud communications",
    skills: ["Twilio", "Vonage (Nexmo)"],
  },
  {
    id: "architecture",
    name: "Architecture & systems",
    skills: [
      "Microservices",
      "Multi-tenant SaaS",
      "Asynchronous workflows",
      "API lifecycle design",
    ],
  },
  {
    id: "ai-ml",
    name: "AI / ML & LLMs",
    skills: [
      "OpenAI API",
      "Mistral",
      "LangChain",
      "Hugging Face",
      "Transformers",
      "RAG patterns",
      "Vector DBs",
      "AI-powered SaaS",
      "PyTorch",
      "TensorFlow",
      "MLflow",
    ],
  },
  {
    id: "integrations",
    name: "Third-party APIs",
    skills: [
      "SendGrid",
      "Stripe",
      "Google Calendar",
      "Google Maps",
      "PayPal",
      "Square",
      "HelloSign",
      "DocuSign",
    ],
  },
  {
    id: "data-engineering",
    name: "Data engineering (portfolio depth)",
    skills: ["Airflow", "dbt", "Apache Spark", "Parquet", "ETL pipelines", "Stream processing"],
  },
  {
    id: "testing-quality",
    name: "Testing & quality",
    skills: ["Jest", "Vitest", "Playwright", "pytest", "k6", "SonarQube"],
  },
  {
    id: "design-tools",
    name: "Design & workflow",
    skills: ["Figma", "Postman", "Linear", "Notion", "Cursor"],
  },
]
