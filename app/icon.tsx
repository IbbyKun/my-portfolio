import { ImageResponse } from "next/og"

export const size = { width: 32, height: 32 }
export const contentType = "image/png"

/**
 * Favicon: the wordmark's acid dot over ink, with the initials beneath it at
 * larger sizes. At 32px the dot alone is what actually reads in a tab strip,
 * so the mark is built around it rather than around the letters.
 */
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0a0a0a",
          borderRadius: 6,
        }}
      >
        <div
          style={{
            width: 14,
            height: 14,
            borderRadius: 999,
            background: "#ccff00",
          }}
        />
      </div>
    ),
    { ...size },
  )
}
