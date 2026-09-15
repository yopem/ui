import {
  RiFacebookFill,
  RiGithubFill,
  RiGoogleFill,
  RiTwitterXFill,
} from "@remixicon/react"
import * as stylex from "@stylexjs/stylex"

import { Button } from "@/components/ui/stylex/button"

export default function Particle() {
  return (
    <div {...stylex.props(exampleStyles.example1)}>
      <Button aria-label="Login with Google" size="icon" variant="outline">
        <RiGoogleFill
          {...stylex.props(exampleStyles.icon)}
          aria-hidden="true"
        />
      </Button>
      <Button aria-label="Login with Facebook" size="icon" variant="outline">
        <RiFacebookFill
          {...stylex.props(exampleStyles.icon)}
          aria-hidden="true"
        />
      </Button>
      <Button aria-label="Login with X" size="icon" variant="outline">
        <RiTwitterXFill
          {...stylex.props(exampleStyles.icon)}
          aria-hidden="true"
        />
      </Button>
      <Button aria-label="Login with GitHub" size="icon" variant="outline">
        <RiGithubFill
          {...stylex.props(exampleStyles.icon)}
          aria-hidden="true"
        />
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
    display: "inline-flex",
    flexWrap: "wrap",
    gap: "calc(0.25rem * 2)",
  },
})
