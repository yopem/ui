import * as stylex from "@stylexjs/stylex"
import { ChevronRightIcon } from "lucide-react"

import { Button } from "@/components/ui/stylex/button"

export default function Example() {
  return (
    <Button
      {...stylex.props(stylex.defaultMarker(), exampleStyles.button)}
      variant="outline"
    >
      <div {...stylex.props(exampleStyles.example2)}>
        <h3>Talent Agency</h3>
        <p {...stylex.props(exampleStyles.example3)}>Matches for your roster</p>
      </div>
      <ChevronRightIcon
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
  button: {
    blockSize: "auto",
    gap: "1rem",
    padding: "0.75rem 1rem",
    textAlign: "left",
  },
  example2: {
    display: "flex",
    flexDirection: "column",
    gap: "calc(0.25rem * 0.5)",
  },
  example3: {
    fontWeight: "400",
    whiteSpace: "break-spaces",
    color: "var(--muted-foreground)",
  },
  report1: {
    transform: {
      default: "translateX(0)",
      [stylex.when.ancestor(":hover")]: "translateX(0.125rem)",
    },
    transition: "transform 150ms cubic-bezier(0.4, 0, 0.2, 1)",
  },
})
