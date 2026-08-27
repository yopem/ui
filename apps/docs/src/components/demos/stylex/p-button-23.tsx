import * as stylex from "@stylexjs/stylex"
import { ThumbsUpIcon } from "lucide-react"

import { Button } from "@/components/ui/stylex/button"

export default function Particle() {
  return (
    <Button {...stylex.props(demoStyles.demo1)} variant="outline">
      <ThumbsUpIcon aria-hidden="true" />
      Like
      <span {...stylex.props(demoStyles.demo2)}>86</span>
    </Button>
  )
}

const demoStyles = stylex.create({
  demo1: {
    paddingInlineEnd: "0px",
  },
  demo2: {
    position: "relative",
    marginInlineStart: "0.25rem",
    paddingInline: "calc(0.25rem * 3)",
    fontSize: "0.75rem",
    lineHeight: "calc(1 / 0.75)",
    fontWeight: "500",
    color: "var(--muted-foreground)",
    "::before": {
      content: '""',
      position: "absolute",
      inset: "0px",
      insetInlineStart: "0px",
      inlineSize: "1px",
      backgroundColor: "var(--input)",
    },
  },
})
