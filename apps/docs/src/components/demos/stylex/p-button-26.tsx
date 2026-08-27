"use client"

import * as stylex from "@stylexjs/stylex"
import { StarIcon } from "lucide-react"
import { useState } from "react"

import { Button } from "@/components/ui/stylex/button"

export default function Particle() {
  const [isStarred, setIsStarred] = useState(false)
  const count = isStarred ? 730 : 729

  return (
    <Button onClick={() => setIsStarred(!isStarred)}>
      <StarIcon
        aria-hidden="true"
        {...stylex.props(isStarred && demoStyles.starred)}
      />
      <span {...stylex.props(demoStyles.demo1)}>
        {isStarred ? "Starred" : "Star"}
        <span {...stylex.props(demoStyles.demo2)}>{count}</span>
      </span>
    </Button>
  )
}

const demoStyles = stylex.create({
  demo1: {
    display: "flex",
    alignItems: "baseline",
    gap: "calc(0.25rem * 2)",
  },
  starred: {
    color: "oklch(79.5% 0.184 86.047)",
    fill: "oklch(79.5% 0.184 86.047)",
  },
  demo2: {
    fontSize: "0.75rem",
    lineHeight: "calc(1 / 0.75)",
    color: {
      default: "var(--primary-foreground)",
      "@supports (color: color-mix(in lab, red, red))":
        "color-mix(in oklab, var(--primary-foreground) 60%, transparent)",
    },
  },
})
