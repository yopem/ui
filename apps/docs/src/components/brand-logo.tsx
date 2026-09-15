import * as stylex from "@stylexjs/stylex"

import { brandLogoPath } from "@/lib/brand"

export function BrandLogo() {
  return (
    <svg
      {...stylex.props(styles.logo)}
      aria-hidden="true"
      viewBox="0 0 240 240"
    >
      <g transform="translate(0 240) scale(.1 -.1)">
        <path d={brandLogoPath} fill="currentColor" />
      </g>
    </svg>
  )
}

const styles = stylex.create({
  logo: { blockSize: "2rem", inlineSize: "2rem", flexShrink: 0 },
})
