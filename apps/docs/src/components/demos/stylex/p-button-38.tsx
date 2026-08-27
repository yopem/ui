import { RiGithubFill, RiGoogleFill, RiTwitterXFill } from "@remixicon/react"
import * as stylex from "@stylexjs/stylex"

import { Button } from "@/components/ui/stylex/button"

export default function Particle() {
  return (
    <div {...stylex.props(demoStyles.demo1)}>
      <Button variant="outline">
        <RiGoogleFill aria-hidden="true" />
        <span {...stylex.props(demoStyles.demo2)}>Login with Google</span>
      </Button>
      <Button variant="outline">
        <RiTwitterXFill aria-hidden="true" />
        <span {...stylex.props(demoStyles.demo2)}>Login with X</span>
      </Button>
      <Button variant="outline">
        <RiGithubFill aria-hidden="true" />
        <span {...stylex.props(demoStyles.demo2)}>Login with GitHub</span>
      </Button>
    </div>
  )
}

const demoStyles = stylex.create({
  demo1: {
    display: "flex",
    flexDirection: "column",
    gap: "calc(0.25rem * 2)",
  },
  demo2: {
    flex: "1",
  },
})
