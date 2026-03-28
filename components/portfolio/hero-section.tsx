"use client"

import { Github, Linkedin, Mail, ArrowDown } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { profile } from "@/data/profile"

export function HeroSection() {
  const { bio } = profile

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-background grid-pattern">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-6 py-20 w-full">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-14 lg:items-start">
          <div className="space-y-8 flex flex-col items-center lg:items-start text-center lg:text-left">
            <div className="relative shrink-0">
              <div
                className="absolute inset-0 rounded-full bg-primary/20 blur-xl scale-110"
                aria-hidden
              />
              <div className="relative size-28 sm:size-32 rounded-full ring-2 ring-primary/30 ring-offset-4 ring-offset-background overflow-hidden">
                <Image
                  src="/hero-avatar.png"
                  alt={profile.name}
                  width={128}
                  height={128}
                  className="size-full object-cover"
                  priority
                />
              </div>
            </div>

            <div className="space-y-4 w-full">
              <h1 className="text-5xl lg:text-7xl font-bold tracking-tight text-foreground">
                {profile.name}
              </h1>
              <p className="text-xl lg:text-2xl text-primary font-medium">{profile.title}</p>
              <p className="text-sm text-muted-foreground">{profile.education}</p>
              <p className="text-xs text-muted-foreground/90">{bio.pronouns}</p>
            </div>

            <div className="flex items-center justify-center lg:justify-start gap-4">
              <Link
                href={profile.githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <Github className="w-5 h-5" />
                <span className="sr-only">GitHub</span>
              </Link>
              <Link
                href={profile.linkedinUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <Linkedin className="w-5 h-5" />
                <span className="sr-only">LinkedIn</span>
              </Link>
              <Link
                href={`mailto:${profile.email}`}
                className="p-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <Mail className="w-5 h-5" />
                <span className="sr-only">Email</span>
              </Link>
            </div>
          </div>

          <div className="space-y-6 text-center lg:text-left lg:pt-2">
            <p className="text-lg text-muted-foreground leading-relaxed">
              I architect intelligent systems that bridge the gap between cutting-edge AI and robust,
              scalable applications.
            </p>
            <p className="text-lg text-muted-foreground leading-relaxed">
              {"I'm a developer passionate about crafting intelligent, pixel-perfect user interfaces that blend thoughtful design with robust engineering. My favorite work lies at the intersection of "}
              <span className="text-foreground font-medium">AI/ML</span>
              {" and "}
              <span className="text-foreground font-medium">full-stack development</span>
              {", creating experiences that not only look great but are meticulously built for performance and scalability."}
            </p>
          </div>
        </div>
      </div>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <ArrowDown className="w-5 h-5 text-muted-foreground" />
      </div>
    </section>
  )
}
