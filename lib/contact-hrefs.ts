import { profile } from "@/data/profile"

/** Single source for every outbound contact link on the site. */
export const contactHrefs = {
  email: `mailto:${profile.email}`,
  phone: `tel:${profile.phoneTel}`,
  github: profile.githubUrl,
  linkedin: profile.linkedinUrl,
} as const

export const socials = [
  { label: "GitHub", href: contactHrefs.github, handle: profile.githubDisplay },
  { label: "LinkedIn", href: contactHrefs.linkedin, handle: profile.linkedinDisplay },
  { label: "Email", href: contactHrefs.email, handle: profile.email },
] as const
