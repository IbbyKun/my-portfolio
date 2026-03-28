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
    id: "neural-code-assistant",
    title: "Neural Code Assistant",
    description:
      "An AI-powered coding assistant that uses large language models to provide intelligent code suggestions, automated refactoring, and natural language code generation. Handles 100K+ daily requests.",
    image: "/projects/neural-assistant.jpg",
    technologies: ["Python", "FastAPI", "LangChain", "React", "Redis"],
    githubUrl: "#",
    liveUrl: "#",
    featured: true,
  },
  {
    id: "realtime-analytics",
    title: "Real-time Analytics Platform",
    description:
      "Enterprise-grade analytics dashboard processing millions of events in real-time. Features custom visualization components, anomaly detection, and predictive insights.",
    image: "/projects/analytics.jpg",
    technologies: ["Next.js", "TypeScript", "Apache Kafka", "ClickHouse"],
    githubUrl: "#",
    liveUrl: "#",
    featured: true,
  },
  {
    id: "conversational-ai",
    title: "Conversational AI Framework",
    description:
      "Open-source framework for building multi-turn conversational AI systems with memory, context awareness, and tool integration capabilities.",
    image: "/projects/conversational.jpg",
    technologies: ["Python", "Transformers", "Docker", "PostgreSQL"],
    githubUrl: "#",
    featured: true,
  },
  {
    id: "ml-pipeline",
    title: "ML Pipeline Orchestrator",
    description:
      "Automated machine learning pipeline management system for model training, evaluation, and deployment. Integrates with major cloud providers.",
    image: "/projects/ml-pipeline.jpg",
    technologies: ["Python", "Kubernetes", "MLflow", "AWS"],
  },
  {
    id: "smart-document",
    title: "Smart Document Processor",
    description:
      "AI-driven document processing system using OCR, NLP, and custom transformers to extract structured data from unstructured documents.",
    image: "/projects/document.jpg",
    technologies: ["Python", "PyTorch", "React", "Tesseract"],
    liveUrl: "#",
  },
]
