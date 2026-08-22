/**
 * Identity, positioning and contact.
 *
 * Framing note: this is written at staff level. The organising idea is
 * *scope* — systems owned, decisions made, people multiplied — rather than
 * a list of things that can be done. Facts (roles, dates, numbers) are
 * carried over unchanged from the previous site and CV.
 */

export const profile = {
  name: "Muhammad Ibrahim",
  /** Shown under the hero name-plate. */
  title: "Senior Software Engineer",
  /** Three-beat discipline strip — sits in the hero meta row. */
  disciplines: ["Full-Stack", "Applied AI", "Multi-Tenant Platforms"],
  location: "Lahore, PK · Remote",
  /* Changed from "Open to staff-level & lead roles" — you started at
     athGADLANG in July 2026, and an actively-looking banner on a public site
     reads badly to a current employer. Revert if that is not a concern. */
  availability: "Staff Engineer at athGADLANG",

  email: "muh.ibrahim240102@gmail.com",
  phoneDisplay: "(+92) 309-9072684",
  phoneTel: "+923099072684",
  linkedinDisplay: "m-ibrahim2412",
  githubDisplay: "IbbyKun",
  githubUrl: "https://github.com/IbbyKun",
  linkedinUrl: "https://www.linkedin.com/in/m-ibrahim2412",

  education: "B.S. Software Engineering — FAST-NUCES · 2020–2024",

  /**
   * The hero statement. Built to be split across lines and revealed
   * word-by-word, so keep it short and load-bearing.
   */
  statement: "I architect systems that carry real money, real patients, and real teams.",

  /** Sub-statement under the hero headline. */
  intro:
    "Four years building multi-tenant platforms where the failure modes are expensive — escrow payments, clinical consultations, multi-currency marketplaces. I have led 20 engineers, owned portals end to end, and still write the code when writing it is the fastest way through.",

  /**
   * Manifesto section — three positions, stated plainly.
   * Each is a claim about how the work gets done, backed by the record below.
   */
  manifesto: [
    {
      id: "systems",
      index: "01",
      title: "Systems before features",
      body: "A payments flow that handles escrow, commissions, subscriptions and four currencies is not a feature — it is a system with invariants. I design for the invariants first: what must never be true, what must survive a retry, what an auditor will ask for in eighteen months. Features fall out of that. The reverse never works.",
    },
    {
      id: "leverage",
      index: "02",
      title: "Leverage over output",
      body: "Leading 20 engineers changed what my day is worth. The highest-value hours are now spent on the decisions that are expensive to reverse — data models, tenancy boundaries, release discipline — and on review that makes the next person faster. I still ship. I just stopped measuring myself by how much.",
    },
    {
      id: "honest-ai",
      index: "03",
      title: "AI that earns its place",
      body: "I have shipped guided consultations, symptom checkers, and OCR-to-JSON document pipelines into production. The bar is the same as any other dependency: measurable, observable, and gracefully degrading when the model is wrong. AI that cannot be evaluated is a liability wearing a demo's clothes.",
    },
  ],

  /**
   * Hero-adjacent proof strip. Kept to four so it stays a single row.
   * These four numbers are the source of truth — every figure in the body copy
   * across profile / experience / projects is written to agree with them.
   */
  proof: [
    { value: "4+", label: "Years in production" },
    { value: "20", label: "Engineers led" },
    { value: "15+", label: "Portals owned or shipped" },
    { value: "25+", label: "Vendor integrations live" },
  ],

  /** Closing line above the contact CTA. */
  closing: "If you are building something where the hard part is the system, not the screen — let's talk.",
} as const

export type Profile = typeof profile
