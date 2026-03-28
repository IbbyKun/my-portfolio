"use client"

import {
  useEffect,
  useRef,
  useState,
  ReactNode,
  Children,
  cloneElement,
  isValidElement,
} from "react"

interface ParallaxContainerProps {
  children: ReactNode
}

/** Widen the layer before scaling so the viewport stays full-bleed (avoids side gutters). */
function ParallaxScaledShell({
  scale,
  children,
}: {
  scale: number
  children: ReactNode
}) {
  const s = Math.max(scale, 0.001)
  const widthPercent = 100 / s
  return (
    <div className="flex w-full justify-center overflow-x-hidden">
      <div
        style={{
          width: `${widthPercent}%`,
          transform: `scale(${scale})`,
          transformOrigin: "top center",
          willChange: "transform",
        }}
      >
        {children}
      </div>
    </div>
  )
}

export function ParallaxContainer({ children }: ParallaxContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [sectionStates, setSectionStates] = useState<{ opacity: number; scale: number }[]>([])
  const childCount = Children.count(children)

  useEffect(() => {
    // Initialize states for all children
    setSectionStates(Array(childCount).fill({ opacity: 1, scale: 1 }))
  }, [childCount])

  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return
      
      const sections = containerRef.current.querySelectorAll<HTMLElement>('[data-parallax-section]')
      const windowHeight = window.innerHeight
      const newStates: { opacity: number; scale: number }[] = []

      sections.forEach((section, index) => {
        const isFlat = section.dataset.parallaxFlat === "true"
        const scalesWithNext = section.dataset.parallaxScaleWithNext === "true"
        if (isFlat && !scalesWithNext) {
          newStates[index] = { opacity: 1, scale: 1 }
          return
        }

        if (index >= sections.length - 1) {
          newStates[index] = { opacity: 1, scale: 1 }
          return
        }

        const next = sections[index + 1]
        const nextRect = next.getBoundingClientRect()
        const vh = windowHeight

        // Fade only when the *next* section rises into view (handoff). Using `rect.top < 0`
        // breaks tall sticky blocks (e.g. Skills): top stays negative for thousands of px while
        // the user still needs to read content — opacity would sit near 0 the whole time.
        if (nextRect.top >= vh) {
          newStates[index] = { opacity: 1, scale: 1 }
          return
        }

        const progress = Math.min(1, (vh - nextRect.top) / (vh * 0.55))
        // Opacity on the whole section made lower layers (e.g. hero) show through sticky panels.
        // Keep depth via scale only so backgrounds stay visually solid.
        newStates[index] = {
          opacity: 1,
          scale: 1 - progress * 0.08,
        }
      })

      setSectionStates(newStates)
    }

    window.addEventListener("scroll", handleScroll, { passive: true })
    handleScroll()
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const childrenWithProps = Children.map(children, (child, index) => {
    if (isValidElement(child)) {
      const state = sectionStates[index] || { opacity: 1, scale: 1 }
      const parallaxFlat = Boolean(
        (child.props as { parallaxFlat?: boolean }).parallaxFlat,
      )
      const parallaxScaleWithNext = Boolean(
        (child.props as { parallaxScaleWithNext?: boolean }).parallaxScaleWithNext,
      )
      /** Flat + scale: section keeps full-bleed bg; child applies scale to inner column only. */
      const childHandlesScale = parallaxFlat && parallaxScaleWithNext
      const useOuterScaleShell = !parallaxFlat
      const inner = cloneElement(
        child as React.ReactElement<{ parallaxContentScale?: number }>,
        childHandlesScale ? { parallaxContentScale: state.scale } : {},
      )

      return (
        <div
          key={index}
          data-parallax-section
          data-parallax-flat={parallaxFlat ? "true" : undefined}
          data-parallax-scale-with-next={parallaxScaleWithNext ? "true" : undefined}
          className={parallaxFlat ? "relative" : "sticky top-0"}
          style={
            parallaxFlat
              ? {
                  zIndex: index + 1,
                  opacity: state.opacity,
                }
              : {
                  zIndex: index + 1,
                }
          }
        >
          {useOuterScaleShell ? (
            <ParallaxScaledShell scale={state.scale}>{inner}</ParallaxScaledShell>
          ) : (
            inner
          )}
        </div>
      )
    }
    return child
  })

  return (
    <main ref={containerRef} className="bg-background">
      {childrenWithProps}
    </main>
  )
}
