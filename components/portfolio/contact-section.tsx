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
      className="relative min-h-screen bg-card py-24 lg:py-32 overflow-hidden flex flex-col justify-center"
    >
      <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-background to-transparent pointer-events-none" />

      <div className="absolute inset-0 bg-gradient-to-t from-primary/10 via-primary/5 to-transparent pointer-events-none" />

      <div className="relative max-w-6xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-start">
          <div className="space-y-8">
            <div className="space-y-4">
              <h2 className="text-sm uppercase tracking-widest text-primary font-medium">
                Get in touch
              </h2>
              <h3 className="text-4xl lg:text-5xl font-bold text-foreground text-balance">
                Let’s talk about your next build
              </h3>
            </div>

            <p className="text-lg text-muted-foreground leading-relaxed">
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

          <div className="space-y-4">
            {contactLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                target={link.external ? "_blank" : undefined}
                rel={link.external ? "noopener noreferrer" : undefined}
                className="group flex items-center justify-between p-6 bg-background border border-border rounded-xl hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <link.icon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">{link.label}</div>
                    <div className="text-foreground font-medium">{link.value}</div>
                  </div>
                </div>
                <ArrowUpRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
