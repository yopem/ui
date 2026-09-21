import { Resvg } from "@resvg/resvg-js"
import satori from "satori"

import { brandLogoPath } from "@/lib/brand"

// Satori needs intrinsic JSX and inline styles, not React components or CSS classes.
export async function renderOgImage(
  title: string,
  description: string,
  regularFont: ArrayBuffer,
  boldFont: ArrayBuffer,
) {
  const svg = await satori(
    <div
      style={{
        background: "#f7f7f5",
        color: "#171717",
        display: "flex",
        flexDirection: "column",
        fontFamily: "Figtree",
        height: "100%",
        justifyContent: "space-between",
        padding: "72px 80px",
        width: "100%",
      }}
    >
      <div style={{ alignItems: "center", display: "flex", gap: "18px" }}>
        <svg height="56" viewBox="0 0 240 240" width="56">
          <g transform="translate(0 240) scale(.1 -.1)">
            <path d={brandLogoPath} fill="currentColor" />
          </g>
        </svg>
        <span style={{ fontSize: 32, fontWeight: 700, letterSpacing: "-1px" }}>
          Yopem UI
        </span>
        <span style={{ color: "#737373", fontSize: 26 }}>
          StyleX React UI Library
        </span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
        <div
          style={{
            fontSize: title.length > 64 ? 60 : 72,
            fontWeight: 700,
            letterSpacing: "-3px",
            lineHeight: 1.05,
          }}
        >
          {title}
        </div>
        <div
          style={{
            color: "#626262",
            fontSize: 28,
            lineHeight: 1.35,
            maxWidth: "980px",
          }}
        >
          {description}
        </div>
      </div>
      <div style={{ color: "#737373", display: "flex", fontSize: 22 }}>
        ui.yopem.com
      </div>
    </div>,
    {
      fonts: [
        {
          data: regularFont,
          name: "Figtree",
          style: "normal",
          weight: 400,
        },
        { data: boldFont, name: "Figtree", style: "normal", weight: 700 },
      ],
      height: 630,
      width: 1200,
    },
  )

  return new Resvg(svg).render().asPng()
}
