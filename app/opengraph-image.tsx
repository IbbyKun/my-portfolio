import { ImageResponse } from "next/og"
import { readFile } from "node:fs/promises"
import { join } from "node:path"
import { profile } from "@/data/profile"
import { experiences } from "@/data/experience"

export const alt = `${profile.name} — ${profile.title}`
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

/**
 * The share card.
 *
 * Carries identity only — name, current position, employer, location. No
 * project work: this is the image that appears when the link is pasted into
 * Slack, LinkedIn or a DM, and the job it has to do there is say who this is.
 *
 * Archivo is loaded from a .woff rather than the .woff2 the site itself uses,
 * because Satori (which renders this) supports ttf/otf/woff and not woff2.
 */
export default async function OpengraphImage() {
  const archivo = await readFile(join(process.cwd(), "app/fonts/archivo-800.woff"))
  const current = experiences.find((e) => e.current)

  const ACID = "#ccff00"
  const INK = "#0a0a0a"

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: INK,
          padding: "72px 80px",
          // A single acid hairline along the top, echoing the site's rules.
          borderTop: `10px solid ${ACID}`,
        }}
      >
        {/* nowrap: at 26/6 the discipline strip wrapped, and a wrapped block
            re-centres against the dot, which then floated mid-paragraph. */}
        <div style={{ display: "flex", alignItems: "center", gap: 18, flexWrap: "nowrap" }}>
          <div
            style={{ width: 20, height: 20, borderRadius: 10, background: ACID, flexShrink: 0 }}
          />
          <div
            style={{
              fontSize: 22,
              letterSpacing: 4,
              color: "#8c8c88",
              textTransform: "uppercase",
              whiteSpace: "nowrap",
            }}
          >
            {profile.disciplines.join("  ·  ")}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              fontFamily: "Archivo",
              fontSize: 118,
              lineHeight: 1,
              letterSpacing: -4,
              color: "#f2f2f0",
              textTransform: "uppercase",
              display: "flex",
            }}
          >
            {profile.name}
          </div>
          <div
            style={{
              marginTop: 30,
              fontSize: 40,
              color: "#f2f2f0",
              display: "flex",
            }}
          >
            {profile.title}
          </div>
          {current ? (
            <div style={{ marginTop: 12, fontSize: 34, color: ACID, display: "flex" }}>
              {current.title} · {current.company}
            </div>
          ) : null}
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: 24,
            letterSpacing: 3,
            color: "#8c8c88",
            textTransform: "uppercase",
          }}
        >
          <div style={{ display: "flex" }}>{profile.location}</div>
          <div style={{ display: "flex" }}>{profile.githubDisplay}</div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [{ name: "Archivo", data: archivo, style: "normal", weight: 800 }],
    },
  )
}
