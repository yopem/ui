import * as stylex from "@stylexjs/stylex"
import { ArrowRightIcon } from "lucide-react"

import { Button } from "@/components/ui/button"

export default function Example() {
  return (
    <Button {...stylex.props(stylex.defaultMarker())}>
      Get Started
      <ArrowRightIcon
        aria-hidden="true"
        {...stylex.props(exampleStyles.icon, exampleStyles.report1)}
      />
    </Button>
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
  report1: {
    transform: {
      default: "translateX(0)",
      [stylex.when.ancestor(":hover")]: "translateX(0.125rem)",
    },
    transition: "transform 150ms cubic-bezier(0.4, 0, 0.2, 1)",
  },
})
