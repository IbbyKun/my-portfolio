import { ImageResponse } from "next/og"

export const size = { width: 180, height: 180 }
export const contentType = "image/png"

/**
 * Home-screen icon. At 180px there is room for the initials, so this is the
 * full mark: acid dot plus "MI" in the display weight, on ink.
 */
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 14,
          background: "#0a0a0a",
        }}
      >
        <div
          style={{
            width: 26,
            height: 26,
            borderRadius: 999,
            background: "#ccff00",
          }}
        />
        <div
          style={{
            fontSize: 62,
            lineHeight: 1,
            fontWeight: 800,
            letterSpacing: -3,
            color: "#f2f2f0",
          }}
        >
          MI
        </div>
      </div>
    ),
    { ...size },
  )
}
