"use client"
import * as stylex from "@stylexjs/stylex"
import { CheckIcon, CopyIcon } from "lucide-react"
import { useState } from "react"

import { Button } from "@/components/ui/stylex/button"

export default function Example() {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText("Text copied!")
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Button
      aria-label={copied ? "Copied" : "Copy to clipboard"}
      onClick={handleCopy}
      size="icon"
      variant="outline"
    >
      {copied ? (
        <CheckIcon {...stylex.props(exampleStyles.icon)} aria-hidden="true" />
      ) : (
        <CopyIcon {...stylex.props(exampleStyles.icon)} aria-hidden="true" />
      )}
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
})
