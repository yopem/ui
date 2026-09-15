import { RiGithubFill, RiGoogleFill, RiTwitterXFill } from "@remixicon/react"
import * as stylex from "@stylexjs/stylex"

import { Button } from "@/components/ui/stylex/button"

export default function Particle() {
  return (
    <div {...stylex.props(exampleStyles.example1)}>
      <Button variant="outline">
        <RiGoogleFill
          {...stylex.props(exampleStyles.icon)}
          aria-hidden="true"
        />
        <span {...stylex.props(exampleStyles.example2)}>Login with Google</span>
      </Button>
      <Button variant="outline">
        <RiTwitterXFill
          {...stylex.props(exampleStyles.icon)}
          aria-hidden="true"
        />
        <span {...stylex.props(exampleStyles.example2)}>Login with X</span>
      </Button>
      <Button variant="outline">
        <RiGithubFill
          {...stylex.props(exampleStyles.icon)}
          aria-hidden="true"
        />
        <span {...stylex.props(exampleStyles.example2)}>Login with GitHub</span>
      </Button>
    </div>
  )
}

const exampleStyles = stylex.create({
  icon: {
    blockSize: { default: "1.125rem", "@media (min-width: 640px)": "1rem" },
    inlineSize: { default: "1.125rem", "@media (min-width: 640px)": "1rem" },
    flexShrink: 0,
    pointerEvents: "none",
    opacity: 0.8,
    marginInline: "-0.125rem",
  },
  example1: {
    display: "flex",
    flexDirection: "column",
    gap: "calc(0.25rem * 2)",
  },
  example2: {
    flex: "1",
  },
})
