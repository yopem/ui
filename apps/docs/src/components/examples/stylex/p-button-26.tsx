"use client"

import * as stylex from "@stylexjs/stylex"
import { StarIcon } from "lucide-react"
import { useState } from "react"

import { Box } from "@/components/ui/box"
import { Button } from "@/components/ui/button"
export default function Example() {
  const [isStarred, setIsStarred] = useState(false)
  const count = isStarred ? 730 : 729

  return (
    <Button onClick={() => setIsStarred(!isStarred)}>
      <StarIcon
        aria-hidden="true"
        {...stylex.props(
          exampleStyles.icon,
          isStarred && exampleStyles.starred,
        )}
      />
      <Box as="span" {...stylex.props(exampleStyles.example1)}>
        {isStarred ? "Starred" : "Star"}
        <Box as="span" {...stylex.props(exampleStyles.example2)}>
          {count}
        </Box>
      </Box>
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
    display: "flex",
    alignItems: "baseline",
    gap: "calc(0.25rem * 2)",
  },
  starred: {
    color: "oklch(79.5% 0.184 86.047)",
    fill: "oklch(79.5% 0.184 86.047)",
  },
  example2: {
    fontSize: "0.75rem",
    lineHeight: "calc(1 / 0.75)",
    color: "var(--primary-foreground)",
  },
})
