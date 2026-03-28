export interface FooterProps {
  /** Read by `ParallaxContainer` — keeps footer in normal flow under the sticky contact panel */
  parallaxFlat?: boolean
}

export function Footer(_props: FooterProps) {
  return (
    <footer className="relative bg-background border-t border-border py-8">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <p>
            Designed & Built by Muhammad Ibrahim
          </p>
          <p>
            Built with Next.js & Tailwind CSS
          </p>
        </div>
      </div>
    </footer>
  )
}
