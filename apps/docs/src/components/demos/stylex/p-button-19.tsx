"use client"

import * as stylex from "@stylexjs/stylex"
import { ChevronDownIcon, ChevronUpIcon } from "lucide-react"
import { useState } from "react"

import { Button } from "@/components/ui/stylex/button"

export default function Particle() {
  const [isExpanded, setIsExpanded] = useState<boolean>(false)

  const toggleExpand = () => {
    setIsExpanded((prevState) => !prevState)
  }

  return (
    <Button
      aria-controls="expandable-content"
      aria-expanded={isExpanded}
      onClick={toggleExpand}
      {...stylex.props(demoStyles.button)}
      variant="ghost" // Use this ID on the element that this button controls
    >
      {isExpanded ? "Show less" : "Show more"}
      {isExpanded ? (
        <ChevronUpIcon aria-hidden="true" {...stylex.props(demoStyles.demo2)} />
      ) : (
        <ChevronDownIcon
          aria-hidden="true"
          {...stylex.props(demoStyles.demo2)}
        />
      )}
    </Button>
  )
}

const demoStyles = stylex.create({
  button: { gap: "0.25rem" },
  demo2: {
    marginInlineEnd: "calc(0.25rem * -1)",
  },
})
