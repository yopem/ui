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
    <div {...stylex.props(demoStyles.demo1)}>
      <Button aria-label="Login with Google" size="icon" variant="outline">
        <RiGoogleFill aria-hidden="true" />
      </Button>
      <Button aria-label="Login with Facebook" size="icon" variant="outline">
        <RiFacebookFill aria-hidden="true" />
      </Button>
      <Button aria-label="Login with X" size="icon" variant="outline">
        <RiTwitterXFill aria-hidden="true" />
      </Button>
      <Button aria-label="Login with GitHub" size="icon" variant="outline">
        <RiGithubFill aria-hidden="true" />
      </Button>
    </div>
  )
}

const demoStyles = stylex.create({
  demo1: {
    display: "inline-flex",
    flexWrap: "wrap",
    gap: "calc(0.25rem * 2)",
  },
})
