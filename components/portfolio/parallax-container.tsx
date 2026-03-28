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
import {
  SimpleScrollProvider,
  useSimpleScrollLayout,
} from "@/components/portfolio/parallax-layout-context"

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

function ParallaxContainerInner({ children }: ParallaxContainerProps) {
  const simpleScroll = useSimpleScrollLayout()
  const containerRef = useRef<HTMLDivElement>(null)
  const [sectionStates, setSectionStates] = useState<{ opacity: number; scale: number }[]>([])
  const childCount = Children.count(children)

  useEffect(() => {
    setSectionStates(Array(childCount).fill({ opacity: 1, scale: 1 }))
  }, [childCount])

  useEffect(() => {
    if (simpleScroll) {
      setSectionStates(Array(childCount).fill({ opacity: 1, scale: 1 }))
      return
    }

    const handleScroll = () => {
      if (!containerRef.current) return

      const sections = containerRef.current.querySelectorAll<HTMLElement>(
        "[data-parallax-section]",
      )
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

        if (nextRect.top >= vh) {
          newStates[index] = { opacity: 1, scale: 1 }
          return
        }

        const progress = Math.min(1, (vh - nextRect.top) / (vh * 0.55))
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
  }, [childCount, simpleScroll])

  const childrenWithProps = Children.map(children, (child, index) => {
    if (isValidElement(child)) {
      const state = sectionStates[index] || { opacity: 1, scale: 1 }
      const parallaxFlat = Boolean(
        (child.props as { parallaxFlat?: boolean }).parallaxFlat,
      )
      const parallaxScaleWithNext = Boolean(
        (child.props as { parallaxScaleWithNext?: boolean }).parallaxScaleWithNext,
      )
      const childHandlesScale = parallaxFlat && parallaxScaleWithNext
      const useOuterScaleShell = !parallaxFlat && !simpleScroll
      const inner = cloneElement(
        child as React.ReactElement<{ parallaxContentScale?: number }>,
        childHandlesScale && !simpleScroll ? { parallaxContentScale: state.scale } : {},
      )

      const wrapperClass = simpleScroll
        ? "relative"
        : parallaxFlat
          ? "relative"
          : "sticky top-0"

      return (
        <div
          key={index}
          data-parallax-section
          data-parallax-flat={parallaxFlat ? "true" : undefined}
          data-parallax-scale-with-next={parallaxScaleWithNext ? "true" : undefined}
          className={wrapperClass}
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
    <main
      ref={containerRef}
      className={simpleScroll ? "overflow-x-hidden bg-background" : "bg-background"}
    >
      {childrenWithProps}
    </main>
  )
}

export function ParallaxContainer({ children }: ParallaxContainerProps) {
  return (
    <SimpleScrollProvider>
      <ParallaxContainerInner>{children}</ParallaxContainerInner>
    </SimpleScrollProvider>
  )
}
