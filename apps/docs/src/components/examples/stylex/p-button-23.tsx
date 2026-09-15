import * as stylex from "@stylexjs/stylex"
import { ThumbsUpIcon } from "lucide-react"

import { Button } from "@/components/ui/stylex/button"

export default function Particle() {
  return (
    <Button {...stylex.props(exampleStyles.example1)} variant="outline">
      <ThumbsUpIcon {...stylex.props(exampleStyles.icon)} aria-hidden="true" />
      Like
      <span {...stylex.props(exampleStyles.example2)}>86</span>
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
  example1: {
    paddingInlineEnd: "0px",
  },
  example2: {
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
