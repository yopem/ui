import * as stylex from "@stylexjs/stylex"
import { ArrowRightIcon } from "lucide-react"

import { Button } from "@/components/ui/stylex/button"

export default function Particle() {
  return (
    <Button {...stylex.props(stylex.defaultMarker())}>
      Get Started
      <ArrowRightIcon
        aria-hidden="true"
        {...stylex.props(demoStyles.report1)}
      />
    </Button>
  )
}

const demoStyles = stylex.create({
  report1: {
    transform: {
      default: "translateX(0)",
      [stylex.when.ancestor(":hover")]: "translateX(0.125rem)",
    },
    transition: "transform 150ms cubic-bezier(0.4, 0, 0.2, 1)",
  },
})
