"use client"

import { SectionHeader } from "@/components/primitives/section-header"
import { SplitText } from "@/components/primitives/split-text"
import { Reveal, RevealGroup, RevealItem } from "@/components/primitives/reveal"
import { Magnetic } from "@/components/primitives/magnetic"
import { Marquee } from "@/components/primitives/marquee"
import { profile } from "@/data/profile"
import { contactHrefs, socials } from "@/lib/contact-hrefs"
import { sections } from "@/data/site"

const meta = sections.find((s) => s.id === "contact")!

/**
 * Contact.
 *
 * The email address is the largest interactive element on the page — if
 * someone has read this far, the next action should require no hunting. The
 * marquee beneath it is the only place the site raises its voice.
 */
// Split at the "@", keeping it on the domain half so a wrapped address still
// reads as one address.
const atIndex = profile.email.indexOf("@")
const emailLocal = atIndex > 0 ? profile.email.slice(0, atIndex) : profile.email
const emailDomain = atIndex > 0 ? profile.email.slice(atIndex) : ""

export function Contact() {
  return (
    <section
      id={meta.id}
      className="relative z-10 scroll-mt-24 pt-[var(--spacing-section)]"
    >
      <div className="container-grid">
        <SectionHeader
          index={meta.index}
          label={meta.label}
          title="Let's build something that holds"
          aside={profile.availability}
        />

        <div className="mt-16 grid gap-12 md:mt-24 md:grid-cols-12 md:gap-8">
          <div className="min-w-0 md:col-span-7">
            <SplitText
              as="p"
              className="text-lead text-grey-100 max-w-[46ch] text-balance"
              stagger={0.018}
            >
              {profile.closing}
            </SplitText>

            <Reveal delay={0.15} className="mt-12">
              <Magnetic strength={0.15}>
                <a
                  href={contactHrefs.email}
                  data-cursor
                  data-cursor-label="EMAIL"
                  className="group inline-block"
                >
                  <span className="display text-paper group-hover:text-acid inline-block text-[clamp(1.35rem,3.4vw,2.9rem)] leading-[1.05] tracking-[-0.03em] break-words transition-colors duration-500">
                    {/* An email has no soft wrap opportunity in it, so at
                        375px the browser used to break wherever it ran out of
                        room and orphan two letters on the next line. `<wbr>`
                        offers the one break a reader would choose themselves;
                        `break-words` stays as the last resort below that. */}
                    {emailLocal}
                    <wbr />
                    {emailDomain}
                  </span>
                  <span className="bg-line-strong group-hover:bg-acid mt-2 block h-px w-full origin-left transition-colors duration-500" />
                </a>
              </Magnetic>
            </Reveal>

            <Reveal delay={0.2} className="mt-8">
              <a
                href={contactHrefs.phone}
                data-cursor
                className="label text-subtle hover:text-paper link-sweep transition-colors"
              >
                {profile.phoneDisplay}
              </a>
            </Reveal>
          </div>

          {/* ---- Channels --------------------------------------------------- */}
          <div className="md:col-span-4 md:col-start-9">
            <div className="rule" />
            <RevealGroup>
              {socials.map((social) => (
                <RevealItem key={social.label}>
                  <a
                    href={social.href}
                    target={social.label === "Email" ? undefined : "_blank"}
                    rel={social.label === "Email" ? undefined : "noopener noreferrer"}
                    data-cursor
                    className="group flex items-baseline justify-between gap-4 border-b border-line py-5"
                  >
                    <span className="label text-subtle">{social.label}</span>
                    <span className="text-paper group-hover:text-acid flex items-center gap-2 truncate text-sm transition-colors duration-300">
                      <span className="truncate">{social.handle}</span>
                      <span
                        className="shrink-0 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                        aria-hidden
                      >
                        ↗
                      </span>
                    </span>
                  </a>
                </RevealItem>
              ))}
            </RevealGroup>

            <Reveal delay={0.25} className="mt-8">
              <p className="label text-subtle leading-relaxed normal-case">
                Typically replies within a day. Based in {profile.location}, comfortable
                across European and US hours.
              </p>
            </Reveal>
          </div>
        </div>
      </div>

      {/* ---- Shout ---------------------------------------------------------- */}
      <div className="mt-24 border-y border-line py-6 md:mt-32">
        <Marquee duration={28}>
          {Array.from({ length: 4 }).map((_, i) => (
            <span key={i} className="flex items-center">
              <span className="display text-d4 text-paper px-8 whitespace-nowrap">
                Open to interesting problems
              </span>
              <span className="display text-d4 text-acid whitespace-nowrap">✳</span>
              <span className="display text-d4 text-paper px-8 whitespace-nowrap">
                AI · Platforms · Architecture
              </span>
              <span className="display text-d4 text-acid whitespace-nowrap">✳</span>
            </span>
          ))}
        </Marquee>
      </div>
    </section>
  )
}
