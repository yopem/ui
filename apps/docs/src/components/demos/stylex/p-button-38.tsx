import { RiGithubFill, RiGoogleFill, RiTwitterXFill } from "@remixicon/react"
import * as stylex from "@stylexjs/stylex"

import { Button } from "@/components/ui/stylex/button"

export default function Particle() {
  return (
    <div {...stylex.props(demoStyles.demo1)}>
      <Button variant="outline">
        <RiGoogleFill {...stylex.props(demoStyles.icon)} aria-hidden="true" />
        <span {...stylex.props(demoStyles.demo2)}>Login with Google</span>
      </Button>
      <Button variant="outline">
        <RiTwitterXFill {...stylex.props(demoStyles.icon)} aria-hidden="true" />
        <span {...stylex.props(demoStyles.demo2)}>Login with X</span>
      </Button>
      <Button variant="outline">
        <RiGithubFill {...stylex.props(demoStyles.icon)} aria-hidden="true" />
        <span {...stylex.props(demoStyles.demo2)}>Login with GitHub</span>
      </Button>
    </div>
  )
}

const demoStyles = stylex.create({
  icon: {
    blockSize: { default: "1.125rem", "@media (min-width: 640px)": "1rem" },
    inlineSize: { default: "1.125rem", "@media (min-width: 640px)": "1rem" },
    flexShrink: 0,
    pointerEvents: "none",
    opacity: 0.8,
    marginInline: "-0.125rem",
  },
  demo1: {
    display: "flex",
    flexDirection: "column",
    gap: "calc(0.25rem * 2)",
  },
  demo2: {
    flex: "1",
  },
})
