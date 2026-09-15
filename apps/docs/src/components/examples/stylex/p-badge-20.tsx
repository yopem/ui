"use client"

import * as stylex from "@stylexjs/stylex"
import { XIcon } from "lucide-react"
import { useState } from "react"

import { Badge } from "@/components/ui/stylex/badge"

export default function Example() {
  const [isActive, setIsActive] = useState(true)

  if (!isActive) return null

  return (
    <Badge {...stylex.props(exampleStyles.example1)}>
      Removable
      <button
        {...stylex.props(exampleStyles.report1, exampleStyles.report1Manual)}
        aria-label="Remove badge"
        onClick={() => setIsActive(false)}
        type="button"
      >
        <XIcon {...stylex.props(exampleStyles.icon)} aria-hidden="true" />
      </button>
    </Badge>
  )
}

const exampleStyles = stylex.create({
  icon: {
    blockSize: { default: "0.875rem", "@media (min-width: 640px)": "0.75rem" },
    inlineSize: { default: "0.875rem", "@media (min-width: 640px)": "0.75rem" },
    flexShrink: 0,
    pointerEvents: "none",
    opacity: 0.8,
  },
  example1: {
    gap: "0px",
  },
  report1: {
    marginBlock: "-1px",
    marginInlineStart: "-1px",
    marginInlineEnd: "calc(0.25rem * -1.5)",
    display: "inline-flex",
    inlineSize: "calc(0.25rem * 5)",
    blockSize: "calc(0.25rem * 5)",
    flexShrink: "0",
    cursor: "pointer",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "inherit",
    padding: "0px",
    color: {
      default: "var(--primary-foreground)",
      "@supports (color: color-mix(in lab, red, red))":
        "color-mix(in oklab, var(--primary-foreground) 60%, transparent)",
      ":hover": "var(--primary-foreground)",
    },
    outlineStyle: "none",
    borderColor: {
      default: null,
      ":focus-visible": "var(--ring)",
    },
    boxShadow: {
      default: null,
      ":focus-visible":
        "0 0 #0000, 0 0 #0000, 0 0 #0000,  0 0 0 calc(3px + 0px) currentcolor, 0 0 #0000",
    },
  },
  report1Manual: {
    transitionProperty: "color, box-shadow",
    boxShadow: {
      default: null,
      ":focus-visible":
        "0 0 0 3px color-mix(in oklab, var(--ring) 50%, transparent)",
    },
  },
})
