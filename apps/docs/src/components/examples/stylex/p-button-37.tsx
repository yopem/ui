"use client"

import * as stylex from "@stylexjs/stylex"
import { PlusIcon } from "lucide-react"
import { useState } from "react"

import { Button } from "@/components/ui/button"

export default function Example() {
  const [open, setOpen] = useState(false)

  return (
    <Button
      aria-expanded={open}
      aria-label={open ? "Close menu" : "Open menu"}
      onClick={() => setOpen((prevState) => !prevState)}
      {...stylex.props(exampleStyles.button)}
      size="icon"
      variant="outline"
    >
      <PlusIcon
        aria-hidden="true"
        {...stylex.props(
          exampleStyles.icon,
          exampleStyles.report1,
          exampleStyles.report1Manual,
          open && exampleStyles.open,
        )}
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
    "--button-inner-radius": "9999px",
    borderRadius: "9999px",
  },
  report1: {
    transitionProperty: "transform, translate, scale, rotate",
    transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
    transitionDuration: "500ms",
  },
  report1Manual: {
    transitionTimingFunction: "cubic-bezier(0.68,-0.6,0.32,1.6)",
  },
  open: {
    transform: "rotate(135deg)",
  },
})
