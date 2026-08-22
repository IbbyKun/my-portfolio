"use client"

import { Fragment } from "react"
import { motion } from "motion/react"
import { cn } from "@/lib/utils"

/**
 * Word-by-word masked reveal.
 *
 * Each word sits in an `overflow: hidden` box and slides up from beneath it,
 * which reads as type being *set* rather than faded in. Words stay separate
 * inline-blocks so native line-breaking still works at every viewport.
 *
 * Deliberately restrained: 0.55s, 115% of travel, 0.03s stagger. Character-
 * level splitting was tried and reads as showy at this type size.
 *
 * Reduced motion is handled by the `rm-static` class, not by rendering a
 * different tree. The server has no way to know the visitor's preference, so a
 * JSX branch here renders one structure on the server and another on the
 * client — React discards the server HTML for the whole subtree and logs a
 * hydration error. The class neutralises the transform in CSS instead, which
 * both sides agree on.
 */

type Tag = "h1" | "h2" | "h3" | "h4" | "p" | "span" | "div"

interface SplitTextProps {
  children: string
  as?: Tag
  className?: string
  /** Seconds before the first word moves. */
  delay?: number
  /** Seconds between words. */
  stagger?: number
  /** Replay every time it scrolls into view instead of once. */
  repeat?: boolean
}

const wordVariants = {
  hidden: { y: "115%" },
  visible: {
    y: "0%",
    transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] as const },
  },
}

export function SplitText({
  children,
  as = "span",
  className,
  delay = 0,
  stagger = 0.03,
  repeat = false,
}: SplitTextProps) {
  const Component = motion[as]
  const words = children.split(" ")

  return (
    <Component
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: !repeat, margin: "0px 0px -10% 0px" }}
      transition={{ delayChildren: delay, staggerChildren: stagger }}
      // The visible text is the aria-hidden word spans, so the accessible name
      // has to be restated here or the heading reads as empty.
      aria-label={children}
    >
      {words.map((word, i) => (
        <Fragment key={`${word}-${i}`}>
          <span className="line-mask inline-block" aria-hidden>
            <motion.span
              className="rm-static inline-block will-change-transform"
              variants={wordVariants}
            >
              {word}
            </motion.span>
          </span>
          {/* Space is a sibling of the mask, not a child of it: a trailing
              space inside an inline-block is collapsed, which would run every
              word into the next. As a sibling it also stays a valid wrap
              opportunity, so long headings still break naturally. */}
          {i < words.length - 1 ? " " : null}
        </Fragment>
      ))}
    </Component>
  )
}

/**
 * Whole-block reveal for copy that is too long to justify per-word staggering
 * (paragraphs, lists). One mask, one slide.
 */
export function RevealLine({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode
  className?: string
  delay?: number
}) {
  return (
    <span className={cn("line-mask block", className)}>
      <motion.span
        className="rm-static block will-change-transform"
        initial={{ y: "110%" }}
        whileInView={{ y: "0%" }}
        viewport={{ once: true, margin: "0px 0px -10% 0px" }}
        transition={{ duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] }}
      >
        {children}
      </motion.span>
    </span>
  )
}
