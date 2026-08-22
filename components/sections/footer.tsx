"use client"

import { useScrollToSection } from "@/components/chrome/smooth-scroll"
import { navSections } from "@/data/site"
import { profile } from "@/data/profile"

/**
 * Footer.
 *
 * Deliberately quiet after the contact shout — a sitemap, a colophon, and a
 * way back up. The build year is hardcoded rather than `new Date()` so the
 * server and client agree and nothing re-renders on hydration.
 */

const YEAR = 2026

export function Footer() {
  const scrollTo = useScrollToSection()

  // `id` is load-bearing: the scroll companion finds this element to settle
  // behind as its resting state. See scroll-companion.
  return (
    <footer id="colophon" className="relative z-10 pt-20 pb-10">
      <div className="container-grid">
        <div className="grid gap-12 md:grid-cols-12 md:gap-8">
          {/* Wordmark */}
          <div className="md:col-span-5">
            <button
              type="button"
              onClick={() => scrollTo("index")}
              data-cursor
              className="group flex items-center gap-3 text-left"
            >
              <span className="display text-d4 group-hover:text-acid transition-colors duration-500">
                {profile.name}
              </span>
              <span
                className="text-subtle group-hover:text-acid mb-1 transition-all duration-500 group-hover:-translate-y-1"
                aria-hidden
              >
                ↑
              </span>
            </button>
            <p className="label text-subtle mt-4 max-w-[28ch] leading-relaxed normal-case">
              {profile.title} — building multi-tenant platforms and the teams that
              maintain them.
            </p>
          </div>

          {/* Sitemap */}
          <nav className="md:col-span-3 md:col-start-7" aria-label="Footer">
            <p className="label text-subtle">Index</p>
            <ul className="mt-4 space-y-2">
              {navSections.map((section) => (
                <li key={section.id}>
                  <button
                    type="button"
                    onClick={() => scrollTo(section.id)}
                    data-cursor
                    className="text-grey-200 hover:text-acid link-sweep text-sm transition-colors"
                  >
                    {section.label}
                  </button>
                </li>
              ))}
            </ul>
          </nav>

          {/* Colophon */}
          <div className="md:col-span-3 md:col-start-10">
            <p className="label text-subtle">Colophon</p>
            <ul className="text-grey-200 mt-4 space-y-2 text-sm">
              <li>Next.js · React · TypeScript</li>
              <li>Three.js · React Three Fiber</li>
              <li>Motion · Lenis · Tailwind</li>
            </ul>
          </div>
        </div>

        <div className="rule mt-16 mb-6" />

        <div className="label text-subtle flex flex-wrap items-center justify-between gap-4">
          <p>
            © {YEAR} {profile.name}
          </p>
          <p>Designed &amp; built in Lahore</p>
        </div>
      </div>
    </footer>
  )
}
