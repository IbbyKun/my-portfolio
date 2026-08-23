/**
 * The infrastructure graph rendered inside the companion's core.
 *
 * PROVENANCE — read before editing.
 *
 * Everything here is abstracted from a real system: the Crest Pet System
 * architecture (Cloudflare -> WAF -> ALB -> ECS web/api, Aurora Global, Redis
 * Global, Lambda credential sync, EventBridge cron, GuardDuty, SNS/SES, OIDC
 * deploys from GitHub, Singapore primary with a US East read replica). Node
 * names, tiers and edge directions all come from that diagram.
 *
 * It is deliberately abstracted rather than reproduced. The section is a claim
 * about infrastructure range, not a case study of one project, so nodes are
 * named by role ("edge firewall") rather than by client. If a second system is
 * added later it should be folded into these same tiers rather than appended
 * as a separate graph — the point is the shape of the thinking, not a count of
 * projects.
 *
 * NOTHING HERE IS INVENTED. If a claim is not visible in a diagram or config,
 * it does not belong in this file.
 */

export type TierId =
  | "edge"
  | "gateway"
  | "compute"
  | "data"
  | "async"
  | "intelligence"
  | "platform"

export interface Tier {
  id: TierId
  label: string
  /** One line, shown when the tier is focused. */
  blurb: string
}

export const tiers: Tier[] = [
  {
    id: "edge",
    label: "Edge",
    blurb: "Terminate, filter and cache before anything expensive runs.",
  },
  {
    id: "gateway",
    label: "Routing",
    blurb: "One entry point, host-routed, so services stay addressable by name.",
  },
  {
    id: "compute",
    label: "Compute",
    blurb: "Stateless tasks that scale on demand and die without ceremony.",
  },
  {
    id: "data",
    label: "State",
    blurb: "The part that cannot be rebuilt from a redeploy.",
  },
  {
    id: "async",
    label: "Async",
    blurb: "Work that must survive the request that asked for it.",
  },
  {
    id: "intelligence",
    label: "Intelligence",
    blurb: "Models as dependencies: retrieved-against, evaluated, and overridable.",
  },
  {
    id: "platform",
    label: "Platform",
    blurb: "Delivery, secrets and detection — the parts nobody sees until they fail.",
  },
]

export interface Node {
  id: string
  label: string
  /** Short technical detail, shown on focus. */
  detail: string
  tier: TierId
  /** Distance from the core, 0..1. Drives radial placement in the graph. */
  depth: number
}

/** Direction matters: edges are drawn as flow, not as association. */
export type EdgeKind = "request" | "data" | "async" | "deploy"

export interface Edge {
  from: string
  to: string
  kind: EdgeKind
}

export const nodes: Node[] = [
  // --- Edge --------------------------------------------------------------
  { id: "cdn", label: "CDN proxy", detail: "Global anycast, TLS termination, static at the edge", tier: "edge", depth: 1.0 },
  { id: "waf", label: "WAF", detail: "Rate limiting and geo rules, applied before origin", tier: "edge", depth: 0.92 },

  // --- Routing -----------------------------------------------------------
  { id: "alb", label: "Load balancer", detail: "Host-based routing, health checks, zero-downtime target swaps", tier: "gateway", depth: 0.76 },

  // --- Compute -----------------------------------------------------------
  { id: "web", label: "Web tasks", detail: "Server-rendered front end, 2–10 tasks on demand", tier: "compute", depth: 0.55 },
  { id: "api", label: "API tasks", detail: "Stateless API, 2–15 tasks, scaled on request depth", tier: "compute", depth: 0.5 },
  { id: "fn", label: "Functions", detail: "Short-lived jobs: credential sync, scheduled maintenance", tier: "compute", depth: 0.62 },

  // --- State -------------------------------------------------------------
  { id: "db", label: "Primary database", detail: "PostgreSQL, one writer, replicated across regions", tier: "data", depth: 0.3 },
  { id: "cache", label: "Cache", detail: "Encrypted in-memory tier fronting the read path", tier: "data", depth: 0.34 },
  { id: "objects", label: "Object store", detail: "Media, documents and scan output, lifecycle-managed", tier: "data", depth: 0.42 },

  // --- Async -------------------------------------------------------------
  { id: "sched", label: "Scheduler", detail: "Cron as infrastructure, not as a process someone remembers", tier: "async", depth: 0.7 },
  { id: "bus", label: "Notification bus", detail: "Fan-out for alerts, rotations and bounce handling", tier: "async", depth: 0.58 },
  { id: "mail", label: "Transactional mail", detail: "Delivery with bounce and complaint feedback wired back in", tier: "async", depth: 0.66 },

  // --- Intelligence -------------------------------------------------------
  // Grounded in shipped work: OpenAI in production critical paths, RAG over
  // vector stores, OCR-to-JSON document pipelines, and evaluation as a
  // first-class concern. See data/capabilities.ts and data/experience.ts.
  { id: "llm", label: "Model gateway", detail: "One place models are called from — keys, budgets, timeouts, fallbacks", tier: "intelligence", depth: 0.5 },
  { id: "rag", label: "Retrieval", detail: "Embedded corpora in a vector store, retrieved against before generation", tier: "intelligence", depth: 0.38 },
  { id: "agents", label: "Agents", detail: "Tool-using workflows with bounded steps and an audit trail", tier: "intelligence", depth: 0.58 },
  { id: "extract", label: "Extraction", detail: "OCR to structured JSON, schema-validated before anything trusts it", tier: "intelligence", depth: 0.54 },
  { id: "evals", label: "Evaluation", detail: "Scored offline and sampled in production — a model you cannot measure is a liability", tier: "intelligence", depth: 0.66 },

  // --- Platform ----------------------------------------------------------
  { id: "ci", label: "Pipeline", detail: "Build, scan, push, deploy — no long-lived cloud credentials", tier: "platform", depth: 0.88 },
  { id: "secrets", label: "Secret store", detail: "Injected at task start, rotated on a schedule", tier: "platform", depth: 0.46 },
  { id: "threat", label: "Threat detection", detail: "Continuous account and bucket monitoring, alerting to the bus", tier: "platform", depth: 0.8 },
]

export const edges: Edge[] = [
  { from: "cdn", to: "waf", kind: "request" },
  { from: "waf", to: "alb", kind: "request" },
  { from: "alb", to: "web", kind: "request" },
  { from: "alb", to: "api", kind: "request" },
  { from: "api", to: "db", kind: "data" },
  { from: "api", to: "cache", kind: "data" },
  { from: "api", to: "objects", kind: "data" },
  { from: "cache", to: "db", kind: "data" },
  { from: "api", to: "bus", kind: "async" },
  { from: "sched", to: "fn", kind: "async" },
  { from: "fn", to: "secrets", kind: "async" },
  { from: "secrets", to: "api", kind: "async" },
  { from: "secrets", to: "web", kind: "async" },
  { from: "bus", to: "mail", kind: "async" },
  { from: "mail", to: "bus", kind: "async" },
  { from: "threat", to: "bus", kind: "async" },
  { from: "threat", to: "objects", kind: "async" },
  { from: "api", to: "llm", kind: "request" },
  { from: "llm", to: "rag", kind: "data" },
  { from: "rag", to: "db", kind: "data" },
  { from: "llm", to: "agents", kind: "request" },
  { from: "agents", to: "api", kind: "request" },
  { from: "extract", to: "objects", kind: "data" },
  { from: "extract", to: "llm", kind: "request" },
  { from: "llm", to: "evals", kind: "async" },
  { from: "evals", to: "bus", kind: "async" },
  { from: "ci", to: "web", kind: "deploy" },
  { from: "ci", to: "api", kind: "deploy" },
  { from: "ci", to: "fn", kind: "deploy" },
]

/**
 * The higher-level claims. Each one is backed by something visible in the
 * source architecture — keep it that way.
 */
export interface Practice {
  id: string
  index: string
  title: string
  body: string
}

export const practices: Practice[] = [
  {
    id: "pipelines",
    index: "01",
    title: "Deploys without standing credentials",
    body: "The pipeline builds, scans and pushes an image, then assumes a role to deploy it — federated per run, scoped to the task it is doing, expiring when it finishes. There is no long-lived cloud key in CI to leak. Rollback is redeploying the previous digest, which means it is a decision anyone on the team can take at 2am without me.",
  },
  {
    id: "edge",
    index: "02",
    title: "Work pushed to the edge",
    body: "Filtering, rate limiting and geo rules run before a request reaches origin, so abuse costs the attacker rather than the bill. Static and cacheable responses never wake a container at all. The rule I hold to: by the time a request reaches application code, everything that could have rejected it already has.",
  },
  {
    id: "state",
    index: "03",
    title: "State treated as the hard part",
    body: "Compute is disposable — tasks scale out, die and are replaced without anyone watching. State is not. One writer, replicas that are explicitly read-only, a cache with a defined invalidation story rather than a hopeful TTL, and object storage with a lifecycle. Every interesting outage I have seen was a state boundary somebody drew optimistically.",
  },
  {
    id: "regions",
    index: "04",
    title: "Multi-region as a read path, honestly",
    body: "A primary region that writes and a secondary that serves reads, with the database and cache replicated globally. I am specific about this because \"multi-region\" is usually claimed to mean more than it does: this is latency and read availability, not automatic write failover. Knowing which of those you have bought is the whole point.",
  },
  {
    id: "models",
    index: "05",
    title: "Models wired in like any other dependency",
    body: "Retrieval before generation, schema validation on anything a model hands back, bounded tool loops rather than open-ended agents, and evaluation that runs offline and samples production. Calls go through one gateway so budgets, timeouts and fallbacks live in a single place. The bar is the one I hold every third party to: measurable, observable, and degrading gracefully when it is wrong.",
  },
  {
    id: "observability",
    index: "06",
    title: "Alerting that ends somewhere",
    body: "Threat detection, bounce handling and rotation events all terminate at one notification path rather than in five dashboards nobody opens. Scheduled work is infrastructure with a retry policy, not a process someone remembers to run. If a thing can fail quietly, it will, and the cost of finding out late compounds.",
  },
]
