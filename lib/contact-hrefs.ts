import { profile } from "@/data/profile"

/** Single source for Connect + hero social URLs. */
export const contactHrefs = {
  email: `mailto:${profile.email}`,
  phone: `tel:${profile.phoneTel}`,
  github: profile.githubUrl,
  linkedin: profile.linkedinUrl,
} as const
