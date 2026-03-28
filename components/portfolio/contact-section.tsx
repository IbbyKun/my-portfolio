"use client"

import { Github, Linkedin, Mail, ArrowUpRight, Phone } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { profile } from "@/data/profile"
import { contactHrefs } from "@/lib/contact-hrefs"

const contactLinks = [
  {
    href: contactHrefs.email,
    icon: Mail,
    label: "Email",
    value: profile.email,
    external: false as const,
  },
  {
    href: contactHrefs.phone,
    icon: Phone,
    label: "Phone",
    value: profile.phoneDisplay,
    external: false as const,
  },
  {
    href: contactHrefs.github,
    icon: Github,
    label: "GitHub",
    value: "Profile & projects",
    external: true as const,
  },
  {
    href: contactHrefs.linkedin,
    icon: Linkedin,
    label: "LinkedIn",
    value: profile.linkedinDisplay,
    external: true as const,
  },
]

export function ContactSection() {
  return (
    <section
      id="contact"
      className="relative flex min-h-screen w-full min-w-0 flex-col justify-center overflow-x-hidden bg-card py-24 lg:py-32"
    >
      <div className="pointer-events-none absolute top-0 right-0 left-0 h-32 bg-gradient-to-b from-background to-transparent" />

      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-primary/10 via-primary/5 to-transparent" />

      <div className="relative mx-auto w-full min-w-0 max-w-6xl px-4 sm:px-6">
        <div className="grid w-full min-w-0 grid-cols-1 items-start gap-12 lg:grid-cols-2 lg:gap-20">
          <div className="min-w-0 space-y-8">
            <div className="space-y-4">
              <h2 className="text-sm uppercase tracking-widest text-primary font-medium">
                Get in touch
              </h2>
              <h3 className="text-4xl lg:text-5xl font-bold text-foreground text-balance">
                Let’s talk about your next build
              </h3>
            </div>

            <p className="text-lg leading-relaxed text-muted-foreground break-words">
              {
                "I’m open to full-stack and AI-heavy product work, technical leadership alongside IC contribution, and well-scoped freelance engagements. Tell me what you’re shipping and where you need depth—I’ll respond as soon as I can."
              }
            </p>

            <Button size="lg" className="group" asChild>
              <Link href={contactHrefs.email}>
                <Mail className="w-4 h-4 mr-2" />
                Email me
                <ArrowUpRight className="w-4 h-4 ml-2 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </Link>
            </Button>
          </div>

          <div className="min-w-0 space-y-4">
            {contactLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                target={link.external ? "_blank" : undefined}
                rel={link.external ? "noopener noreferrer" : undefined}
                className="group flex max-w-full min-w-0 items-center gap-3 rounded-xl border border-border bg-background p-5 transition-all hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 sm:gap-4 sm:p-6"
              >
                <div className="flex min-w-0 flex-1 items-center gap-3 sm:gap-4">
                  <div className="shrink-0 rounded-lg bg-primary/10 p-3">
                    <link.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm text-muted-foreground">{link.label}</div>
                    <div className="break-words font-medium text-foreground">
                      {link.value}
                    </div>
                  </div>
                </div>
                <ArrowUpRight className="h-5 w-5 shrink-0 text-muted-foreground transition-colors group-hover:text-primary" />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
