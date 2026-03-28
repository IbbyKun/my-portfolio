"use client"

import { Github, Linkedin, Mail, ArrowDown } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { profile } from "@/data/profile"
import { contactHrefs } from "@/lib/contact-hrefs"

function HeroIntro() {
  return (
    <div className="flex flex-col items-center space-y-6 text-center lg:items-start lg:space-y-8 lg:text-left">
      <div className="relative shrink-0">
        <div
          className="absolute inset-0 scale-110 rounded-full bg-primary/20 blur-xl"
          aria-hidden
        />
        <div className="relative size-28 overflow-hidden rounded-full ring-2 ring-primary/30 ring-offset-4 ring-offset-background sm:size-32">
          <Image
            src="/portfolio_image.jpeg"
            alt={profile.name}
            width={768}
            height={1364}
            className="size-full object-cover object-top"
            priority
          />
        </div>
      </div>

      <div className="w-full space-y-4">
        <h1 className="text-5xl font-bold tracking-tight text-foreground lg:text-7xl">
          {profile.name}
        </h1>
        <p className="text-xl font-medium text-primary lg:text-2xl">{profile.title}</p>
      </div>

      <div className="flex items-center justify-center gap-4 lg:justify-start">
        <Link
          href={contactHrefs.github}
          target="_blank"
          rel="noopener noreferrer"
          className="p-2 text-muted-foreground transition-colors hover:text-foreground"
        >
          <Github className="h-5 w-5" />
          <span className="sr-only">GitHub</span>
        </Link>
        <Link
          href={contactHrefs.linkedin}
          target="_blank"
          rel="noopener noreferrer"
          className="p-2 text-muted-foreground transition-colors hover:text-foreground"
        >
          <Linkedin className="h-5 w-5" />
          <span className="sr-only">LinkedIn</span>
        </Link>
        <Link
          href={contactHrefs.email}
          className="p-2 text-muted-foreground transition-colors hover:text-foreground"
        >
          <Mail className="h-5 w-5" />
          <span className="sr-only">Email</span>
        </Link>
      </div>
    </div>
  )
}

function HeroBio() {
  return (
    <div className="space-y-4 text-center lg:space-y-6 lg:text-left">
      <p className="text-lg leading-relaxed text-muted-foreground">
        I architect intelligent systems that bridge the gap between cutting-edge AI and robust,
        scalable applications.
      </p>
      <p className="text-lg leading-relaxed text-muted-foreground">
        {
          "I'm a developer passionate about crafting intelligent, pixel-perfect user interfaces that blend thoughtful design with robust engineering. My favorite work lies at the intersection of "
        }
        <span className="font-medium text-foreground">AI/ML</span>
        {" and "}
        <span className="font-medium text-foreground">full-stack development</span>
        {
          ", creating experiences that not only look great but are meticulously built for performance and scalability."
        }
      </p>
    </div>
  )
}

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-background grid-pattern lg:flex lg:min-h-screen lg:items-center lg:justify-center">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-20 left-10 h-72 w-72 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute right-10 bottom-20 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/5 blur-3xl" />
      </div>

      {/* Mobile: first screen = intro only, centered in viewport; bio below the fold */}
      <div className="relative z-10 w-full lg:hidden">
        <div className="relative flex min-h-[100dvh] flex-col justify-center px-6">
          <div className="mx-auto w-full min-w-0 max-w-6xl">
            <HeroIntro />
          </div>
          <div className="pointer-events-none absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
            <ArrowDown className="h-5 w-5 text-muted-foreground" />
          </div>
        </div>
        <div className="mx-auto w-full min-w-0 max-w-6xl px-6 pt-6 pb-20">
          <HeroBio />
        </div>
      </div>

      {/* Desktop: two-column layout */}
      <div className="relative z-10 mx-auto hidden w-full min-w-0 max-w-6xl px-6 py-20 lg:block">
        <div className="grid gap-8 lg:grid-cols-2 lg:items-center lg:gap-14">
          <HeroIntro />
          <HeroBio />
        </div>
      </div>

      <div className="pointer-events-none absolute bottom-8 left-1/2 hidden -translate-x-1/2 animate-bounce lg:block">
        <ArrowDown className="h-5 w-5 text-muted-foreground" />
      </div>
    </section>
  )
}
