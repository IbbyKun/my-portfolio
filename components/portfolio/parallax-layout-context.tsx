"use client"

import {
  createContext,
  useContext,
  useSyncExternalStore,
  type ReactNode,
} from "react"

/**
 * Viewports at or below this width use normal document scroll (no parallax / sticky stack /
 * horizontal experience rail / stacked project stage). Matches Tailwind `lg` breakpoint.
 */
export const SIMPLE_SCROLL_MAX_WIDTH_PX = 1023

const query = `(max-width: ${SIMPLE_SCROLL_MAX_WIDTH_PX}px)`

function subscribe(onStoreChange: () => void) {
  const mq = window.matchMedia(query)
  mq.addEventListener("change", onStoreChange)
  return () => mq.removeEventListener("change", onStoreChange)
}

function getSnapshot() {
  return window.matchMedia(query).matches
}

function getServerSnapshot() {
  return false
}

const SimpleScrollContext = createContext(false)

export function SimpleScrollProvider({ children }: { children: ReactNode }) {
  const simpleScroll = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  return (
    <SimpleScrollContext.Provider value={simpleScroll}>
      {children}
    </SimpleScrollContext.Provider>
  )
}

export function useSimpleScrollLayout() {
  return useContext(SimpleScrollContext)
}
