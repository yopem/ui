import type { CSSProperties } from "react"

import { Resvg } from "@resvg/resvg-js"
import satori from "satori"

import { brandLogoPath } from "./brand"

const ogStyles = {
  root: {
    background: "#f7f7f5",
    color: "#171717",
    display: "flex",
    flexDirection: "column",
    fontFamily: "Figtree",
    height: "100%",
    justifyContent: "space-between",
    padding: "72px 80px",
    width: "100%",
  },
  brand: { alignItems: "center", display: "flex", gap: "18px" },
  brandName: { fontSize: 32, fontWeight: 700, letterSpacing: "-1px" },
  tagline: { color: "#737373", fontSize: 26 },
  content: { display: "flex", flexDirection: "column", gap: "24px" },
  title: {
    fontSize: 72,
    fontWeight: 700,
    letterSpacing: "-3px",
    lineHeight: 1.05,
  },
  description: {
    color: "#626262",
    fontSize: 28,
    lineHeight: 1.35,
    maxWidth: "980px",
  },
  longTitle: {
    fontSize: 60,
    fontWeight: 700,
    letterSpacing: "-3px",
    lineHeight: 1.05,
  },
  footer: { color: "#737373", display: "flex", fontSize: 22 },
} satisfies Record<string, CSSProperties>

// Satori needs intrinsic JSX and inline styles, not React components or CSS classes.
export async function renderOgImage(
  title: string,
  description: string,
  regularFont: ArrayBuffer,
  boldFont: ArrayBuffer,
) {
  const titleStyle = title.length > 64 ? ogStyles.longTitle : ogStyles.title

  const svg = await satori(
    <div style={ogStyles.root}>
      <div style={ogStyles.brand}>
        <svg height="56" viewBox="0 0 240 240" width="56">
          <g transform="translate(0 240) scale(.1 -.1)">
            <path d={brandLogoPath} fill="currentColor" />
          </g>
        </svg>
        <span style={ogStyles.brandName}>Yopem UI</span>
        <span style={ogStyles.tagline}>StyleX React UI Library</span>
      </div>
      <div style={ogStyles.content}>
        <div style={titleStyle}>{title}</div>
        <div style={ogStyles.description}>{description}</div>
      </div>
      <div style={ogStyles.footer}>ui.yopem.com</div>
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
